import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApproveRenewal, useRejectRenewal } from '@/hooks/useContractRenewal';
import { Loader2, CalendarSync, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/validators';
import { Badge } from '@/components/ui/badge';

interface ContractRenewal {
  id: string;
  contract_id: string;
  new_valor_aluguel: number;
  new_valor_condominio: number;
  new_valor_iptu: number;
  new_valor_outros_encargos: number;
  new_taxa_garantia_percentual: number;
  old_valor_aluguel: number;
  old_valor_condominio: number | null;
  old_valor_iptu: number | null;
  old_valor_outros_encargos: number | null;
  old_taxa_garantia_percentual: number | null;
  requested_at: string;
  request_source: 'agency' | 'tridots';
}

interface ContractRenewalApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewal: ContractRenewal | null;
  contractId: string;
  tenantName?: string;
}

export function ContractRenewalApprovalModal({
  open,
  onOpenChange,
  renewal,
  contractId,
  tenantName,
}: ContractRenewalApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<'approve' | 'reject'>('approve');
  const [durationMonths, setDurationMonths] = useState(12);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveRenewal = useApproveRenewal();
  const rejectRenewal = useRejectRenewal();

  const isLoading = approveRenewal.isPending || rejectRenewal.isPending;

  const handleApprove = async () => {
    if (!renewal) return;
    
    await approveRenewal.mutateAsync({
      renewalId: renewal.id,
      contractId,
      durationMonths,
    });
    onOpenChange(false);
    resetForm();
  };

  const handleReject = async () => {
    if (!renewal || !rejectionReason.trim()) return;
    
    await rejectRenewal.mutateAsync({
      renewalId: renewal.id,
      contractId,
      reason: rejectionReason,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setDurationMonths(12);
    setRejectionReason('');
    setActiveTab('approve');
  };

  if (!renewal) return null;

  const oldTotal = (renewal.old_valor_aluguel || 0) + 
                   (renewal.old_valor_condominio || 0) + 
                   (renewal.old_valor_iptu || 0) + 
                   (renewal.old_valor_outros_encargos || 0);

  const newTotal = renewal.new_valor_aluguel + 
                   renewal.new_valor_condominio + 
                   renewal.new_valor_iptu + 
                   renewal.new_valor_outros_encargos;

  const percentChange = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSync className="h-5 w-5 text-primary" />
            Solicitação de Renovação
          </DialogTitle>
          <DialogDescription>
            {tenantName ? `Contrato de ${tenantName}` : 'Revisar solicitação de renovação'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Info */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Solicitado em:</span>
              <span className="font-medium">
                {new Date(renewal.requested_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Origem:</span>
              <Badge variant="outline">
                {renewal.request_source === 'agency' ? 'Imobiliária' : 'GarantFácil'}
              </Badge>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Comparativo de Valores</h4>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-muted-foreground">Aluguel:</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_aluguel)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_aluguel)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-muted-foreground">Condomínio:</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_condominio || 0)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_condominio)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-muted-foreground">IPTU:</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_iptu || 0)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_iptu)}
              </div>
            </div>

            <div className="border-t pt-2 grid grid-cols-3 gap-2 text-sm font-medium">
              <div>Total Mensal:</div>
              <div className="text-right">{formatCurrency(oldTotal)}</div>
              <div className="text-right flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                <span className={percentChange > 0 ? 'text-amber-600' : percentChange < 0 ? 'text-green-600' : ''}>
                  {formatCurrency(newTotal)}
                </span>
              </div>
            </div>

            {percentChange !== 0 && (
              <div className="text-xs text-muted-foreground text-right">
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% de variação
              </div>
            )}
          </div>

          {/* Tabs for Approve/Reject */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'approve' | 'reject')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approve" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </TabsTrigger>
              <TabsTrigger value="reject" className="gap-2">
                <XCircle className="h-4 w-4" />
                Recusar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approve" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração da Renovação (meses)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={60}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
                />
                <p className="text-xs text-muted-foreground">
                  Padrão: 12 meses. Um novo link de aceite será enviado ao inquilino.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="reject" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Recusa *</Label>
                <Textarea
                  id="reason"
                  placeholder="Informe o motivo da recusa..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          {activeTab === 'approve' ? (
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar Renovação
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isLoading || !rejectionReason.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <XCircle className="h-4 w-4 mr-2" />
              Recusar Renovação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
