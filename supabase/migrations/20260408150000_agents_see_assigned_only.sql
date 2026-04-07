-- ============================================================================
-- AGENT WORKFLOW — Service requests go to CSR first, then CSR assigns to agents
-- Agents can only SELECT service_requests where they are the assignee.
-- Agents can only UPDATE service_requests they are assigned to (status, notes).
-- Riders are not granted any service_requests access — they only deal with deliveries.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Agents see only their assigned service requests
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='service_requests') THEN
    DROP POLICY IF EXISTS "Agents read assigned service requests" ON public.service_requests;
    CREATE POLICY "Agents read assigned service requests"
      ON public.service_requests FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(),'agent'::app_role)
        AND assigned_to = auth.uid()
      );
  END IF;
END $$;

-- 2. Agents can update only their assigned service requests (status, notes, completed_at)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='service_requests') THEN
    DROP POLICY IF EXISTS "Agents update assigned service requests" ON public.service_requests;
    CREATE POLICY "Agents update assigned service requests"
      ON public.service_requests FOR UPDATE TO authenticated
      USING (
        public.has_role(auth.uid(),'agent'::app_role)
        AND assigned_to = auth.uid()
      )
      WITH CHECK (
        public.has_role(auth.uid(),'agent'::app_role)
        AND assigned_to = auth.uid()
      );
  END IF;
END $$;

-- 3. New service requests must NOT auto-assign — enforce assigned_to defaults to NULL
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_requests' AND column_name='assigned_to'
  ) THEN
    ALTER TABLE public.service_requests ALTER COLUMN assigned_to DROP DEFAULT;
  END IF;
END $$;
