import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContractsWithActiveClaims(contractIds: string[]) {
  return useQuery({
    queryKey: ['contracts-with-active-claims', contractIds],
    queryFn: async (): Promise<Set<string>> => {
      if (contractIds.length === 0) return new Set();

      const { data, error } = await supabase
        .from('claims')
        .select('contract_id')
        .in('contract_id', contractIds)
        .in('public_status', ['solicitado', 'em_analise_tecnica', 'pagamento_programado'])
        .is('canceled_at', null);

      if (error) throw error;
      return new Set(data?.map(c => c.contract_id) || []);
    },
    enabled: contractIds.length > 0,
    staleTime: 30000,
  });
}
