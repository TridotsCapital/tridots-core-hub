import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  User, 
  Home, 
  Building2, 
  DollarSign,
  FileText,
  History,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClaimItems } from '@/hooks/useClaimItems';
import { useUpdateClaimStatus, useClaimDetail } from '@/hooks/useClaims';
import { ClaimItemsSection, ClaimFilesSection, ClaimHistorySection } from '@/components/agency/claims';
import { ClaimNotesSection } from './ClaimNotesSection';
import { ClaimDocsChecklist } from './ClaimDocsChecklist';
import { InternalClaimTicketSheet } from './InternalClaimTicketSheet';
import { 
  Claim, 
  ClaimPublicStatus,
  ClaimInternalStatus,
  claimPublicStatusConfig,
  claimInternalStatusConfig 
} from '@/types/claims';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ClaimManagementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim | null;
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ClaimManagementDrawer({ 
  open, 
  onOpenChange, 
  claim,
  onRefresh 
}: ClaimManagementDrawerProps) {
  const navigate = useNavigate();
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  
  // Fetch full claim data with new fields
  const { data: fullClaim, refetch } = useClaimDetail(claim?.id);
  const { data: items } = useClaimItems(claim?.id);
  const updateStatus = useUpdateClaimStatus();

  const currentClaim = fullClaim || claim;

  const handlePublicStatusChange = async (newStatus: ClaimPublicStatus) => {
    if (!currentClaim) return;
    try {
      await updateStatus.mutateAsync({
        id: currentClaim.id,
        public_status: newStatus,
      });
      toast.success('Status público atualizado');
      refetch();
      onRefresh();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleInternalStatusChange = async (newStatus: ClaimInternalStatus) => {
    if (!currentClaim) return;
    try {
      await updateStatus.mutateAsync({
        id: currentClaim.id,
        internal_status: newStatus,
      });
      toast.success('Status interno atualizado');
      refetch();
      onRefresh();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  if (!currentClaim) return null;

  const publicConfig = claimPublicStatusConfig[currentClaim.public_status];
  const internalConfig = claimInternalStatusConfig[currentClaim.internal_status];
  const docsChecklist = (currentClaim as { docs_checklist?: Record<string, boolean> }).docs_checklist || {
    contrato: false,
    boletos: false,
    notificacao: false,
    vistoria: false,
    acordo: false,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <SheetTitle className="text-left">
                  {currentClaim.analysis?.inquilino_nome}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {currentClaim.agency?.nome_fantasia} • {format(new Date(currentClaim.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/claims/${currentClaim.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Página Completa
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
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
                      {formatCurrency(currentClaim.total_claimed_value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Status Público
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={currentClaim.public_status} onValueChange={handlePublicStatusChange}>
                    <SelectTrigger className="w-full">
                      <Badge className={`${publicConfig.bgColor} ${publicConfig.color}`}>
                        {publicConfig.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(claimPublicStatusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <Badge className={`${config.bgColor} ${config.color}`}>
                            {config.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Status Interno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={currentClaim.internal_status} onValueChange={handleInternalStatusChange}>
                    <SelectTrigger className="w-full">
                      <Badge variant="outline" className={`${internalConfig.bgColor} ${internalConfig.color}`}>
                        {internalConfig.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(claimInternalStatusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
                            {config.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    <span className="text-xs">Inquilino</span>
                  </div>
                  <p className="text-sm font-medium truncate">{currentClaim.analysis?.inquilino_nome}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Home className="h-3 w-3" />
                    <span className="text-xs">Imóvel</span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {currentClaim.analysis?.imovel_cidade}/{currentClaim.analysis?.imovel_estado}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-3 w-3" />
                    <span className="text-xs">Imobiliária</span>
                  </div>
                  <p className="text-sm font-medium truncate">{currentClaim.agency?.nome_fantasia}</p>
                </CardContent>
              </Card>
            </div>

            {/* Docs Checklist */}
            <ClaimDocsChecklist claimId={currentClaim.id} checklist={docsChecklist} />

            {/* Notes Section */}
            <ClaimNotesSection claimId={currentClaim.id} />

            {/* Tabs for Items, Files, History */}
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="items" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Itens ({items?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Arquivos
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  Histórico
                </TabsTrigger>
              </TabsList>
              <TabsContent value="items" className="mt-4">
                <ClaimItemsSection 
                  claimId={currentClaim.id} 
                  canEdit={true} 
                  onUpdate={() => {
                    refetch();
                    onRefresh();
                  }}
                />
              </TabsContent>
              <TabsContent value="files" className="mt-4">
                <ClaimFilesSection 
                  claimId={currentClaim.id} 
                  canEdit={true} 
                />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <ClaimHistorySection claimId={currentClaim.id} />
              </TabsContent>
            </Tabs>

            {/* Open Ticket Button */}
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setTicketSheetOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Abrir/Ver Chamado Vinculado
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Internal Claim Ticket Sheet */}
        <InternalClaimTicketSheet
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
          claim={currentClaim}
        />
      </SheetContent>
    </Sheet>
  );
}
