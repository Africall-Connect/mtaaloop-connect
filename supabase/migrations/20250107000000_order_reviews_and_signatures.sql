-- Create order_reviews table for customer ratings and feedback
CREATE TABLE IF NOT EXISTS order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_rating INTEGER NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
  delivery_rating INTEGER NOT NULL CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id) -- One review per order
);

-- Add customer_signature and delivered_at to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_signature TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add delivered_at to deliveries table if not exists
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Create index for faster review queries
CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_customer_id ON order_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_created_at ON order_reviews(created_at DESC);

-- Enable RLS for order_reviews
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can read their own reviews
CREATE POLICY "Customers can read own reviews"
ON order_reviews FOR SELECT
USING (auth.uid() = customer_id);

-- Policy: Customers can create reviews for their orders
CREATE POLICY "Customers can create reviews for their orders"
ON order_reviews FOR INSERT
WITH CHECK (
  auth.uid() = customer_id 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_reviews.order_id 
    AND orders.customer_id = auth.uid()
    AND orders.status = 'delivered'
  )
);

-- Policy: Vendors can read reviews for their orders
CREATE POLICY "Vendors can read reviews for their orders"
ON order_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN vendor_profiles ON orders.vendor_id = vendor_profiles.user_id
    WHERE orders.id = order_reviews.order_id
    AND vendor_profiles.user_id = auth.uid()
  )
);

-- Policy: Admins can read all reviews
CREATE POLICY "Admins can read all reviews"
ON order_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Function to calculate average ratings for a vendor
CREATE OR REPLACE FUNCTION get_vendor_average_ratings(vendor_user_id UUID)
RETURNS TABLE(
  avg_food_rating NUMERIC,
  avg_delivery_rating NUMERIC,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(or2.food_rating)::numeric, 2) as avg_food_rating,
    ROUND(AVG(or2.delivery_rating)::numeric, 2) as avg_delivery_rating,
    COUNT(*)::bigint as total_reviews
  FROM order_reviews or2
  JOIN orders o ON or2.order_id = o.id
  WHERE o.vendor_id = vendor_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_order_reviews_updated_at
  BEFORE UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT ON order_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_average_ratings(UUID) TO authenticated;
