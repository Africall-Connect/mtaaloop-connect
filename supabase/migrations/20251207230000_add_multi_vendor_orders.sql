-- Migration: Add Multi-Vendor Order Support
-- Description: Adds parent-child order relationship for multi-vendor orders
-- Date: 2025-12-07

-- Add parent order support columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS parent_order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_parent_order boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'single' 
  CHECK (order_type IN ('single', 'parent', 'child')),
ADD COLUMN IF NOT EXISTS order_group_number text;

-- Create index for performance on parent_order_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id 
  ON public.orders(parent_order_id);

-- Create index for order_group_number lookups
CREATE INDEX IF NOT EXISTS idx_orders_group_number 
  ON public.orders(order_group_number);

-- Update RLS policies to include parent orders
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Customers view parent orders" ON public.orders;

-- Create new policy for parent order access
CREATE POLICY "Customers view parent orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR 
    parent_order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

-- Create function to generate order group numbers
CREATE OR REPLACE FUNCTION generate_order_group_number()
RETURNS text AS $$
DECLARE
  new_number text;
BEGIN
  new_number := 'GRP-' || to_char(now(), 'YYYYMMDD') || '-' || 
                LPAD(floor(random() * 10000)::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the schema change
COMMENT ON COLUMN public.orders.parent_order_id IS 'References parent order for multi-vendor orders';
COMMENT ON COLUMN public.orders.is_parent_order IS 'True if this is a parent order grouping multiple vendor orders';
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: single (default), parent (grouping order), or child (vendor-specific order)';
COMMENT ON COLUMN public.orders.order_group_number IS 'Human-readable group number for multi-vendor orders';
