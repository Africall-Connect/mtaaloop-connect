-- Enhance estates table with comprehensive fields from MtaaLoop documentation

-- Add estate type enum
CREATE TYPE public.estate_type AS ENUM (
  'apartment_complex',
  'gated_community',
  'residential_estate',
  'mixed_use_development',
  'townhouse_complex',
  'condominiums'
);

-- Add vendor approval enum
CREATE TYPE public.vendor_approval_type AS ENUM (
  'auto_approve',
  'manual_approve',
  'hybrid'
);

-- Add new columns to estates table
ALTER TABLE public.estates
  ADD COLUMN IF NOT EXISTS estate_type estate_type DEFAULT 'apartment_complex',
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS manager_alt_phone text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS latitude decimal(10,8),
  ADD COLUMN IF NOT EXISTS longitude decimal(11,8),
  
  -- Management Details
  ADD COLUMN IF NOT EXISTS management_company text,
  ADD COLUMN IF NOT EXISTS company_registration_number text,
  ADD COLUMN IF NOT EXISTS years_managing integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS office_location text,
  ADD COLUMN IF NOT EXISTS office_hours jsonb DEFAULT '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "9:00-13:00", "sunday": "closed"}'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT ARRAY[]::text[],
  
  -- Documentation
  ADD COLUMN IF NOT EXISTS registration_docs text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS authorization_letter text,
  ADD COLUMN IF NOT EXISTS manager_id_copy text,
  ADD COLUMN IF NOT EXISTS estate_photos text[] DEFAULT ARRAY[]::text[],
  
  -- Platform Settings
  ADD COLUMN IF NOT EXISTS vendor_approval_setting vendor_approval_type DEFAULT 'manual_approve',
  ADD COLUMN IF NOT EXISTS allowed_service_categories text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS delivery_zones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '{"start": "06:00", "end": "23:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_fee_settings jsonb DEFAULT '{"base_fee": 50, "per_km": 20}'::jsonb,
  
  -- Additional metadata
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS active_vendors_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_residents_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create user_preferences table for customer apartment selections
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL,
    apartment_name text,
    building_name text,
    floor_number text,
    unit_number text,
    house_name text,
    phase text,
    extra_directions text,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
ON public.user_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create delivery_addresses table for multiple addresses
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL,
    address_type text NOT NULL CHECK (address_type IN ('home', 'work', 'other')),
    label text NOT NULL,
    building_name text,
    floor_number text,
    unit_number text,
    additional_directions text,
    latitude decimal(10,8),
    longitude decimal(11,8),
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
ON public.delivery_addresses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_delivery_addresses_updated_at
    BEFORE UPDATE ON public.delivery_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create estate_analytics table for dashboard metrics
CREATE TABLE IF NOT EXISTS public.estate_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estate_id uuid REFERENCES public.estates(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    total_orders integer DEFAULT 0,
    total_revenue decimal(10,2) DEFAULT 0,
    active_vendors integer DEFAULT 0,
    active_residents integer DEFAULT 0,
    new_residents integer DEFAULT 0,
    average_delivery_time integer DEFAULT 0, -- in minutes
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (estate_id, date)
);

ALTER TABLE public.estate_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estate managers view own analytics"
ON public.estate_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.estates
    WHERE estates.id = estate_analytics.estate_id
    AND estates.manager_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_estates_approved ON public.estates(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_estates_location ON public.estates(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_estates_manager ON public.estates(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_estate ON public.user_preferences(estate_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user ON public.delivery_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_estate ON public.delivery_addresses(estate_id);
CREATE INDEX IF NOT EXISTS idx_estate_analytics_estate_date ON public.estate_analytics(estate_id, date);

-- Add comments for documentation
COMMENT ON TABLE public.estates IS 'Stores complete estate/property information for MtaaLoop platform';
COMMENT ON TABLE public.user_preferences IS 'Stores customer apartment/unit selection within estates';
COMMENT ON TABLE public.delivery_addresses IS 'Stores multiple delivery addresses per user';
COMMENT ON TABLE public.estate_analytics IS 'Stores daily analytics metrics for estate managers';
