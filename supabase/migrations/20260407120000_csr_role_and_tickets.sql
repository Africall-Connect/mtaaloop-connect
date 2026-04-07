-- ============================================================================
-- CSR (Customer Representative) ROLE + SUPPORT TICKETS + CANNED RESPONSES
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Add 'customer_rep' to the app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_rep';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Helper function so RLS policies stay short
CREATE OR REPLACE FUNCTION public.is_csr(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = 'customer_rep'::app_role
  );
$$;

-- 3. Read-only RLS for CSRs on customer-facing tables
DO $$
DECLARE
  tbl text;
  read_tables text[] := ARRAY[
    'orders', 'order_items', 'premium_orders', 'premium_order_items',
    'deliveries', 'premium_deliveries', 'trash_deliveries', 'trash_collection',
    'customers', 'customer_profiles', 'customer_addresses',
    'customer_wallet', 'customer_wallet_tx',
    'service_requests',
    'booking_reservations', 'booking_service_types',
    'reviews', 'order_reviews',
    'order_notifications', 'rider_notifications', 'notifications',
    'user_preferences',
    'vendor_profiles', 'rider_profiles', 'estates',
    'private_chats', 'private_chat_messages',
    'support_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY read_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "CSRs read access" ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY "CSRs read access" ON public.%I
          FOR SELECT TO authenticated
          USING (public.is_csr(auth.uid()))',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- 4. CSRs can also UPDATE private_chats (claim) and INSERT private_chat_messages (reply)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chats') THEN
    DROP POLICY IF EXISTS "CSRs claim chats" ON public.private_chats;
    CREATE POLICY "CSRs claim chats" ON public.private_chats
      FOR UPDATE TO authenticated
      USING (public.is_csr(auth.uid()))
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'private_chat_messages') THEN
    DROP POLICY IF EXISTS "CSRs send messages" ON public.private_chat_messages;
    CREATE POLICY "CSRs send messages" ON public.private_chat_messages
      FOR INSERT TO authenticated
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;

-- 5. support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('order_issue','delivery_problem','payment_issue','product_quality','account','refund_request','other')),
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed','escalated')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  escalated_to_admin BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own tickets" ON public.support_tickets;
CREATE POLICY "Customers view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers create own tickets" ON public.support_tickets;
CREATE POLICY "Customers create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "CSRs view all tickets" ON public.support_tickets;
CREATE POLICY "CSRs view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.is_csr(auth.uid()));

DROP POLICY IF EXISTS "CSRs update tickets" ON public.support_tickets;
CREATE POLICY "CSRs update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.is_csr(auth.uid()))
  WITH CHECK (public.is_csr(auth.uid()));

DROP POLICY IF EXISTS "Admins full access tickets" ON public.support_tickets;
CREATE POLICY "Admins full access tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- 6. support_ticket_notes (internal CSR notes, never seen by customer)
CREATE TABLE IF NOT EXISTS public.support_ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket ON public.support_ticket_notes(ticket_id);

ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CSRs and admins manage notes" ON public.support_ticket_notes;
CREATE POLICY "CSRs and admins manage notes" ON public.support_ticket_notes
  FOR ALL TO authenticated
  USING (public.is_csr(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.is_csr(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

-- 7. csr_canned_responses (knowledge base / quick replies)
CREATE TABLE IF NOT EXISTS public.csr_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  shortcut TEXT,
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.csr_canned_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CSRs and admins read canned responses" ON public.csr_canned_responses;
CREATE POLICY "CSRs and admins read canned responses" ON public.csr_canned_responses
  FOR SELECT TO authenticated
  USING (public.is_csr(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage canned responses" ON public.csr_canned_responses;
CREATE POLICY "Admins manage canned responses" ON public.csr_canned_responses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- 8. Seed starter canned responses
INSERT INTO public.csr_canned_responses (category, title, body, shortcut) VALUES
  ('greeting', 'Welcome', 'Hi there! Thanks for reaching out to MtaaLoop support. How can I help you today?', '/hi'),
  ('refund', 'Refund policy', 'We offer full refunds for orders that have not yet been picked up by a rider, and partial refunds for delivery issues. I''ll need to check your order details to advise the best path forward.', '/refund'),
  ('delivery', 'Delivery delay apology', 'I''m sorry your order is taking longer than expected. Let me check with the rider and get back to you with an updated ETA right away.', '/late'),
  ('wallet', 'Wallet top-up', 'You can top up your MtaaLoop wallet from the Wallet page in your account. We support M-Pesa STK Push for instant top-ups.', '/topup'),
  ('escalation', 'Escalating to admin', 'I''m going to flag this for our admin team to look into. You can expect a follow-up within 24 hours. Is there anything else I can help with in the meantime?', '/escalate'),
  ('closing', 'Closing chat', 'Thank you for chatting with MtaaLoop today! If you have any other questions, just open a new chat anytime. Have a great day!', '/bye')
ON CONFLICT DO NOTHING;
