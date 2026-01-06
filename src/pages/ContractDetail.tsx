import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Home, 
  User, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  CreditCard, 
  FileText,
  Building2,
  MessageSquare,
  Eye,
  ExternalLink,
  FileCheck,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useContract } from '@/hooks/useContracts';
import { useTicketCountByAnalysis, useTicketsByAnalysis } from '@/hooks/useTickets';
import { ContractActions } from '@/components/contracts';
import { ContractDocumentsSection } from '@/components/contracts/ContractDocumentsSection';
import { ContractTicketSheet } from '@/components/contracts/ContractTicketSheet';
import { TicketDetailSheet } from '@/components/tickets/TicketDetailSheet';
import { formatCurrency, PROPERTY_TYPES } from '@/lib/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ContractStatus = Database['public']['Enums']['contract_status'];

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  documentacao_pendente: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: FileCheck },
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
};

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  type?: 'contract' | 'ticket';
  ticketId?: string;
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const { data: contract, isLoading, refetch } = useContract(id);
  const analysisId = contract?.analysis_id;
  const { data: ticketCount = 0 } = useTicketCountByAnalysis(analysisId);
  const { data: tickets = [] } = useTicketsByAnalysis(analysisId);

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract || !contract.analysis) {
    return (
      <DashboardLayout title="Contrato não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Contrato não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/contracts')}>
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { analysis } = contract;
  const statusConfig = STATUS_CONFIG[contract.status];
  const StatusIcon = statusConfig.icon;
  const propertyType = PROPERTY_TYPES.find(t => t.value === analysis.imovel_tipo)?.label || analysis.imovel_tipo;

  // Check if all documents are approved (ready for activation)
  const allDocsApproved = 
    contract.doc_contrato_locacao_status === 'approved' &&
    contract.doc_vistoria_inicial_status === 'approved' &&
    contract.doc_seguro_incendio_status === 'approved';
  
  const readyForActivation = contract.status === 'documentacao_pendente' && allDocsApproved;


  const handleActivateContract = async () => {
    setIsActivating(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'ativo',
          activated_at: new Date().toISOString(),
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success('Contrato ativado com sucesso!');
      setActivationModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    } catch (error) {
      console.error('Error activating contract:', error);
      toast.error('Erro ao ativar contrato');
    } finally {
      setIsActivating(false);
    }
  };

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      date: contract.created_at,
      title: 'Contrato Criado',
      description: 'Contrato criado após confirmação de pagamento',
      icon: FileText,
      iconColor: 'text-blue-500',
      type: 'contract',
    },
  ];

  if (contract.activated_at) {
    timelineEvents.push({
      date: contract.activated_at,
      title: 'Contrato Ativado',
      description: 'Documentação aprovada, garantia ativada',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      type: 'contract',
    });
  }

  if (contract.canceled_at) {
    timelineEvents.push({
      date: contract.canceled_at,
      title: 'Contrato Cancelado',
      description: contract.cancellation_reason || 'Contrato cancelado',
      icon: XCircle,
      iconColor: 'text-red-500',
      type: 'contract',
    });
  }

  if (contract.status === 'documentacao_pendente') {
    timelineEvents.push({
      date: contract.created_at,
      title: 'Aguardando Documentação',
      description: 'Documentos pendentes para ativação',
      icon: FileCheck,
      iconColor: 'text-amber-500',
      type: 'contract',
    });
  }

  // Add ticket events to timeline
  tickets.forEach((ticket) => {
    const ticketRef = `#${ticket.id.slice(0, 8).toUpperCase()}`;
    timelineEvents.push({
      date: ticket.created_at,
      title: `Chamado Aberto`,
      description: `${ticketRef} - ${ticket.subject}`,
      icon: MessageSquare,
      iconColor: 'text-amber-500',
      type: 'ticket',
      ticketId: ticket.id,
    });
    
    if (ticket.resolved_at) {
      timelineEvents.push({
        date: ticket.resolved_at,
        title: `Chamado Resolvido`,
        description: `${ticketRef} - ${ticket.subject}`,
        icon: CheckCircle,
        iconColor: 'text-amber-600',
        type: 'ticket',
        ticketId: ticket.id,
      });
    }
  });

  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalEncargos = (analysis.valor_aluguel || 0) + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0);
  const taxaMensal = totalEncargos * ((analysis.taxa_garantia_percentual || 0) / 100);

  return (
    <DashboardLayout
      title={`Contrato #${contract.id.slice(0, 8).toUpperCase()}`}
      description={analysis.inquilino_nome}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Badge className={`${statusConfig.color} border px-3 py-1`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {ticketCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/tickets?contract=${contract.analysis_id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Chamados ({ticketCount})
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTicketSheetOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir Chamado
            </Button>
          </div>
        </div>

        {/* Ready for Activation Banner */}
        {readyForActivation && (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-500" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">Pronto para Ativar!</p>
                <p className="text-sm text-green-700 dark:text-green-400">Todos os documentos foram aprovados</p>
              </div>
            </div>
            <Button 
              onClick={() => setActivationModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ativar Contrato
            </Button>
          </div>
        )}

        {/* Ticket Detail Sheet */}
        <TicketDetailSheet
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />

        {/* Ticket Sheet */}
        <ContractTicketSheet
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
          analysisId={contract.analysis_id}
          agencyId={contract.agency_id}
          contractRef={contract.id.slice(0, 8).toUpperCase()}
          agencyName={analysis.agency?.nome_fantasia || analysis.agency?.razao_social}
          tenantName={analysis.inquilino_nome}
        />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractActions
              contract={{
                id: contract.id,
                status: contract.status,
                agency_id: contract.agency_id,
                analysis_id: contract.analysis_id,
              }}
              onEdit={() => navigate(`/analyses/${contract.analysis_id}`)}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Agency Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Imobiliária
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">
                    {analysis.agency?.nome_fantasia || analysis.agency?.razao_social || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">% Comissão Recorrente:</span>
                  <p className="font-medium">{analysis.agency?.percentual_comissao_recorrente || 0}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dados do Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Endereço:</span>
                  <p className="font-medium">
                    {analysis.imovel_endereco}, {analysis.imovel_numero}
                    {analysis.imovel_complemento && ` - ${analysis.imovel_complemento}`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Localização:</span>
                  <p className="font-medium">
                    {analysis.imovel_bairro}, {analysis.imovel_cidade} - {analysis.imovel_estado}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">CEP:</span>
                  <p className="font-medium">{analysis.imovel_cep}</p>
                </div>
                {propertyType && (
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{propertyType}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Inquilino
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{analysis.inquilino_nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{analysis.inquilino_cpf}</p>
                </div>
                {analysis.inquilino_email && (
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-medium">{analysis.inquilino_email}</p>
                  </div>
                )}
                {analysis.inquilino_telefone && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{analysis.inquilino_telefone}</p>
                  </div>
                )}
                {analysis.inquilino_profissao && (
                  <div>
                    <span className="text-muted-foreground">Profissão:</span>
                    <p className="font-medium">{analysis.inquilino_profissao}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Renda Mensal:</span>
                  <p className="font-medium">{formatCurrency(analysis.inquilino_renda_mensal || 0)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Spouse Info */}
            {analysis.conjuge_nome && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Dados do Cônjuge/Co-inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{analysis.conjuge_nome}</p>
                  </div>
                  {analysis.conjuge_cpf && (
                    <div>
                      <span className="text-muted-foreground">CPF:</span>
                      <p className="font-medium">{analysis.conjuge_cpf}</p>
                    </div>
                  )}
                  {analysis.conjuge_profissao && (
                    <div>
                      <span className="text-muted-foreground">Profissão:</span>
                      <p className="font-medium">{analysis.conjuge_profissao}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Renda Mensal:</span>
                    <p className="font-medium">{formatCurrency(analysis.conjuge_renda_mensal || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observations */}
            {analysis.observacoes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{analysis.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <ContractDocumentsSection
              contract={{
                id: contract.id,
                status: contract.status,
                analysis_id: contract.analysis_id,
                doc_contrato_locacao_path: contract.doc_contrato_locacao_path,
                doc_contrato_locacao_name: contract.doc_contrato_locacao_name,
                doc_contrato_locacao_status: contract.doc_contrato_locacao_status,
                doc_contrato_locacao_feedback: contract.doc_contrato_locacao_feedback,
                doc_contrato_locacao_uploaded_at: contract.doc_contrato_locacao_uploaded_at,
                doc_vistoria_inicial_path: contract.doc_vistoria_inicial_path,
                doc_vistoria_inicial_name: contract.doc_vistoria_inicial_name,
                doc_vistoria_inicial_status: contract.doc_vistoria_inicial_status,
                doc_vistoria_inicial_feedback: contract.doc_vistoria_inicial_feedback,
                doc_vistoria_inicial_uploaded_at: contract.doc_vistoria_inicial_uploaded_at,
                doc_seguro_incendio_path: contract.doc_seguro_incendio_path,
                doc_seguro_incendio_name: contract.doc_seguro_incendio_name,
                doc_seguro_incendio_status: contract.doc_seguro_incendio_status,
                doc_seguro_incendio_feedback: contract.doc_seguro_incendio_feedback,
                doc_seguro_incendio_uploaded_at: contract.doc_seguro_incendio_uploaded_at,
              }}
              identityPhotoPath={analysis.identity_photo_path}
              tenantName={analysis.inquilino_nome}
              isAgencyView={false}
              onUpdate={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline de Eventos
                </CardTitle>
                <CardDescription>Histórico completo do contrato e chamados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                  
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => {
                      const EventIcon = event.icon;
                      return (
                        <div key={index} className="relative pl-10">
                          <div className={`absolute left-0 w-8 h-8 rounded-full bg-background border-2 ${event.type === 'ticket' ? 'border-amber-300' : 'border-border'} flex items-center justify-center`}>
                            <EventIcon className={`h-4 w-4 ${event.iconColor}`} />
                          </div>
                          <div className="pb-4">
                            <div className="flex items-center gap-2">
                            <p className="font-medium">{event.title}</p>
                              {event.type === 'ticket' && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Chamado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {event.type === 'ticket' && event.ticketId && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 mt-1 text-xs text-amber-600 hover:text-amber-700"
                                onClick={() => setSelectedTicketId(event.ticketId!)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Abrir chamado
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Aluguel:</span>
                    <p className="font-medium">{formatCurrency(analysis.valor_aluguel || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condomínio:</span>
                    <p className="font-medium">{formatCurrency(analysis.valor_condominio || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IPTU:</span>
                    <p className="font-medium">{formatCurrency(analysis.valor_iptu || 0)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Total Encargos:</span>
                    <p className="font-medium">{formatCurrency(totalEncargos)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taxa Garantia ({analysis.taxa_garantia_percentual}%):</span>
                    <p className="font-medium">{formatCurrency(taxaMensal)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Custo Mensal Total:</span>
                    <p className="font-semibold text-primary text-lg">{formatCurrency(totalEncargos + taxaMensal)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Setup Fee:</span>
                    <p className="font-semibold">{formatCurrency(analysis.setup_fee || 0)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Comissão Imobiliária (Recorrente):</span>
                    <p className="font-medium">
                      {formatCurrency(taxaMensal * ((analysis.agency?.percentual_comissao_recorrente || 0) / 100))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({analysis.agency?.percentual_comissao_recorrente || 0}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Comissão Imobiliária (Setup):</span>
                    <p className="font-medium">
                      {formatCurrency((analysis.setup_fee || 0) * ((analysis.agency?.percentual_comissao_setup || 0) / 100))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({analysis.agency?.percentual_comissao_setup || 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Activation Confirmation Modal */}
      <Dialog open={activationModalOpen} onOpenChange={setActivationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <ShieldCheck className="h-5 w-5" />
              Ativar Contrato
            </DialogTitle>
            <DialogDescription>
              Todos os documentos foram aprovados. Deseja ativar o contrato agora?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p><strong>Inquilino:</strong> {analysis.inquilino_nome}</p>
            <p><strong>Imóvel:</strong> {analysis.imovel_endereco}, {analysis.imovel_numero}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(analysis.valor_total || 0)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivationModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleActivateContract} 
              disabled={isActivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Ativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
