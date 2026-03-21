
-- SECURITY HARDENING MIGRATION (corrected column names)

-- PART 1: Enable RLS on unprotected tables
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_paystack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_wallet_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash_deliveries ENABLE ROW LEVEL SECURITY;

-- payment_logs
CREATE POLICY "Users can view own payment logs"
  ON public.payment_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- payments_paystack
CREATE POLICY "Users can view own paystack payments"
  ON public.payments_paystack FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- premium_orders
CREATE POLICY "Customers view own premium orders"
  ON public.premium_orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers create own premium orders"
  ON public.premium_orders FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins update premium orders"
  ON public.premium_orders FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- premium_order_items
DROP POLICY IF EXISTS "Allow read access to premium order items" ON public.premium_order_items;
CREATE POLICY "Users view own premium order items"
  ON public.premium_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM premium_orders po WHERE po.id = premium_order_id AND po.customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Users insert own premium order items"
  ON public.premium_order_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM premium_orders po WHERE po.id = premium_order_id AND po.customer_id = auth.uid())
  );

-- premium_deliveries
CREATE POLICY "Users view own premium deliveries"
  ON public.premium_deliveries FOR SELECT TO authenticated
  USING (
    rider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM premium_orders po WHERE po.id = premium_order_id AND po.customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Riders update assigned premium deliveries"
  ON public.premium_deliveries FOR UPDATE TO authenticated
  USING (rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- rider_wallet
CREATE POLICY "Riders view own wallet"
  ON public.rider_wallet FOR SELECT TO authenticated
  USING (rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- rider_wallet_tx
CREATE POLICY "Riders view own transactions"
  ON public.rider_wallet_tx FOR SELECT TO authenticated
  USING (rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- trash_collection
CREATE POLICY "Users view own trash collections"
  ON public.trash_collection FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create own trash collections"
  ON public.trash_collection FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users update own trash collections"
  ON public.trash_collection FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- trash_deliveries
DROP POLICY IF EXISTS "System can create trash deliveries" ON public.trash_deliveries;
CREATE POLICY "Riders and admins view trash deliveries"
  ON public.trash_deliveries FOR SELECT TO authenticated
  USING (rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins create trash deliveries"
  ON public.trash_deliveries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Riders update assigned trash deliveries"
  ON public.trash_deliveries FOR UPDATE TO authenticated
  USING (rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- PART 2: Fix overly permissive policies

-- badges
DROP POLICY IF EXISTS "Users can manage badges" ON public.badges;
CREATE POLICY "Admins manage badges"
  ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- big_supermarket_items
DROP POLICY IF EXISTS "Authenticated users can delete supermarket items" ON public.big_supermarket_items;
DROP POLICY IF EXISTS "Authenticated users can insert supermarket items" ON public.big_supermarket_items;
DROP POLICY IF EXISTS "Authenticated users can update supermarket items" ON public.big_supermarket_items;
CREATE POLICY "Admins manage supermarket items"
  ON public.big_supermarket_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- booking_availability
DROP POLICY IF EXISTS "Enable all access for all users" ON public.booking_availability;
CREATE POLICY "Vendors manage own availability"
  ON public.booking_availability FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
  );
CREATE POLICY "Public read booking availability"
  ON public.booking_availability FOR SELECT TO anon, authenticated
  USING (true);

-- booking_reservations
DROP POLICY IF EXISTS "Enable all access for all users" ON public.booking_reservations;
CREATE POLICY "Customers view own reservations"
  ON public.booking_reservations FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Customers create own reservations"
  ON public.booking_reservations FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Owner or vendor update reservations"
  ON public.booking_reservations FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- booking_service_types
DROP POLICY IF EXISTS "Enable read access for all users" ON public.booking_service_types;
CREATE POLICY "Public read service types"
  ON public.booking_service_types FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Vendors manage own service types"
  ON public.booking_service_types FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
  );

-- booking_time_slots
DROP POLICY IF EXISTS "Enable all access for all users" ON public.booking_time_slots;
CREATE POLICY "Public read time slots"
  ON public.booking_time_slots FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Vendors manage own time slots"
  ON public.booking_time_slots FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_id AND vp.user_id = auth.uid())
  );

-- event_categories (system-level, admin only for mutations)
DROP POLICY IF EXISTS "Users can manage event categories" ON public.event_categories;
CREATE POLICY "Admins manage event categories"
  ON public.event_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public read event categories"
  ON public.event_categories FOR SELECT TO anon, authenticated
  USING (true);

-- payments
DROP POLICY IF EXISTS "Service can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service can update payments" ON public.payments;
CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- product_attributes (uses product_service_id, admin-only mutations)
DROP POLICY IF EXISTS "Allow public delete attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow public insert attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Allow public update attributes" ON public.product_attributes;
CREATE POLICY "Admins manage product attributes"
  ON public.product_attributes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- product_categories (system catalog, admin-only mutations)
DROP POLICY IF EXISTS "Allow public delete categories" ON public.product_categories;
DROP POLICY IF EXISTS "Allow public insert categories" ON public.product_categories;
DROP POLICY IF EXISTS "Allow public update categories" ON public.product_categories;
CREATE POLICY "Admins manage product categories"
  ON public.product_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public read product categories"
  ON public.product_categories FOR SELECT TO anon, authenticated
  USING (true);

-- product_variants (uses product_service_id, admin-only mutations)
DROP POLICY IF EXISTS "Allow public delete variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow public insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow public update variants" ON public.product_variants;
CREATE POLICY "Admins manage product variants"
  ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- products_services (system catalog, admin-only mutations)
DROP POLICY IF EXISTS "Allow public delete products" ON public.products_services;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products_services;
DROP POLICY IF EXISTS "Allow public update products" ON public.products_services;
CREATE POLICY "Admins manage products_services"
  ON public.products_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- support_messages
DROP POLICY IF EXISTS "public chat" ON public.support_messages;
CREATE POLICY "Users manage own support messages"
  ON public.support_messages FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid());

-- estates INSERT
DROP POLICY IF EXISTS "Estates can be inserted" ON public.estates;
CREATE POLICY "Authenticated users can register estates"
  ON public.estates FOR INSERT TO authenticated
  WITH CHECK (true);

-- PART 3: Fix exposed auth.users view
DROP VIEW IF EXISTS public.leaderboard CASCADE;
DROP VIEW IF EXISTS public.estate_leaderboard CASCADE;
DROP VIEW IF EXISTS public.app_users CASCADE;

CREATE VIEW public.app_users
WITH (security_invoker = on) AS
  SELECT 
    id,
    email,
    (raw_user_meta_data ->> 'first_name') AS first_name,
    (raw_user_meta_data ->> 'last_name') AS last_name,
    COALESCE((raw_user_meta_data ->> 'phone'), phone) AS phone
  FROM auth.users;

CREATE VIEW public.estate_leaderboard
WITH (security_invoker = on) AS
  SELECT 
    u.user_id AS id,
    u.display_name,
    u.avatar_url,
    u.estate_id,
    g.total_points,
    g.level,
    g.xp_points,
    rank() OVER (PARTITION BY u.estate_id ORDER BY g.total_points DESC) AS estate_rank
  FROM where_profiles u
  JOIN user_gamification g ON u.user_id = g.user_id
  WHERE u.estate_id IS NOT NULL;

CREATE VIEW public.leaderboard
WITH (security_invoker = on) AS
  SELECT 
    u.user_id AS id,
    u.display_name,
    u.avatar_url,
    u.estate_id,
    g.total_points,
    g.level,
    g.xp_points,
    rank() OVER (ORDER BY g.total_points DESC) AS global_rank,
    rank() OVER (PARTITION BY u.estate_id ORDER BY g.total_points DESC) AS estate_rank
  FROM where_profiles u
  JOIN user_gamification g ON u.user_id = g.user_id;
