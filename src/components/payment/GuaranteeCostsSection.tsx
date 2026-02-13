import { Shield, Calendar } from 'lucide-react';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GUARANTEE_PLANS, type PlanType, getPlanByRate } from '@/lib/plans';
import { formatDateBR } from '@/lib/utils';

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
  /** Contract start date (data_inicio_contrato) */
  dataInicioContrato?: string | null;
  /** Plan type (start, prime, exclusive) */
  planoGarantia?: PlanType | string | null;
  /** Show commission info */
  showCommission?: boolean;
  /** Commission label type: 'agency' = "Sua Comissão" | 'internal' = "Comissão Imobiliária" */
  commissionLabel?: 'agency' | 'internal';
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
  dataInicioContrato,
  planoGarantia,
  showCommission = false,
  commissionLabel = 'agency',
}: GuaranteeCostsSectionProps) {
  const valorTotal = valorAluguel + (valorCondominio || 0) + (valorIptu || 0);
  const garantiaMensal = valorTotal * (taxaGarantiaPercentual / 100);
  const garantiaAnualBase = garantiaMensal * 12;
  
  // Use saved value if available, otherwise calculate with discount
  // Use ?? 0 to avoid fallback to 5 - if not configured, no discount
  const pixDiscount = descontoPix ?? 0;
  const garantiaAnualComDesconto = pixDiscount > 0 
    ? garantiaAnualBase * (1 - pixDiscount / 100)
    : garantiaAnualBase;
  
  // Final annual value based on payment method
  const garantiaAnualFinal = garantiaAnualSalva !== null && garantiaAnualSalva !== undefined
    ? garantiaAnualSalva
    : formaPagamentoPreferida === 'pix'
      ? garantiaAnualComDesconto
      : garantiaAnualBase;

  const isSetupExempt = setupFeeExempt || setupFee === 0;
  
  // Get plan info - derive from rate if not provided
  const effectivePlan: PlanType = (planoGarantia as PlanType) || getPlanByRate(taxaGarantiaPercentual);
  const plan = effectivePlan ? GUARANTEE_PLANS[effectivePlan] : null;
  const commissionAmount = plan ? garantiaAnualFinal * (plan.commissionRate / 100) / 12 : 0;
  
  // Commission text based on portal
  const commissionText = commissionLabel === 'agency' ? 'Sua Comissão' : 'Comissão Imobiliária';

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Custos da Garantia Tridots
        </h4>
        {plan && (
          <Badge className={plan.badgeClass}>
            {plan.emoji} {plan.name}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Valor Total - base de cálculo (sem destaque) */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Valor Total (com encargos)</span>
          <span>{formatCurrency(valorTotal)}</span>
        </div>
        
        {/* Garantia Anual - SEM destaque exagerado */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Garantia Anual ({taxaGarantiaPercentual}%)
          </span>
          <span>
            {formatCurrency(garantiaAnualFinal)}
            <span className="text-xs text-muted-foreground"> /ano</span>
          </span>
        </div>
        
        {/* Setup Fee */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Setup Fee (único)</span>
          <span className={isSetupExempt ? 'text-green-600 font-medium' : ''}>
            {isSetupExempt ? 'Isento' : formatCurrency(setupFee)}
          </span>
        </div>
        
        {/* Forma de Pagamento - DESTACADA */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">Forma de Pagamento:</p>
          <div className="font-medium text-primary">
            {formaPagamentoPreferida ? (
              <PaymentMethodDisplay
                method={formaPagamentoPreferida}
                garantiaAnual={garantiaAnualBase}
                descontoPix={pixDiscount}
                showDiscount={true}
              />
            ) : (
              <span className="text-sm text-muted-foreground italic font-normal">
                Não definida
              </span>
            )}
          </div>
        </div>

        {/* Data de início do contrato */}
        {dataInicioContrato && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Contrato iniciado em:{' '}
              <span className="font-medium text-foreground">
                {formatDateBR(dataInicioContrato, 'dd/MM/yyyy')}
              </span>
            </span>
          </div>
        )}

        {/* Commission - only shown when requested and plan is available */}
        {showCommission && plan && (
          <div className="pt-3 mt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{commissionText}:</span>
              <span className="font-medium text-primary">
                {plan.commissionRate}% (~{formatCurrency(commissionAmount)}/mês)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
