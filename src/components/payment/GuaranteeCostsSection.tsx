import { Shield, Calendar, CheckCircle } from 'lucide-react';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GUARANTEE_PLANS, type PlanType, calculateCoverage } from '@/lib/plans';

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
  planoGarantia?: PlanType | null;
  /** Show commission info (for agency portals) */
  showCommission?: boolean;
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
  
  // Get plan info
  const plan = planoGarantia ? GUARANTEE_PLANS[planoGarantia] : null;
  const coverage = calculateCoverage(valorTotal);
  const commissionAmount = plan ? garantiaAnualFinal * (plan.commissionRate / 100) / 12 : 0;

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Custos da Garantia Tridots
        </h4>
        {plan && (
          <Badge className={plan.badgeClass}>
            {plan.name}
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
                {format(new Date(dataInicioContrato), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </span>
          </div>
        )}

        {/* Plan Coverage & Commission - only shown when plan is available */}
        {plan && (
          <div className="pt-3 mt-2 border-t space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Cobertura total: <span className="font-medium">{formatCurrency(coverage)}</span> (20x)
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                Limite custos de saída: <span className="font-medium">até {formatCurrency(plan.exitCostsLimit)}</span>
              </span>
            </div>
            {showCommission && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Sua comissão: <span className="font-medium text-primary">{plan.commissionRate}% (~{formatCurrency(commissionAmount)}/mês)</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
