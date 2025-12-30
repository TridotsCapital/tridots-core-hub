import { useState } from 'react';
import { Analysis } from '@/types/database';
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
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ApprovalModalProps {
  analysis: Analysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (additionalData?: Record<string, unknown>) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ApprovalModal({ analysis, open, onOpenChange, onConfirm }: ApprovalModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [setupFee, setSetupFee] = useState(analysis?.setup_fee?.toString() || '0');
  const [observacoes, setObservacoes] = useState('');

  const handleConfirm = async () => {
    setIsGenerating(true);
    
    // Simulate link generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConfirm({
      setup_fee: parseFloat(setupFee) || 0,
      observacoes: observacoes || undefined,
    });
    
    setIsGenerating(false);
    setObservacoes('');
  };

  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Aprovar Análise
          </DialogTitle>
          <DialogDescription>
            Confirme os dados antes de gerar o link de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Analysis summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Inquilino</span>
              <span className="font-medium">{analysis.inquilino_nome}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Imobiliária</span>
              <span className="font-medium">{analysis.agency?.razao_social}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor do Aluguel</span>
              <span className="font-medium">{formatCurrency(analysis.valor_aluguel)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Total</span>
              <span className="font-bold text-primary">{formatCurrency(analysis.valor_total || analysis.valor_aluguel)}</span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setup-fee">Taxa de Setup (R$)</Label>
              <Input
                id="setup-fee"
                type="number"
                value={setupFee}
                onChange={(e) => setSetupFee(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
                rows={3}
              />
            </div>
          </div>

          {/* Payment link preview */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <LinkIcon className="h-4 w-4" />
              <span>Link de pagamento será gerado automaticamente</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando link...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar e Gerar Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
