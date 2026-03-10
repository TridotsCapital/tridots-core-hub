import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ContractRenewalTab } from '@/components/contracts/ContractRenewalTab';
import { ArrowLeft, Home, User, Users, DollarSign, Calendar, CheckCircle, Clock, XCircle, CreditCard, FileText, Loader2, MessageSquare, Eye, ExternalLink, FileCheck, Shield, CalendarSync, Receipt, Pencil, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, PROPERTY_TYPES } from '@/lib/validators';
import { addDays, isWithinInterval } from 'date-fns';
import { formatDateBR } from '@/lib/utils';
import { ContractDocumentsSection } from '@/components/contracts/ContractDocumentsSection';
import { ContractTicketSheet } from './ContractTicketSheet';
import { AgencyTicketDetail } from './AgencyTicketDetail';
import { ContractRenewalModal } from './ContractRenewalModal';
import { ContractRenewalStatus } from './ContractRenewalStatus';
import { ContractRenewalHistory } from './ContractRenewalHistory';
import { GuaranteeCostsSection } from '@/components/payment/GuaranteeCostsSection';
import { CoverageCard } from '@/components/shared/CoverageCard';
import { PayerInfoCard } from '@/components/shared/PayerInfoCard';
import { ContractCommissionsTab } from '@/components/shared/ContractCommissionsTab';
import { ContractInstallmentsTab } from '@/components/contracts/ContractInstallmentsTab';
import { useTicketCountByAnalysis, useTicketsByAnalysis } from '@/hooks/useTickets';
import { useActiveClaimByContract } from '@/hooks/useActiveClaimByContract';
import { usePendingRenewal } from '@/hooks/useContractRenewal';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';


type ContractStatus = Database['public']['Enums']['contract_status'];
type AnalysisStatus = Database['public']['Enums']['analysis_status'];

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: any }> = {
  documentacao_pendente: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: FileCheck },
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
};

const ANALYSIS_STATUS_CONFIG: Record<AnalysisStatus, { label: string; color: string; icon: any }> = {
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
  type?: 'contract' | 'ticket' | 'claim';
  ticketId?: string;
  claimId?: string;
}

