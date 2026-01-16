import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  AlertTriangle, 
  User, 
  Home, 
  Building2,
  MessageSquare,
  FileText,
  Clock,
  DollarSign,
  FileCheck,
  StickyNote
} from "lucide-react";
import { useClaimDetail, useUpdateClaimStatus } from "@/hooks/useClaims";
import { useClaimItems } from "@/hooks/useClaimItems";
import { useClaimTickets } from "@/hooks/useClaimTickets";
import { 
  ClaimPublicStatus, 
  ClaimInternalStatus,
  claimPublicStatusConfig,
  claimInternalStatusConfig 
} from "@/types/claims";
import { ClaimItemsSection, ClaimFilesSection } from "@/components/agency/claims";
import { ClaimTimeline, ClaimTicketsTab, ClaimContractTab } from "@/components/claims";
import { InternalClaimTicketSheet } from "@/components/claims";
import { InternalNotesTab } from "@/components/shared/InternalNotesTab";
import { GuaranteeCostsSection } from "@/components/payment/GuaranteeCostsSection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);

  const { data: claim, isLoading, refetch } = useClaimDetail(id!);
  const { data: items } = useClaimItems(id!);
  const { data: tickets } = useClaimTickets(id);
  const updateStatus = useUpdateClaimStatus();

  const formatClaimId = (claimId: string) => `#${claimId.slice(0, 8).toUpperCase()}`;

  const handlePublicStatusChange = async (newStatus: ClaimPublicStatus) => {
    if (!claim) return;
    try {
      await updateStatus.mutateAsync({
        id: claim.id,
        public_status: newStatus,
      });
      toast.success("Status público atualizado");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleInternalStatusChange = async (newStatus: ClaimInternalStatus) => {
    if (!claim) return;
    try {
      await updateStatus.mutateAsync({
        id: claim.id,
        internal_status: newStatus,
      });
      toast.success("Status interno atualizado");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Garantia não encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/claims")}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const publicConfig = claimPublicStatusConfig[claim.public_status];
  const internalConfig = claimInternalStatusConfig[claim.internal_status];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/claims")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Garantia {formatClaimId(claim.id)} - {claim.contract?.analysis?.inquilino_nome}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {claim.agency?.nome_fantasia} • Criado em{" "}
                  {format(new Date(claim.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setTicketSheetOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Abrir Chamado
          </Button>
        </div>

        {/* Status Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Público (visível para imobiliária)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={claim.public_status} onValueChange={handlePublicStatusChange}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Badge className={`${publicConfig.bgColor} ${publicConfig.color}`}>{publicConfig.label}</Badge>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(claimPublicStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.bgColor} ${config.color}`}>{config.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Interno (operação de cobrança)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={claim.internal_status} onValueChange={handleInternalStatusChange}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${internalConfig.bgColor} ${internalConfig.color}`}>
                      {internalConfig.label}
                    </Badge>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(claimInternalStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="space-y-4">
            {/* Custos da Garantia Tridots - NO TOPO */}
            {claim.contract?.analysis && (
              <GuaranteeCostsSection
                valorAluguel={(claim.contract.analysis as any).valor_aluguel}
                valorCondominio={(claim.contract.analysis as any).valor_condominio}
                valorIptu={(claim.contract.analysis as any).valor_iptu}
                taxaGarantiaPercentual={(claim.contract.analysis as any).taxa_garantia_percentual}
                setupFee={(claim.contract.analysis as any).setup_fee}
                setupFeeExempt={(claim.contract.analysis as any).setup_fee_exempt}
                formaPagamentoPreferida={(claim.contract.analysis as any).forma_pagamento_preferida}
                descontoPix={(claim.agency as any)?.desconto_pix_percentual}
                garantiaAnualSalva={(claim.contract.analysis as any).garantia_anual}
                dataInicioContrato={(claim.contract.analysis as any).guarantee_payment_date}
              />
            )}

            {/* Value Card */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Solicitado</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(claim.total_claimed_value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Inquilino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{claim.contract?.analysis?.inquilino_nome}</p>
                <p className="text-muted-foreground">CPF: {claim.contract?.analysis?.inquilino_cpf}</p>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{claim.contract?.analysis?.imovel_endereco}</p>
                <p className="text-muted-foreground">
                  {claim.contract?.analysis?.imovel_cidade}/{claim.contract?.analysis?.imovel_estado}
                </p>
              </CardContent>
            </Card>

            {/* Agency Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Imobiliária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{claim.agency?.nome_fantasia}</p>
                <p className="text-muted-foreground">{claim.agency?.razao_social}</p>
              </CardContent>
            </Card>

            {/* Observations */}
            {claim.observations && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {claim.observations}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Card>
              <Tabs defaultValue="items" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-6 overflow-x-auto scrollbar-hide">
                    <TabsTrigger value="items" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <DollarSign className="h-4 w-4" />
                      Itens ({items?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <FileText className="h-4 w-4" />
                      Arquivos
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <MessageSquare className="h-4 w-4" />
                      Chamados ({tickets?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="contract" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <FileCheck className="h-4 w-4" />
                      Contrato
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <Clock className="h-4 w-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="notas" className="flex items-center gap-2 whitespace-nowrap shrink-0">
                      <StickyNote className="h-4 w-4" />
                      Notas
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-6">
                  <TabsContent value="items" className="mt-0">
                    <ClaimItemsSection 
                      claimId={claim.id} 
                      canEdit={true} 
                      onUpdate={() => refetch()}
                    />
                  </TabsContent>
                  <TabsContent value="files" className="mt-0">
                    <ClaimFilesSection 
                      claimId={claim.id} 
                      canEdit={true} 
                    />
                  </TabsContent>
                  <TabsContent value="tickets" className="mt-0">
                    <ClaimTicketsTab claimId={claim.id} isAgencyPortal={false} />
                  </TabsContent>
                  <TabsContent value="contract" className="mt-0">
                    <ClaimContractTab contractId={claim.contract_id} />
                  </TabsContent>
                  <TabsContent value="timeline" className="mt-0">
                    <ClaimTimeline claimId={claim.id} />
                  </TabsContent>
                  <TabsContent value="notas" className="mt-0">
                    <InternalNotesTab 
                      referenceType="claim" 
                      referenceId={claim.id} 
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Ticket Sheet */}
      <InternalClaimTicketSheet
        open={ticketSheetOpen}
        onOpenChange={setTicketSheetOpen}
        claim={claim}
      />
    </DashboardLayout>
  );
}
