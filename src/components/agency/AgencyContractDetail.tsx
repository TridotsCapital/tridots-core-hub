import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Home, User, Users, DollarSign, Calendar, CheckCircle, Clock, XCircle, CreditCard, FileText, Loader2, MessageSquare, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, PROPERTY_TYPES } from '@/lib/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgencyDocumentCenter } from './AgencyDocumentCenter';
import { ContractTicketSheet } from './ContractTicketSheet';
import { AgencyTicketDetail } from './AgencyTicketDetail';
import { useTicketCountByAnalysis, useTicketsByAnalysis } from '@/hooks/useTickets';
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

const TICKET_STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em Atendimento',
  aguardando_cliente: 'Aguardando Resposta',
  resolvido: 'Resolvido',
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

export function AgencyContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: ticketCount = 0 } = useTicketCountByAnalysis(id);
  const { data: tickets = [] } = useTicketsByAnalysis(id);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/agency/contracts')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[analysis.status as AnalysisStatus];
  const StatusIcon = statusConfig.icon;
  const propertyType = PROPERTY_TYPES.find(t => t.value === analysis.imovel_tipo)?.label || analysis.imovel_tipo;

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      date: analysis.created_at,
      title: 'Análise Solicitada',
      description: 'Solicitação de análise de crédito enviada',
      icon: FileText,
      iconColor: 'text-blue-500',
      type: 'contract',
    },
  ];

  if (analysis.approved_at) {
    timelineEvents.push({
      date: analysis.approved_at,
      title: 'Análise Aprovada',
      description: 'Crédito aprovado pela equipe Tridots',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      type: 'contract',
    });
  }

  if (analysis.rejected_at) {
    timelineEvents.push({
      date: analysis.rejected_at,
      title: 'Análise Reprovada',
      description: 'Crédito não aprovado',
      icon: XCircle,
      iconColor: 'text-red-500',
      type: 'contract',
    });
  }

  if (analysis.canceled_at) {
    timelineEvents.push({
      date: analysis.canceled_at,
      title: 'Análise Cancelada',
      description: 'Solicitação cancelada',
      icon: XCircle,
      iconColor: 'text-gray-500',
      type: 'contract',
    });
  }

  if (analysis.status === 'aguardando_pagamento') {
    timelineEvents.push({
      date: analysis.approved_at || analysis.created_at,
      title: 'Aguardando Pagamento',
      description: `Setup Fee: ${formatCurrency(analysis.setup_fee)}`,
      icon: CreditCard,
      iconColor: 'text-orange-500',
      type: 'contract',
    });
  }

  if (analysis.status === 'ativo') {
    timelineEvents.push({
      date: analysis.updated_at,
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

  const totalEncargos = analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0);
  const taxaMensal = totalEncargos * (analysis.taxa_garantia_percentual / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/agency/contracts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Contrato #{analysis.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">{analysis.inquilino_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} border px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusConfig.label}
          </Badge>
          {ticketCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/agency/support?contract=${analysis.id}`)}
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

      {/* Ticket Sheet */}
      {/* Ticket Detail Sheet */}
      <AgencyTicketDetail
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />

      <ContractTicketSheet
        open={ticketSheetOpen}
        onOpenChange={setTicketSheetOpen}
        analysisId={analysis.id}
        agencyId={analysis.agency_id}
        contractRef={analysis.id.slice(0, 8).toUpperCase()}
        tenantName={analysis.inquilino_nome}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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

          {/* Financial Summary */}
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
                  <p className="font-medium">{formatCurrency(analysis.valor_aluguel)}</p>
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
                  <p className="font-semibold">{formatCurrency(analysis.setup_fee)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline de Eventos
              </CardTitle>
              <CardDescription>Histórico completo da análise e chamados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
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

        <TabsContent value="documents" className="mt-6">
          <AgencyDocumentCenter analysisId={analysis.id} analysisStatus={analysis.status} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
