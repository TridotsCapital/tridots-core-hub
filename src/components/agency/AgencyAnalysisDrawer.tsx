import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Analysis, statusConfig } from '@/types/database';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnalysisTimeline } from '@/components/kanban/AnalysisTimeline';
import { DocumentSection } from '@/components/kanban/DocumentSection';
import { AnalysisTicketSection } from '@/components/kanban/AnalysisTicketSection';
import { useLinkedEntitiesForAnalysis } from '@/hooks/useLinkedEntities';
import { useTicketCountByAnalysis } from '@/hooks/useTickets';
import { 
  User, 
  Home, 
  MessageSquare, 
  FileText, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  Link,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Loader2,
  FileCheck,
  Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AgencyAnalysisDrawerProps {
  analysis: Analysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ElementType }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || '-'}</p>
    </div>
  </div>
);

// Helper to calculate acceptance link status
const getAcceptanceStatus = (analysis: Analysis) => {
  if (!analysis.acceptance_token) return null;
  
  if (analysis.acceptance_token_used_at) {
    return { status: 'used' as const, label: 'Aceite realizado', variant: 'default' as const };
  }
  
  const expiresAt = new Date(analysis.acceptance_token_expires_at!);
  const now = new Date();
  
  if (now > expiresAt) {
    return { status: 'expired' as const, label: 'Link expirado', variant: 'destructive' as const };
  }
  
  const diffMs = expiresAt.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    status: 'active' as const, 
    label: `Expira em ${hours}h ${minutes}min`,
    variant: 'secondary' as const,
  };
};

