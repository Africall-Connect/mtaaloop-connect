-- Fix infinite recursion in orders RLS policies

-- Drop and recreate the vendors update policy with proper check expression
DROP POLICY IF EXISTS "Vendors update their orders" ON orders;

CREATE POLICY "Vendors update their orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_profiles
    WHERE vendor_profiles.id = orders.vendor_id
    AND vendor_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendor_profiles
    WHERE vendor_profiles.id = orders.vendor_id
    AND vendor_profiles.user_id = auth.uid()
  )
);

-- Allow customers to update their own orders
CREATE POLICY "Customers update their own orders"
ON orders
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);
