import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAnalysis, useCreateAnalysis, useUpdateAnalysis, useUpdateAnalysisStatus } from '@/hooks/useAnalyses';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { statusConfig, AnalysisStatus } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';

type AnalysisFormData = Omit<TablesInsert<'analyses'>, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'rejected_at' | 'canceled_at' | 'status'>;

export default function AnalysisForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMaster, user, role } = useAuth();
  const isEditing = !!id;
  const canValidatePayments = role === 'master' || role === 'analyst';
  const queryClient = useQueryClient();

  const [isValidating, setIsValidating] = useState(false);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);

  const { data: analysis, isLoading: loadingAnalysis } = useAnalysis(id);
  const { data: agencies } = useAgencies();
  const createAnalysis = useCreateAnalysis();
  const updateAnalysis = useUpdateAnalysis();
  const updateStatus = useUpdateAnalysisStatus();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AnalysisFormData>({
    defaultValues: {
      valor_condominio: 0,
      valor_iptu: 0,
      valor_outros_encargos: 0,
      setup_fee: 0,
    },
    values: analysis ? {
      agency_id: analysis.agency_id,
      analyst_id: analysis.analyst_id,
      inquilino_nome: analysis.inquilino_nome,
      inquilino_cpf: analysis.inquilino_cpf,
      inquilino_rg: analysis.inquilino_rg,
      inquilino_data_nascimento: analysis.inquilino_data_nascimento,
      inquilino_email: analysis.inquilino_email,
      inquilino_telefone: analysis.inquilino_telefone,
      inquilino_profissao: analysis.inquilino_profissao,
      inquilino_renda_mensal: analysis.inquilino_renda_mensal,
      inquilino_empresa: analysis.inquilino_empresa,
      conjuge_nome: analysis.conjuge_nome,
      conjuge_cpf: analysis.conjuge_cpf,
      conjuge_rg: analysis.conjuge_rg,
      conjuge_data_nascimento: analysis.conjuge_data_nascimento,
      conjuge_profissao: analysis.conjuge_profissao,
      conjuge_renda_mensal: analysis.conjuge_renda_mensal,
      conjuge_empresa: analysis.conjuge_empresa,
      imovel_endereco: analysis.imovel_endereco,
      imovel_numero: analysis.imovel_numero,
      imovel_complemento: analysis.imovel_complemento,
      imovel_bairro: analysis.imovel_bairro,
      imovel_cidade: analysis.imovel_cidade,
      imovel_estado: analysis.imovel_estado,
      imovel_cep: analysis.imovel_cep,
      imovel_tipo: analysis.imovel_tipo,
      imovel_proprietario_nome: analysis.imovel_proprietario_nome,
      imovel_proprietario_cpf_cnpj: analysis.imovel_proprietario_cpf_cnpj,
      valor_aluguel: analysis.valor_aluguel,
      valor_condominio: analysis.valor_condominio,
      valor_iptu: analysis.valor_iptu,
      valor_outros_encargos: analysis.valor_outros_encargos,
      setup_fee: analysis.setup_fee,
      observacoes: analysis.observacoes,
    } : undefined,
  });

  const selectedAgency = watch('agency_id');

  const onSubmit = async (data: AnalysisFormData) => {
    // Calculate total value
    const valorTotal = (data.valor_aluguel || 0) + 
                       (data.valor_condominio || 0) + 
                       (data.valor_iptu || 0) + 
                       (data.valor_outros_encargos || 0);

    const submitData = {
      ...data,
      valor_total: valorTotal,
      analyst_id: user?.id,
    };

    if (isEditing && id) {
      await updateAnalysis.mutateAsync({ id, ...submitData });
    } else {
      await createAnalysis.mutateAsync(submitData as TablesInsert<'analyses'>);
    }
    navigate('/analyses');
  };

  const handleStatusChange = async (newStatus: AnalysisStatus) => {
    if (id) {
      await updateStatus.mutateAsync({ id, status: newStatus });
    }
  };

  // Payment validation logic - show button if at least ONE payment confirmed (or setup exempt)
  const paymentsPendingValidation = (() => {
    if (!analysis) return false;
    if (analysis.status !== 'aguardando_pagamento') return false;
    
    // Any confirmation exists
    const hasGuaranteeConfirmed = !!analysis.guarantee_payment_confirmed_at;
    const hasSetupConfirmed = !!analysis.setup_payment_confirmed_at;
    const setupIsExempt = !!analysis.setup_fee_exempt;
    const anyConfirmed = hasGuaranteeConfirmed || hasSetupConfirmed || setupIsExempt;
    
    return anyConfirmed && !analysis.payments_validated_at && !analysis.payments_rejected_at;
  })();

  const handleValidatePayments = async () => {
    if (!id) return;
    
    setIsValidating(true);
    try {
      const { error } = await supabase.functions.invoke('validate-payments', {
        body: { action: 'validate', analysisId: id },
      });

      if (error) throw error;

      toast.success('Pagamentos validados com sucesso!');
      setValidateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['analysis', id] });
    } catch (error: any) {
      console.error('Error validating payments:', error);
      toast.error('Erro ao validar pagamentos: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  if (isEditing && loadingAnalysis) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditing ? 'Detalhes da Análise' : 'Nova Análise'}
      description={isEditing ? `Status: ${analysis ? statusConfig[analysis.status].label : ''}` : 'Cadastre uma nova análise de crédito'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in max-w-5xl">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => navigate('/analyses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {isEditing && analysis && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary"
                className={`status-badge ${statusConfig[analysis.status].class}`}
              >
                {statusConfig[analysis.status].label}
              </Badge>

              {isMaster && analysis.status === 'pendente' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('em_analise')}
                  disabled={updateStatus.isPending}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Iniciar Análise
                </Button>
              )}

              {isMaster && analysis.status === 'em_analise' && (
                <>
                  <Button
                    type="button"
                    variant="default"
                    className="bg-success hover:bg-success/90"
                    onClick={() => handleStatusChange('aprovada')}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleStatusChange('reprovada')}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reprovar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Payment Validation Card */}
        {isEditing && canValidatePayments && paymentsPendingValidation && (
          <Card className="border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <CreditCard className="h-5 w-5" />
                Pagamentos Aguardando Validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                O inquilino confirmou pelo menos um pagamento (ou setup isento). Valide para aprovar a análise e criar o contrato.
              </p>
              <Button 
                type="button"
                onClick={() => setValidateDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar Pagamentos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agency Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Imobiliária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="agency_id">Selecione a imobiliária *</Label>
              <Select
                value={selectedAgency}
                onValueChange={(value) => setValue('agency_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {agencies?.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.agency_id && <p className="text-sm text-destructive">{errors.agency_id.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Inquilino</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inquilino_nome">Nome completo *</Label>
              <Input
                id="inquilino_nome"
                placeholder="Nome do inquilino"
                {...register('inquilino_nome', { required: 'Nome é obrigatório' })}
              />
              {errors.inquilino_nome && <p className="text-sm text-destructive">{errors.inquilino_nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_cpf">CPF *</Label>
              <Input
                id="inquilino_cpf"
                placeholder="000.000.000-00"
                {...register('inquilino_cpf', { required: 'CPF é obrigatório' })}
              />
              {errors.inquilino_cpf && <p className="text-sm text-destructive">{errors.inquilino_cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_rg">RG</Label>
              <Input id="inquilino_rg" placeholder="RG" {...register('inquilino_rg')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_data_nascimento">Data de Nascimento</Label>
              <Input id="inquilino_data_nascimento" type="date" {...register('inquilino_data_nascimento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_email">Email</Label>
              <Input id="inquilino_email" type="email" placeholder="email@exemplo.com" {...register('inquilino_email')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_telefone">Telefone</Label>
              <Input id="inquilino_telefone" placeholder="(00) 00000-0000" {...register('inquilino_telefone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_profissao">Profissão</Label>
              <Input id="inquilino_profissao" placeholder="Profissão" {...register('inquilino_profissao')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_empresa">Empresa</Label>
              <Input id="inquilino_empresa" placeholder="Empresa onde trabalha" {...register('inquilino_empresa')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquilino_renda_mensal">Renda Mensal</Label>
              <Input
                id="inquilino_renda_mensal"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('inquilino_renda_mensal', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Spouse Data (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cônjuge (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conjuge_nome">Nome completo</Label>
              <Input id="conjuge_nome" placeholder="Nome do cônjuge" {...register('conjuge_nome')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_cpf">CPF</Label>
              <Input id="conjuge_cpf" placeholder="000.000.000-00" {...register('conjuge_cpf')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_rg">RG</Label>
              <Input id="conjuge_rg" placeholder="RG" {...register('conjuge_rg')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_data_nascimento">Data de Nascimento</Label>
              <Input id="conjuge_data_nascimento" type="date" {...register('conjuge_data_nascimento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_profissao">Profissão</Label>
              <Input id="conjuge_profissao" placeholder="Profissão" {...register('conjuge_profissao')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_empresa">Empresa</Label>
              <Input id="conjuge_empresa" placeholder="Empresa onde trabalha" {...register('conjuge_empresa')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conjuge_renda_mensal">Renda Mensal</Label>
              <Input
                id="conjuge_renda_mensal"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('conjuge_renda_mensal', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Imóvel</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imovel_endereco">Endereço *</Label>
              <Input
                id="imovel_endereco"
                placeholder="Rua, Avenida..."
                {...register('imovel_endereco', { required: 'Endereço é obrigatório' })}
              />
              {errors.imovel_endereco && <p className="text-sm text-destructive">{errors.imovel_endereco.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_numero">Número</Label>
              <Input id="imovel_numero" placeholder="Nº" {...register('imovel_numero')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_complemento">Complemento</Label>
              <Input id="imovel_complemento" placeholder="Apto, Bloco..." {...register('imovel_complemento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_bairro">Bairro</Label>
              <Input id="imovel_bairro" placeholder="Bairro" {...register('imovel_bairro')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_cep">CEP</Label>
              <Input id="imovel_cep" placeholder="00000-000" {...register('imovel_cep')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_cidade">Cidade *</Label>
              <Input
                id="imovel_cidade"
                placeholder="Cidade"
                {...register('imovel_cidade', { required: 'Cidade é obrigatória' })}
              />
              {errors.imovel_cidade && <p className="text-sm text-destructive">{errors.imovel_cidade.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_estado">Estado *</Label>
              <Input
                id="imovel_estado"
                placeholder="UF"
                maxLength={2}
                {...register('imovel_estado', { required: 'Estado é obrigatório' })}
              />
              {errors.imovel_estado && <p className="text-sm text-destructive">{errors.imovel_estado.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_tipo">Tipo do Imóvel</Label>
              <Input id="imovel_tipo" placeholder="Apartamento, Casa..." {...register('imovel_tipo')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_proprietario_nome">Nome do Proprietário</Label>
              <Input id="imovel_proprietario_nome" placeholder="Nome" {...register('imovel_proprietario_nome')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovel_proprietario_cpf_cnpj">CPF/CNPJ do Proprietário</Label>
              <Input id="imovel_proprietario_cpf_cnpj" placeholder="CPF ou CNPJ" {...register('imovel_proprietario_cpf_cnpj')} />
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_aluguel">Valor do Aluguel *</Label>
              <Input
                id="valor_aluguel"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('valor_aluguel', { required: 'Valor é obrigatório', valueAsNumber: true })}
              />
              {errors.valor_aluguel && <p className="text-sm text-destructive">{errors.valor_aluguel.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_condominio">Condomínio</Label>
              <Input
                id="valor_condominio"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('valor_condominio', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_iptu">IPTU</Label>
              <Input
                id="valor_iptu"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('valor_iptu', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_outros_encargos">Outros Encargos</Label>
              <Input
                id="valor_outros_encargos"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('valor_outros_encargos', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_fee">Taxa de Setup (R$)</Label>
              <Input
                id="setup_fee"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('setup_fee', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Valor fixo cobrado na ativação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa_garantia_percentual">Taxa de Garantia Tridots (%)</Label>
              <Input
                id="taxa_garantia_percentual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="8.00"
                {...register('taxa_garantia_percentual', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Percentual sobre o aluguel cobrado mensalmente</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Informações adicionais..."
              className="min-h-[100px]"
              {...register('observacoes')}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={createAnalysis.isPending || updateAnalysis.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createAnalysis.isPending || updateAnalysis.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>

      {/* Validate Payments Dialog */}
      <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Validação de Pagamentos</DialogTitle>
            <DialogDescription>
              Ao confirmar, a análise será aprovada e um contrato será criado automaticamente.
              A imobiliária será notificada para enviar os documentos obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidateDialogOpen(false)} disabled={isValidating}>
              Cancelar
            </Button>
            <Button onClick={handleValidatePayments} disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Validação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
