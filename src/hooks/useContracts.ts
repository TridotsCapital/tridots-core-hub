import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AnalysisStatus = Database['public']['Enums']['analysis_status'];

export interface ContractFilters {
  status?: AnalysisStatus[];
  agencyId?: string;
  startDate?: Date;
  endDate?: Date;
  minRent?: number;
  maxRent?: number;
  city?: string;
  state?: string;
  search?: string;
}

export function useContracts(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      // Only fetch analyses that are contracts (approved, awaiting payment, or active)
      const contractStatuses: AnalysisStatus[] = ['aprovada', 'aguardando_pagamento', 'ativo'];
      
      let query = supabase
        .from('analyses')
        .select(`
          *,
          agency:agencies(id, razao_social, nome_fantasia)
        `)
        .in('status', filters?.status?.length ? filters.status : contractStatuses)
        .order('created_at', { ascending: false });

      if (filters?.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }

      if (filters?.startDate) {
        query = query.gte('approved_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('approved_at', filters.endDate.toISOString());
      }

      if (filters?.minRent) {
        query = query.gte('valor_aluguel', filters.minRent);
      }

      if (filters?.maxRent) {
        query = query.lte('valor_aluguel', filters.maxRent);
      }

      if (filters?.city) {
        query = query.ilike('imovel_cidade', `%${filters.city}%`);
      }

      if (filters?.state) {
        query = query.eq('imovel_estado', filters.state);
      }

      if (filters?.search) {
        query = query.or(`inquilino_nome.ilike.%${filters.search}%,inquilino_cpf.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          agency:agencies(id, razao_social, nome_fantasia, percentual_comissao_recorrente, percentual_comissao_setup)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}