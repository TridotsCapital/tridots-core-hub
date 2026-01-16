import { Shield, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GUARANTEE_PLANS, PLAN_COVERAGES, getPlanByRate, calculateCoverage, type PlanType } from '@/lib/plans';
import { useClaimCoverage } from '@/hooks/useClaimCoverage';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface CoverageCardProps {
  /** Plan type (start, prime, exclusive) */
  planoGarantia?: PlanType | string | null;
  /** Total monthly rental package (aluguel + condomínio + IPTU) */
  valorLocaticioTotal: number;
  /** Guarantee rate percentage (fallback if planoGarantia not provided) */
  taxaGarantiaPercentual?: number;
  /** Show consumption bar (only for Claims) */
  showConsumption?: boolean;
  /** Contract ID for consumption calculation */
  contractId?: string;
}

export function CoverageCard({
  planoGarantia,
  valorLocaticioTotal,
  taxaGarantiaPercentual = 10,
  showConsumption = false,
  contractId,
}: CoverageCardProps) {
  // Derive plan from rate if not provided
  const effectivePlan: PlanType = (planoGarantia as PlanType) || getPlanByRate(taxaGarantiaPercentual);
  const plan = GUARANTEE_PLANS[effectivePlan];
  
  // Calculate coverage values
  const coberturaTotal = calculateCoverage(valorLocaticioTotal);
  const limiteCustosSaida = plan.exitCostsLimit;

  // Get consumption data if needed
  const { data: consumptionData } = useClaimCoverage(showConsumption ? contractId : undefined);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Coberturas Contratadas
          </CardTitle>
          <Badge className={plan.badgeClass}>
            {plan.emoji} {plan.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage Checkmarks */}
        <ul className="space-y-2">
          {PLAN_COVERAGES.map((coverage) => (
            <li key={coverage.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>
                {coverage.id === 'custos_saida' 
                  ? `${coverage.label} (até ${formatCurrency(limiteCustosSaida)})`
                  : coverage.label
                }
              </span>
            </li>
          ))}
        </ul>

        {/* Coverage Totals */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Cobertura Total:</span>
            </span>
            <span className="font-semibold text-primary">
              {formatCurrency(coberturaTotal)} <span className="text-muted-foreground font-normal">(20x)</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Limite Custos de Saída:</span>
            <span>até {formatCurrency(limiteCustosSaida)}</span>
          </div>
        </div>

        {/* Explanatory Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>OBS:</strong> O limite disponível para os custos de saída está dentro da cobertura global 
            da garantia de 20x o valor do pacote locatício, não sendo um valor adicional.
          </p>
        </div>

        {/* Consumption Bar - Only for Claims */}
        {showConsumption && consumptionData && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Consumo da Cobertura</span>
              <span className="text-muted-foreground">
                {consumptionData.percentUsed.toFixed(1)}% utilizado
              </span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Progress 
                      value={consumptionData.percentUsed} 
                      className="h-2.5"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Utilizado: {formatCurrency(consumptionData.totalUsed)}</p>
                  <p>Disponível: {formatCurrency(consumptionData.totalAvailable)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Saldo Utilizado</p>
                <p className="font-medium text-amber-600">
                  {formatCurrency(consumptionData.totalUsed)}
                  {consumptionData.programmedAmount > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {' '}(incl. programados)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Saldo Disponível</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(consumptionData.totalAvailable)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}