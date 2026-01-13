import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePendingAgencies() {
  return useQuery({
    queryKey: ['pending-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, nome_fantasia, razao_social, cnpj, email, created_at')
        .eq('active', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function usePendingAgenciesCount() {
  return useQuery({
    queryKey: ['pending-agencies-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('agencies')
        .select('id', { count: 'exact', head: true })
        .eq('active', false);

      if (error) throw error;
      return count || 0;
    },
  });
}
