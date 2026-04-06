// Hardcoded configuration for client-side (publishable) keys ONLY
// ⚠️ NEVER put private/secret keys here — they belong in Supabase Edge Function secrets
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://oxehayneipjiozpuxlnv.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhheW5laXBqaW96cHV4bG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTM2NzcsImV4cCI6MjA5MDg1MzY3N30.GaYFjUGx79W3B_3V4nZ6Iwzx3gTZVjahg7t9ePGBUHM',
  },
  pusher: {
    key: import.meta.env.VITE_PUSHER_KEY || '92acec48c588575d855e',
    cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'eu',
  },
  googleMaps: {
    apiKey: undefined,
  },
  pwa: {
    enabled: false,
  },
  location: {
    updateMs: {
      active: 5000,
      onDelivery: 3000,
      idle: 30000,
    },
    retentionDays: 90,
  },
  notifications: {
    pushEnabled: false,
  },
} as const;

// Type for the config
export type Config = typeof config;
