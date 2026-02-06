import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRegisterInvoicePayment } from '@/hooks/useAgencyInvoices';
import { toast } from 'sonner';

interface InvoicePaymentModalProps {
  invoiceId: string;
  invoiceValue: number;
  onClose: () => void;
}

export default function InvoicePaymentModal({ invoiceId, invoiceValue, onClose }: InvoicePaymentModalProps) {
  const [paidValue, setPaidValue] = useState(invoiceValue.toString());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const mutation = useRegisterInvoicePayment();
  const isProcessing = mutation.isPending;

  const handleSubmit = async () => {
    const value = parseFloat(paidValue);
    
    if (isNaN(value) || value <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (Math.abs(value - invoiceValue) > 0.01) {
      toast.error(`Valor deve ser exato (R$ ${invoiceValue.toFixed(2)})`);
      return;
    }

    try {
      await mutation.mutateAsync({
        invoiceId,
        paidValue: value,
        paymentNotes: paymentNotes || undefined,
      });

      toast.success('Pagamento registrado com sucesso');
      onClose();
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os dados do pagamento para finalizar a fatura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Valor Esperado</label>
            <p className="text-2xl font-bold text-primary mt-1">R$ {invoiceValue.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Valor Pago *</label>
            <Input
              type="number"
              step="0.01"
              value={paidValue}
              onChange={(e) => setPaidValue(e.target.value)}
              placeholder="0.00"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deve ser exato ao valor esperado
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Observações</label>
            <Textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Adicione observações sobre o pagamento..."
              disabled={isProcessing}
              rows={3}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Próximas etapas:</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Upload do comprovante de pagamento (via Cloud)</li>
              <li>Fatura será marcada como PAGA</li>
              <li>Comissões serão geradas no próximo mês</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : 'Registrar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
