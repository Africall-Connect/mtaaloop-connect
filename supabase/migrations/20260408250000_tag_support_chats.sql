-- Backfill: mark any legacy unassigned private_chats as support-queue chats
-- so the CSR queue picks them up via recipient_role='customer_rep'.
UPDATE public.private_chats
   SET recipient_role = 'customer_rep'
 WHERE recipient_id IS NULL
   AND recipient_role IS NULL
   AND is_closed = false;
