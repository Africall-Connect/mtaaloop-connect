CREATE TABLE public.premium_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID NULL,
  estate_id UUID NULL,
  total_amount NUMERIC(10, 2) NOT NULL, -- What customer pays (markup)
  base_amount NUMERIC(10, 2) NOT NULL,  -- What rider pays at Carrefour
  profit_amount NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount - base_amount) STORED,
  status TEXT NULL DEFAULT 'pending', -- pending, confirmed, rider_assigned, purchased, delivered, cancelled
  delivery_address TEXT NOT NULL,
  customer_notes TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  order_number TEXT NULL,
  payment_status TEXT NULL DEFAULT 'pending',
  rated BOOLEAN NOT NULL DEFAULT FALSE,
  customer_signature TEXT NULL,
  delivered_at TIMESTAMPTZ NULL,
  cancellation_reason TEXT NULL,
  cancelled_at TIMESTAMPTZ NULL,

  -- Foreign Keys
  CONSTRAINT premium_orders_pkey PRIMARY KEY (id),
  CONSTRAINT premium_orders_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_orders_customer_id 
  ON public.premium_orders USING btree (customer_id);

CREATE INDEX IF NOT EXISTS idx_premium_orders_status 
  ON public.premium_orders USING btree (status);

CREATE INDEX IF NOT EXISTS idx_premium_orders_created_at 
  ON public.premium_orders USING btree (created_at);

CREATE TABLE public.premium_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  premium_order_id UUID NOT NULL,
  product_id UUID NOT NULL, -- references big_supermarket_items.id
  product_name TEXT NOT NULL,
  clean_name TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL, -- Carrefour price
  markup_price NUMERIC(10, 2) NOT NULL, -- Customer pays
  quantity INT NOT NULL DEFAULT 1,
  image_url TEXT NULL,

  CONSTRAINT premium_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT premium_order_items_order_id_fkey 
    FOREIGN KEY (premium_order_id) REFERENCES premium_orders(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_premium_order_items_order_id 
  ON public.premium_order_items USING btree (premium_order_id);
