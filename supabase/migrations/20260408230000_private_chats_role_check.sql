-- Extend private_chats role check constraints to include all staff roles
DO $$
DECLARE con_name text;
BEGIN
  SELECT conname INTO con_name FROM pg_constraint
   WHERE conrelid = 'public.private_chats'::regclass
     AND conname = 'private_chats_initiator_role_check';
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.private_chats DROP CONSTRAINT private_chats_initiator_role_check';
  END IF;
  SELECT conname INTO con_name FROM pg_constraint
   WHERE conrelid = 'public.private_chats'::regclass
     AND conname = 'private_chats_recipient_role_check';
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.private_chats DROP CONSTRAINT private_chats_recipient_role_check';
  END IF;
END $$;

ALTER TABLE public.private_chats
  ADD CONSTRAINT private_chats_initiator_role_check
  CHECK (initiator_role IN ('customer','vendor','rider','agent','customer_rep','admin','estate_manager'));

ALTER TABLE public.private_chats
  ADD CONSTRAINT private_chats_recipient_role_check
  CHECK (recipient_role IS NULL OR recipient_role IN ('customer','vendor','rider','agent','customer_rep','admin','estate_manager'));
