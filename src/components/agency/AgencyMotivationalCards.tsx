import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Trophy } from "lucide-react";
import { AgencyRanking, AgencyProjection, AgencyApprovalRate } from "@/types/agency-portal";

interface AgencyMotivationalCardsProps {
  ranking: AgencyRanking | null | undefined;
  projection: AgencyProjection | null | undefined;
  approvalRate: AgencyApprovalRate | null | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Projeção de Ganhos */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Projeção Mensal
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(projection?.monthly_projection || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            baseado em {projection?.contracts_count || 0} contratos ativos
          </p>
          <p className="text-xs text-primary/80 mt-2 font-medium">
            ≈ {formatCurrency((projection?.monthly_projection || 0) * 3)} em 3 meses
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Aprovação */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Aprovação
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Target className="h-4 w-4 text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {approvalRate?.rate || 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {approvalRate?.approved || 0} de {approvalRate?.total || 0} análises aprovadas
          </p>
          <p className="text-xs text-emerald-600/80 mt-2 font-medium">
            Último ano
          </p>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Seu Ranking
          </CardTitle>
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {ranking?.ranking_position ? `${ranking.ranking_position}º` : '-'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            de {ranking?.total_agencies || 0} imobiliárias parceiras
          </p>
          <p className="text-xs text-amber-600/80 mt-2 font-medium">
            {formatCurrency(ranking?.total_commissions || 0)} em comissões
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
