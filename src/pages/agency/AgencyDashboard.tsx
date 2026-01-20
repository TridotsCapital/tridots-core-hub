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
import { PendingDocsContractsBanner } from "@/components/agency/PendingDocsContractsBanner";
import { useAnalysisDraft } from "@/hooks/useAnalysisDraft";
import { useClaimDraft } from "@/hooks/useClaimDraft";
import { useContractsPendingDocs } from "@/hooks/useContractsPendingDocs";
import { useAgencyPath } from "@/hooks/useAgencyPath";
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
  const navigate = useNavigate();
  const { agencyPath } = useAgencyPath();
  const [period, setPeriod] = useState<PeriodFilterType>('year');
  
  const { data: agencyId } = useCurrentAgencyId();
  const { hasDraft: hasAnalysisDraft, getLastSavedTime: getAnalysisDraftTime, clearDraft: clearAnalysisDraft } = useAnalysisDraft();
  const { hasDraft: hasClaimDraft, getLastSavedTime: getClaimDraftTime, clearDraft: clearClaimDraft } = useClaimDraft();
  const { data: pendingDocsCount = 0 } = useContractsPendingDocs(agencyId);
  const { data: dashboardData, isLoading: loadingDashboard } = useAgencyDashboard(agencyId, period);
  const { data: ranking, isLoading: loadingRanking } = useAgencyRanking(agencyId);
  const { data: projection, isLoading: loadingProjection } = useAgencyProjection(agencyId);
  const { data: approvalRate, isLoading: loadingApproval } = useAgencyApprovalRate(agencyId);
  const { data: earningsData, isLoading: loadingEarnings } = useAgencyCommissionsChart(agencyId, period);
  const { data: portfolioData, isLoading: loadingPortfolio } = useAgencyPortfolioChart(agencyId);

  const isLoadingMotivational = loadingRanking || loadingProjection || loadingApproval;

  // Handle KPI card clicks - navigate to relevant pages with filters
  const handleKpiClick = (kpiKey: string) => {
    switch (kpiKey) {
      case 'active_contracts':
        navigate(agencyPath('/contracts'), { state: { statusFilter: 'ativo' } });
        break;
      case 'paid_claims':
        navigate(agencyPath('/claims'), { state: { statusFilter: 'finalizado' } });
        break;
      case 'contracts_to_renew':
        navigate(agencyPath('/contracts'), { state: { renewalFilter: true } });
        break;
      case 'commissions':
        navigate(agencyPath('/commissions'));
        break;
      case 'analyses_in_progress':
        navigate(agencyPath('/analyses'), { 
          state: { highlightColumns: ['pendente', 'em_analise', 'aguardando_pagamento'] } 
        });
        break;
      case 'analyses_active':
        navigate(agencyPath('/analyses'), { state: { highlightColumns: ['ativo'] } });
        break;
      case 'canceled_contracts':
        navigate(agencyPath('/contracts'), { state: { statusFilter: 'cancelado' } });
        break;
      case 'analyses_rejected':
        navigate(agencyPath('/analyses'), { state: { highlightColumns: ['reprovada'] } });
        break;
    }
  };

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

        {/* Pending Docs Contracts Banner */}
        <PendingDocsContractsBanner count={pendingDocsCount} />

        {/* Period Filter */}
        <div className="flex justify-end">
          <AgencyPeriodFilter value={period} onChange={setPeriod} />
        </div>

        {/* KPI Cards - with click navigation */}
        <AgencyKPICards 
          data={dashboardData} 
          isLoading={loadingDashboard} 
          onKpiClick={handleKpiClick}
        />

        {/* Motivational Cards */}
        <AgencyMotivationalCards 
          ranking={ranking}
          projection={projection}
          approvalRate={approvalRate}
          isLoading={isLoadingMotivational}
        />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AgencyEarningsChart data={earningsData} isLoading={loadingEarnings} />
          <AgencyPortfolioChart data={portfolioData} isLoading={loadingPortfolio} />
        </div>

        {/* Mini Kanban Funnel - moved to last */}
        <AgencyMiniKanban analysesByStatus={dashboardData?.analysesByStatus || {}} />
      </div>
    </AgencyLayout>
  );
}
