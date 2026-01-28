-- Migration to integrate MtaaLoop business pages with ordering system
-- This extends the existing orders table to support MtaaLoop businesses

-- Add business_type_id to orders table to identify MtaaLoop business orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS business_type_id uuid REFERENCES business_types(id),
ADD COLUMN IF NOT EXISTS is_mtaaloop_managed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mtaaloop_delivery_type text CHECK (mtaaloop_delivery_type IN ('standard', 'express', 'scheduled'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type_id);
CREATE INDEX IF NOT EXISTS idx_orders_mtaaloop_managed ON orders(is_mtaaloop_managed) WHERE is_mtaaloop_managed = true;

-- Modify order_items to support products_services
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_service_id uuid REFERENCES products_services(id);

-- Add index for product_service_id
CREATE INDEX IF NOT EXISTS idx_order_items_product_service ON order_items(product_service_id);

-- Create MtaaLoop delivery tracking table (separate from regular deliveries)
CREATE TABLE IF NOT EXISTS mtaaloop_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_type_id uuid NOT NULL REFERENCES business_types(id),
  estate_id uuid REFERENCES estates(id),
  rider_profile_id uuid REFERENCES rider_profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled'
  )),
  pickup_address text,
  delivery_address text NOT NULL,
  delivery_instructions text,
  scheduled_time timestamp with time zone,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  delivery_fee numeric(10, 2) DEFAULT 50,
  rider_earnings numeric(10, 2),
  estimated_delivery_time integer, -- in minutes
  actual_delivery_time integer, -- in minutes
  customer_signature text,
  delivery_photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for mtaaloop_deliveries
CREATE INDEX IF NOT EXISTS idx_mtaaloop_deliveries_order ON mtaaloop_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_mtaaloop_deliveries_rider_profile ON mtaaloop_deliveries(rider_profile_id);
CREATE INDEX IF NOT EXISTS idx_mtaaloop_deliveries_status ON mtaaloop_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_mtaaloop_deliveries_business_type ON mtaaloop_deliveries(business_type_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_mtaaloop_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mtaaloop_deliveries_updated_at
  BEFORE UPDATE ON mtaaloop_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_mtaaloop_deliveries_updated_at();

-- Create view for MtaaLoop order analytics
CREATE OR REPLACE VIEW mtaaloop_order_analytics AS
SELECT 
  bt.name as business_name,
  bt.id as business_type_id,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as average_order_value,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
  AVG(CASE WHEN md.actual_delivery_time IS NOT NULL THEN md.actual_delivery_time END) as avg_delivery_time_minutes
FROM business_types bt
LEFT JOIN orders o ON o.business_type_id = bt.id AND o.is_mtaaloop_managed = true
LEFT JOIN mtaaloop_deliveries md ON md.order_id = o.id
GROUP BY bt.id, bt.name;

-- Add comment to explain the structure
COMMENT ON TABLE mtaaloop_deliveries IS 'Handles deliveries for MtaaLoop-managed businesses (Liquor Store, Pharmacy, etc.) with a different flow than regular vendor deliveries';
COMMENT ON COLUMN orders.business_type_id IS 'References the business type for MtaaLoop-managed orders (e.g., liquor-store, pharmacy)';
COMMENT ON COLUMN orders.is_mtaaloop_managed IS 'True if this order is from a MtaaLoop-managed business page';
COMMENT ON COLUMN order_items.product_service_id IS 'References products_services table for MtaaLoop business items';
