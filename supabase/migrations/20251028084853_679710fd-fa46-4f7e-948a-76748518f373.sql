-- Create a function to handle new vendor signups
CREATE OR REPLACE FUNCTION public.handle_new_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert vendor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'vendor'::app_role);
  RETURN NEW;
END;
$$;

-- Create a trigger for vendor_profiles
CREATE TRIGGER on_vendor_profile_created
  AFTER INSERT ON public.vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_vendor();

-- Create a function to handle new rider signups
CREATE OR REPLACE FUNCTION public.handle_new_rider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert rider role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'rider'::app_role);
  RETURN NEW;
END;
$$;

-- Create a trigger for rider_profiles
CREATE TRIGGER on_rider_profile_created
  AFTER INSERT ON public.rider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_rider();

-- Create a function to handle new estate manager signups
CREATE OR REPLACE FUNCTION public.handle_new_estate_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert estate_manager role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.manager_id, 'estate_manager'::app_role);
  RETURN NEW;
END;
$$;

-- Create a trigger for estates
CREATE TRIGGER on_estate_created
  AFTER INSERT ON public.estates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_estate_manager();