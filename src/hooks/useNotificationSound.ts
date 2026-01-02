import { useCallback, useRef } from 'react';

// Base64 encoded notification sound - clear "ding" sound
// This is a simple 440Hz sine wave beep that's audible and not annoying
const NOTIFICATION_SOUND_DATA = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2telegsje8markup_e9vxe+lEU6ltv0x9J6DiFi5gYR/e3N5jJRoSFqIpJdxWFNhg6eztqJ0Qh0we7DXsn0mDDaItMe1jDYNMX24yb6IURoxia7WtH0hESuDvd+udxoOMYm52rR7HR0siLzixJE6GzSXxuXDkjoLLIOt4MSKMQotg6rgxpI7DDKFsODGkjsKL4Os4MWSPAsui6vfxZE6CS2DrODGkjwMLoit4caROQksg6zgxpI8DC6IreHGkTkJLIOs4caROgwuiK3hxpE5CCuDrOHGkToNLoit4ceSOQgrgqvhx5E6DS6IrOHHkjkIK4Kr4ceROg0uiKzhx5I5ByqCquHHkTsNLoiq4seSOQcpgarhyJE7DS+IquLIkjkHKYGp4ciRPA4viKniyJI5BymAqOLIkjwOL4ep4smTOQYof6fiyZM8DjCHqOLKkzkGKH6m4sqTPQ8wh6fiyZQ6BieAp+LKkz0PL4an48qUOgYnf6biy5Q9EC+FpeLLlDoGJn6l4syVPhAuhqXizZU6BiV9pOLMlT4RL4Wk482VOgYlfKPizpY+ES6EpOPOljoGJXyj486WPhEuhKPjzpc7BiR8o+LPmD8SLoOj49CYOwYkfKLj0Zg/Ei6Do+TRmDsGI3ui5NKYPxIug6Lk0pg7BiN7ouTSmD8SLYKi5NOaQAYje6Hk05o/Ei2CouTTmkAGInqh5dOaQBItgaHl05pBBiJ6oeXUm0ASLYGh5dSbQQYheqDl1ZxBEy2AoObVnEEGIXqg5tacQRMtf6Dm1pxCBiB5n+bWnUETLX+f5tedQgYgep/n155CEy1+n+fXnkMHIHmf59ieQhQtfZ7o2J5DByB4nunZoEMULX2e6NmfRAcfd5zp2aBDFC19nenZoEQHH3ec6dqhRBQtfJ3q2qFEBx92m+raoUQVLXyc6tqiRQcfdpvq26JFFSx8nOvbo0UHHnWb69ujRhUse5vr3KNFCB51muvco0YVLHua69ykRggedJrr3KRHFSt6muvdpUcIHnSa7N2lRxUreJnt3qZHCB1zme3fpkgWK3mY7d+nSAgdc5nu4KdIFit4mO7gqEgIHHKY7uGpSBYreJfv4alJCRxymO/hqUkWKneX7+KqSQkccZfv4qpJFip2lu/jq0oJHHCW8OOsShordhbw5KxKChtwlfHlrUsaK3YV8eWtSwobcJXx5a1LGit1FPLmrksKG2+U8uevTBordRTz6LBMCR7'; 

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playSound = useCallback(() => {
    try {
      // Debounce: don't play more than once per second
      const now = Date.now();
      if (now - lastPlayedRef.current < 1000) {
        console.log('[NotificationSound] Debounced - too soon since last play');
        return;
      }
      lastPlayedRef.current = now;

      console.log('[NotificationSound] Attempting to play sound...');
      
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_DATA);
        audioRef.current.volume = 0.5;
        console.log('[NotificationSound] Audio element created');
      }
      
      // Reset and play
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[NotificationSound] Sound played successfully');
          })
          .catch((error) => {
            console.warn('[NotificationSound] Playback blocked by browser:', error.message);
            // This is expected if user hasn't interacted with page yet
          });
      }
    } catch (error) {
      console.error('[NotificationSound] Error playing sound:', error);
    }
  }, []);

  return { playSound };
}
