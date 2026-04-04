import { useRef, useCallback } from 'react';

const NOTIFICATION_SOUND_URL = '/sounds/notification.wav';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.7;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay until user interaction
      });
    } catch {
      // Silently fail if audio is not supported
    }
  }, []);

  return { playSound };
}
