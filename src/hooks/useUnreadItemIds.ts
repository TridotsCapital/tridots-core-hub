import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnreadItemIds {
  chamados: Set<string>;
  analises: Set<string>;
  contratos: Set<string>;
  garantias: Set<string>;
}

export function useUnreadItemIds() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-item-ids', user?.id],
    queryFn: async (): Promise<UnreadItemIds> => {
      if (!user?.id) {
        return {
          chamados: new Set(),
          analises: new Set(),
          contratos: new Set(),
          garantias: new Set(),
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('reference_id, source')
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      const chamadosIds = new Set<string>();
      const analisesIds = new Set<string>();
      const contratosIds = new Set<string>();
      const garantiasIds = new Set<string>();

      data?.forEach((notification) => {
        if (!notification.reference_id) return;
        
        if (notification.source === 'chamados') {
          chamadosIds.add(notification.reference_id);
        } else if (notification.source === 'analises') {
          analisesIds.add(notification.reference_id);
        } else if (notification.source === 'contratos') {
          contratosIds.add(notification.reference_id);
        } else if (notification.source === 'sinistros') {
          garantiasIds.add(notification.reference_id);
        }
      });

      return {
        chamados: chamadosIds,
        analises: analisesIds,
        contratos: contratosIds,
        garantias: garantiasIds,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Real-time subscription for notifications changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unread-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-item-ids', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

// Helper hook to mark item as read when opened
export function useMarkItemAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsRead = async (referenceId: string, source: string) => {
    if (!user?.id || !referenceId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('reference_id', referenceId)
      .eq('source', source)
      .is('read_at', null);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['unread-item-ids', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  return markAsRead;
}
