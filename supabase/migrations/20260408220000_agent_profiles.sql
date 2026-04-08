-- ============================================================================
-- AGENT PROFILES — parallel to rider_profiles / vendor_profiles
-- Stores onboarded agent details (name, phone, email, estate) so CSR can list
-- them for service-request assignment.
-- Idempotent — safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  phone      text,
  email      text,
  estate_id  uuid REFERENCES public.estates(id) ON DELETE SET NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Admin: full access
DROP POLICY IF EXISTS "Admins full access" ON public.agent_profiles;
CREATE POLICY "Admins full access" ON public.agent_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- CSR: read (to list + assign agents)
DROP POLICY IF EXISTS "CSRs read agents" ON public.agent_profiles;
CREATE POLICY "CSRs read agents" ON public.agent_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'customer_rep'::app_role));

-- Agent: read/update own profile
DROP POLICY IF EXISTS "Agents manage own profile" ON public.agent_profiles;
CREATE POLICY "Agents manage own profile" ON public.agent_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Backfill: create agent_profiles rows for existing agent user_roles that don't have one
INSERT INTO public.agent_profiles (user_id, full_name, email, phone)
SELECT
  ur.user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'Agent'),
  au.email,
  au.raw_user_meta_data->>'phone'
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'agent'
  AND NOT EXISTS (SELECT 1 FROM public.agent_profiles ap WHERE ap.user_id = ur.user_id)
ON CONFLICT (user_id) DO NOTHING;
