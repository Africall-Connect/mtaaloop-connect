import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(), // Commented out for now
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(), // Commented out for now
  VITE_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(), // Commented out for now
  VITE_ENABLE_PWA: z.string().transform(val => val === '1').optional(), // Commented out for now
  VITE_LOCATION_UPDATE_MS_ACTIVE: z.string().transform(val => parseInt(val)).optional(), // Commented out for now
  VITE_LOCATION_UPDATE_MS_ON_DELIVERY: z.string().transform(val => parseInt(val)).optional(), // Commented out for now
  VITE_LOCATION_UPDATE_MS_IDLE: z.string().transform(val => parseInt(val)).optional(), // Commented out for now
  VITE_DEFAULT_LOCATION_RETENTION_DAYS: z.string().transform(val => parseInt(val)).optional(), // Commented out for now
  VITE_ENABLE_PUSH_NOTIFICATIONS: z.string().transform(val => val === '1').optional(), // Commented out for now
  VITE_ENABLE_MPESA: z.string().transform(val => val === '1').optional(), // Commented out for now
  VITE_MPESA_ENV: z.enum(['sandbox', 'production']).optional(), // Commented out for now
  VITE_MPESA_CONSUMER_KEY: z.string().optional(),
  VITE_MPESA_CONSUMER_SECRET: z.string().optional(),
  VITE_MPESA_SHORTCODE: z.string().optional(),
  VITE_MPESA_PASSKEY: z.string().optional(),
});

// Parse and validate environment variables
const env = envSchema.parse(import.meta.env);

// Export validated environment
export const config = {
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },
  googleMaps: {
    apiKey: env.VITE_GOOGLE_MAPS_API_KEY,
  },
  pwa: {
    enabled: env.VITE_ENABLE_PWA,
  },
  location: {
    updateMs: {
      active: env.VITE_LOCATION_UPDATE_MS_ACTIVE,
      onDelivery: env.VITE_LOCATION_UPDATE_MS_ON_DELIVERY,
      idle: env.VITE_LOCATION_UPDATE_MS_IDLE,
    },
    retentionDays: env.VITE_DEFAULT_LOCATION_RETENTION_DAYS,
  },
  notifications: {
    pushEnabled: env.VITE_ENABLE_PUSH_NOTIFICATIONS,
  },
  mpesa: {
    enabled: env.VITE_ENABLE_MPESA,
    env: env.VITE_MPESA_ENV,
    consumerKey: env.VITE_MPESA_CONSUMER_KEY,
    consumerSecret: env.VITE_MPESA_CONSUMER_SECRET,
    shortcode: env.VITE_MPESA_SHORTCODE,
    passkey: env.VITE_MPESA_PASSKEY,
  },
} as const;

// Type for the config
export type Config = typeof config;
