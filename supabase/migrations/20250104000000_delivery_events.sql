-- Create delivery_events table for tracking delivery status changes
CREATE TABLE IF NOT EXISTS public.delivery_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid REFERENCES public.delivery_order(id) ON DELETE CASCADE NOT NULL,
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status_from text,
    status_to text NOT NULL,
    notes text,
    location_lat double precision,
    location_lng double precision,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Riders view own delivery events"
    ON public.delivery_events FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

CREATE POLICY "Riders create delivery events"
    ON public.delivery_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = rider_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery ON public.delivery_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_rider ON public.delivery_events(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_created ON public.delivery_events(created_at DESC);
