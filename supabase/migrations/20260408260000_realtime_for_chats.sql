-- Enable Supabase Realtime for chat tables so messages appear without refresh.
-- ALTER PUBLICATION errors if the table is already a member, so wrap in DO blocks.

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_chats;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Ensure full row data is sent on UPDATE (needed so realtime payloads have content)
ALTER TABLE public.private_chats REPLICA IDENTITY FULL;
ALTER TABLE public.private_chat_messages REPLICA IDENTITY FULL;
