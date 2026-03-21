ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS channel_preference text DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS errand_type text,
  ADD COLUMN IF NOT EXISTS location_scope text DEFAULT 'within_estate',
  ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'within_hour',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'general';