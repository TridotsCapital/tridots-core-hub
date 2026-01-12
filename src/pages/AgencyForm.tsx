import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAgency, useCreateAgency, useUpdateAgency } from '@/hooks/useAgencies';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import type { TablesInsert } from '@/integrations/supabase/types';

type AgencyFormData = Omit<TablesInsert<'agencies'>, 'id' | 'created_at' | 'updated_at'>;

export default function AgencyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: agency, isLoading: loadingAgency } = useAgency(id);
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AgencyFormData>({
    defaultValues: {
      active: true,
      percentual_comissao_recorrente: 0,
      percentual_comissao_setup: 100,
    },
    values: agency ? {
      cnpj: agency.cnpj,
      razao_social: agency.razao_social,
      nome_fantasia: agency.nome_fantasia,
      email: agency.email,
      telefone: agency.telefone,
      endereco: agency.endereco,
      cidade: agency.cidade,
      estado: agency.estado,
      cep: agency.cep,
      responsavel_nome: agency.responsavel_nome,
      responsavel_email: agency.responsavel_email,
      responsavel_telefone: agency.responsavel_telefone,
      percentual_comissao_recorrente: agency.percentual_comissao_recorrente,
      percentual_comissao_setup: agency.percentual_comissao_setup,
      desconto_pix_percentual: agency.desconto_pix_percentual,
      active: agency.active,
    } : undefined,
  });

  const isActive = watch('active');

  const onSubmit = async (data: AgencyFormData) => {
    if (isEditing && id) {
      await updateAgency.mutateAsync({ id, ...data });
    } else {
      await createAgency.mutateAsync(data);
    }
    navigate('/agencies');
  };

  if (isEditing && loadingAgency) {
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
      title={isEditing ? 'Editar Imobiliária' : 'Nova Imobiliária'}
      description={isEditing ? 'Atualize os dados da imobiliária' : 'Cadastre uma nova imobiliária parceira'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/agencies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Company Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register('cnpj', { required: 'CNPJ é obrigatório' })}
              />
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                placeholder="Nome da empresa"
                {...register('razao_social', { required: 'Razão Social é obrigatória' })}
              />
              {errors.razao_social && <p className="text-sm text-destructive">{errors.razao_social.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                placeholder="Nome fantasia"
                {...register('nome_fantasia')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                {...register('email', { required: 'Email é obrigatório' })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...register('telefone')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Comissão e Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="percentual_comissao_recorrente">
                % Comissão Recorrente sobre Taxa Tridots *
              </Label>
              <div className="relative">
                <Input
                  id="percentual_comissao_recorrente"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  className="pr-8"
                  {...register('percentual_comissao_recorrente', { 
                    required: 'Percentual é obrigatório',
                    valueAsNumber: true 
                  })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Percentual que a imobiliária recebe sobre a taxa de garantia cobrada pela Tridots
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_comissao_setup">
                % Comissão sobre Setup Fee *
              </Label>
              <div className="relative">
                <Input
                  id="percentual_comissao_setup"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="100.00"
                  className="pr-8"
                  {...register('percentual_comissao_setup', { 
                    required: 'Percentual é obrigatório',
                    valueAsNumber: true 
                  })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Percentual do setup fee que é repassado à imobiliária (padrão: 100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto_pix_percentual">
                Desconto PIX (%) *
              </Label>
              <div className="relative">
                <Input
                  id="desconto_pix_percentual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  placeholder="5.00"
                  className="pr-8"
                  {...register('desconto_pix_percentual', { 
                    required: 'Desconto PIX é obrigatório para ativar a imobiliária',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Mínimo 0%' },
                    max: { value: 20, message: 'Máximo 20%' }
                  })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Desconto para pagamento via PIX (obrigatório para ativar)
              </p>
              {errors.desconto_pix_percentual && (
                <p className="text-sm text-destructive">{errors.desconto_pix_percentual.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, número"
                {...register('endereco')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                {...register('cep')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                placeholder="Cidade"
                {...register('cidade')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                placeholder="UF"
                maxLength={2}
                {...register('estado')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle>Responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_nome">Nome *</Label>
              <Input
                id="responsavel_nome"
                placeholder="Nome do responsável"
                {...register('responsavel_nome', { required: 'Nome do responsável é obrigatório' })}
              />
              {errors.responsavel_nome && <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_email">Email</Label>
              <Input
                id="responsavel_email"
                type="email"
                placeholder="email@empresa.com"
                {...register('responsavel_email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_telefone">Telefone</Label>
              <Input
                id="responsavel_telefone"
                placeholder="(00) 00000-0000"
                {...register('responsavel_telefone')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status & Submit */}
        <Card>
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('active', checked)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Imobiliária ativa
              </Label>
            </div>

            <Button 
              type="submit" 
              disabled={createAgency.isPending || updateAgency.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createAgency.isPending || updateAgency.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </DashboardLayout>
  );
}