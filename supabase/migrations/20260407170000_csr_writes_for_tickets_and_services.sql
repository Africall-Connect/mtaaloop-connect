-- ============================================================================
-- CSR WRITE POLICIES — support_tickets INSERT + service_requests UPDATE
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. CSRs can INSERT new support tickets (escalation flow on orders/reviews
--    requires CSR to create a ticket on the customer's behalf)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
    DROP POLICY IF EXISTS "CSRs create tickets" ON public.support_tickets;
    CREATE POLICY "CSRs create tickets"
      ON public.support_tickets FOR INSERT TO authenticated
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;

-- 2. CSRs can UPDATE service_requests (assign agents, change status)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'service_requests') THEN
    DROP POLICY IF EXISTS "CSRs update service requests" ON public.service_requests;
    CREATE POLICY "CSRs update service requests"
      ON public.service_requests FOR UPDATE TO authenticated
      USING (public.is_csr(auth.uid()))
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;
