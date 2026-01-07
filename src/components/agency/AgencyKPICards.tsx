import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgencyDashboardData } from "@/types/agency-portal";
import { useCountUp } from "@/hooks/useCountUp";
import { 
  FileCheck2, 
  ShieldCheck, 
  CalendarClock, 
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgencyKPICardsProps {
  data: AgencyDashboardData | undefined;
  isLoading: boolean;
  onKpiClick?: (kpiKey: string) => void;
}

// Animated KPI value component
function AnimatedValue({ 
  value, 
  isCurrency = false 
}: { 
  value: number; 
  isCurrency?: boolean;
}) {
  const animatedValue = useCountUp(value, { duration: 1200 });
  
  if (isCurrency) {
    return (
      <>
        {animatedValue.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })}
      </>
    );
  }
  
  return <>{animatedValue}</>;
}

function formatCurrencyValue(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function AgencyKPICards({ data, isLoading, onKpiClick }: AgencyKPICardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Main KPIs skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Secondary KPIs skeleton */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-muted/30">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Main KPIs (large cards)
  const mainKpis = [
    {
      key: "active_contracts",
      title: "Contratos Ativos",
      value: data?.activeContracts || 0,
      icon: FileCheck2,
      iconColor: "text-green-500",
      bgColor: "bg-green-500/10",
      isCurrency: false,
      subtitle: data?.totalGuaranteedMonthly 
        ? `Total Garantido/mês: ${formatCurrencyValue(data.totalGuaranteedMonthly)}`
        : undefined
    },
    {
      key: "paid_claims",
      title: "Garantias Pagas", // Renamed from "Garantias Efetuadas"
      value: data?.totalGuaranteedValue || 0,
      icon: ShieldCheck,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      isCurrency: true
    },
    {
      key: "contracts_to_renew",
      title: "Contratos para Renovar", // Renamed from "Para Renovar"
      value: data?.contractsToRenew || 0,
      icon: CalendarClock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      isCurrency: false,
      subtitle: "próximos 30 dias"
    },
    {
      key: "commissions",
      title: "Comissões Recebidas",
      value: data?.receivedCommissions || 0,
      icon: Wallet,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      isCurrency: true,
      subtitle: data?.totalHistoricalCommissions 
        ? `Total: ${data.totalHistoricalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}`
        : "últimos 12 meses"
    }
  ];

  // Secondary KPIs (smaller cards)
  const secondaryKpis = [
    {
      key: "analyses_in_progress",
      title: "Análises em Andamento",
      value: data?.analysesInProgress || 0,
      icon: Clock,
      color: "text-blue-500"
    },
    {
      key: "analyses_active",
      title: "Análises Ativas",
      value: data?.analysesByStatus?.['ativo'] || 0,
      icon: CheckCircle2,
      color: "text-green-500"
    },
    {
      key: "canceled_contracts",
      title: "Contratos Cancelados",
      value: data?.canceledContracts || 0,
      icon: Ban,
      color: "text-red-500"
    },
    {
      key: "analyses_rejected",
      title: "Análises Recusadas",
      value: data?.analysesByStatus?.['reprovada'] || 0,
      icon: XCircle,
      color: "text-orange-500"
    }
  ];

  const handleClick = (key: string) => {
    onKpiClick?.(key);
  };

  return (
    <div className="space-y-4">
      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainKpis.map((kpi) => (
          <Card 
            key={kpi.key} 
            className={cn(
              "hover:shadow-md transition-all group",
              onKpiClick && "cursor-pointer hover:border-primary/50"
            )}
            onClick={() => handleClick(kpi.key)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-full ${kpi.bgColor} group-hover:scale-110 transition-transform`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                <AnimatedValue value={kpi.value} isCurrency={kpi.isCurrency} />
              </div>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {secondaryKpis.map((kpi) => (
          <Card 
            key={kpi.key} 
            className={cn(
              "bg-muted/30 border-muted transition-all",
              onKpiClick && "cursor-pointer hover:bg-muted/50 hover:border-primary/30"
            )}
            onClick={() => handleClick(kpi.key)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
                <p className="text-lg font-semibold">
                  <AnimatedValue value={kpi.value} />
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
