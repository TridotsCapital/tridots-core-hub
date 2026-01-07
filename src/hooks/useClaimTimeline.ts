import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClaimTimelineEvent {
  id: string;
  claim_id: string;
  event_type: string;
  description: string;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
  creator?: {
    full_name: string;
    email: string;
  } | null;
}

export function useClaimTimeline(claimId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['claim-timeline', claimId],
    queryFn: async (): Promise<ClaimTimelineEvent[]> => {
      if (!claimId) return [];

      const { data, error } = await supabase
        .from('claim_timeline')
        .select(`
          *,
          creator:profiles!claim_timeline_created_by_fkey(full_name, email)
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!claimId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!claimId) return;

    const channel = supabase
      .channel(`claim-timeline-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claim_timeline',
          filter: `claim_id=eq.${claimId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['claim-timeline', claimId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId, queryClient]);

  return query;
}
