-- ============================================================================
-- ADMIN FULL ACCESS — extra tables missed in 20260406120000
-- Grants admins full SELECT/INSERT/UPDATE/DELETE on operational tables that
-- previously only had role-restricted policies (vendor_profiles, products, etc.).
-- Idempotent — safe to re-run.
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'vendor_profiles',
    'rider_profiles',
    'estates',
    'products',
    'orders',
    'deliveries',
    'premium_orders',
    'premium_deliveries',
    'trash_collection',
    'trash_deliveries',
    'app_users',
    'user_roles',
    'support_tickets',
    'private_chat_messages',
    'vendor_applications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', tbl);
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
