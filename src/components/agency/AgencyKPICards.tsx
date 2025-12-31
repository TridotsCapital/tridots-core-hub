import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, DollarSign, Clock, TrendingUp } from "lucide-react";
import { AgencyDashboardData } from "@/types/agency-portal";

interface AgencyKPICardsProps {
  data: AgencyDashboardData | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function AgencyKPICards({ data, isLoading }: AgencyKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-1" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Contratos Ativos",
      value: data?.activeContracts || 0,
      subValue: formatCurrency(data?.totalGuaranteedValue || 0),
      subLabel: "valor garantido",
      icon: FileCheck,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Comissões Recebidas",
      value: formatCurrency(data?.receivedCommissions || 0),
      icon: DollarSign,
      iconColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Comissões a Receber",
      value: formatCurrency(data?.pendingCommissions || 0),
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "Análises em Andamento",
      value: data?.analysesInProgress || 0,
      subLabel: "processos no funil",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.subValue && (
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.subValue} {kpi.subLabel}
              </p>
            )}
            {!kpi.subValue && kpi.subLabel && (
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.subLabel}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
