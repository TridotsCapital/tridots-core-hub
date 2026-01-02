import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { 
  AgencyKPICards, 
  AgencyMotivationalCards, 
  AgencyMiniKanban, 
  AgencyEarningsChart, 
  AgencyPortfolioChart,
  AgencyPeriodFilter,
  DraftBanner
} from "@/components/agency";
import { ClaimDraftBanner } from "@/components/agency/claims/ClaimDraftBanner";
import { useAnalysisDraft } from "@/hooks/useAnalysisDraft";
import { useClaimDraft } from "@/hooks/useClaimDraft";
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
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodFilterType>('year');
  
  const { data: agencyId } = useCurrentAgencyId();
  const { hasDraft: hasAnalysisDraft, getLastSavedTime: getAnalysisDraftTime, clearDraft: clearAnalysisDraft } = useAnalysisDraft();
  const { hasDraft: hasClaimDraft, getLastSavedTime: getClaimDraftTime, clearDraft: clearClaimDraft } = useClaimDraft();
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
      description="Acompanhe sua performance e ganhos com a Tridots Capital"
    >
      <div className="space-y-6">
        {/* Analysis Draft Banner */}
        {hasAnalysisDraft && (
          <DraftBanner 
            lastSavedTime={getAnalysisDraftTime()} 
            onDiscard={clearAnalysisDraft} 
          />
        )}

        {/* Claim Draft Banner */}
        {hasClaimDraft && (
          <ClaimDraftBanner 
            lastSavedTime={getClaimDraftTime()} 
            onDiscard={clearClaimDraft} 
          />
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <Button onClick={() => navigate('/agency/analyses/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Análise
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/agency/claims/new')}
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <Shield className="h-4 w-4" />
              Solicitar Garantia
            </Button>
          </div>
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
