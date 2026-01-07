import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClaimTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    full_name: string;
  } | null;
  agency?: {
    nome_fantasia: string | null;
  } | null;
}

export function useClaimTickets(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claim-tickets', claimId],
    queryFn: async (): Promise<ClaimTicket[]> => {
      if (!claimId) return [];

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          subject,
          status,
          priority,
          category,
          created_at,
          updated_at,
          assigned_to_profile:profiles!tickets_assigned_to_fkey(full_name),
          agency:agencies(nome_fantasia)
        `)
        .eq('claim_id', claimId)
        .neq('status', 'resolvido')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!claimId,
  });
}
