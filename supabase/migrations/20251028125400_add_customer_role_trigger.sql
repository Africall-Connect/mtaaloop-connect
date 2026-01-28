/*
  # Add automatic customer role assignment
  
  ## Changes
  - Create a trigger to automatically assign 'customer' role to new users
  - This ensures all new signups get the default 'customer' role
  
  ## Security
  - Uses SECURITY DEFINER to bypass RLS during role insertion
  - Only triggers on new auth.users creation
*/

-- Create a function to handle new user signups (customer role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert customer role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If role already exists, that's fine
    RETURN NEW;
END;
$$;

-- Create a trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