export function AgencyContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);

  const { data: ticketCount = 0 } = useTicketCountByAnalysis(id);
  const { data: tickets = [] } = useTicketsByAnalysis(id);
  const { data: activeClaim } = useActiveClaimByContract(contract?.id);
  const { data: pendingRenewal } = usePendingRenewal(contract?.id);

  // Check if contract is eligible for renewal (ativo or vencido, within 30 days of expiry)
  const now = new Date();
  const isEligibleForRenewal = contract && 
    ['ativo', 'vencido'].includes(contract.status) && 
    !pendingRenewal;

  // Fetch all claims for this contract (for timeline)
  const { data: contractClaims = [] } = useQuery({
    queryKey: ['agency-contract-claims', contract?.id],
    queryFn: async () => {
      if (!contract?.id) return [];
      const { data, error } = await supabase
        .from('claims')
        .select('id, public_status, created_at')
        .eq('contract_id', contract.id)
        .is('canceled_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contract?.id,
  });

  // Fetch manual_date_correction events from analysis_timeline
  const { data: manualCorrectionEvents = [] } = useQuery({
    queryKey: ['agency-manual-date-corrections', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('analysis_timeline')
        .select('*')
        .eq('analysis_id', id)
        .eq('event_type', 'manual_date_correction')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const fetchData = async () => {
    if (!id) return;
    
    try {
      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (analysisError) throw analysisError;
      setAnalysis(analysisData);

      // Fetch contract if exists
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('analysis_id', id)
        .maybeSingle();

      setContract(contractData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        <p className="text-muted-foreground">Análise não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/agency/contracts')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  // DEBUG: Verify is_migrated and timeline data
  console.log('[AgencyContractDetail] contract?.is_migrated:', contract?.is_migrated, 'manualCorrectionEvents:', manualCorrectionEvents);
  
  // Determine which status to show
  const hasContract = !!contract;
  const statusConfig = hasContract 
    ? CONTRACT_STATUS_CONFIG[contract.status as ContractStatus]
    : ANALYSIS_STATUS_CONFIG[analysis.status as AnalysisStatus];
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

  if (contract?.created_at) {
    timelineEvents.push({
      date: contract.created_at,
      title: 'Contrato Criado',
      description: 'Pagamento confirmado, contrato gerado',
      icon: FileCheck,
      iconColor: 'text-blue-600',
      type: 'contract',
    });
  }

  if (contract?.activated_at) {
    timelineEvents.push({
      date: contract.activated_at,
      title: 'Contrato Ativado',
      description: 'Documentação aprovada, garantia ativa',
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

  // Add claim events to timeline
  contractClaims.forEach((claim) => {
    const claimRef = `#${claim.id.slice(0, 8).toUpperCase()}`;
    timelineEvents.push({
      date: claim.created_at,
      title: 'Garantia Solicitada',
      description: `${claimRef} - Solicitação de garantia aberta`,
      icon: Shield,
      iconColor: 'text-amber-500',
      type: 'claim',
      claimId: claim.id,
    });
    
    if (claim.public_status === 'finalizado') {
      timelineEvents.push({
        date: claim.created_at, // Ideally use a finalized_at date if available
        title: 'Garantia Finalizada',
        description: `${claimRef} - Processo concluído`,
        icon: CheckCircle,
        iconColor: 'text-amber-600',
        type: 'claim',
        claimId: claim.id,
      });
    }
  });

  // Add manual date correction events
  manualCorrectionEvents.forEach((event) => {
    timelineEvents.push({
      date: event.created_at,
      title: 'Correção Manual de Datas',
      description: event.description,
      icon: Pencil,
      iconColor: 'text-orange-500',
      type: 'contract',
    });
  });

  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalEncargos = analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0);
  const taxaMensal = totalEncargos * (analysis.taxa_garantia_percentual / 100);

  // Show documents tab only if contract exists
  const showDocsTab = hasContract;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/agency/contracts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {hasContract ? 'Contrato' : 'Análise'} #{(contract?.id || analysis.id).slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">{analysis.inquilino_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} border px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusConfig.label}
          </Badge>
          {contract?.is_migrated && (
            <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700 dark:text-purple-400 px-3 py-1">
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
              Migrado
            </Badge>
          )}
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

      {/* Ticket Detail Sheet */}
      <AgencyTicketDetail
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />

      <ContractTicketSheet
        open={ticketSheetOpen}
        onOpenChange={setTicketSheetOpen}
        analysisId={analysis.id}
        contractId={contract?.id || ''}
        agencyId={analysis.agency_id}
        contractRef={(contract?.id || analysis.id).slice(0, 8).toUpperCase()}
        tenantName={analysis.inquilino_nome}
      />

      {/* Active Claim Banner */}
      {activeClaim && (
        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">Garantia em Andamento</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                #{activeClaim.id.slice(0, 8).toUpperCase()} - Solicitação de garantia aberta para este contrato
              </p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(`/agency/claims/${activeClaim.id}`)}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Garantia
          </Button>
        </div>
      )}

      {/* Renewal Section */}
      {contract && (
        <div className="space-y-4">
          {pendingRenewal ? (
            <ContractRenewalStatus renewal={pendingRenewal} />
          ) : isEligibleForRenewal && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarSync className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Renovação Disponível</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.data_fim_contrato 
                        ? `Contrato vence em ${formatDateBR(contract.data_fim_contrato)}`
                        : 'Solicite a renovação do contrato'}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setRenewalModalOpen(true)}>
                  <CalendarSync className="h-4 w-4 mr-2" />
                  Solicitar Renovação
                </Button>
              </CardContent>
            </Card>
          )}
          
          <ContractRenewalHistory contractId={contract.id} />
        </div>
      )}

      {/* Renewal Modal */}
      {contract && analysis && (
        <ContractRenewalModal
          open={renewalModalOpen}
          onOpenChange={setRenewalModalOpen}
          contract={{
            id: contract.id,
            data_fim_contrato: contract.data_fim_contrato,
            analysis: {
              valor_aluguel: analysis.valor_aluguel,
              valor_condominio: analysis.valor_condominio,
              valor_iptu: analysis.valor_iptu,
              valor_outros_encargos: analysis.valor_outros_encargos,
              taxa_garantia_percentual: analysis.taxa_garantia_percentual
            }
          }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {showDocsTab && <TabsTrigger value="documents">Documentos</TabsTrigger>}
          {contract && <TabsTrigger value="comissoes" className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            Comissões
          </TabsTrigger>}
          {contract && <TabsTrigger value="renovacao" className="flex items-center gap-2">
            <CalendarSync className="h-3.5 w-3.5" />
            Renovação
          </TabsTrigger>}
          {contract && contract.payment_method === 'boleto_imobiliaria' && (
            <TabsTrigger value="parcelas" className="flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" />
              Parcelas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Custos da Garantia Tridots - NO TOPO */}
          <GuaranteeCostsSection
            valorAluguel={analysis.valor_aluguel}
            valorCondominio={analysis.valor_condominio}
            valorIptu={analysis.valor_iptu}
            taxaGarantiaPercentual={analysis.taxa_garantia_percentual}
            setupFee={analysis.setup_fee}
            setupFeeExempt={analysis.setup_fee_exempt}
            formaPagamentoPreferida={analysis.forma_pagamento_preferida}
            descontoPix={null}
            garantiaAnualSalva={analysis.garantia_anual}
            dataInicioContrato={analysis.guarantee_payment_date}
            planoGarantia={analysis.plano_garantia}
            showCommission={true}
            commissionLabel="agency"
          />

          {/* Coberturas Contratadas */}
          <CoverageCard
            planoGarantia={analysis.plano_garantia}
            valorLocaticioTotal={analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0)}
            taxaGarantiaPercentual={analysis.taxa_garantia_percentual}
          />

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
              {analysis.inquilino_rg && (
                <div>
                  <span className="text-muted-foreground">RG:</span>
                  <p className="font-medium">{analysis.inquilino_rg}</p>
                </div>
              )}
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
              {analysis.inquilino_telefone_secundario && (
                <div>
                  <span className="text-muted-foreground">Telefone Secundário:</span>
                  <p className="font-medium">{analysis.inquilino_telefone_secundario}</p>
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

          {/* Payer Info - show if different from tenant */}
          {contract && (
            <PayerInfoCard
              payerIsTenant={analysis.payer_is_tenant}
              payerName={analysis.payer_name}
              payerCpf={analysis.payer_cpf}
              payerEmail={analysis.payer_email}
              payerPhone={analysis.payer_phone}
              payerAddress={analysis.payer_address}
              payerNumber={analysis.payer_number}
              payerComplement={analysis.payer_complement}
              payerNeighborhood={analysis.payer_neighborhood}
              payerCity={analysis.payer_city}
              payerState={analysis.payer_state}
              payerCep={analysis.payer_cep}
            />
          )}

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
                  <p className="font-semibold">
                    {analysis.setup_fee_exempt ? 'ISENTO' : formatCurrency(analysis.setup_fee)}
                  </p>
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
                      <div 
                        key={index} 
                        className={`relative pl-10 ${(event.type === 'ticket' || event.type === 'claim') ? 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                        onClick={() => {
                          if (event.type === 'ticket' && event.ticketId) {
                            setSelectedTicketId(event.ticketId);
                          } else if (event.type === 'claim' && event.claimId) {
                            navigate(`/agency/claims/${event.claimId}`);
                          }
                        }}
                      >
                        <div className={`absolute left-0 w-8 h-8 rounded-full bg-background border-2 ${event.type === 'ticket' || event.type === 'claim' ? 'border-amber-300' : 'border-border'} flex items-center justify-center`}>
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
                            {event.type === 'claim' && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                Garantia
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateBR(event.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
                          </p>
                          {event.type === 'ticket' && event.ticketId && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-1 text-xs text-amber-600 hover:text-amber-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketId(event.ticketId!);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Abrir chamado
                            </Button>
                          )}
                          {event.type === 'claim' && event.claimId && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-1 text-xs text-amber-600 hover:text-amber-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/agency/claims/${event.claimId}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver garantia
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

        {showDocsTab && contract && (
          <TabsContent value="documents" className="mt-6">
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
                doc_contrato_administrativo_path: contract.doc_contrato_administrativo_path,
                doc_contrato_administrativo_name: contract.doc_contrato_administrativo_name,
                doc_contrato_administrativo_status: contract.doc_contrato_administrativo_status,
                doc_contrato_administrativo_feedback: contract.doc_contrato_administrativo_feedback,
                doc_contrato_administrativo_uploaded_at: contract.doc_contrato_administrativo_uploaded_at,
              }}
              identityPhotoPath={analysis.identity_photo_path}
              tenantName={analysis.inquilino_nome}
              isAgencyView={true}
              onUpdate={() => fetchData()}
            />
          </TabsContent>
        )}

        {/* Comissões Tab */}
        {contract && (
          <TabsContent value="comissoes" className="space-y-6 mt-6">
            <ContractCommissionsTab 
              analysisId={analysis.id}
              planoGarantia={analysis.plano_garantia}
            />
          </TabsContent>
        )}

        {/* Renovação Tab */}
        {contract && (
          <TabsContent value="renovacao" className="mt-6">
            <ContractRenewalTab
              contractId={contract.id}
              contractStatus={contract.status}
              dataFimContrato={contract.data_fim_contrato}
              paymentMethod={contract.payment_method}
              analysis={{
                inquilino_nome: analysis.inquilino_nome,
                inquilino_email: analysis.inquilino_email,
                inquilino_telefone: analysis.inquilino_telefone,
                valor_aluguel: analysis.valor_aluguel,
                valor_condominio: analysis.valor_condominio,
                valor_iptu: analysis.valor_iptu,
                valor_outros_encargos: analysis.valor_outros_encargos,
                taxa_garantia_percentual: analysis.taxa_garantia_percentual,
                imovel_endereco: analysis.imovel_endereco,
                imovel_cidade: analysis.imovel_cidade,
                imovel_estado: analysis.imovel_estado,
              }}
              isAgencyView={true}
            />
          </TabsContent>
        )}

        {/* Parcelas Tab */}
        {contract && contract.payment_method === 'boleto_imobiliaria' && (
          <TabsContent value="parcelas" className="mt-6">
            <ContractInstallmentsTab contractId={contract.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}