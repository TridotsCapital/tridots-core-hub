import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgencyDashboardData, AgencyRanking, AgencyProjection, AgencyApprovalRate, AgencyPeriodFilter } from "@/types/agency-portal";
import { startOfMonth, subMonths, startOfYear, addDays } from "date-fns";

const getPeriodStartDate = (period: AgencyPeriodFilter): Date => {
  const now = new Date();
  switch (period) {
    case 'current_month':
      return startOfMonth(now);
    case 'last_3_months':
      return subMonths(now, 3);
    case 'last_6_months':
      return subMonths(now, 6);
    case 'year':
      return startOfYear(now);
    default:
      return startOfMonth(now);
  }
};

export const useAgencyDashboard = (agencyId: string | null, period: AgencyPeriodFilter = 'current_month') => {
  return useQuery({
    queryKey: ['agency-dashboard', agencyId, period],
    queryFn: async (): Promise<AgencyDashboardData> => {
      if (!agencyId) throw new Error('Agency ID is required');

      const now = new Date();
      const thirtyDaysFromNow = addDays(now, 30);
      const twelveMonthsAgo = subMonths(now, 12);

      // Fetch active contracts (status = 'ativo') with analysis values for total guaranteed monthly
      const { data: activeContracts, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id, 
          status, 
          data_fim_contrato, 
          canceled_at,
          analysis:analyses(valor_aluguel, valor_condominio, valor_iptu, valor_outros_encargos)
        `)
        .eq('agency_id', agencyId);

      if (contractsError) throw contractsError;

      // Count active contracts and contracts to renew
      const activeContractsList = activeContracts?.filter(c => c.status === 'ativo') || [];
      const contractsToRenew = activeContractsList.filter(c => {
        if (!c.data_fim_contrato) return false;
        const endDate = new Date(c.data_fim_contrato);
        return endDate >= now && endDate <= thirtyDaysFromNow;
      }).length;

      const canceledContracts = activeContracts?.filter(c => c.canceled_at !== null).length || 0;

      // Calculate total guaranteed monthly (sum of all rental values for active contracts)
      const totalGuaranteedMonthly = activeContractsList.reduce((sum, c) => {
        const analysis = c.analysis as any;
        if (!analysis) return sum;
        return sum + 
          (analysis.valor_aluguel || 0) + 
          (analysis.valor_condominio || 0) + 
          (analysis.valor_iptu || 0) + 
          (analysis.valor_outros_encargos || 0);
      }, 0);

      // Fetch analyses by status for the funnel
      const { data: allAnalyses, error: allAnalysesError } = await supabase
        .from('analyses')
        .select('status, valor_aluguel')
        .eq('agency_id', agencyId);

      if (allAnalysesError) throw allAnalysesError;

      // Fetch finalized claims for guaranteed value
      const { data: finalizedClaims, error: claimsError } = await supabase
        .from('claims')
        .select('total_claimed_value')
        .eq('agency_id', agencyId)
        .eq('public_status', 'finalizado');

      if (claimsError) throw claimsError;

      const totalGuaranteedValue = finalizedClaims?.reduce((sum, c) => sum + (c.total_claimed_value || 0), 0) || 0;

      // Fetch commissions for last 12 months
      const { data: recentCommissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('valor, status, created_at')
        .eq('agency_id', agencyId)
        .eq('status', 'paga')
        .gte('created_at', twelveMonthsAgo.toISOString());

      if (commissionsError) throw commissionsError;

      // Fetch all historical commissions
      const { data: allCommissions, error: allCommissionsError } = await supabase
        .from('commissions')
        .select('valor')
        .eq('agency_id', agencyId)
        .eq('status', 'paga');

      if (allCommissionsError) throw allCommissionsError;

      const receivedCommissions = recentCommissions?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const totalHistoricalCommissions = allCommissions?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;

      // Count analyses by status
      const analysesByStatus: Record<string, number> = {};
      allAnalyses?.forEach(a => {
        analysesByStatus[a.status] = (analysesByStatus[a.status] || 0) + 1;
      });

      const analysesInProgress = (analysesByStatus['pendente'] || 0) + 
                                  (analysesByStatus['em_analise'] || 0) + 
                                  (analysesByStatus['aguardando_pagamento'] || 0);

      return {
        activeContracts: activeContractsList.length,
        totalGuaranteedValue,
        totalGuaranteedMonthly,
        receivedCommissions,
        totalHistoricalCommissions,
        pendingCommissions: 0,
        analysesInProgress,
        analysesByStatus,
        contractsToRenew,
        canceledContracts
      };
    },
    enabled: !!agencyId
  });
};

export const useAgencyRanking = (agencyId: string | null) => {
  return useQuery({
    queryKey: ['agency-ranking', agencyId],
    queryFn: async (): Promise<AgencyRanking | null> => {
      if (!agencyId) return null;

      // Use type assertion for new RPC function
      const { data, error } = await (supabase.rpc as any)('get_agency_ranking', { _agency_id: agencyId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!agencyId
  });
};

export const useAgencyProjection = (agencyId: string | null) => {
  return useQuery({
    queryKey: ['agency-projection', agencyId],
    queryFn: async (): Promise<AgencyProjection | null> => {
      if (!agencyId) return null;

      // Use type assertion for new RPC function
      const { data, error } = await (supabase.rpc as any)('get_agency_projection', { _agency_id: agencyId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!agencyId
  });
};

export const useAgencyApprovalRate = (agencyId: string | null) => {
  return useQuery({
    queryKey: ['agency-approval-rate', agencyId],
    queryFn: async (): Promise<AgencyApprovalRate | null> => {
      if (!agencyId) return null;

      // Use type assertion for new RPC function
      const { data, error } = await (supabase.rpc as any)('get_agency_approval_rate', { _agency_id: agencyId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!agencyId
  });
};

export const useAgencyCommissionsChart = (agencyId: string | null, period: AgencyPeriodFilter = 'year') => {
  return useQuery({
    queryKey: ['agency-commissions-chart', agencyId, period],
    queryFn: async () => {
      if (!agencyId) return [];

      const periodStart = getPeriodStartDate(period);

      const { data, error } = await supabase
        .from('commissions')
        .select('valor, type, created_at, status')
        .eq('agency_id', agencyId)
        .eq('status', 'paga')
        .gte('created_at', periodStart.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, { setup: number; recorrente: number }> = {};
      
      data?.forEach(commission => {
        const month = new Date(commission.created_at).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { setup: 0, recorrente: 0 };
        }
        
        if (commission.type === 'setup') {
          monthlyData[month].setup += commission.valor || 0;
        } else {
          monthlyData[month].recorrente += commission.valor || 0;
        }
      });

      return Object.entries(monthlyData).map(([month, values]) => ({
        month,
        setup: values.setup,
        recorrente: values.recorrente,
        total: values.setup + values.recorrente
      }));
    },
    enabled: !!agencyId
  });
};

export const useAgencyPortfolioChart = (agencyId: string | null) => {
  return useQuery({
    queryKey: ['agency-portfolio-chart', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('analyses')
        .select('created_at, status, approved_at')
        .eq('agency_id', agencyId)
        .in('status', ['aprovada', 'aguardando_pagamento', 'ativo'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month and calculate cumulative contracts
      const monthlyData: Record<string, number> = {};
      let cumulative = 0;
      
      data?.forEach(analysis => {
        const date = analysis.approved_at || analysis.created_at;
        const month = new Date(date).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        });
        
        cumulative++;
        monthlyData[month] = cumulative;
      });

      return Object.entries(monthlyData).map(([month, contracts]) => ({
        month,
        contracts
      }));
    },
    enabled: !!agencyId
  });
};

// Hook to get agency ID for current user
export const useCurrentAgencyId = () => {
  return useQuery({
    queryKey: ['current-agency-id'],
    queryFn: async (): Promise<string | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('agency_users' as any)
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;
      return (data as any).agency_id;
    }
  });
};