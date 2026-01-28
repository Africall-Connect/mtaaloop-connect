-- Make recipient_role nullable to support unassigned chats
ALTER TABLE public.private_chats
  ALTER COLUMN recipient_role DROP NOT NULL;

-- Drop and recreate the recipient_role check constraint to allow NULL
ALTER TABLE public.private_chats
  DROP CONSTRAINT IF EXISTS private_chats_recipient_role_check;

ALTER TABLE public.private_chats
  ADD CONSTRAINT private_chats_recipient_role_check CHECK (
    recipient_role IS NULL OR
    recipient_role = ANY (
      ARRAY['customer'::text, 'vendor'::text, 'rider'::text, 'admin'::text]
    )
  );

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their chats" ON public.private_chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.private_chats;
DROP POLICY IF EXISTS "Users can update their chats" ON public.private_chats;
DROP POLICY IF EXISTS "Users can view their messages" ON public.private_chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.private_chat_messages;

-- Enable RLS
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_chats

-- Allow users to view chats they are part of (initiator or recipient)
-- Also allow admins to view all chats
CREATE POLICY "Users can view their chats"
  ON public.private_chats
  FOR SELECT
  USING (
    auth.uid() = initiator_id 
    OR auth.uid() = recipient_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated users to create chats (initiator)
CREATE POLICY "Users can create chats"
  ON public.private_chats
  FOR INSERT
  WITH CHECK (
    auth.uid() = initiator_id
    AND is_closed = false
  );

-- Allow users to update chats they are part of
-- Admins can assign themselves (update recipient_id and recipient_role)
CREATE POLICY "Users can update their chats"
  ON public.private_chats
  FOR UPDATE
  USING (
    auth.uid() = initiator_id 
    OR auth.uid() = recipient_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = initiator_id 
    OR auth.uid() = recipient_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for private_chat_messages

-- Allow users to view messages in chats they are part of
CREATE POLICY "Users can view their messages"
  ON public.private_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_chats
      WHERE private_chats.chat_id = private_chat_messages.chat_id
      AND (
        private_chats.initiator_id = auth.uid()
        OR private_chats.recipient_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Allow users to send messages in chats they are part of
CREATE POLICY "Users can send messages"
  ON public.private_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.private_chats
      WHERE private_chats.chat_id = private_chat_messages.chat_id
      AND (
        private_chats.initiator_id = auth.uid()
        OR private_chats.recipient_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );
