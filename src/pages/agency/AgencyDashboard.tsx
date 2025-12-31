import { useState } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { 
  AgencyKPICards, 
  AgencyMotivationalCards, 
  AgencyMiniKanban, 
  AgencyEarningsChart, 
  AgencyPortfolioChart,
  AgencyPeriodFilter 
} from "@/components/agency";
import { 
  useAgencyDashboard, 
  useAgencyRanking, 
  useAgencyProjection, 
  useAgencyApprovalRate,
  useAgencyCommissionsChart,
  useAgencyPortfolioChart,
  useCurrentAgencyId
} from "@/hooks/useAgencyDashboard";
import { AgencyPeriodFilter as PeriodFilterType } from "@/types/agency-portal";

export default function AgencyDashboard() {
  const [period, setPeriod] = useState<PeriodFilterType>('year');
  
  const { data: agencyId } = useCurrentAgencyId();
  const { data: dashboardData, isLoading: loadingDashboard } = useAgencyDashboard(agencyId, period);
  const { data: ranking, isLoading: loadingRanking } = useAgencyRanking(agencyId);
  const { data: projection, isLoading: loadingProjection } = useAgencyProjection(agencyId);
  const { data: approvalRate, isLoading: loadingApproval } = useAgencyApprovalRate(agencyId);
  const { data: earningsData, isLoading: loadingEarnings } = useAgencyCommissionsChart(agencyId, period);
  const { data: portfolioData, isLoading: loadingPortfolio } = useAgencyPortfolioChart(agencyId);

  const isLoadingMotivational = loadingRanking || loadingProjection || loadingApproval;

  return (
    <AgencyLayout 
      title="Dashboard" 
      description="Acompanhe sua performance e ganhos com a Tridots Garantia"
    >
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex justify-end">
          <AgencyPeriodFilter value={period} onChange={setPeriod} />
        </div>

        {/* KPI Cards */}
        <AgencyKPICards data={dashboardData} isLoading={loadingDashboard} />

        {/* Motivational Cards */}
        <AgencyMotivationalCards 
          ranking={ranking}
          projection={projection}
          approvalRate={approvalRate}
          isLoading={isLoadingMotivational}
        />

        {/* Mini Kanban Funnel */}
        <AgencyMiniKanban analysesByStatus={dashboardData?.analysesByStatus || {}} />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AgencyEarningsChart data={earningsData} isLoading={loadingEarnings} />
          <AgencyPortfolioChart data={portfolioData} isLoading={loadingPortfolio} />
        </div>
      </div>
    </AgencyLayout>
  );
}
