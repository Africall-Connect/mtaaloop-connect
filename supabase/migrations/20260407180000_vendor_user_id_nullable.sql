-- ============================================================================
-- VENDOR PROFILES — allow business-only records (no auth user yet)
-- Lets admin create a vendor record before its owner has been invited.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Drop NOT NULL on user_id so admin can create business-only records
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vendor_profiles'
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.vendor_profiles ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Admin INSERT policy on vendor_profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'vendor_profiles') THEN
    DROP POLICY IF EXISTS "Admins create vendor profiles" ON public.vendor_profiles;
    CREATE POLICY "Admins create vendor profiles"
      ON public.vendor_profiles FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
