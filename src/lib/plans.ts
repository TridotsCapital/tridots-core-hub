// Guarantee Plans Configuration for Tridots Capital

export const GUARANTEE_PLANS = {
  start: {
    name: 'START',
    emoji: '🚀',
    minRate: 10,
    maxRate: 12.5,
    steps: [10, 10.5, 11, 11.5, 12, 12.5],
    coverage: 20,
    exitCostsLimit: 4000,
    commissionRate: 5,
    // Visual styling
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    selectedBorderClass: 'border-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    gradientClass: 'from-blue-500 to-blue-600',
  },
  prime: {
    name: 'PRIME',
    emoji: '⭐',
    minRate: 13,
    maxRate: 14.5,
    steps: [13, 13.5, 14, 14.5],
    coverage: 20,
    exitCostsLimit: 6000,
    commissionRate: 10,
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-300',
    selectedBorderClass: 'border-blue-600',
    badgeClass: 'bg-blue-200 text-blue-800',
    gradientClass: 'from-blue-600 to-blue-700',
  },
  exclusive: {
    name: 'EXCLUSIVE',
    emoji: '💎',
    minRate: 15,
    maxRate: 15,
    steps: [15],
    coverage: 20,
    exitCostsLimit: 8000,
    commissionRate: 15,
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-100',
    borderClass: 'border-indigo-300',
    selectedBorderClass: 'border-indigo-600',
    badgeClass: 'bg-indigo-200 text-indigo-800',
    gradientClass: 'from-indigo-600 to-indigo-700',
  },
} as const;

export type PlanType = keyof typeof GUARANTEE_PLANS;

export const PLAN_ORDER: PlanType[] = ['start', 'prime', 'exclusive'];

// Get plan by rate
export function getPlanByRate(rate: number): PlanType {
  if (rate >= 15) return 'exclusive';
  if (rate >= 13) return 'prime';
  return 'start';
}

// Get plan info
export function getPlanInfo(plan: PlanType) {
  return GUARANTEE_PLANS[plan];
}

// Calculate total coverage (20x monthly value)
export function calculateCoverage(valorLocaticioTotal: number): number {
  return valorLocaticioTotal * 20;
}

// Calculate exit costs limit (minimum between plan limit and remaining balance)
export function calculateExitCostsLimit(plan: PlanType, remainingBalance?: number): number {
  const planLimit = GUARANTEE_PLANS[plan].exitCostsLimit;
  if (remainingBalance !== undefined) {
    return Math.min(planLimit, remainingBalance);
  }
  return planLimit;
}

// Calculate commission for a given guarantee amount and plan
export function calculateCommission(
  garantiaAnual: number,
  plano: PlanType
): { mensal: number; anual: number; percentual: number } {
  const percentual = GUARANTEE_PLANS[plano].commissionRate;
  const anual = garantiaAnual * (percentual / 100);
  const mensal = anual / 12;
  return { mensal, anual, percentual };
}

// Get default rate for a plan (minimum)
export function getDefaultRateForPlan(plan: PlanType): number {
  return GUARANTEE_PLANS[plan].minRate;
}

// Validate if rate is valid for a plan
export function isRateValidForPlan(rate: number, plan: PlanType): boolean {
  const planInfo = GUARANTEE_PLANS[plan];
  return rate >= planInfo.minRate && rate <= planInfo.maxRate;
}

// Get all valid rates for a plan
export function getValidRatesForPlan(plan: PlanType): number[] {
  return [...GUARANTEE_PLANS[plan].steps];
}

// Coverage items for display (comprehensive list)
export const PLAN_COVERAGES = [
  { id: 'inadimplencia', label: 'Inadimplência de aluguel' },
  { id: 'encargos', label: 'Encargos (condomínio, IPTU)' },
  { id: 'custos_saida', label: 'Custos de saída', showLimit: true },
  { id: 'danos_imovel', label: 'Danos ao imóvel' },
  { id: 'multa_rescisoria', label: 'Multa rescisória (10%)' },
  { id: 'pintura', label: 'Pintura do imóvel' },
  { id: 'despesas_judiciais', label: 'Despesas judiciais e honorários advocatícios' },
] as const;

// Legacy coverage items (deprecated, use PLAN_COVERAGES instead)
export const COVERAGE_ITEMS = PLAN_COVERAGES;

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
