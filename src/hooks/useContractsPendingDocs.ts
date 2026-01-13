import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContractsPendingDocs(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['contracts-pending-docs', agencyId],
    queryFn: async () => {
      if (!agencyId) return 0;
      
      const { count, error } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'documentacao_pendente');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!agencyId,
  });
}
