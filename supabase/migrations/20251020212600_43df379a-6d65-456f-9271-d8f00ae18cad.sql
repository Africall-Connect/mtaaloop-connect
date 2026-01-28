-- Create products table for vendors
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  delivery_address text NOT NULL,
  customer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rider_id uuid REFERENCES public.rider_profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'assigned',
  pickup_time timestamptz,
  delivery_time timestamptz,
  delivery_fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create estate residents table
CREATE TABLE public.estate_residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id uuid REFERENCES public.estates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  apartment_number text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(estate_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estate_residents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors manage their own products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = products.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for orders
CREATE POLICY "Customers view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Vendors view their orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = orders.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors update their orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE vendor_profiles.id = orders.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for order_items
CREATE POLICY "Users view order items for their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.vendor_profiles
        WHERE vendor_profiles.id = orders.vendor_id
        AND vendor_profiles.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Customers create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all order items"
  ON public.order_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for deliveries
CREATE POLICY "Riders view their deliveries"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rider_profiles
      WHERE rider_profiles.id = deliveries.rider_id
      AND rider_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Riders update their deliveries"
  ON public.deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rider_profiles
      WHERE rider_profiles.id = deliveries.rider_id
      AND rider_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers view deliveries for their orders"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = deliveries.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Vendors view deliveries for their orders"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.vendor_profiles ON vendor_profiles.id = orders.vendor_id
      WHERE orders.id = deliveries.order_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all deliveries"
  ON public.deliveries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for estate_residents
CREATE POLICY "Estate managers view their residents"
  ON public.estate_residents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.estates
      WHERE estates.id = estate_residents.estate_id
      AND estates.manager_id = auth.uid()
    )
  );

CREATE POLICY "Estate managers manage their residents"
  ON public.estate_residents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.estates
      WHERE estates.id = estate_residents.estate_id
      AND estates.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users view their own resident profile"
  ON public.estate_residents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own resident profile"
  ON public.estate_residents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all residents"
  ON public.estate_residents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_deliveries_rider_id ON public.deliveries(rider_id);
CREATE INDEX idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX idx_estate_residents_estate_id ON public.estate_residents(estate_id);
CREATE INDEX idx_estate_residents_user_id ON public.estate_residents(user_id);