import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarSync,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Send,
  AlertCircle,
  Loader2,
  History,
  RefreshCw,
} from 'lucide-react';
import { differenceInDays, addMonths } from 'date-fns';
import { formatDateBR } from '@/lib/utils';
import { formatCurrency } from '@/lib/validators';
import { useContractRenewals, usePendingRenewal, useApproveRenewal, useRejectRenewal } from '@/hooks/useContractRenewal';
import { useRenewalNotifications } from '@/hooks/useRenewalNotifications';
import { RenewalNotificationHistory } from './RenewalNotificationHistory';
import { RenewalNotificationActions } from './RenewalNotificationActions';
import { TridotsRenewalModal } from './TridotsRenewalModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  approved: { label: 'Aprovada', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'Recusada', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
  canceled: { label: 'Cancelada', icon: Ban, color: 'bg-gray-100 text-gray-700 border-gray-300' }
};

interface ContractRenewalTabProps {
  contractId: string;
  contractStatus: string;
  dataFimContrato: string | null;
  paymentMethod?: 'pix' | 'card' | 'boleto_imobiliaria' | null;
  analysis: {
    inquilino_nome: string;
    inquilino_email: string | null;
    inquilino_telefone: string | null;
    valor_aluguel: number;
    valor_condominio: number | null;
    valor_iptu: number | null;
    valor_outros_encargos?: number | null;
    taxa_garantia_percentual: number;
    imovel_endereco: string;
    imovel_cidade: string;
    imovel_estado: string;
  };
  isAgencyView?: boolean;
}

