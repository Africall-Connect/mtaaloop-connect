// Hardcoded configuration for client-side (publishable) keys ONLY
// ⚠️ NEVER put private/secret keys here — they belong in Supabase Edge Function secrets
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://oxehayneipjiozpuxlnv.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhheW5laXBqaW96cHV4bG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDU0NTgsImV4cCI6MjA3NzIyMTQ1OH0.y3K9yTkJ0EMlqtxb_qUStRntsywv14fB-pDLN4w84jk',
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
