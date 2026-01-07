import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FileWarning, 
  User, 
  Home, 
  Calendar,
  DollarSign,
  XCircle,
  Loader2,
} from "lucide-react";
import type { Claim } from "@/types/claims";
import { claimPublicStatusConfig } from "@/types/claims";
import { useCancelClaim } from "@/hooks/useClaims";
import { ClaimItemsSection } from "./ClaimItemsSection";
import { ClaimFilesSection } from "./ClaimFilesSection";
import { ClaimHistorySection } from "./ClaimHistorySection";

interface AgencyClaimDetailViewProps {
  claim: Claim;
  onUpdate: () => void;
}

export function AgencyClaimDetailView({ claim, onUpdate }: AgencyClaimDetailViewProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelClaim = useCancelClaim();

  const statusConfig = claimPublicStatusConfig[claim.public_status];
  const canEdit = claim.public_status === 'solicitado';
  const canCancel = claim.public_status === 'solicitado' && !claim.canceled_at;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCancel = async () => {
    await cancelClaim.mutateAsync(claim.id);
    setCancelDialogOpen(false);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <FileWarning className="h-6 w-6 text-primary" />
              <CardTitle>Detalhes do Sinistro</CardTitle>
            </div>
            <CardDescription>
              Criado em {format(new Date(claim.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              className={`${statusConfig.bgColor} ${statusConfig.color} text-sm px-3 py-1`}
            >
              {statusConfig.label}
            </Badge>
            {canCancel && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Inquilino */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inquilino</p>
                <p className="font-medium">{claim.contract?.analysis?.inquilino_nome}</p>
                <p className="text-xs text-muted-foreground">CPF: {claim.contract?.analysis?.inquilino_cpf}</p>
              </div>
            </div>

            {/* Imóvel */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Imóvel</p>
                <p className="font-medium">{claim.contract?.analysis?.imovel_endereco}</p>
                <p className="text-xs text-muted-foreground">
                  {claim.contract?.analysis?.imovel_cidade}/{claim.contract?.analysis?.imovel_estado}
                </p>
              </div>
            </div>

            {/* Valor Solicitado */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                <p className="font-medium text-lg">{formatCurrency(claim.total_claimed_value)}</p>
              </div>
            </div>

            {/* Aluguel Mensal */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aluguel Mensal</p>
                <p className="font-medium">{formatCurrency(claim.contract?.analysis?.valor_aluguel || 0)}</p>
              </div>
            </div>
          </div>

          {claim.observations && (
            <>
              <Separator className="my-6" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{claim.observations}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Itens do Sinistro</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ClaimItemsSection 
            claimId={claim.id} 
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="files">
          <ClaimFilesSection 
            claimId={claim.id} 
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="history">
          <ClaimHistorySection claimId={claim.id} />
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Sinistro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este sinistro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelClaim.isPending}
            >
              {cancelClaim.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar Cancelamento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
