import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAgency, useCreateAgency, useUpdateAgency, useDeleteAgency } from '@/hooks/useAgencies';
import { useAgencyCollaborators } from '@/hooks/useAgencyCollaborators';
import { useAdminResetPassword } from '@/hooks/useAdminResetPassword';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GeneratePasswordDialog } from '@/components/users/GeneratePasswordDialog';
import { ArrowLeft, Save, Users, Key, Loader2, FileText, Trash2 } from 'lucide-react';
import { AgencyActivationDocuments } from '@/components/agency/AgencyActivationDocuments';
import type { TablesInsert } from '@/integrations/supabase/types';

type AgencyFormData = Omit<TablesInsert<'agencies'>, 'id' | 'created_at' | 'updated_at'>;

const POSITION_LABELS: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  auxiliar: 'Auxiliar',
};

export default function AgencyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: agency, isLoading: loadingAgency } = useAgency(id);
  const { data: collaborators, isLoading: loadingCollaborators } = useAgencyCollaborators(id);
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();
  const deleteAgency = useDeleteAgency();
  const { resetPassword, generatedPassword, isLoading: isGeneratingPassword, showPasswordDialog, closeDialog, copyToClipboard } = useAdminResetPassword();

  const [targetUserName, setTargetUserName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAgency = async () => {
    if (!id) return;
    await deleteAgency.mutateAsync(id);
    navigate('/agencies');
  };

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AgencyFormData>({
    defaultValues: {
      active: true,
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
      percentual_comissao_setup: agency.percentual_comissao_setup,
      desconto_pix_percentual: agency.desconto_pix_percentual,
      active: agency.active,
      internal_observations: (agency as any).internal_observations,
      billing_due_day: (agency as any).billing_due_day,
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

  const handleGeneratePassword = (userId: string, userName: string) => {
    setTargetUserName(userName);
    resetPassword(userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
            <CardDescription>
              A comissão recorrente agora é definida automaticamente pelo plano escolhido (START: 5%, PRIME: 10%, EXCLUSIVE: 15%)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="space-y-2">
              <Label htmlFor="billing_due_day">
                Dia Vencimento Boleto Unificado
              </Label>
              <select
                id="billing_due_day"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('billing_due_day' as any, { valueAsNumber: true })}
              >
                <option value="">Não definido</option>
                <option value="5">Dia 05</option>
                <option value="10">Dia 10</option>
                <option value="15">Dia 15</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Dia de vencimento das faturas do Boleto Unificado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Internal Observations - Only visible to Tridots */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Internas (apenas Tridots)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="internal_observations">Observações</Label>
              <textarea
                id="internal_observations"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Adicione observações internas sobre esta imobiliária..."
                {...register('internal_observations' as any)}
              />
              <p className="text-xs text-muted-foreground">
                Estas observações são visíveis apenas para a equipe Tridots
              </p>
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

        {/* Collaborators Section - Only when editing */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores
              </CardTitle>
              <CardDescription>
                Lista de colaboradores vinculados a esta imobiliária
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCollaborators ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !collaborators?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mb-2" />
                  <p>Nenhum colaborador cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collaborators.map((collab) => (
                        <TableRow key={collab.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={collab.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(collab.profile?.full_name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{collab.profile?.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{collab.profile?.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {POSITION_LABELS[collab.position || ''] || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={collab.profile?.active ? 'default' : 'outline'}>
                              {collab.profile?.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleGeneratePassword(
                                      collab.user_id,
                                      collab.profile?.full_name || 'Colaborador'
                                    )}
                                    disabled={isGeneratingPassword}
                                  >
                                    {isGeneratingPassword ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Key className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gerar Senha Provisória</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activation Documents - Only when editing */}
        {isEditing && id && (
          <AgencyActivationDocuments agencyId={id} creciNumero={agency?.creci_numero} />
        )}

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

            <div className="flex items-center gap-3">
              {isEditing && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive"
                      disabled={deleteAgency.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir imobiliária?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todos os dados da imobiliária serão removidos permanentemente, 
                        incluindo colaboradores e documentos. Análises e contratos vinculados podem ficar órfãos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAgency}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteAgency.isPending ? 'Excluindo...' : 'Sim, excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button 
                type="submit" 
                disabled={createAgency.isPending || updateAgency.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createAgency.isPending || updateAgency.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <GeneratePasswordDialog
        open={showPasswordDialog}
        onOpenChange={closeDialog}
        password={generatedPassword}
        userName={targetUserName}
        onCopy={copyToClipboard}
      />
    </DashboardLayout>
  );
}
