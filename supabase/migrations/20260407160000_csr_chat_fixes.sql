-- ============================================================================
-- CSR Chat Fixes
-- 1. Allow 'customer_rep' in private_chats.recipient_role check constraint
-- 2. Add INSERT policy for CSRs and admins so they can start chats on
--    behalf of customers (the legacy "Users can create chats" policy
--    only allows auth.uid() = initiator_id, which blocks CSRs)
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Update recipient_role check constraint to allow 'customer_rep'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    ALTER TABLE public.private_chats
      DROP CONSTRAINT IF EXISTS private_chats_recipient_role_check;

    ALTER TABLE public.private_chats
      ADD CONSTRAINT private_chats_recipient_role_check CHECK (
        recipient_role IS NULL OR
        recipient_role = ANY (
          ARRAY['customer'::text, 'vendor'::text, 'rider'::text, 'admin'::text, 'customer_rep'::text]
        )
      );
  END IF;
END $$;

-- 2. Also allow customer_rep in initiator_role if a constraint exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'private_chats_initiator_role_check'
  ) THEN
    ALTER TABLE public.private_chats
      DROP CONSTRAINT private_chats_initiator_role_check;

    ALTER TABLE public.private_chats
      ADD CONSTRAINT private_chats_initiator_role_check CHECK (
        initiator_role IS NULL OR
        initiator_role = ANY (
          ARRAY['customer'::text, 'vendor'::text, 'rider'::text, 'admin'::text, 'customer_rep'::text]
        )
      );
  END IF;
END $$;

-- 3. Allow CSRs and admins to INSERT private_chats rows on behalf of customers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    DROP POLICY IF EXISTS "CSRs and admins create chats" ON public.private_chats;
    CREATE POLICY "CSRs and admins create chats"
      ON public.private_chats FOR INSERT TO authenticated
      WITH CHECK (
        public.is_csr(auth.uid())
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;
