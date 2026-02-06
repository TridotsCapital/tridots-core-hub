import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock, CreditCard, Landmark, AlertTriangle } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/validators';
import { 
  useInitiateRenewal, 
  useApproveRenewal, 
  useRejectRenewal 
} from '@/hooks/useContractRenewal';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Analysis {
  inquilino_nome: string;
  valor_aluguel: number;
  valor_condominio: number | null;
  valor_iptu: number | null;
  valor_outros_encargos?: number | null;
  taxa_garantia_percentual: number;
}

interface PendingRenewal {
  id: string;
  request_source: string;
  requested_at: string;
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
}

interface TridotsRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  dataFimContrato: string | null;
  analysis: Analysis;
  pendingRenewal?: PendingRenewal;
  currentPaymentMethod?: 'pix' | 'card' | 'boleto_imobiliaria' | null;
}

export function TridotsRenewalModal({
  open,
  onOpenChange,
  contractId,
  dataFimContrato,
  analysis,
  pendingRenewal,
  currentPaymentMethod,
}: TridotsRenewalModalProps) {
  const [mode, setMode] = useState<'pending' | 'new'>(pendingRenewal ? 'pending' : 'new');
  const [durationMonths, setDurationMonths] = useState('12');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto_imobiliaria' | 'keep'>(
    'keep'
  );
  
  // Form values for new renewal
  const [valorAluguel, setValorAluguel] = useState(analysis.valor_aluguel.toString());
  const [valorCondominio, setValorCondominio] = useState((analysis.valor_condominio || 0).toString());
  const [valorIptu, setValorIptu] = useState((analysis.valor_iptu || 0).toString());
  const [valorOutros, setValorOutros] = useState('0');
  const [taxaGarantia, setTaxaGarantia] = useState(analysis.taxa_garantia_percentual.toString());

  const initiateRenewal = useInitiateRenewal();
  const approveRenewal = useApproveRenewal();
  const rejectRenewal = useRejectRenewal();

  // Reset mode when pendingRenewal changes
  useEffect(() => {
    setMode(pendingRenewal ? 'pending' : 'new');
  }, [pendingRenewal]);


  const isChangingPaymentMethod = paymentMethod !== 'keep' && paymentMethod !== currentPaymentMethod;
  const isChangingFromBoleto = currentPaymentMethod === 'boleto_imobiliaria' && isChangingPaymentMethod;

  const handleInitiateRenewal = async () => {
    const newPaymentMethod = paymentMethod === 'keep' ? undefined : paymentMethod;
    
    await initiateRenewal.mutateAsync({
      contract_id: contractId,
      new_valor_aluguel: parseFloat(valorAluguel) || 0,
      new_valor_condominio: parseFloat(valorCondominio) || 0,
      new_valor_iptu: parseFloat(valorIptu) || 0,
      new_valor_outros_encargos: parseFloat(valorOutros) || 0,
      new_taxa_garantia_percentual: parseFloat(taxaGarantia) || analysis.taxa_garantia_percentual,
      old_valor_aluguel: analysis.valor_aluguel,
      old_valor_condominio: analysis.valor_condominio,
      old_valor_iptu: analysis.valor_iptu,
      old_valor_outros_encargos: analysis.valor_outros_encargos || null,
      old_taxa_garantia_percentual: analysis.taxa_garantia_percentual,
      old_data_fim_contrato: dataFimContrato,
      durationMonths: parseInt(durationMonths),
      newPaymentMethod
    });
    onOpenChange(false);
  };

  const handleApprovePending = async () => {
    if (!pendingRenewal) return;
    
    const newPaymentMethod = paymentMethod === 'keep' ? undefined : paymentMethod;
    
    await approveRenewal.mutateAsync({
      renewalId: pendingRenewal.id,
      contractId,
      durationMonths: parseInt(durationMonths),
      newPaymentMethod
    });
    onOpenChange(false);
  };

  const handleRejectPending = async () => {
    if (!pendingRenewal || !rejectionReason.trim()) return;
    
    await rejectRenewal.mutateAsync({
      renewalId: pendingRenewal.id,
      contractId,
      reason: rejectionReason
    });
    onOpenChange(false);
    setRejectionReason('');
  };

  const isLoading = initiateRenewal.isPending || approveRenewal.isPending || rejectRenewal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renovar Contrato
          </DialogTitle>
          <DialogDescription>
            {pendingRenewal 
              ? 'Existe uma solicitação de renovação pendente da imobiliária.' 
              : 'Inicie uma renovação definindo os novos valores e duração.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle if there's a pending renewal */}
        {pendingRenewal && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Ver Solicitação Pendente
            </Button>
            <Button
              variant={mode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('new')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Nova Renovação
            </Button>
          </div>
        )}

        {/* Pending Renewal View */}
        {mode === 'pending' && pendingRenewal && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-700">
                  Pendente
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Solicitada pela {pendingRenewal.request_source === 'agency' ? 'Imobiliária' : 'Tridots'} em{' '}
                  {format(new Date(pendingRenewal.requested_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Aluguel:</span>
                  <p className="font-medium">
                    {formatCurrency(pendingRenewal.old_valor_aluguel)} → {formatCurrency(pendingRenewal.new_valor_aluguel)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Condomínio:</span>
                  <p className="font-medium">
                    {formatCurrency(pendingRenewal.old_valor_condominio || 0)} → {formatCurrency(pendingRenewal.new_valor_condominio)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">IPTU:</span>
                  <p className="font-medium">
                    {formatCurrency(pendingRenewal.old_valor_iptu || 0)} → {formatCurrency(pendingRenewal.new_valor_iptu)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Taxa Garantia:</span>
                  <p className="font-medium">
                    {pendingRenewal.new_taxa_garantia_percentual}%
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Duração da Renovação (meses)</Label>
                <Input
                  type="number"
                  min="1"
                  max="36"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                />
                {dataFimContrato && (
                  <p className="text-xs text-muted-foreground">
                    Nova data de vencimento: {format(addMonths(new Date(dataFimContrato), parseInt(durationMonths) || 12), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Manter atual ({currentPaymentMethod === 'boleto_imobiliaria' ? 'Boleto Unificado' : currentPaymentMethod === 'card' ? 'Cartão' : 'PIX'})
                      </div>
                    </SelectItem>
                    <SelectItem value="boleto_imobiliaria">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        Boleto Unificado (Imobiliária)
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito (Inquilino)
                      </div>
                    </SelectItem>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        PIX (Inquilino)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {isChangingFromBoleto && (
                  <Alert className="border-amber-300 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-xs">
                      Mudança de Boleto Unificado para outra forma requer novo aceite digital do inquilino.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Motivo da Recusa (se aplicável)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Informe o motivo caso queira recusar..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectPending} 
                disabled={isLoading || !rejectionReason.trim()}
              >
                {rejectRenewal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <XCircle className="h-4 w-4 mr-2" />
                Recusar
              </Button>
              <Button 
                onClick={handleApprovePending} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveRenewal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* New Renewal Form */}
        {mode === 'new' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Novo Aluguel</Label>
                <Input
                  type="number"
                  value={valorAluguel}
                  onChange={(e) => setValorAluguel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Atual: {formatCurrency(analysis.valor_aluguel)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Novo Condomínio</Label>
                <Input
                  type="number"
                  value={valorCondominio}
                  onChange={(e) => setValorCondominio(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Atual: {formatCurrency(analysis.valor_condominio || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Novo IPTU</Label>
                <Input
                  type="number"
                  value={valorIptu}
                  onChange={(e) => setValorIptu(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Atual: {formatCurrency(analysis.valor_iptu || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Outros Encargos</Label>
                <Input
                  type="number"
                  value={valorOutros}
                  onChange={(e) => setValorOutros(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxa de Garantia (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={taxaGarantia}
                  onChange={(e) => setTaxaGarantia(e.target.value)}
                />
              </div>
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
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento na Renovação</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Manter atual ({currentPaymentMethod === 'boleto_imobiliaria' ? 'Boleto Unificado' : currentPaymentMethod === 'card' ? 'Cartão' : 'PIX'})
                    </div>
                  </SelectItem>
                  <SelectItem value="boleto_imobiliaria">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Boleto Unificado (Imobiliária)
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito (Inquilino)
                    </div>
                  </SelectItem>
                  <SelectItem value="pix">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      PIX (Inquilino)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {isChangingFromBoleto && (
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Mudança de Boleto Unificado para outra forma requer novo aceite digital do inquilino.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {dataFimContrato && (
              <p className="text-sm text-muted-foreground">
                Nova data de vencimento: {format(addMonths(new Date(dataFimContrato), parseInt(durationMonths) || 12), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleInitiateRenewal} 
                disabled={isLoading}
              >
                {initiateRenewal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Iniciar Renovação
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
