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
}: GuaranteeCostsSectionProps) {
  const valorTotal = valorAluguel + (valorCondominio || 0) + (valorIptu || 0);
  const garantiaMensal = valorTotal * (taxaGarantiaPercentual / 100);
  const garantiaAnual = garantiaMensal * 12;

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Custos da Garantia Tridots
      </h4>
      
      <div className="space-y-2">
        {/* Taxa Mensal - DESTAQUE */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Taxa Mensal Tridots ({taxaGarantiaPercentual}%)
          </span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(garantiaMensal)}/mês
          </span>
        </div>
        
        {/* Garantia Anual */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Garantia Anual</span>
          <span className="font-semibold">{formatCurrency(garantiaAnual)}</span>
        </div>
        
        {/* Setup Fee */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Setup Fee (único)</span>
          <span className={setupFeeExempt ? 'text-green-600 font-medium' : ''}>
            {setupFeeExempt ? 'ISENTA' : formatCurrency(setupFee)}
          </span>
        </div>
        
        {/* Forma de Pagamento */}
        <div className="pt-2 border-t">
          {formaPagamentoPreferida ? (
            <PaymentMethodDisplay
              method={formaPagamentoPreferida}
              garantiaAnual={garantiaAnual}
              descontoPix={descontoPix || 0}
              showDiscount={true}
            />
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Forma de pagamento não definida
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
