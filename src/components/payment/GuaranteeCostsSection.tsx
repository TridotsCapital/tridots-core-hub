import { Shield } from 'lucide-react';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface GuaranteeCostsSectionProps {
  valorAluguel: number;
  valorCondominio: number | null;
  valorIptu: number | null;
  taxaGarantiaPercentual: number;
  setupFee: number;
  setupFeeExempt?: boolean | null;
  formaPagamentoPreferida: string | null | undefined;
  descontoPix?: number | null;
  /** Use this if garantia_anual is saved in the DB */
  garantiaAnualSalva?: number | null;
}

export function GuaranteeCostsSection({
  valorAluguel,
  valorCondominio,
  valorIptu,
  taxaGarantiaPercentual,
  setupFee,
  setupFeeExempt,
  formaPagamentoPreferida,
  descontoPix,
  garantiaAnualSalva,
}: GuaranteeCostsSectionProps) {
  const valorTotal = valorAluguel + (valorCondominio || 0) + (valorIptu || 0);
  const garantiaMensal = valorTotal * (taxaGarantiaPercentual / 100);
  const garantiaAnualBase = garantiaMensal * 12;
  
  // Use saved value if available, otherwise calculate with discount
  const pixDiscount = descontoPix || 5;
  const garantiaAnualComDesconto = garantiaAnualBase * (1 - pixDiscount / 100);
  
  // Final annual value based on payment method
  const garantiaAnualFinal = garantiaAnualSalva !== null && garantiaAnualSalva !== undefined
    ? garantiaAnualSalva
    : formaPagamentoPreferida === 'pix'
      ? garantiaAnualComDesconto
      : garantiaAnualBase;

  const isSetupExempt = setupFeeExempt || setupFee === 0;

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Custos da Garantia Tridots
      </h4>
      
      <div className="space-y-2">
        {/* Garantia Anual - DESTAQUE */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Garantia Anual ({taxaGarantiaPercentual}%)
          </span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(garantiaAnualFinal)}
            <span className="text-xs font-normal text-muted-foreground"> /ano</span>
          </span>
        </div>
        
        {/* Setup Fee */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Setup Fee (único)</span>
          <span className={isSetupExempt ? 'text-green-600 font-medium' : ''}>
            {isSetupExempt ? 'Isento' : formatCurrency(setupFee)}
          </span>
        </div>
        
        {/* Forma de Pagamento */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">Forma de Pagamento:</p>
          <div>
            {formaPagamentoPreferida ? (
              <PaymentMethodDisplay
                method={formaPagamentoPreferida}
                garantiaAnual={garantiaAnualBase}
                descontoPix={pixDiscount}
                showDiscount={true}
              />
            ) : (
              <span className="text-sm text-muted-foreground italic">
                Não definida
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
