import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oxehayneipjiozpuxlnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZWhheW5laXBqaW96cHV4bG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDU0NTgsImV4cCI6MjA3NzIyMTQ1OH0.y3K9yTkJ0EMlqtxb_qUStRntsywv14fB-pDLN4w84jk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'mtaa-loop-auth-token',
    flowType: 'pkce',
  }
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => true;
