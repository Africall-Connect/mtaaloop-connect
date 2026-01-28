/*
  # MtaaLoop Vendor Portal - Complete Database Schema
  
  Comprehensive database for vendor management including products, orders,
  customers, communications, analytics, and marketing features.
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    parent_id uuid REFERENCES public.product_categories(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
    ON public.product_categories FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    phone text NOT NULL,
    email text,
    first_name text,
    last_name text,
    total_orders integer DEFAULT 0,
    total_spent decimal(10,2) DEFAULT 0,
    average_order_value decimal(10,2) DEFAULT 0,
    last_order_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own customer profile"
    ON public.customers FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert customer profile"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update customer profile"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label text,
    building text,
    apartment text,
    estate_name text,
    additional_info text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage addresses"
    ON public.customer_addresses FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.customers 
        WHERE customers.id = customer_addresses.customer_id 
        AND customers.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.customers 
        WHERE customers.id = customer_addresses.customer_id 
        AND customers.user_id = auth.uid()
    ));

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    category_id uuid REFERENCES public.product_categories(id),
    price decimal(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price decimal(10,2),
    cost_price decimal(10,2),
    sku text,
    barcode text,
    track_inventory boolean DEFAULT false,
    stock_quantity integer DEFAULT 0,
    low_stock_threshold integer DEFAULT 5,
    is_available boolean DEFAULT true,
    preparation_time integer DEFAULT 15,
    image_url text,
    tags text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Public views products"
    ON public.products FOR SELECT
    TO authenticated
    USING (is_available = true);

CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage product images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = product_images.product_id 
        AND products.vendor_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = product_images.product_id 
        AND products.vendor_id = auth.uid()
    ));

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    change_type text NOT NULL CHECK (change_type IN ('restock', 'sale', 'adjustment', 'return')),
    quantity_change integer NOT NULL,
    quantity_after integer NOT NULL,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view inventory logs"
    ON public.inventory_logs FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = inventory_logs.product_id 
        AND products.vendor_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = inventory_logs.product_id 
        AND products.vendor_id = auth.uid()
    ));

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number text UNIQUE NOT NULL,
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
    ),
    subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee decimal(10,2) DEFAULT 0,
    service_fee decimal(10,2) DEFAULT 0,
    discount_amount decimal(10,2) DEFAULT 0,
    total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_method text,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_transaction_id text,
    delivery_address text NOT NULL,
    customer_notes text,
    vendor_notes text,
    preparation_time integer,
    estimated_delivery_time timestamptz,
    accepted_at timestamptz,
    preparing_at timestamptz,
    ready_at timestamptz,
    out_for_delivery_at timestamptz,
    delivered_at timestamptz,
    cancelled_at timestamptz,
    cancellation_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Customers view orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.customers 
        WHERE customers.id = orders.customer_id 
        AND customers.user_id = auth.uid()
    ));

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id),
    product_name text NOT NULL,
    product_price decimal(10,2) NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    customizations jsonb,
    special_instructions text,
    subtotal decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.vendor_id = auth.uid()
    ));

CREATE POLICY "Customers view order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.customers c ON c.id = o.customer_id
        WHERE o.id = order_items.order_id 
        AND c.user_id = auth.uid()
    ));

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View order history"
    ON public.order_status_history FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_status_history.order_id 
        AND orders.vendor_id = auth.uid()
    ));

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    is_verified boolean DEFAULT true,
    helpful_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view reviews"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (auth.uid() = vendor_id);

CREATE POLICY "Customers create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.customers 
        WHERE customers.id = reviews.customer_id 
        AND customers.user_id = auth.uid()
    ));

CREATE POLICY "Public views reviews"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE TABLE IF NOT EXISTS public.review_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL UNIQUE,
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    response text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage responses"
    ON public.review_responses FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Public views responses"
    ON public.review_responses FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- COMMUNICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users update messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

CREATE TABLE IF NOT EXISTS public.message_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    template_type text NOT NULL CHECK (template_type IN ('sms', 'email', 'chat')),
    category text,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage templates"
    ON public.message_templates FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE TABLE IF NOT EXISTS public.sms_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    message text NOT NULL,
    recipient_count integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
    scheduled_at timestamptz,
    sent_at timestamptz,
    cost_amount decimal(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage sms"
    ON public.sms_campaigns FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

-- =====================================================
-- PROMOTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promotions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    promo_code text NOT NULL,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'bogo', 'free_item', 'free_delivery')),
    discount_value decimal(10,2) NOT NULL,
    minimum_purchase decimal(10,2) DEFAULT 0,
    usage_limit integer,
    usage_per_customer integer DEFAULT 1,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage promotions"
    ON public.promotions FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Customers view promotions"
    ON public.promotions FOR SELECT
    TO authenticated
    USING (is_active = true AND starts_at <= now() AND ends_at >= now());

CREATE TABLE IF NOT EXISTS public.promotion_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id uuid REFERENCES public.promotions(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) NOT NULL,
    discount_applied decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view usage"
    ON public.promotion_usage FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.promotions 
        WHERE promotions.id = promotion_usage.promotion_id 
        AND promotions.vendor_id = auth.uid()
    ));

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('order', 'review', 'system', 'promotion', 'payment', 'inventory')),
    related_id uuid,
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_orders boolean DEFAULT true,
    email_reviews boolean DEFAULT true,
    sms_orders boolean DEFAULT true,
    push_orders boolean DEFAULT true,
    push_reviews boolean DEFAULT true,
    quiet_hours_enabled boolean DEFAULT false,
    quiet_hours_start time,
    quiet_hours_end time,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage prefs"
    ON public.notification_preferences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CUSTOMER TAGS & NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    tag text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (vendor_id, customer_id, tag)
);

ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage tags"
    ON public.customer_tags FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

CREATE TABLE IF NOT EXISTS public.customer_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    note text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage notes"
    ON public.customer_notes FOR ALL
    TO authenticated
    USING (auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = vendor_id);

-- =====================================================
-- ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_analytics_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    total_orders integer DEFAULT 0,
    completed_orders integer DEFAULT 0,
    cancelled_orders integer DEFAULT 0,
    total_revenue decimal(10,2) DEFAULT 0,
    average_order_value decimal(10,2) DEFAULT 0,
    new_customers integer DEFAULT 0,
    returning_customers integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE (vendor_id, date)
);

ALTER TABLE public.vendor_analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view analytics"
    ON public.vendor_analytics_daily FOR SELECT
    TO authenticated
    USING (auth.uid() = vendor_id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON public.reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_users ON public.messages(sender_id, recipient_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_products_ts BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_ts BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_ts BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_ts BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notif_prefs_ts BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
