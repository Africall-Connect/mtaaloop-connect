import { useRef, useCallback, useEffect } from 'react';

const NOTIFICATION_SOUND_URL = '/sounds/notification.wav';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  // Pre-create audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.7;
    audioRef.current.preload = 'auto';
  }, []);

  // Unlock audio on first user interaction (required for mobile browsers)
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current || !audioRef.current) return;
      // Play a silent/muted sound to unlock the audio context
      audioRef.current.muted = true;
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.muted = false;
        audioRef.current!.currentTime = 0;
        unlockedRef.current = true;
      }).catch(() => {});
    };

    const events = ['touchstart', 'touchend', 'click', 'keydown'];
    events.forEach(e => document.addEventListener(e, unlock, { once: false, passive: true }));

    return () => {
      events.forEach(e => document.removeEventListener(e, unlock));
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.7;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});

      // Vibrate on mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {
      // Fallback: at least vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, []);

  return { playSound };
}
