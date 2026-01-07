import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyUser } from './useAgencyUser';

export function useRejectedDocumentsCount() {
  const { data: agencyUser } = useAgencyUser();

  return useQuery({
    queryKey: ['rejected-documents-count', agencyUser?.agency_id],
    queryFn: async () => {
      if (!agencyUser?.agency_id) return 0;

      const { count, error } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyUser.agency_id)
        .neq('status', 'cancelado')
        .or('doc_contrato_locacao_status.eq.rejeitado,doc_vistoria_inicial_status.eq.rejeitado,doc_seguro_incendio_status.eq.rejeitado');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!agencyUser?.agency_id,
    refetchInterval: 30000,
  });
}