export function ContractRenewalTab({
  contractId,
  contractStatus,
  dataFimContrato,
  paymentMethod,
  analysis,
  isAgencyView = false,
}: ContractRenewalTabProps) {
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [durationMonths, setDurationMonths] = useState('12');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: renewals, isLoading: loadingRenewals } = useContractRenewals(contractId);
  const { data: pendingRenewal, isLoading: loadingPending } = usePendingRenewal(contractId);
  const { data: notifications, isLoading: loadingNotifications } = useRenewalNotifications(contractId);
  
  const approveRenewal = useApproveRenewal();
  const rejectRenewal = useRejectRenewal();

  // Calculate renewal status
  const daysUntilExpiration = dataFimContrato
    ? differenceInDays(new Date(dataFimContrato), new Date())
    : null;
  const isInRenewalPeriod = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0;

  // Historical renewals (excluding pending)
  const historicalRenewals = renewals?.filter(r => r.status !== 'pending') || [];

  const handleApprove = async () => {
    if (!pendingRenewal) return;
    
    await approveRenewal.mutateAsync({
      renewalId: pendingRenewal.id,
      contractId,
      durationMonths: parseInt(durationMonths)
    });
    setApproveModalOpen(false);
  };

  const handleReject = async () => {
    if (!pendingRenewal || !rejectionReason.trim()) return;
    
    await rejectRenewal.mutateAsync({
      renewalId: pendingRenewal.id,
      contractId,
      reason: rejectionReason
    });
    setRejectModalOpen(false);
    setRejectionReason('');
  };

  const isLoading = loadingRenewals || loadingPending || loadingNotifications;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Renewal Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarSync className="h-4 w-4" />
            Status de Renovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {isExpired && (
              <Badge variant="destructive" className="px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                Contrato Vencido
              </Badge>
            )}
            {isInRenewalPeriod && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 px-3 py-1">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                No Prazo de Renovação ({daysUntilExpiration} dias restantes)
              </Badge>
            )}
            {pendingRenewal && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Solicitação Pendente
              </Badge>
            )}
            {!isExpired && !isInRenewalPeriod && !pendingRenewal && contractStatus === 'ativo' && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Contrato Vigente
              </Badge>
            )}
          </div>

          {dataFimContrato && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vencimento Atual:</span>
                <p className="font-medium">
                  {formatDateBR(dataFimContrato)}
                </p>
              </div>
              {daysUntilExpiration !== null && (
                <div>
                  <span className="text-muted-foreground">Dias Restantes:</span>
                  <p className={`font-medium ${daysUntilExpiration <= 0 ? 'text-red-600' : daysUntilExpiration <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {daysUntilExpiration <= 0 ? 'Vencido' : `${daysUntilExpiration} dias`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isAgencyView && contractStatus === 'ativo' && (
            <div className="pt-2">
              <Button onClick={() => setRenewModalOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {pendingRenewal ? 'Ver Solicitação Pendente' : 'Iniciar Renovação'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Renewal Details */}
      {pendingRenewal && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Solicitação de Renovação Pendente
            </CardTitle>
            <CardDescription>
              Solicitada em {formatDateBR(pendingRenewal.requested_at, "dd/MM/yyyy 'às' HH:mm")}
              {' '}pela {pendingRenewal.request_source === 'agency' ? 'Imobiliária' : 'GarantFácil'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Aluguel:</span>
                <p className="font-medium">
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrency(pendingRenewal.old_valor_aluguel)}
                  </span>
                  → {formatCurrency(pendingRenewal.new_valor_aluguel)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Condomínio:</span>
                <p className="font-medium">
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrency(pendingRenewal.old_valor_condominio || 0)}
                  </span>
                  → {formatCurrency(pendingRenewal.new_valor_condominio)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">IPTU:</span>
                <p className="font-medium">
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrency(pendingRenewal.old_valor_iptu || 0)}
                  </span>
                  → {formatCurrency(pendingRenewal.new_valor_iptu)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Taxa:</span>
                <p className="font-medium">
                  {pendingRenewal.new_taxa_garantia_percentual}%
                </p>
              </div>
            </div>

            {!isAgencyView && (
              <div className="flex gap-2 pt-2">
                <Button onClick={() => setApproveModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button variant="destructive" onClick={() => setRejectModalOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Actions (only for GarantFácil when there's an approved renewal pending acceptance) */}
      {!isAgencyView && (
        <RenewalNotificationActions
          contractId={contractId}
          renewalId={renewals?.find(r => r.status === 'approved' && !r.terms_accepted_at)?.id}
          tenantName={analysis.inquilino_nome}
          tenantEmail={analysis.inquilino_email}
          tenantPhone={analysis.inquilino_telefone}
          propertyAddress={`${analysis.imovel_endereco}, ${analysis.imovel_cidade} - ${analysis.imovel_estado}`}
          dataFimContrato={dataFimContrato}
        />
      )}

      {/* Notification History */}
      <RenewalNotificationHistory notifications={notifications || []} />

      {/* Historical Renewals */}
      {historicalRenewals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Renovações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historicalRenewals.map((renewal) => {
              const config = STATUS_CONFIG[renewal.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = config.icon;
              const newTotal = renewal.new_valor_aluguel + renewal.new_valor_condominio + renewal.new_valor_iptu + (renewal.new_valor_outros_encargos || 0);
              const oldTotal = renewal.old_valor_aluguel + (renewal.old_valor_condominio || 0) + (renewal.old_valor_iptu || 0) + (renewal.old_valor_outros_encargos || 0);

              return (
                <div key={renewal.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatDateBR(renewal.requested_at)}
                    </span>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">De:</span>
                      <span className="line-through text-muted-foreground">{formatCurrency(oldTotal)}</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Para:</span>
                      <span className="font-medium">{formatCurrency(newTotal)}</span>
                    </div>
                  </div>

                  {renewal.status === 'approved' && renewal.renewal_duration_months && (
                    <div className="text-xs text-green-600">
                      Renovado por {renewal.renewal_duration_months} meses
                    </div>
                  )}

                  {renewal.status === 'rejected' && renewal.rejection_reason && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Motivo: {renewal.rejection_reason}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Solicitado por: {renewal.request_source === 'agency' ? 'Imobiliária' : 'GarantFácil'}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* GarantFácil Renewal Modal */}
      <TridotsRenewalModal
        open={renewModalOpen}
        onOpenChange={setRenewModalOpen}
        contractId={contractId}
        dataFimContrato={dataFimContrato}
        analysis={analysis}
        pendingRenewal={pendingRenewal || undefined}
        currentPaymentMethod={paymentMethod}
      />

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Renovação</DialogTitle>
            <DialogDescription>
              Defina a duração da renovação do contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duração (meses)</Label>
              <Input
                type="number"
                min="1"
                max="36"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </div>
            {dataFimContrato && (
              <p className="text-sm text-muted-foreground">
                Nova data de vencimento: {formatDateBR(addMonths(new Date(dataFimContrato), parseInt(durationMonths) || 12).toISOString(), "dd/MM/yyyy")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={approveRenewal.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveRenewal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Renovação</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Recusa *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da recusa..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject} 
              disabled={rejectRenewal.isPending || !rejectionReason.trim()}
            >
              {rejectRenewal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
