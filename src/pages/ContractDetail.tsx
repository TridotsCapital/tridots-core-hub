import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useContract } from '@/hooks/useContracts';
import { useTicketCountByAnalysis, useTicketsByAnalysis } from '@/hooks/useTickets';
import { ContractActions } from '@/components/contracts';
import { ContractTicketSheet } from '@/components/contracts/ContractTicketSheet';
import { TicketDetailSheet } from '@/components/tickets/TicketDetailSheet';
import { formatCurrency, PROPERTY_TYPES } from '@/lib/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type AnalysisStatus = Database['public']['Enums']['analysis_status'];

const STATUS_CONFIG: Record<AnalysisStatus, { label: string; color: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  aprovada: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  reprovada: { label: 'Reprovada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
  aguardando_pagamento: { label: 'Aguardando Pagamento', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: CreditCard },
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
};

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
  type?: 'contract' | 'ticket';
  ticketId?: string;
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: contract, isLoading } = useContract(id);
  const { data: ticketCount = 0 } = useTicketCountByAnalysis(id);
  const { data: tickets = [] } = useTicketsByAnalysis(id);

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

  if (!contract) {
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

  const statusConfig = STATUS_CONFIG[contract.status as AnalysisStatus];
  const StatusIcon = statusConfig.icon;
  const propertyType = PROPERTY_TYPES.find(t => t.value === contract.imovel_tipo)?.label || contract.imovel_tipo;

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      date: contract.created_at,
      title: 'Análise Solicitada',
      description: 'Solicitação de análise de crédito enviada',
      icon: FileText,
      iconColor: 'text-blue-500',
      type: 'contract',
    },
  ];

  if (contract.approved_at) {
    timelineEvents.push({
      date: contract.approved_at,
      title: 'Análise Aprovada',
      description: 'Crédito aprovado pela equipe Tridots',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      type: 'contract',
    });
  }

  if (contract.rejected_at) {
    timelineEvents.push({
      date: contract.rejected_at,
      title: 'Análise Reprovada',
      description: 'Crédito não aprovado',
      icon: XCircle,
      iconColor: 'text-red-500',
      type: 'contract',
    });
  }

  if (contract.canceled_at) {
    timelineEvents.push({
      date: contract.canceled_at,
      title: 'Contrato Cancelado',
      description: 'Contrato cancelado',
      icon: XCircle,
      iconColor: 'text-gray-500',
      type: 'contract',
    });
  }

  if (contract.status === 'aguardando_pagamento') {
    timelineEvents.push({
      date: contract.approved_at || contract.created_at,
      title: 'Aguardando Pagamento',
      description: `Setup Fee: ${formatCurrency(contract.setup_fee)}`,
      icon: CreditCard,
      iconColor: 'text-orange-500',
      type: 'contract',
    });
  }

  if (contract.status === 'ativo') {
    timelineEvents.push({
      date: contract.updated_at,
      title: 'Contrato Ativo',
      description: 'Pagamento confirmado, garantia ativada',
      icon: CheckCircle,
      iconColor: 'text-green-600',
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

  const totalEncargos = contract.valor_aluguel + (contract.valor_condominio || 0) + (contract.valor_iptu || 0);
  const taxaMensal = totalEncargos * (contract.taxa_garantia_percentual / 100);

  return (
    <DashboardLayout
      title={`Contrato #${contract.id.slice(0, 8).toUpperCase()}`}
      description={contract.inquilino_nome}
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
                onClick={() => navigate(`/tickets?contract=${contract.id}`)}
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

        {/* Ticket Detail Sheet */}
        <TicketDetailSheet
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />

        {/* Ticket Sheet */}
        <ContractTicketSheet
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
          analysisId={contract.id}
          agencyId={contract.agency_id}
          contractRef={contract.id.slice(0, 8).toUpperCase()}
          agencyName={contract.agency?.nome_fantasia || contract.agency?.razao_social}
          tenantName={contract.inquilino_nome}
        />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractActions
              contract={contract}
              onEdit={() => navigate(`/analyses/${contract.id}`)}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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
                    {contract.agency?.nome_fantasia || contract.agency?.razao_social || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">% Comissão Recorrente:</span>
                  <p className="font-medium">{contract.agency?.percentual_comissao_recorrente || 0}%</p>
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
                    {contract.imovel_endereco}, {contract.imovel_numero}
                    {contract.imovel_complemento && ` - ${contract.imovel_complemento}`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Localização:</span>
                  <p className="font-medium">
                    {contract.imovel_bairro}, {contract.imovel_cidade} - {contract.imovel_estado}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">CEP:</span>
                  <p className="font-medium">{contract.imovel_cep}</p>
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
                  <p className="font-medium">{contract.inquilino_nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{contract.inquilino_cpf}</p>
                </div>
                {contract.inquilino_email && (
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-medium">{contract.inquilino_email}</p>
                  </div>
                )}
                {contract.inquilino_telefone && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{contract.inquilino_telefone}</p>
                  </div>
                )}
                {contract.inquilino_profissao && (
                  <div>
                    <span className="text-muted-foreground">Profissão:</span>
                    <p className="font-medium">{contract.inquilino_profissao}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Renda Mensal:</span>
                  <p className="font-medium">{formatCurrency(contract.inquilino_renda_mensal || 0)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Spouse Info */}
            {contract.conjuge_nome && (
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
                    <p className="font-medium">{contract.conjuge_nome}</p>
                  </div>
                  {contract.conjuge_cpf && (
                    <div>
                      <span className="text-muted-foreground">CPF:</span>
                      <p className="font-medium">{contract.conjuge_cpf}</p>
                    </div>
                  )}
                  {contract.conjuge_profissao && (
                    <div>
                      <span className="text-muted-foreground">Profissão:</span>
                      <p className="font-medium">{contract.conjuge_profissao}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Renda Mensal:</span>
                    <p className="font-medium">{formatCurrency(contract.conjuge_renda_mensal || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observations */}
            {contract.observacoes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{contract.observacoes}</p>
                </CardContent>
              </Card>
            )}
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
                    <p className="font-medium">{formatCurrency(contract.valor_aluguel)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condomínio:</span>
                    <p className="font-medium">{formatCurrency(contract.valor_condominio || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IPTU:</span>
                    <p className="font-medium">{formatCurrency(contract.valor_iptu || 0)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Total Encargos:</span>
                    <p className="font-medium">{formatCurrency(totalEncargos)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taxa Garantia ({contract.taxa_garantia_percentual}%):</span>
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
                    <p className="font-semibold">{formatCurrency(contract.setup_fee)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Comissão Imobiliária (Recorrente):</span>
                    <p className="font-medium">
                      {formatCurrency(taxaMensal * ((contract.agency?.percentual_comissao_recorrente || 0) / 100))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({contract.agency?.percentual_comissao_recorrente || 0}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Comissão Imobiliária (Setup):</span>
                    <p className="font-medium">
                      {formatCurrency(contract.setup_fee * ((contract.agency?.percentual_comissao_setup || 0) / 100))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({contract.agency?.percentual_comissao_setup || 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