export function AgencyAnalysisDrawer({ analysis, open, onOpenChange }: AgencyAnalysisDrawerProps) {
  const [requestingLink, setRequestingLink] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch linked entities
  const { data: linkedEntities = [] } = useLinkedEntitiesForAnalysis(analysis?.id);
  
  // Fetch ticket count
  const { data: ticketCount = 0 } = useTicketCountByAnalysis(analysis?.id);

  if (!analysis) return null;

  const acceptanceStatus = getAcceptanceStatus(analysis);
  const acceptanceUrl = analysis.acceptance_token 
    ? `${window.location.origin}/aceite/${analysis.acceptance_token}` 
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(acceptanceUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleRequestNewLink = async () => {
    setRequestingLink(true);
    try {
      // Create automatic ticket with solicitacao_link category
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          subject: 'Solicitação de Novo Link de Aceite',
          description: `Solicitação automática de regeneração do link de aceite para a análise #${analysis.id.slice(0, 8).toUpperCase()}.`,
          category: 'solicitacao_link',
          analysis_id: analysis.id,
          agency_id: analysis.agency_id,
          status: 'aberto',
          priority: 'media',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create notifications for all Masters
      const { data: masters } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'master');

      if (masters && masters.length > 0) {
        const notifications = masters.map(m => ({
          user_id: m.user_id,
          title: 'Solicitação de Novo Link',
          message: `Imobiliária solicitou novo link de aceite para análise #${analysis.id.slice(0, 8).toUpperCase()}`,
          type: 'info',
          source: 'ticket',
          reference_id: ticket.id,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-count-by-analysis'] });
      toast.success('Solicitação enviada! Nossa equipe irá gerar um novo link em breve.');
    } catch (error) {
      console.error('Error requesting new link:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setRequestingLink(false);
    }
  };

  // Find contract and claim from linked entities
  const contractEntity = linkedEntities.find(e => e.type === 'contract');
  const claimEntity = linkedEntities.find(e => e.type === 'claim');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{analysis.inquilino_nome}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-mono font-semibold">#{analysis.id.slice(0, 8).toUpperCase()}</span>
                  {' • '}
                  Criada em {formatDate(analysis.created_at)}
                </span>
                {/* Inline linked entities */}
                {(contractEntity || claimEntity) && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    {contractEntity && (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-green-50 border-green-300 text-green-700 text-xs"
                        onClick={() => navigate(`/agency/contracts/${contractEntity.id}`)}
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        Contrato
                      </Badge>
                    )}
                    {claimEntity && (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-amber-50 border-amber-300 text-amber-700 text-xs"
                        onClick={() => navigate(`/agency/claims/${claimEntity.id}`)}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Garantia
                      </Badge>
                    )}
                  </>
                )}
              </SheetDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={`status-badge ${statusConfig[analysis.status].class}`}
            >
              {statusConfig[analysis.status].label}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="flex flex-col h-[calc(100vh-120px)]">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="resumo" className="gap-1.5 whitespace-nowrap shrink-0">
              <Clock className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="inquilino" className="gap-1.5 whitespace-nowrap shrink-0">
              <User className="h-4 w-4" />
              Inquilino
            </TabsTrigger>
            <TabsTrigger value="imovel" className="gap-1.5 whitespace-nowrap shrink-0">
              <Home className="h-4 w-4" />
              Imóvel
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5 whitespace-nowrap shrink-0">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 whitespace-nowrap shrink-0">
              <MessageSquare className="h-4 w-4" />
              Chamados ({ticketCount})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Resumo Tab */}
            <TabsContent value="resumo" className="m-0 p-6">
              <div className="space-y-6">
                {/* Acceptance Link Section - only for aguardando_pagamento */}
                {analysis.status === 'aguardando_pagamento' && analysis.acceptance_token && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Link de Aceite do Inquilino</span>
                      </div>
                      <Badge variant={acceptanceStatus?.variant || 'secondary'}>
                        {acceptanceStatus?.status === 'used' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {acceptanceStatus?.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {acceptanceStatus?.status === 'active' && <Timer className="h-3 w-3 mr-1" />}
                        {acceptanceStatus?.label}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        value={acceptanceUrl}
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCopyLink}
                        disabled={acceptanceStatus?.status === 'expired'}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleRequestNewLink}
                        disabled={requestingLink}
                        title="Solicitar novo link"
                      >
                        {requestingLink ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {acceptanceStatus?.status === 'expired' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Este link expirou. Clique no botão para solicitar um novo link.
                      </p>
                    )}
                  </div>
                )}

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Valor do Aluguel</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(analysis.valor_aluguel)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysis.valor_total)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Timeline de Eventos</h3>
                  <AnalysisTimeline analysis={analysis} />
                </div>

                {/* Additional costs */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-semibold mb-3">Custos Adicionais</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Condomínio</span>
                      <span>{formatCurrency(analysis.valor_condominio)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IPTU</span>
                      <span>{formatCurrency(analysis.valor_iptu)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outros Encargos</span>
                      <span>{formatCurrency(analysis.valor_outros_encargos)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-medium">Taxa de Setup</span>
                      <span className="font-medium">{formatCurrency(analysis.setup_fee)}</span>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {analysis.observacoes && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-semibold mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Inquilino Tab */}
            <TabsContent value="inquilino" className="m-0 p-6">
              <div className="space-y-6">
                {/* Main tenant */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dados do Inquilino</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Nome Completo" value={analysis.inquilino_nome} icon={User} />
                    <InfoRow label="CPF" value={analysis.inquilino_cpf} icon={Briefcase} />
                    <InfoRow label="RG" value={analysis.inquilino_rg} />
                    <InfoRow label="Data de Nascimento" value={formatDate(analysis.inquilino_data_nascimento)} />
                    <InfoRow label="E-mail" value={analysis.inquilino_email} icon={Mail} />
                    <InfoRow label="Telefone" value={analysis.inquilino_telefone} icon={Phone} />
                    <InfoRow label="Telefone Secundário" value={(analysis as any).inquilino_telefone_secundario} icon={Phone} />
                    <InfoRow label="Profissão" value={analysis.inquilino_profissao} icon={Briefcase} />
                    <InfoRow label="Empresa" value={analysis.inquilino_empresa} icon={DollarSign} />
                    <InfoRow label="Renda Mensal" value={formatCurrency(analysis.inquilino_renda_mensal)} icon={DollarSign} />
                  </div>
                </div>

                {/* Spouse */}
                {analysis.conjuge_nome && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Dados do Cônjuge</h3>
                    <div className="grid gap-1">
                      <InfoRow label="Nome Completo" value={analysis.conjuge_nome} icon={User} />
                      <InfoRow label="CPF" value={analysis.conjuge_cpf} icon={Briefcase} />
                      <InfoRow label="RG" value={analysis.conjuge_rg} />
                      <InfoRow label="Data de Nascimento" value={formatDate(analysis.conjuge_data_nascimento)} />
                      <InfoRow label="Profissão" value={analysis.conjuge_profissao} icon={Briefcase} />
                      <InfoRow label="Empresa" value={analysis.conjuge_empresa} icon={DollarSign} />
                      <InfoRow label="Renda Mensal" value={formatCurrency(analysis.conjuge_renda_mensal)} icon={DollarSign} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Imóvel Tab */}
            <TabsContent value="imovel" className="m-0 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dados do Imóvel</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Tipo" value={analysis.imovel_tipo} icon={Home} />
                    <InfoRow 
                      label="Endereço" 
                      value={`${analysis.imovel_endereco}${analysis.imovel_numero ? `, ${analysis.imovel_numero}` : ''}${analysis.imovel_complemento ? ` - ${analysis.imovel_complemento}` : ''}`}
                      icon={MapPin}
                    />
                    <InfoRow label="Bairro" value={analysis.imovel_bairro} />
                    <InfoRow label="Cidade/Estado" value={`${analysis.imovel_cidade} - ${analysis.imovel_estado}`} />
                    <InfoRow label="CEP" value={analysis.imovel_cep} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Proprietário</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Nome" value={analysis.imovel_proprietario_nome} icon={User} />
                    <InfoRow label="CPF/CNPJ" value={analysis.imovel_proprietario_cpf_cnpj} icon={Briefcase} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documentos Tab */}
            <TabsContent value="documentos" className="m-0 p-6">
              <DocumentSection 
                analysisId={analysis.id}
                identityPhotoPath={analysis.identity_photo_path}
                tenantName={analysis.inquilino_nome}
              />
            </TabsContent>

            {/* Chamados Tab */}
            <TabsContent value="chat" className="m-0 h-full">
              <AnalysisTicketSection 
                analysisId={analysis.id}
                agencyId={analysis.agency_id}
                tenantName={analysis.inquilino_nome}
                isAgencyPortal={true}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
