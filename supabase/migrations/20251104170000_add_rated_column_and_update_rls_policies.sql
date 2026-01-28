-- Add rated column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rated boolean DEFAULT false;

-- Update RLS policies for vendor_profiles to allow customers to update ratings
DROP POLICY IF EXISTS "Customers can update vendor ratings for their orders" ON public.vendor_profiles;
CREATE POLICY "Customers can update vendor ratings for their orders"
ON public.vendor_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.vendor_id = vendor_profiles.id
    AND orders.customer_id = auth.uid()
    AND orders.status = 'delivered'
    AND orders.rated = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.vendor_id = vendor_profiles.id
    AND orders.customer_id = auth.uid()
    AND orders.status = 'delivered'
    AND orders.rated = false
  )
);

-- Update RLS policies for rider_profiles to allow customers to update ratings
DROP POLICY IF EXISTS "Customers can update rider ratings for their deliveries" ON public.rider_profiles;
CREATE POLICY "Customers can update rider ratings for their deliveries"
ON public.rider_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.deliveries d
    JOIN public.orders o ON o.id = d.order_id
    WHERE d.rider_id = rider_profiles.id
    AND o.customer_id = auth.uid()
    AND o.status = 'delivered'
    AND d.status = 'delivered'
    AND o.rated = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deliveries d
    JOIN public.orders o ON o.id = d.order_id
    WHERE d.rider_id = rider_profiles.id
    AND o.customer_id = auth.uid()
    AND o.status = 'delivered'
    AND d.status = 'delivered'
    AND o.rated = false
  )
);
