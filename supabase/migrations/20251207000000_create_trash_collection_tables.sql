-- Create trash_collection table
CREATE TABLE public.trash_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID NULL,
  estate_id UUID NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 30.00, -- 30 shillings one-time
  status TEXT NULL DEFAULT 'pending', -- pending, assigned, picked_up, completed, cancelled
  payment_status TEXT NULL DEFAULT 'pending', -- pending, paid, failed
  house TEXT NOT NULL,
  full_name TEXT NOT NULL,
  customer_notes TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  cancellation_reason TEXT NULL,

  -- Foreign Keys
  CONSTRAINT trash_collection_pkey PRIMARY KEY (id),
  CONSTRAINT trash_collection_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT trash_collection_estate_id_fkey 
    FOREIGN KEY (estate_id) REFERENCES public.estates(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create trash_deliveries table (for rider assignment)
CREATE TABLE public.trash_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  trash_collection_id UUID NOT NULL,
  rider_id UUID NULL,
  estate_id UUID NOT NULL,
  status TEXT NULL DEFAULT 'pending', -- pending, assigned, picked_up, completed, cancelled
  pickup_time TIMESTAMPTZ NULL,
  completion_time TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT trash_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT trash_deliveries_trash_collection_id_fkey 
    FOREIGN KEY (trash_collection_id) REFERENCES public.trash_collection(id) ON DELETE CASCADE,
  CONSTRAINT trash_deliveries_rider_id_fkey 
    FOREIGN KEY (rider_id) REFERENCES public.rider_profiles(id) ON DELETE SET NULL,
  CONSTRAINT trash_deliveries_estate_id_fkey 
    FOREIGN KEY (estate_id) REFERENCES public.estates(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trash_collection_customer_id 
  ON public.trash_collection USING btree (customer_id);

CREATE INDEX IF NOT EXISTS idx_trash_collection_estate_id 
  ON public.trash_collection USING btree (estate_id);

CREATE INDEX IF NOT EXISTS idx_trash_collection_status 
  ON public.trash_collection USING btree (status);

CREATE INDEX IF NOT EXISTS idx_trash_collection_created_at 
  ON public.trash_collection USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_trash_deliveries_trash_collection_id 
  ON public.trash_deliveries USING btree (trash_collection_id);

CREATE INDEX IF NOT EXISTS idx_trash_deliveries_rider_id 
  ON public.trash_deliveries USING btree (rider_id);

CREATE INDEX IF NOT EXISTS idx_trash_deliveries_estate_id 
  ON public.trash_deliveries USING btree (estate_id);

CREATE INDEX IF NOT EXISTS idx_trash_deliveries_status 
  ON public.trash_deliveries USING btree (status);

-- Enable Row Level Security
ALTER TABLE public.trash_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trash_collection
CREATE POLICY "Customers view their own trash collection orders"
  ON public.trash_collection FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers create their own trash collection orders"
  ON public.trash_collection FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers update their own trash collection orders"
  ON public.trash_collection FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins manage all trash collection orders"
  ON public.trash_collection FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for trash_deliveries
CREATE POLICY "Riders view trash deliveries in their estate"
  ON public.trash_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rider_profiles
      WHERE rider_profiles.user_id = auth.uid()
      AND (
        rider_profiles.estate_id = trash_deliveries.estate_id
        OR rider_profiles.id = trash_deliveries.rider_id
      )
    )
  );

CREATE POLICY "Riders update their assigned trash deliveries"
  ON public.trash_deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rider_profiles
      WHERE rider_profiles.id = trash_deliveries.rider_id
      AND rider_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers view trash deliveries for their orders"
  ON public.trash_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trash_collection
      WHERE trash_collection.id = trash_deliveries.trash_collection_id
      AND trash_collection.customer_id = auth.uid()
    )
  );

CREATE POLICY "System can create trash deliveries"
  ON public.trash_deliveries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage all trash deliveries"
  ON public.trash_deliveries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for trash_deliveries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trash_deliveries;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trash_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trash_collection_updated_at
  BEFORE UPDATE ON public.trash_collection
  FOR EACH ROW
  EXECUTE FUNCTION update_trash_collection_updated_at();

CREATE TRIGGER trigger_update_trash_deliveries_updated_at
  BEFORE UPDATE ON public.trash_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_trash_collection_updated_at();

-- Trigger to sync trash_collection status with trash_deliveries status
CREATE OR REPLACE FUNCTION sync_trash_collection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trash_collection status based on trash_deliveries status
  IF NEW.status = 'completed' THEN
    UPDATE public.trash_collection
    SET status = 'completed', completed_at = NOW()
    WHERE id = NEW.trash_collection_id;
  ELSIF NEW.status = 'picked_up' THEN
    UPDATE public.trash_collection
    SET status = 'picked_up'
    WHERE id = NEW.trash_collection_id;
  ELSIF NEW.status = 'assigned' THEN
    UPDATE public.trash_collection
    SET status = 'assigned'
    WHERE id = NEW.trash_collection_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_trash_collection_status
  AFTER UPDATE OF status ON public.trash_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION sync_trash_collection_status();
