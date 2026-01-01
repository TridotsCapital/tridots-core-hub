import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export type NotificationCounts = {
  chamados: number;
  analises: number;
  contratos: number;
};

export function useNotificationCounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-counts', user?.id],
    queryFn: async (): Promise<NotificationCounts> => {
      if (!user?.id) {
        return { chamados: 0, analises: 0, contratos: 0 };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('source')
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      const counts: NotificationCounts = {
        chamados: 0,
        analises: 0,
        contratos: 0,
      };

      data?.forEach((n) => {
        const source = n.source as keyof NotificationCounts;
        if (source in counts) {
          counts[source]++;
        }
      });

      return counts;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notification-counts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}
