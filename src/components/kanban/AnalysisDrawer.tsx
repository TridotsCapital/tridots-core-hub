import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnalysisTimeline } from './AnalysisTimeline';
import { DocumentSection } from './DocumentSection';
import { StartAnalysisModal } from './StartAnalysisModal';
import { RejectionModal } from './RejectionModal';
import { ApprovalModal } from './ApprovalModal';
import { AnalysisTicketSection } from './AnalysisTicketSection';
import { useMoveAnalysis } from '@/hooks/useAnalysesKanban';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Building2, 
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
  PlayCircle,
  XCircle,
  CheckCircle,
  Percent,
  Link,
  Copy,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Loader2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalysisDrawerProps {
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

const formatDateTime = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
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

export function AnalysisDrawer({ analysis, open, onOpenChange }: AnalysisDrawerProps) {
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [regeneratingLink, setRegeneratingLink] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const moveAnalysis = useMoveAnalysis();
  const queryClient = useQueryClient();

  // Calculate acceptance link status
  const acceptanceStatus = useMemo(() => {
    if (!analysis?.acceptance_token) return null;
    
    if (analysis.acceptance_token_used_at) {
      return { status: 'used' as const, label: 'Aceite realizado' };
    }
    
    if (!analysis.acceptance_token_expires_at) return null;
    
    const expiresAt = new Date(analysis.acceptance_token_expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return { status: 'expired' as const, label: 'Link expirado' };
    }
    
    const diffMs = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      status: 'active' as const, 
      label: `Expira em ${hours}h ${minutes}min`,
      expiresAt
    };
  }, [analysis?.acceptance_token, analysis?.acceptance_token_expires_at, analysis?.acceptance_token_used_at]);

  // Check if payments are pending validation - show if at least ONE confirmed (or setup exempt)
  const paymentsPendingValidation = useMemo(() => {
    if (!analysis) return false;
    if (analysis.status !== 'aguardando_pagamento') return false;
    
    // Any confirmation exists
    const hasGuaranteeConfirmed = !!analysis.guarantee_payment_confirmed_at;
    const hasSetupConfirmed = !!analysis.setup_payment_confirmed_at;
    const setupIsExempt = !!analysis.setup_fee_exempt;
    const anyConfirmed = hasGuaranteeConfirmed || hasSetupConfirmed || setupIsExempt;
    
    return anyConfirmed && !analysis.payments_validated_at && !analysis.payments_rejected_at;
  }, [analysis]);

  const handleRegenerateLink = async () => {
    if (!analysis) return;
    
    setRegeneratingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-acceptance-link', {
        body: { 
          analysisId: analysis.id,
          setupPaymentLink: analysis.setup_payment_link,
          guaranteePaymentLink: analysis.guarantee_payment_link,
        }
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      toast.success('Novo link gerado com sucesso!');
    } catch (error) {
      console.error('Error regenerating link:', error);
      toast.error('Erro ao regenerar link');
    } finally {
      setRegeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!analysis?.acceptance_token) return;
    const link = `${window.location.origin}/aceite/${analysis.acceptance_token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleValidatePayments = async () => {
    if (!analysis) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-payments', {
        body: { 
          analysisId: analysis.id,
          action: 'validate',
        }
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['analyses-kanban'] });
      toast.success('Pagamentos validados! Contrato criado com sucesso.');
      setValidationModalOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error validating payments:', error);
      toast.error(error.message || 'Erro ao validar pagamentos');
    } finally {
      setIsValidating(false);
    }
  };


  const openReceiptUrl = async (path: string | null) => {
    if (!path) return;
    
    try {
      const { data } = await supabase.storage
        .from('identity-verification')
        .createSignedUrl(path, 60 * 5); // 5 minutes
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting receipt URL:', error);
      toast.error('Erro ao abrir comprovante');
    }
  };

  if (!analysis) return null;

  const canStartAnalysis = analysis.status === 'pendente';
  const canReject = analysis.status === 'em_analise';
  const canApprove = analysis.status === 'em_analise';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{analysis.inquilino_nome}</SheetTitle>
                <SheetDescription className="mt-1">
                  <span className="font-mono font-semibold">#{analysis.id.slice(0, 8).toUpperCase()}</span>
                  {' • '}
                  Criada em {formatDate(analysis.created_at)}
                </SheetDescription>
              </div>
              <Badge 
                variant="secondary" 
                className={`status-badge ${statusConfig[analysis.status].class}`}
              >
                {statusConfig[analysis.status].label}
              </Badge>
            </div>

            {/* Action Buttons */}
            {(canStartAnalysis || canReject || canApprove) && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {canStartAnalysis && (
                  <Button 
                    onClick={() => setStartModalOpen(true)}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Análise
                  </Button>
                )}
                {canApprove && (
                  <Button 
                    variant="default"
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={() => setApprovalModalOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                )}
                {canReject && (
                  <Button 
                    variant="destructive"
                    onClick={() => setRejectionModalOpen(true)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reprovar
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>

          <Tabs defaultValue="resumo" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12 shrink-0">
              <TabsTrigger value="resumo" className="gap-1.5">
                <Clock className="h-4 w-4" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="imobiliaria" className="gap-1.5">
                <Building2 className="h-4 w-4" />
                Imobiliária
              </TabsTrigger>
              <TabsTrigger value="inquilino" className="gap-1.5">
                <User className="h-4 w-4" />
                Inquilino
              </TabsTrigger>
              <TabsTrigger value="imovel" className="gap-1.5">
                <Home className="h-4 w-4" />
                Imóvel
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Chamados
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Resumo Tab */}
              <TabsContent value="resumo" className="m-0 p-6">
                <div className="space-y-6">
                  {/* Payment Validation Section */}
                  {paymentsPendingValidation && (
                    <div className="rounded-lg border-2 border-warning bg-warning/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span className="font-semibold text-warning">Pagamentos Aguardando Validação</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {!analysis.setup_fee_exempt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              Taxa Setup
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-success/20 text-success">
                                Confirmado em {formatDateTime(analysis.setup_payment_confirmed_at)}
                              </Badge>
                              {analysis.setup_payment_receipt_path && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => openReceiptUrl(analysis.setup_payment_receipt_path)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Garantia
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-success/20 text-success">
                              Confirmado em {formatDateTime(analysis.guarantee_payment_confirmed_at)}
                            </Badge>
                            {analysis.guarantee_payment_receipt_path && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openReceiptUrl(analysis.guarantee_payment_receipt_path)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-success hover:bg-success/90"
                          onClick={() => setValidationModalOpen(true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Validar Pagamentos
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment Rejected Banner */}
                  {analysis.payments_rejected_at && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-destructive">Pagamentos Rejeitados</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Rejeitado em {formatDateTime(analysis.payments_rejected_at)}
                      </p>
                      <p className="text-sm">{analysis.payments_rejection_reason}</p>
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

                  {/* Rate adjustment info */}
                  {analysis.rate_adjusted_by_tridots && (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-warning" />
                        <span className="font-medium text-warning">Taxa Reajustada</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Taxa original: {analysis.original_taxa_garantia_percentual}% → 
                        Nova taxa: {analysis.taxa_garantia_percentual}%
                      </p>
                    </div>
                  )}

                  {/* Acceptance Link Section */}
                  {analysis.status === 'aguardando_pagamento' && analysis.acceptance_token && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-primary" />
                          <span className="font-medium">Link de Aceite</span>
                        </div>
                        <Badge variant={acceptanceStatus?.status === 'active' ? 'default' : acceptanceStatus?.status === 'used' ? 'secondary' : 'destructive'}>
                          {acceptanceStatus?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          value={`${window.location.origin}/aceite/${analysis.acceptance_token}`}
                          readOnly 
                          className="text-xs font-mono"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {acceptanceStatus?.status === 'expired' && (
                        <Button 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={handleRegenerateLink}
                          disabled={regeneratingLink}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingLink ? 'animate-spin' : ''}`} />
                          {regeneratingLink ? 'Gerando...' : 'Regenerar Link'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {analysis.rejection_reason && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-destructive">Motivo da Recusa</span>
                      </div>
                      <p className="text-sm">{analysis.rejection_reason}</p>
                    </div>
                  )}

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
                        <span className="font-medium">
                          {analysis.setup_fee_exempt ? (
                            <span className="text-success">Isento</span>
                          ) : (
                            formatCurrency(analysis.setup_fee)
                          )}
                        </span>
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

              {/* Imobiliária Tab */}
              <TabsContent value="imobiliaria" className="m-0 p-6">
                {analysis.agency ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                      <h3 className="font-semibold text-lg">{analysis.agency.razao_social}</h3>
                      {analysis.agency.nome_fantasia && (
                        <p className="text-sm text-muted-foreground">{analysis.agency.nome_fantasia}</p>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <InfoRow label="CNPJ" value={analysis.agency.cnpj} icon={Briefcase} />
                      <InfoRow label="E-mail" value={analysis.agency.email} icon={Mail} />
                      <InfoRow label="Telefone" value={analysis.agency.telefone} icon={Phone} />
                      <InfoRow 
                        label="Endereço" 
                        value={analysis.agency.endereco ? `${analysis.agency.endereco}, ${analysis.agency.cidade} - ${analysis.agency.estado}` : null} 
                        icon={MapPin} 
                      />
                    </div>

                    <div className="rounded-lg border p-4 mt-4">
                      <h4 className="text-sm font-semibold mb-3">Responsável</h4>
                      <div className="grid gap-1">
                        <InfoRow label="Nome" value={analysis.agency.responsavel_nome} icon={User} />
                        <InfoRow label="E-mail" value={analysis.agency.responsavel_email} icon={Mail} />
                        <InfoRow label="Telefone" value={analysis.agency.responsavel_telefone} icon={Phone} />
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Comissão Recorrente</span>
                        <span className="font-bold text-lg">{analysis.agency.percentual_comissao_recorrente}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    Nenhuma imobiliária vinculada
                  </div>
                )}
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
                      <InfoRow label="Profissão" value={analysis.inquilino_profissao} icon={Briefcase} />
                      <InfoRow label="Empresa" value={analysis.inquilino_empresa} icon={Building2} />
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
                        <InfoRow label="Empresa" value={analysis.conjuge_empresa} icon={Building2} />
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
                  isAgencyPortal={false}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <StartAnalysisModal
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        analysisId={analysis.id}
        tenantName={analysis.inquilino_nome}
        onSuccess={() => onOpenChange(false)}
      />
      <RejectionModal
        open={rejectionModalOpen}
        onOpenChange={setRejectionModalOpen}
        analysisId={analysis.id}
        tenantName={analysis.inquilino_nome}
        onSuccess={() => onOpenChange(false)}
      />
      <ApprovalModal
        analysis={analysis}
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        onConfirm={(additionalData) => {
          moveAnalysis.mutate({
            id: analysis.id,
            newStatus: 'aguardando_pagamento',
            additionalData,
          });
          setApprovalModalOpen(false);
          onOpenChange(false);
        }}
      />

      {/* Validation Confirmation Modal */}
      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Validar Pagamentos
            </DialogTitle>
            <DialogDescription>
              Ao confirmar, os pagamentos serão validados e um contrato será criado automaticamente com status "Documentação Pendente".
            </DialogDescription>
          </DialogHeader>
          
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">O que acontecerá:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Análise será movida para "Aprovada"</li>
              <li>• Contrato será criado automaticamente</li>
              <li>• Imobiliária será notificada para enviar documentos</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-success hover:bg-success/90"
              onClick={handleValidatePayments}
              disabled={isValidating}
            >
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

    </>
  );
}
