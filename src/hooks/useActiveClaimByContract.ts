import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveClaim {
  id: string;
  public_status: string;
  created_at: string;
}

export function useActiveClaimByContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ['active-claim-by-contract', contractId],
    queryFn: async (): Promise<ActiveClaim | null> => {
      if (!contractId) return null;

      const { data, error } = await supabase
        .from('claims')
        .select('id, public_status, created_at')
        .eq('contract_id', contractId)
        .in('public_status', ['solicitado', 'em_analise_tecnica', 'pagamento_programado'])
        .is('canceled_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });
}
