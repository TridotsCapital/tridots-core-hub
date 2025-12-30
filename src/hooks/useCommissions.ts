import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Commission, CommissionStatus, CommissionType } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useCommissions(filters?: { 
  status?: CommissionStatus; 
  agency_id?: string;
  type?: CommissionType;
  month?: number;
  year?: number;
}) {
  return useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          analysis:analyses(*),
          agency:agencies(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.agency_id) {
        query = query.eq('agency_id', filters.agency_id);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.month !== undefined) {
        query = query.eq('mes_referencia', filters.month);
      }
      if (filters?.year !== undefined) {
        query = query.eq('ano_referencia', filters.year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Commission[];
    },
  });
}

export function useFinancialSummary(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['financial-summary', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_summary', {
        start_date: startDate?.toISOString() || null,
        end_date: endDate?.toISOString() || null,
      });

      if (error) throw error;
      return data as Array<{
        mes: string;
        tipo: string;
        status: string;
        total_valor: number;
        quantidade: number;
      }>;
    },
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'commissions'>) => {
      const { data: result, error } = await supabase
        .from('commissions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Comissão registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar comissão: ' + error.message);
    },
  });
}

export function useUpdateCommissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: string; status: CommissionStatus; observacoes?: string }) => {
      const updates: TablesUpdate<'commissions'> = { status };
      
      if (status === 'paga') {
        updates.data_pagamento = new Date().toISOString();
      }
      if (status === 'estornada') {
        updates.data_estorno = new Date().toISOString();
      }
      if (observacoes) {
        updates.observacoes = observacoes;
      }

      const { data: result, error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Status da comissão atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar comissão: ' + error.message);
    },
  });
}

export function useBulkUpdateCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: CommissionStatus }) => {
      const updates: TablesUpdate<'commissions'> = { status };
      
      if (status === 'paga') {
        updates.data_pagamento = new Date().toISOString();
      }

      const { error } = await supabase
        .from('commissions')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success(`${data.count} comissões atualizadas com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar comissões: ' + error.message);
    },
  });
}

// Commission calculation utilities
export function calculateSetupCommission(setupFee: number): number {
  // Setup commission is the full setup fee value
  return setupFee;
}

export function calculateRecurringCommission(
  rentValue: number,
  tridotsGuaranteePercentage: number,
  agencyCommissionPercentage: number
): number {
  // Recurring commission = (Rent × Tridots Fee %) × Agency Commission %
  const tridotsFee = rentValue * (tridotsGuaranteePercentage / 100);
  return tridotsFee * (agencyCommissionPercentage / 100);
}

// Generate commissions when a contract is activated
export function useGenerateContractCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      analysisId,
      agencyId,
      setupFee,
      rentValue,
      tridotsGuaranteePercentage,
      agencyCommissionPercentage,
      contractMonths = 12,
    }: {
      analysisId: string;
      agencyId: string;
      setupFee: number;
      rentValue: number;
      tridotsGuaranteePercentage: number;
      agencyCommissionPercentage: number;
      contractMonths?: number;
    }) => {
      const commissions: TablesInsert<'commissions'>[] = [];
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Setup commission (one-time)
      if (setupFee > 0) {
        commissions.push({
          analysis_id: analysisId,
          agency_id: agencyId,
          type: 'setup',
          status: 'pendente',
          valor: calculateSetupCommission(setupFee),
          mes_referencia: currentMonth,
          ano_referencia: currentYear,
        });
      }

      // Recurring commissions (12 months by default)
      const recurringValue = calculateRecurringCommission(
        rentValue,
        tridotsGuaranteePercentage,
        agencyCommissionPercentage
      );

      for (let i = 0; i < contractMonths; i++) {
        const date = new Date(currentYear, currentMonth - 1 + i, 1);
        commissions.push({
          analysis_id: analysisId,
          agency_id: agencyId,
          type: 'recorrente',
          status: 'pendente',
          valor: recurringValue,
          mes_referencia: date.getMonth() + 1,
          ano_referencia: date.getFullYear(),
        });
      }

      const { data, error } = await supabase
        .from('commissions')
        .insert(commissions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Comissões geradas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar comissões: ' + error.message);
    },
  });
}
