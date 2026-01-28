-- Add policy to allow vendors to create deliveries for their orders
CREATE POLICY "Vendors create deliveries for their orders"
  ON public.deliveries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      JOIN public.vendor_profiles ON vendor_profiles.id = orders.vendor_id
      WHERE orders.id = deliveries.order_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );
