-- Add vendor signature and application date to vendor_profiles
ALTER TABLE public.vendor_profiles
  ADD COLUMN vendor_signature text,
  ADD COLUMN application_date date;
