import { useState, useEffect } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Link as LinkIcon, Loader2, AlertTriangle, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [taxaGarantia, setTaxaGarantia] = useState(analysis?.taxa_garantia_percentual || 8);
  const [observacoes, setObservacoes] = useState('');
  const [isRateAdjusted, setIsRateAdjusted] = useState(false);

  // Reset state when analysis changes
  useEffect(() => {
    if (analysis) {
      setTaxaGarantia(analysis.taxa_garantia_percentual);
      setIsRateAdjusted(false);
      setObservacoes('');
    }
  }, [analysis?.id]);

  // Check if rate was adjusted
  useEffect(() => {
    if (analysis) {
      setIsRateAdjusted(taxaGarantia !== analysis.taxa_garantia_percentual);
    }
  }, [taxaGarantia, analysis?.taxa_garantia_percentual]);

  const handleConfirm = async () => {
    if (!analysis) return;
    
    setIsGenerating(true);

    try {
      // Generate acceptance token via edge function
      const { data, error } = await supabase.functions.invoke('generate-acceptance-link', {
        body: { analysisId: analysis.id }
      });

      if (error) throw error;

      // Prepare update data
      const updateData: Record<string, unknown> = {
        observacoes: observacoes || undefined,
        acceptance_token: data.token,
        acceptance_token_expires_at: data.expiresAt,
      };

      // If rate was adjusted, save original and mark as adjusted
      if (isRateAdjusted) {
        updateData.original_taxa_garantia_percentual = analysis.taxa_garantia_percentual;
        updateData.taxa_garantia_percentual = taxaGarantia;
        updateData.rate_adjusted_by_tridots = true;
      }

      onConfirm(updateData);
      toast.success('Análise aprovada! Link de aceite gerado com sucesso.');
    } catch (error) {
      console.error('Error generating acceptance link:', error);
      toast.error('Erro ao gerar link de aceite. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setObservacoes('');
    }
  };

  if (!analysis) return null;

  // Calculate values
  const valorTotal = analysis.valor_total || analysis.valor_aluguel;
  const garantiaMensal = (valorTotal * taxaGarantia / 100) / 12;
  const setupFee = analysis.setup_fee_exempt ? 0 : analysis.setup_fee;
  const primeiraParcela = setupFee + garantiaMensal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Aprovar Análise
          </DialogTitle>
          <DialogDescription>
            Confirme os dados e ajuste a taxa se necessário. Um link de aceite será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
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
              <span className="text-muted-foreground">Valor Total Mensal</span>
              <span className="font-bold text-primary">{formatCurrency(valorTotal)}</span>
            </div>
          </div>

          {/* Taxa de garantia adjustment */}
          <div className="space-y-3 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Taxa de Garantia Anual
              </Label>
              <span className="text-2xl font-bold text-primary">{taxaGarantia}%</span>
            </div>
            
            <Slider
              value={[taxaGarantia]}
              onValueChange={([value]) => setTaxaGarantia(value)}
              min={5}
              max={15}
              step={0.5}
              className="py-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span>
              <span>Original: {analysis.taxa_garantia_percentual}%</span>
              <span>15%</span>
            </div>

            {isRateAdjusted && (
              <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-md border border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  A taxa foi reajustada de {analysis.taxa_garantia_percentual}% para {taxaGarantia}%. 
                  A imobiliária será notificada sobre essa alteração.
                </p>
              </div>
            )}
          </div>

          {/* Values preview */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-3">Prévia dos Valores</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa Setup</span>
              <span className={analysis.setup_fee_exempt ? 'text-success' : ''}>
                {analysis.setup_fee_exempt ? 'ISENTA' : formatCurrency(setupFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Garantia Mensal</span>
              <span>{formatCurrency(garantiaMensal)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">1ª Parcela</span>
              <span className="font-bold text-primary">{formatCurrency(primeiraParcela)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas 2-12</span>
              <span>{formatCurrency(garantiaMensal)}/mês</span>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a aprovação..."
              rows={2}
            />
          </div>

          {/* Payment link preview */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <LinkIcon className="h-4 w-4" />
              <span>Link de aceite será gerado e enviado automaticamente (válido por 72h)</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4 border-t">
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
                Aprovar e Enviar Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
