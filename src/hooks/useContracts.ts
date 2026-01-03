import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

export interface ContractFilters {
  status?: ContractStatus[];
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
      // Query the REAL contracts table, not analyses
      let query = supabase
        .from('contracts')
        .select(`
          *,
          analysis:analyses(
            id,
            inquilino_nome,
            inquilino_cpf,
            inquilino_email,
            inquilino_telefone,
            valor_aluguel,
            valor_total,
            taxa_garantia_percentual,
            imovel_endereco,
            imovel_cidade,
            imovel_estado,
            imovel_bairro,
            approved_at,
            status
          ),
          agency:agencies(id, razao_social, nome_fantasia)
        `)
        .order('created_at', { ascending: false });

      // Filter by contract status
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Apply additional filters that require analysis data (post-fetch filtering)
      let filteredData = data || [];

      if (filters?.minRent) {
        filteredData = filteredData.filter(c => 
          c.analysis && c.analysis.valor_aluguel >= filters.minRent!
        );
      }

      if (filters?.maxRent) {
        filteredData = filteredData.filter(c => 
          c.analysis && c.analysis.valor_aluguel <= filters.maxRent!
        );
      }

      if (filters?.city) {
        filteredData = filteredData.filter(c => 
          c.analysis?.imovel_cidade?.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }

      if (filters?.state) {
        filteredData = filteredData.filter(c => 
          c.analysis?.imovel_estado === filters.state
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(c => 
          c.analysis?.inquilino_nome?.toLowerCase().includes(searchLower) ||
          c.analysis?.inquilino_cpf?.includes(filters.search!)
        );
      }

      return filteredData;
    },
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          analysis:analyses(
            *,
            agency:agencies(id, razao_social, nome_fantasia, percentual_comissao_recorrente, percentual_comissao_setup)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
