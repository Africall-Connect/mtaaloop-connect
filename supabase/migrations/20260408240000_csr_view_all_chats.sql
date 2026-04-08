-- CSR + admin can view every private_chat (including unassigned customer live-support chats)
-- and every private_chat_message (for queue previews and full conversation history)

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='private_chats') THEN
    DROP POLICY IF EXISTS "CSR view all chats" ON public.private_chats;
    CREATE POLICY "CSR view all chats"
      ON public.private_chats FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='private_chat_messages') THEN
    DROP POLICY IF EXISTS "CSR view all messages" ON public.private_chat_messages;
    CREATE POLICY "CSR view all messages"
      ON public.private_chat_messages FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;
