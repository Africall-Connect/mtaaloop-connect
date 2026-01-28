-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    date_of_birth date,
    gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    dietary_preferences text[], -- e.g., ['vegetarian', 'halal', 'gluten_free']
    allergens text[], -- e.g., ['peanuts', 'dairy', 'shellfish']
    preferred_language text DEFAULT 'en',
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    loyalty_points integer DEFAULT 0,
    total_orders integer DEFAULT 0,
    total_spent decimal(10,2) DEFAULT 0,
    average_rating decimal(3,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
ON public.customer_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.customer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.customer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON public.customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.customer_profiles (user_id, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Comments
COMMENT ON TABLE public.customer_profiles IS 'Extended customer profile information';
COMMENT ON COLUMN public.customer_profiles.dietary_preferences IS 'Array of dietary preferences like vegetarian, vegan, halal, kosher, etc.';
COMMENT ON COLUMN public.customer_profiles.allergens IS 'Array of allergens to avoid in food orders';
COMMENT ON COLUMN public.customer_profiles.loyalty_points IS 'Accumulated loyalty points from orders';
