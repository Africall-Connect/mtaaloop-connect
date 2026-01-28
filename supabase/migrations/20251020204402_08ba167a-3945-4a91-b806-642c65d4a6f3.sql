-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'estate_manager', 'rider', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create estates table
CREATE TABLE public.estates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    location text NOT NULL,
    county text NOT NULL,
    address text NOT NULL,
    total_units integer NOT NULL,
    manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    manager_name text NOT NULL,
    manager_phone text NOT NULL,
    manager_email text NOT NULL,
    is_approved boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estate managers manage own estate"
ON public.estates
FOR ALL
TO authenticated
USING (auth.uid() = manager_id)
WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Anyone can view approved estates"
ON public.estates
FOR SELECT
TO authenticated
USING (is_approved = true AND is_active = true);

-- Create vendor_profiles table
CREATE TABLE public.vendor_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_name text NOT NULL,
    business_type text NOT NULL,
    business_description text,
    business_phone text NOT NULL,
    business_email text,
    business_address text NOT NULL,
    logo_url text,
    banner_url text,
    slug text UNIQUE NOT NULL,
    is_approved boolean DEFAULT false,
    is_active boolean DEFAULT true,
    estate_id uuid REFERENCES public.estates(id),
    rating decimal(3,2) DEFAULT 0.0,
    total_orders integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own profile"
ON public.vendor_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved vendors"
ON public.vendor_profiles
FOR SELECT
TO authenticated
USING (is_approved = true AND is_active = true);

-- Create rider_profiles table
CREATE TABLE public.rider_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    id_number text NOT NULL,
    vehicle_type text NOT NULL CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car')),
    vehicle_registration text,
    license_number text,
    estate_id uuid REFERENCES public.estates(id),
    is_approved boolean DEFAULT false,
    is_active boolean DEFAULT true,
    rating decimal(3,2) DEFAULT 0.0,
    total_deliveries integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage own profile"
ON public.rider_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all riders"
ON public.rider_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_estates_updated_at
    BEFORE UPDATE ON public.estates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_profiles_updated_at
    BEFORE UPDATE ON public.vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rider_profiles_updated_at
    BEFORE UPDATE ON public.rider_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();