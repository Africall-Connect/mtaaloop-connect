-- Add rejection reason columns to profile tables
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.estates 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.rider_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create approval workflow functions
CREATE OR REPLACE FUNCTION public.approve_vendor(vendor_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_profiles
  SET is_approved = true, updated_at = now()
  WHERE id = vendor_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_vendor(vendor_profile_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_profiles
  SET is_approved = false, rejection_reason = reason, updated_at = now()
  WHERE id = vendor_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_estate(estate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE estates
  SET is_approved = true, updated_at = now()
  WHERE id = estate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_estate(estate_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE estates
  SET is_approved = false, rejection_reason = reason, updated_at = now()
  WHERE id = estate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_rider(rider_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rider_profiles
  SET is_approved = true, updated_at = now()
  WHERE id = rider_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_rider(rider_profile_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rider_profiles
  SET is_approved = false, rejection_reason = reason, updated_at = now()
  WHERE id = rider_profile_id;
END;
$$;

-- Update RLS policies to allow admins to view and manage all records
CREATE POLICY "Admins view all vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all vendor profiles"
ON public.vendor_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all estates"
ON public.estates
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all estates"
ON public.estates
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all rider profiles"
ON public.rider_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all rider profiles"
ON public.rider_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));