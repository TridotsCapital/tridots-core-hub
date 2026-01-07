import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Preload notification sound
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

/**
 * Global component that listens for notifications and plays sound
 * This component should be mounted at the app root level (inside AuthProvider)
 * It renders nothing but subscribes to realtime notifications
 */
export function GlobalNotificationListener() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const hasInteractedRef = useRef(false);

  // Preload audio on mount and after user interaction
  useEffect(() => {
    const preloadAudio = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.5;
        audioRef.current.preload = 'auto';
        // Try to load audio
        audioRef.current.load();
      }
    };

    preloadAudio();

    // Enable audio after first interaction
    const enableAudio = () => {
      hasInteractedRef.current = true;
      if (audioRef.current) {
        // Try a silent play to unlock audio context
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioRef.current!.volume = 0.5;
        }).catch(() => {
          // Ignore errors, we'll try again on notification
        });
      }
    };

    // Listen for first interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('[GlobalNotificationListener] Subscribing for user:', user.id);

    const channel = supabase
      .channel(`global-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[GlobalNotificationListener] New notification received:', payload);
          playNotificationSound();
        }
      )
      .subscribe((status) => {
        console.log('[GlobalNotificationListener] Subscription status:', status);
      });

    return () => {
      console.log('[GlobalNotificationListener] Unsubscribing');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const playNotificationSound = () => {
    try {
      // Debounce: don't play more than once per second
      const now = Date.now();
      if (now - lastPlayedRef.current < 1000) {
        console.log('[GlobalNotificationListener] Debounced - too soon');
        return;
      }
      lastPlayedRef.current = now;

      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.5;
      }

      // Reset and play
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[GlobalNotificationListener] Sound played successfully');
          })
          .catch((error) => {
            console.warn('[GlobalNotificationListener] Playback blocked:', error.message);
            // Browser blocked audio, user hasn't interacted yet
          });
      }
    } catch (error) {
      console.error('[GlobalNotificationListener] Error playing sound:', error);
    }
  };

  // This component renders nothing
  return null;
}