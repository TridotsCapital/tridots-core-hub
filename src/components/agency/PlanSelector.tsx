import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  GUARANTEE_PLANS, 
  PLAN_ORDER, 
  type PlanType, 
  calculateCommission,
  formatCurrency,
  formatPercentage,
  calculateCoverage
} from '@/lib/plans';

interface PlanSelectorProps {
  valorLocaticioTotal: number;
  selectedPlan: PlanType | null;
  selectedRate: number;
  onPlanChange: (plan: PlanType, rate: number) => void;
  garantiaAnual?: number;
  showCommission?: boolean;
  disabled?: boolean;
}

export function PlanSelector({
  valorLocaticioTotal,
  selectedPlan,
  selectedRate,
  onPlanChange,
  garantiaAnual,
  showCommission = true,
  disabled = false,
}: PlanSelectorProps) {
  const coverage = calculateCoverage(valorLocaticioTotal);

  const handlePlanClick = (plan: PlanType) => {
    if (disabled) return;
    // When switching plans, reset to the minimum rate of the new plan
    const defaultRate = GUARANTEE_PLANS[plan].minRate;
    onPlanChange(plan, defaultRate);
  };

  const handleRateChange = (plan: PlanType, rate: string) => {
    if (disabled) return;
    onPlanChange(plan, parseFloat(rate));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PLAN_ORDER.map((planKey) => {
        const plan = GUARANTEE_PLANS[planKey];
        const isSelected = selectedPlan === planKey;
        const currentRate = isSelected ? selectedRate : plan.minRate;
        
        // Calculate guarantee based on current rate
        const currentGarantiaAnual = garantiaAnual ?? (valorLocaticioTotal * currentRate / 100 * 12);
        const commission = calculateCommission(currentGarantiaAnual, planKey);

        return (
          <Card
            key={planKey}
            className={cn(
              'relative cursor-pointer transition-all duration-200',
              isSelected 
                ? `ring-2 ring-offset-2 ${plan.selectedBorderClass} ring-current` 
                : `hover:border-gray-300 ${plan.borderClass}`,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => handlePlanClick(planKey)}
          >
            {isSelected && (
              <div className={cn(
                'absolute -top-2 -right-2 rounded-full p-1',
                `bg-gradient-to-r ${plan.gradientClass} text-white`
              )}>
                <Check className="h-4 w-4" />
              </div>
            )}
            
            <CardContent className="p-4 space-y-4">
              {/* Plan Badge */}
              <Badge className={cn('font-bold', plan.badgeClass)}>
                {plan.name}
              </Badge>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', plan.colorClass)} />
                  <span>Cobertura: 20x valor locatício</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', plan.colorClass)} />
                  <span>Custos de saída: até {formatCurrency(plan.exitCostsLimit)}</span>
                </div>
                {showCommission && (
                  <div className="flex items-start gap-2 text-sm">
                    <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', plan.colorClass)} />
                    <span>Sua comissão: {plan.commissionRate}%</span>
                  </div>
                )}
              </div>

              {/* Rate Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Taxa:</label>
                <Select
                  value={currentRate.toString()}
                  onValueChange={(value) => handleRateChange(planKey, value)}
                  disabled={disabled || !isSelected}
                >
                  <SelectTrigger 
                    className={cn(
                      'w-full',
                      isSelected ? plan.borderClass : 'border-gray-200'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue placeholder="Selecione a taxa" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.steps.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {formatPercentage(rate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              {valorLocaticioTotal > 0 && (
                <div className={cn(
                  'pt-3 border-t space-y-1',
                  isSelected ? 'border-current/20' : 'border-gray-100'
                )}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cobertura total:</span>
                    <span className="font-medium">{formatCurrency(coverage)}</span>
                  </div>
                  {showCommission && isSelected && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sua comissão:</span>
                      <span className={cn('font-medium', plan.colorClass)}>
                        ~{formatCurrency(commission.mensal)}/mês
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
