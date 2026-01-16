import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Commission, CommissionStatus, CommissionType, PlanType } from '@/types/database';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { GUARANTEE_PLANS } from '@/lib/plans';

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
          analysis:analyses(
            id,
            inquilino_nome,
            plano_garantia,
            taxa_garantia_percentual,
            garantia_anual,
            valor_aluguel,
            valor_condominio,
            valor_iptu,
            contract:contracts(id)
          ),
          agency:agencies(razao_social, nome_fantasia)
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
      return data;
    },
  });
}

export function useAgencyCommissions(agencyId?: string) {
  return useQuery({
    queryKey: ['commissions', 'agency', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          analysis:analyses(
            id,
            inquilino_nome,
            plano_garantia,
            taxa_garantia_percentual,
            garantia_anual,
            imovel_endereco,
            imovel_cidade,
            contract:contracts(id)
          )
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });
}

export function useAgencyCommissionsSummary(agencyId?: string) {
  return useQuery({
    queryKey: ['commissions', 'summary', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      
      const { data, error } = await supabase
        .from('commissions')
        .select('status, valor')
        .eq('agency_id', agencyId);

      if (error) throw error;
      
      const summary = {
        pendente: 0,
        a_pagar: 0,
        paga: 0,
        total: 0,
      };
      
      data.forEach(c => {
        summary.total += c.valor;
        if (c.status === 'pendente') summary.pendente += c.valor;
        else if (c.status === 'a_pagar') summary.a_pagar += c.valor;
        else if (c.status === 'paga') summary.paga += c.valor;
      });
      
      return summary;
    },
    enabled: !!agencyId,
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

// Generate commissions when a contract is activated (payment validated)
export function useGenerateContractCommissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      analysisId,
      agencyId,
      setupFee,
      garantiaAnual,
      planoGarantia,
      validationDate,
    }: {
      analysisId: string;
      agencyId: string;
      setupFee: number;
      garantiaAnual: number;
      planoGarantia: PlanType;
      validationDate: string;
    }) => {
      const plan = GUARANTEE_PLANS[planoGarantia];
      const comissaoAnual = garantiaAnual * (plan.commissionRate / 100);
      const comissaoMensal = comissaoAnual / 12;
      const startDate = new Date(validationDate);

      const commissions: TablesInsert<'commissions'>[] = [];

      // Setup commission (one-time) - if not exempt
      if (setupFee > 0) {
        commissions.push({
          analysis_id: analysisId,
          agency_id: agencyId,
          type: 'setup',
          status: 'pendente',
          valor: setupFee,
          base_calculo: setupFee,
          percentual_comissao: 100,
          due_date: startDate.toISOString().split('T')[0],
          mes_referencia: startDate.getMonth() + 1,
          ano_referencia: startDate.getFullYear(),
        });
      }

      // 12 recurring commissions
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1); // Start from next month

        commissions.push({
          analysis_id: analysisId,
          agency_id: agencyId,
          type: 'recorrente',
          status: 'pendente',
          valor: comissaoMensal,
          base_calculo: garantiaAnual,
          percentual_comissao: plan.commissionRate,
          due_date: dueDate.toISOString().split('T')[0],
          mes_referencia: dueDate.getMonth() + 1,
          ano_referencia: dueDate.getFullYear(),
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
