
-- Add assigned_to and agent-related columns to service_requests
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_notes text;

-- Add 'agent' to the app_role enum if not exists
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
