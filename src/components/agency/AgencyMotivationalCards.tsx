import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgencyRanking, AgencyProjection, AgencyApprovalRate } from "@/types/agency-portal";
import { useCountUp } from "@/hooks/useCountUp";
import { TrendingUp, Target, Trophy, Clock } from "lucide-react";

interface AgencyMotivationalCardsProps {
  ranking: AgencyRanking | null | undefined;
  projection: AgencyProjection | null | undefined;
  approvalRate: AgencyApprovalRate | null | undefined;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value, { duration: 1200 });
  return <>{formatCurrency(animated)}</>;
}

function AnimatedPercent({ value }: { value: number }) {
  const animated = useCountUp(value * 10, { duration: 1200 });
  return <>{(animated / 10).toFixed(1)}%</>;
}

export function AgencyMotivationalCards({ 
  ranking, 
  projection, 
  approvalRate, 
  isLoading 
}: AgencyMotivationalCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Monthly Projection */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-full">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Projeção Mensal
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <AnimatedCurrency value={projection?.monthly_projection || 0} />
          </div>
          <p className="text-xs text-muted-foreground">
            {projection?.contracts_count || 0} contratos ativos
          </p>
        </CardContent>
      </Card>

      {/* Approval Rate */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-500/10 rounded-full">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Taxa de Aprovação
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            <AnimatedPercent value={approvalRate?.rate || 0} />
          </div>
          <p className="text-xs text-muted-foreground">
            {approvalRate?.approved || 0} de {approvalRate?.total || 0} análises
          </p>
        </CardContent>
      </Card>

      {/* Ranking - Coming Soon */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-500/10 rounded-full">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Seu Ranking
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500/70" />
            <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
              Em breve
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Estamos processando sua posição
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            De +500 imobiliárias parceiras
          </p>
        </CardContent>
      </Card>
    </div>
  );
}