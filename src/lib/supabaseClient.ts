import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/env';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Runtime assertion to ensure Supabase environment variables are set.
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Supabase URL or Anon Key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.';
  // Log a more descriptive error in the browser console.
  if (typeof window !== 'undefined') {
    console.error(errorMessage);
  }
  throw new Error(errorMessage);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);