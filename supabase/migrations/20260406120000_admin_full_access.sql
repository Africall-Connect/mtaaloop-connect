-- ============================================================================
-- ADMIN FULL ACCESS POLICIES
-- ============================================================================
-- Grants admins full (SELECT/INSERT/UPDATE/DELETE) access to every table
-- that currently lacks an admin-bypass policy. Idempotent — safe to re-run.
--
-- Pattern per table:
--   DO $$ BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.tables
--                WHERE table_schema = 'public' AND table_name = '<table>') THEN
--       DROP POLICY IF EXISTS "Admins full access" ON public.<table>;
--       CREATE POLICY "Admins full access" ON public.<table>
--         FOR ALL TO authenticated
--         USING (public.has_role(auth.uid(), 'admin'::app_role))
--         WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
--     END IF;
--   END $$;
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    -- Customer data
    'customers',
    'customer_addresses',
    'customer_profiles',
    'customer_wallet',
    'customer_wallet_tx',
    -- Rider financial
    'rider_wallet',
    'rider_wallet_tx',
    'rider_earnings',
    -- Reviews
    'reviews',
    'review_responses',
    'order_reviews',
    -- Messages & chat
    'messages',
    'private_chats',
    'chat_messages',
    'support_messages',
    -- Notifications
    'notifications',
    'order_notifications',
    'rider_notifications',
    'notification_preferences',
    -- Vendor features
    'promotions',
    'inventory_logs',
    -- Services
    'service_requests',
    -- Bookings
    'booking_reservations',
    'booking_service_types',
    'booking_availability',
    'booking_time_slots',
    -- User data
    'user_preferences',
    'user_gamification',
    -- Payments
    'mpesa_transactions',
    'payments',
    'payment_logs',
    'payments_paystack',
    -- Orders extra
    'order_items',
    'premium_order_items'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Enable RLS if not already enabled (no-op if already on)
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      -- Drop any existing admin-full-access policy so we can recreate cleanly
      EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', tbl);
      -- Create the admin-full-access policy
      EXECUTE format(
        'CREATE POLICY "Admins full access" ON public.%I
          FOR ALL TO authenticated
          USING (public.has_role(auth.uid(), ''admin''::app_role))
          WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))',
        tbl
      );
    END IF;
  END LOOP;
END $$;
