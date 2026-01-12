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
import { CheckCircle, Link as LinkIcon, Loader2, AlertTriangle, Percent, ExternalLink, Home, Receipt } from 'lucide-react';
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
  
  // Payment links
  const [setupPaymentLink, setSetupPaymentLink] = useState('');
  const [guaranteePaymentLink, setGuaranteePaymentLink] = useState('');

  // Reset state when analysis changes
  useEffect(() => {
    if (analysis) {
      setTaxaGarantia(analysis.taxa_garantia_percentual);
      setIsRateAdjusted(false);
      setObservacoes('');
      setSetupPaymentLink('');
      setGuaranteePaymentLink('');
    }
  }, [analysis?.id]);

  // Check if rate was adjusted
  useEffect(() => {
    if (analysis) {
      setIsRateAdjusted(taxaGarantia !== analysis.taxa_garantia_percentual);
    }
  }, [taxaGarantia, analysis?.taxa_garantia_percentual]);

  const isSetupRequired = !analysis?.setup_fee_exempt && (analysis?.setup_fee || 0) > 0;
  
  const isFormValid = () => {
    if (isSetupRequired && !setupPaymentLink.trim()) return false;
    if (!guaranteePaymentLink.trim()) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    
    if (!isFormValid()) {
      toast.error('Preencha os links de pagamento obrigatórios.');
      return;
    }
    
    setIsGenerating(true);

    try {
      // Generate acceptance token via edge function with payment links
      const { data, error } = await supabase.functions.invoke('generate-acceptance-link', {
        body: { 
          analysisId: analysis.id,
          setupPaymentLink: isSetupRequired ? setupPaymentLink : null,
          guaranteePaymentLink,
        }
      });

      if (error) throw error;

      // Prepare update data
      const updateData: Record<string, unknown> = {
        observacoes: observacoes || undefined,
        acceptance_token: data.token,
        acceptance_token_expires_at: data.expiresAt,
        setup_payment_link: isSetupRequired ? setupPaymentLink : null,
        guarantee_payment_link: guaranteePaymentLink,
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
      setSetupPaymentLink('');
      setGuaranteePaymentLink('');
    }
  };

  if (!analysis) return null;

  // Calculate values
  const valorTotal = analysis.valor_total || analysis.valor_aluguel;
  const garantiaMensal = valorTotal * taxaGarantia / 100;
  const garantiaAnual = garantiaMensal * 12;
  const setupFee = analysis.setup_fee_exempt ? 0 : analysis.setup_fee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Aprovar Análise
          </DialogTitle>
          <DialogDescription>
            Confirme os dados, insira os links de pagamento e ajuste a taxa se necessário.
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
          </div>

          {/* Values summary - clearer presentation */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Resumo dos Valores
            </h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Mensal do Imóvel</span>
              <span className="font-bold text-primary">{formatCurrency(valorTotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Taxa de Garantia ({taxaGarantia}%)</span>
              <span>{formatCurrency(garantiaAnual)}/ano</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Garantia Mensal</span>
              <span>{formatCurrency(garantiaMensal)}/mês</span>
            </div>
            
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Taxa Setup</span>
              <span className={analysis.setup_fee_exempt ? 'text-success font-medium' : ''}>
                {analysis.setup_fee_exempt ? 'ISENTA' : formatCurrency(setupFee)}
              </span>
            </div>
            
            <div className="flex justify-between text-base pt-2 border-t bg-primary/5 -mx-4 px-4 py-2 rounded-b-lg -mb-4">
              <span className="font-semibold">Total a Pagar (1º mês)</span>
              <span className="font-bold text-primary text-lg">{formatCurrency(setupFee + garantiaMensal)}</span>
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
              min={10}
              max={15}
              step={0.5}
              className="py-2"
            />
            
          <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
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

          {/* Payment Links */}
          <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              Links de Pagamento
            </h4>
            
            {isSetupRequired && (
              <div className="space-y-2">
                <Label htmlFor="setupLink" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Link Pagamento Taxa Setup *
                </Label>
                <Input
                  id="setupLink"
                  value={setupPaymentLink}
                  onChange={(e) => setSetupPaymentLink(e.target.value)}
                  placeholder="https://..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Valor: {formatCurrency(setupFee)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="guaranteeLink" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Link Pagamento Garantia *
              </Label>
              <Input
                id="guaranteeLink"
                value={guaranteePaymentLink}
                onChange={(e) => setGuaranteePaymentLink(e.target.value)}
                placeholder="https://..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Valor: {formatCurrency(garantiaAnual)} (12x de {formatCurrency(garantiaMensal)})
              </p>
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

          {/* Info */}
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              <span>Link de aceite será gerado e enviado automaticamente (válido por 72h)</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isGenerating || !isFormValid()}>
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
