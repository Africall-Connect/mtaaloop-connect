-- Migration: create matches and reports tables for random video matchmaking
-- Run this on the Supabase/Postgres instance.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text UNIQUE,
  estate_id text NOT NULL,
  initiator_user_id uuid NOT NULL,
  peer_user_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled','failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  match_id uuid,
  reason text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
