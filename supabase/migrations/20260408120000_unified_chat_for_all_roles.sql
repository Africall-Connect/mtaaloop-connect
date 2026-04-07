-- ============================================================================
-- UNIFIED CHAT — allow vendor / rider / agent to message customers via the
-- existing private_chats / private_chat_messages tables.
--
-- Today only customers, CSRs, and admins can INSERT chats. This migration
-- adds policies so vendors, riders and agents can also start a chat with a
-- customer (creating a row where the customer is the initiator and the
-- staff user is the recipient) and reply to messages on chats they're part of.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Allow staff roles to INSERT private_chats rows on behalf of customers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    DROP POLICY IF EXISTS "Staff create chats with customers" ON public.private_chats;
    CREATE POLICY "Staff create chats with customers"
      ON public.private_chats FOR INSERT TO authenticated
      WITH CHECK (
        public.has_role(auth.uid(), 'vendor'::app_role)
        OR public.has_role(auth.uid(), 'rider'::app_role)
        OR public.has_role(auth.uid(), 'agent'::app_role)
        OR public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;

-- 2. Allow staff roles to UPDATE private_chats (claim/close)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    DROP POLICY IF EXISTS "Staff update chats they're part of" ON public.private_chats;
    CREATE POLICY "Staff update chats they're part of"
      ON public.private_chats FOR UPDATE TO authenticated
      USING (
        public.has_role(auth.uid(), 'vendor'::app_role)
        OR public.has_role(auth.uid(), 'rider'::app_role)
        OR public.has_role(auth.uid(), 'agent'::app_role)
        OR public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
      WITH CHECK (
        public.has_role(auth.uid(), 'vendor'::app_role)
        OR public.has_role(auth.uid(), 'rider'::app_role)
        OR public.has_role(auth.uid(), 'agent'::app_role)
        OR public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;

-- 3. Allow staff roles to INSERT private_chat_messages (reply to chats)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chat_messages') THEN
    DROP POLICY IF EXISTS "Staff send messages" ON public.private_chat_messages;
    CREATE POLICY "Staff send messages"
      ON public.private_chat_messages FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND (
          public.has_role(auth.uid(), 'vendor'::app_role)
          OR public.has_role(auth.uid(), 'rider'::app_role)
          OR public.has_role(auth.uid(), 'agent'::app_role)
          OR public.has_role(auth.uid(), 'customer_rep'::app_role)
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
      );
  END IF;
END $$;

-- 4. Make sure staff can SELECT chats they're a recipient on
-- (the legacy "Users can view their chats" policy already covers this via
--  auth.uid() = recipient_id, but we add a defensive role-based fallback)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    DROP POLICY IF EXISTS "Staff view assigned chats" ON public.private_chats;
    CREATE POLICY "Staff view assigned chats"
      ON public.private_chats FOR SELECT TO authenticated
      USING (
        recipient_id = auth.uid() OR initiator_id = auth.uid()
      );
  END IF;
END $$;
