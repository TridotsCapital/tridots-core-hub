export interface AgencyUser {
  id: string;
  user_id: string;
  agency_id: string;
  is_primary_contact: boolean;
  created_at: string;
}

export interface AgencyDashboardData {
  activeContracts: number;
  totalGuaranteedValue: number;
  receivedCommissions: number;
  totalHistoricalCommissions?: number;
  pendingCommissions: number;
  analysesInProgress: number;
  analysesByStatus: Record<string, number>;
  contractsToRenew?: number;
  canceledContracts?: number;
}

export interface AgencyRanking {
  ranking_position: number;
  total_agencies: number;
  total_commissions: number;
}

export interface AgencyProjection {
  monthly_projection: number;
  contracts_count: number;
}

export interface AgencyApprovalRate {
  approved: number;
  total: number;
  rate: number;
}

export type AgencyPeriodFilter = 'current_month' | 'last_3_months' | 'last_6_months' | 'year';
