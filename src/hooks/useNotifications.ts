import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useCallback } from 'react';
import type { Notification, NotificationSource } from '@/types/notifications';

async function fetchNotifications(userId: string, source?: NotificationSource): Promise<Notification[]> {
  const session = await supabase.auth.getSession();
  
  let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}&order=created_at.desc&limit=50`;
  if (source) {
    url += `&source=eq.${source}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${session.data.session?.access_token}`,
    },
  });
  
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return await response.json() as Notification[];
}

interface UseNotificationsOptions {
  onNewNotification?: () => void;
}

export function useNotifications(source?: NotificationSource, options?: UseNotificationsOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onNewNotificationRef = useRef(options?.onNewNotification);
  
  // Keep ref updated
  useEffect(() => {
    onNewNotificationRef.current = options?.onNewNotification;
  }, [options?.onNewNotification]);

  const query = useQuery({
    queryKey: ['notifications', user?.id, source],
    queryFn: () => fetchNotifications(user!.id, source),
    enabled: !!user?.id,
  });

  // Realtime subscription - triggers sound on INSERT
  useEffect(() => {
    if (!user?.id) return;

    console.log('[useNotifications] Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useNotifications] New notification received via realtime:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-counts', user.id] });
          
          // Trigger callback for new notification (e.g., play sound)
          if (onNewNotificationRef.current) {
            console.log('[useNotifications] Calling onNewNotification callback');
            onNewNotificationRef.current();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-counts', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-counts', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useNotifications] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read_at=is.null&select=id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Prefer': 'count=exact',
          },
        }
      );
      
      const count = response.headers.get('content-range')?.split('/')[1];
      return count ? parseInt(count, 10) : 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ read_at: new Date().toISOString() }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read_at=is.null`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ read_at: new Date().toISOString() }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete notification');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
    },
  });
}
