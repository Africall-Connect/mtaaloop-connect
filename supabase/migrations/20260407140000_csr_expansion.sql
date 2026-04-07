-- ============================================================================
-- CSR EXPANSION: Order intervention + Vendor campaigns + Review prompts +
-- Outbound campaigns + Notification INSERT permission
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1a. Order intervention columns + RLS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS csr_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_orders_flagged ON public.orders(is_flagged) WHERE is_flagged = true;

DROP POLICY IF EXISTS "CSRs flag orders" ON public.orders;
CREATE POLICY "CSRs flag orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_csr(auth.uid()))
  WITH CHECK (public.is_csr(auth.uid()));

-- 1b. Marketing campaigns + promotions: CSR write access + audit column
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'marketing_campaigns') THEN
    ALTER TABLE public.marketing_campaigns
      ADD COLUMN IF NOT EXISTS created_by_csr UUID REFERENCES auth.users(id);
    DROP POLICY IF EXISTS "CSRs manage campaigns" ON public.marketing_campaigns;
    CREATE POLICY "CSRs manage campaigns"
      ON public.marketing_campaigns FOR ALL TO authenticated
      USING (public.is_csr(auth.uid()))
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'promotions') THEN
    ALTER TABLE public.promotions
      ADD COLUMN IF NOT EXISTS created_by_csr UUID REFERENCES auth.users(id);
    DROP POLICY IF EXISTS "CSRs manage promotions" ON public.promotions;
    CREATE POLICY "CSRs manage promotions"
      ON public.promotions FOR ALL TO authenticated
      USING (public.is_csr(auth.uid()))
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;

-- 1c. Review prompts table
CREATE TABLE IF NOT EXISTS public.review_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  prompt_type TEXT DEFAULT 'csr' CHECK (prompt_type IN ('csr','automated'))
);

CREATE INDEX IF NOT EXISTS idx_review_prompts_order ON public.review_prompts(order_id);
CREATE INDEX IF NOT EXISTS idx_review_prompts_customer ON public.review_prompts(customer_id);

ALTER TABLE public.review_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CSRs send review prompts" ON public.review_prompts;
CREATE POLICY "CSRs send review prompts"
  ON public.review_prompts FOR ALL TO authenticated
  USING (public.is_csr(auth.uid()))
  WITH CHECK (public.is_csr(auth.uid()));

DROP POLICY IF EXISTS "Customers see own review prompts" ON public.review_prompts;
CREATE POLICY "Customers see own review prompts"
  ON public.review_prompts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access review prompts" ON public.review_prompts;
CREATE POLICY "Admins full access review prompts"
  ON public.review_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 1d. CSR outbound campaigns + send log
CREATE TABLE IF NOT EXISTS public.csr_outbound_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('reminder','re_engagement','reorder','feedback','announcement')),
  audience_filter JSONB,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  total_sent INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.csr_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.csr_outbound_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  notification_id UUID
);

CREATE INDEX IF NOT EXISTS idx_csr_sends_campaign ON public.csr_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_csr_sends_customer ON public.csr_campaign_sends(customer_id);

ALTER TABLE public.csr_outbound_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_campaign_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CSRs manage outbound campaigns" ON public.csr_outbound_campaigns;
CREATE POLICY "CSRs manage outbound campaigns"
  ON public.csr_outbound_campaigns FOR ALL TO authenticated
  USING (public.is_csr(auth.uid()))
  WITH CHECK (public.is_csr(auth.uid()));

DROP POLICY IF EXISTS "Admins full access csr outbound" ON public.csr_outbound_campaigns;
CREATE POLICY "Admins full access csr outbound"
  ON public.csr_outbound_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "CSRs view sends" ON public.csr_campaign_sends;
CREATE POLICY "CSRs view sends"
  ON public.csr_campaign_sends FOR ALL TO authenticated
  USING (public.is_csr(auth.uid()))
  WITH CHECK (public.is_csr(auth.uid()));

DROP POLICY IF EXISTS "Admins full access csr sends" ON public.csr_campaign_sends;
CREATE POLICY "Admins full access csr sends"
  ON public.csr_campaign_sends FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 1e. CSRs can INSERT into the existing notifications table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "CSRs send notifications" ON public.notifications;
    CREATE POLICY "CSRs send notifications"
      ON public.notifications FOR INSERT TO authenticated
      WITH CHECK (public.is_csr(auth.uid()));
  END IF;
END $$;
