-- Add RLS policy for riders to view trash_collection records
-- This is needed because riders need to access trash_collection data when fetching trash_deliveries

CREATE POLICY "Riders view trash collection for their deliveries"
  ON public.trash_collection FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trash_deliveries
      INNER JOIN public.rider_profiles ON rider_profiles.id = trash_deliveries.rider_id
      WHERE trash_deliveries.trash_collection_id = trash_collection.id
      AND rider_profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.trash_deliveries
      INNER JOIN public.rider_profiles ON rider_profiles.estate_id = trash_deliveries.estate_id
      WHERE trash_deliveries.trash_collection_id = trash_collection.id
      AND rider_profiles.user_id = auth.uid()
      AND trash_deliveries.rider_id IS NULL
    )
  );
