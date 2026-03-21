-- Allow public read access to big_supermarket_items
CREATE POLICY "Anyone can view supermarket items"
ON public.big_supermarket_items
FOR SELECT
USING (true);

-- Allow authenticated users to insert/update/delete (for admin)
CREATE POLICY "Authenticated users can insert supermarket items"
ON public.big_supermarket_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update supermarket items"
ON public.big_supermarket_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete supermarket items"
ON public.big_supermarket_items
FOR DELETE
TO authenticated
USING (true);