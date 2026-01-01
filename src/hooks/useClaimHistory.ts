import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClaimStatusHistory } from '@/types/claims';

export function useClaimHistory(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim-history', claimId],
    queryFn: async () => {
      if (!claimId) return [];
      
      const { data, error } = await supabase
        .from('claim_status_history')
        .select(`
          *,
          changer:profiles!claim_status_history_changed_by_fkey(full_name)
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClaimStatusHistory[];
    },
    enabled: !!claimId,
  });
}
