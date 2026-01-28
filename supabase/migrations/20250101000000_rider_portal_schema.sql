/*
  # MtaaLoop Rider Portal - Complete Database Schema

  Comprehensive database schema for rider management including profiles,
  vehicles, deliveries, earnings, wallet, settings, and analytics.
*/

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RIDER PROFILES & VEHICLES
-- =====================================================

-- Rider profiles (extends existing rider_profiles)
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Rider vehicles
CREATE TABLE IF NOT EXISTS public.rider_vehicle (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('foot', 'bicycle', 'motorcycle', 'car')),
    make text,
    model text,
    color text,
    reg_no text,
    year integer,
    is_primary boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (status IN ('active', 'available', 'inactive')),
    photo_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Rider vehicle documents
CREATE TABLE IF NOT EXISTS public.rider_vehicle_docs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid REFERENCES public.rider_vehicle(id) ON DELETE CASCADE NOT NULL,
    license_expiry date,
    insurance_expiry date,
    registration_valid boolean DEFAULT true,
    inspection_expiry date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Rider vehicle maintenance
CREATE TABLE IF NOT EXISTS public.rider_vehicle_maintenance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid REFERENCES public.rider_vehicle(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    notes text,
    serviced_at date,
    next_service_at date,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- RIDER STATUS & LOCATION
-- =====================================================

-- Rider status
CREATE TABLE IF NOT EXISTS public.rider_status (
    rider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    online boolean DEFAULT false,
    last_online_at timestamptz DEFAULT now(),
    active_time_seconds integer DEFAULT 0,
    battery_pct integer CHECK (battery_pct >= 0 AND battery_pct <= 100),
    network_strength text CHECK (network_strength IN ('none', 'weak', 'fair', 'good', 'excellent')),
    storage_free_mb integer DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Rider location log
CREATE TABLE IF NOT EXISTS public.rider_location_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    speed_kmh double precision DEFAULT 0,
    heading text,
    altitude_m double precision,
    accuracy_m double precision,
    recorded_at timestamptz DEFAULT now()
);

-- =====================================================
-- DELIVERY ORDERS & OFFERS
-- =====================================================

-- Delivery orders (replaces/extends existing deliveries)
CREATE TABLE IF NOT EXISTS public.delivery_order (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id text UNIQUE NOT NULL,
    vendor_id uuid REFERENCES auth.users(id), -- stub reference
    customer_id uuid REFERENCES auth.users(id), -- stub reference
    rider_id uuid REFERENCES auth.users(id),
    pickup_lat double precision,
    pickup_lng double precision,
    dropoff_lat double precision,
    dropoff_lng double precision,
    pickup_address text NOT NULL,
    dropoff_address text NOT NULL,
    distance_km numeric(10,2),
    value_kes numeric(10,2),
    items_json jsonb,
    package_size text CHECK (package_size IN ('small', 'medium', 'large', 'extra_large')),
    weight_kg numeric(10,2),
    payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
    paid_via text CHECK (paid_via IN ('mpesa', 'cash', 'other')),
    status text DEFAULT 'pending' CHECK (
        status IN ('pending', 'assigned', 'picked', 'enroute', 'delivered', 'canceled')
    ),
    pickup_code text,
    delivery_code text,
    accepted_at timestamptz,
    picked_at timestamptz,
    delivered_at timestamptz,
    canceled_at timestamptz,
    issue_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Delivery offers
CREATE TABLE IF NOT EXISTS public.delivery_offer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.delivery_order(id) ON DELETE CASCADE NOT NULL,
    expires_at timestamptz NOT NULL,
    earnings_base_kes numeric(10,2) NOT NULL,
    earnings_distance_kes numeric(10,2) DEFAULT 0,
    earnings_peak_kes numeric(10,2) DEFAULT 0,
    tip_expected_low numeric(10,2) DEFAULT 0,
    tip_expected_high numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- EARNINGS & WALLET
-- =====================================================

-- Rider earnings
CREATE TABLE IF NOT EXISTS public.rider_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.delivery_order(id) ON DELETE CASCADE NOT NULL,
    base_kes numeric(10,2) NOT NULL,
    distance_kes numeric(10,2) DEFAULT 0,
    peak_kes numeric(10,2) DEFAULT 0,
    tip_kes numeric(10,2) DEFAULT 0,
    total_kes numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Rider wallet
CREATE TABLE IF NOT EXISTS public.rider_wallet (
    rider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_kes numeric(10,2) DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Rider wallet transactions
CREATE TABLE IF NOT EXISTS public.rider_wallet_txn (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('credit', 'debit')),
    amount_kes numeric(10,2) NOT NULL,
    ref text,
    meta jsonb,
    created_at timestamptz DEFAULT now()
);

-- Rider payouts
CREATE TABLE IF NOT EXISTS public.rider_payout (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_kes numeric(10,2) NOT NULL,
    destination text NOT NULL CHECK (destination IN ('mpesa', 'bank')),
    destination_mask text NOT NULL,
    fee_kes numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

-- =====================================================
-- GOALS & REFERRALS
-- =====================================================

-- Rider goals
CREATE TABLE IF NOT EXISTS public.rider_goals (
    rider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    weekly_goal_kes numeric(10,2) DEFAULT 0,
    monthly_goal_kes numeric(10,2) DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Rider referrals
CREATE TABLE IF NOT EXISTS public.rider_referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code text UNIQUE NOT NULL,
    joined_count integer DEFAULT 0,
    earnings_kes numeric(10,2) DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Rider achievements
CREATE TABLE IF NOT EXISTS public.rider_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_key text NOT NULL,
    earned_at timestamptz DEFAULT now(),
    progress_pct numeric(5,2) DEFAULT 100
);

-- =====================================================
-- RATINGS & REVIEWS
-- =====================================================

-- Rider ratings
CREATE TABLE IF NOT EXISTS public.rider_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.delivery_order(id) ON DELETE CASCADE NOT NULL,
    stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
    feedback text,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ZONES & ANALYTICS
-- =====================================================

-- Zone snapshots
CREATE TABLE IF NOT EXISTS public.zone_snapshot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id text NOT NULL,
    demand_level text NOT NULL CHECK (demand_level IN ('none', 'low', 'medium', 'high', 'very_high')),
    orders integer DEFAULT 0,
    avg_earnings_per_hour_kes numeric(10,2) DEFAULT 0,
    active_riders integer DEFAULT 0,
    congestion text CHECK (congestion IN ('low', 'medium', 'high', 'severe')),
    weather jsonb,
    captured_at timestamptz DEFAULT now()
);

-- =====================================================
-- SETTINGS & PREFERENCES
-- =====================================================

-- Rider settings
CREATE TABLE IF NOT EXISTS public.rider_settings (
    rider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    prefs jsonb DEFAULT '{
      "workHours": {"start": "06:00", "end": "22:00"},
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      "serviceRadiusKm": 10,
      "preferredZones": [],
      "notifications": {
        "deliveries": true,
        "earnings": true,
        "performance": true,
        "zone": true,
        "traffic": true,
        "weather": false
      },
      "location": {
        "accuracy": "high",
        "frequency": "balanced",
        "background": true
      },
      "payment": {
        "autoWithdraw": false,
        "withdrawThreshold": 1000,
        "preferredMethod": "mpesa"
      },
      "safety": {
        "emergencyContacts": [],
        "shareLocation": true
      },
      "app": {
        "language": "en",
        "theme": "system",
        "units": "metric",
        "currency": "KES",
        "dataUsage": "unlimited"
      }
    }'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Rider notifications
CREATE TABLE IF NOT EXISTS public.rider_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('delivery', 'earnings', 'system', 'zone', 'safety')),
    title text NOT NULL,
    body text NOT NULL,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Rider vehicle indexes
CREATE INDEX IF NOT EXISTS idx_rider_vehicle_rider ON public.rider_vehicle(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_vehicle_primary ON public.rider_vehicle(rider_id, is_primary) WHERE is_primary = true;

-- Location log indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_rider_location_log_rider_time ON public.rider_location_log(rider_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rider_location_log_time ON public.rider_location_log(recorded_at DESC);

-- Delivery order indexes
CREATE INDEX IF NOT EXISTS idx_delivery_order_rider ON public.delivery_order(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order_status ON public.delivery_order(status);
CREATE INDEX IF NOT EXISTS idx_delivery_order_created ON public.delivery_order(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_order_public_id ON public.delivery_order(public_id);

-- Earnings indexes
CREATE INDEX IF NOT EXISTS idx_rider_earnings_rider ON public.rider_earnings(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_earnings_created ON public.rider_earnings(created_at DESC);

-- Wallet transaction indexes
CREATE INDEX IF NOT EXISTS idx_rider_wallet_txn_rider ON public.rider_wallet_txn(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_wallet_txn_created ON public.rider_wallet_txn(created_at DESC);

-- Zone snapshot indexes
CREATE INDEX IF NOT EXISTS idx_zone_snapshot_zone_time ON public.zone_snapshot(zone_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_snapshot_time ON public.zone_snapshot(captured_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.rider_vehicle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_vehicle_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_location_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_wallet_txn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_payout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_notifications ENABLE ROW LEVEL SECURITY;

-- Rider vehicle policies
CREATE POLICY "Riders manage own vehicles"
    ON public.rider_vehicle FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider vehicle docs policies
CREATE POLICY "Riders manage vehicle docs"
    ON public.rider_vehicle_docs FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.rider_vehicle
        WHERE rider_vehicle.id = rider_vehicle_docs.vehicle_id
        AND rider_vehicle.rider_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.rider_vehicle
        WHERE rider_vehicle.id = rider_vehicle_docs.vehicle_id
        AND rider_vehicle.rider_id = auth.uid()
    ));

-- Rider status policies
CREATE POLICY "Riders manage own status"
    ON public.rider_status FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider location log policies
CREATE POLICY "Riders manage own location logs"
    ON public.rider_location_log FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Delivery order policies
CREATE POLICY "Riders view assigned orders"
    ON public.delivery_order FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

CREATE POLICY "Riders update assigned orders"
    ON public.delivery_order FOR UPDATE
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Delivery offer policies
CREATE POLICY "Riders view offers for assigned orders"
    ON public.delivery_offer FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.delivery_order
        WHERE delivery_order.id = delivery_offer.order_id
        AND delivery_order.rider_id = auth.uid()
    ));

-- Rider earnings policies
CREATE POLICY "Riders view own earnings"
    ON public.rider_earnings FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

-- Rider wallet policies
CREATE POLICY "Riders manage own wallet"
    ON public.rider_wallet FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider wallet transactions policies
CREATE POLICY "Riders view own wallet transactions"
    ON public.rider_wallet_txn FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

-- Rider payout policies
CREATE POLICY "Riders manage own payouts"
    ON public.rider_payout FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider goals policies
CREATE POLICY "Riders manage own goals"
    ON public.rider_goals FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider referrals policies
CREATE POLICY "Riders manage own referrals"
    ON public.rider_referrals FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider achievements policies
CREATE POLICY "Riders view own achievements"
    ON public.rider_achievements FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

-- Rider ratings policies
CREATE POLICY "Riders view own ratings"
    ON public.rider_ratings FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

-- Zone snapshot policies (public read access)
CREATE POLICY "Anyone can view zone snapshots"
    ON public.zone_snapshot FOR SELECT
    TO authenticated
    USING (true);

-- Rider settings policies
CREATE POLICY "Riders manage own settings"
    ON public.rider_settings FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- Rider notifications policies
CREATE POLICY "Riders manage own notifications"
    ON public.rider_notifications FOR ALL
    TO authenticated
    USING (auth.uid() = rider_id)
    WITH CHECK (auth.uid() = rider_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_rider_vehicle_ts BEFORE UPDATE ON public.rider_vehicle FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_vehicle_docs_ts BEFORE UPDATE ON public.rider_vehicle_docs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_status_ts BEFORE UPDATE ON public.rider_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_order_ts BEFORE UPDATE ON public.delivery_order FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_wallet_ts BEFORE UPDATE ON public.rider_wallet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_settings_ts BEFORE UPDATE ON public.rider_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate public_id for delivery orders
CREATE OR REPLACE FUNCTION public.generate_delivery_public_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_id IS NULL THEN
        NEW.public_id := 'DL-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_delivery_public_id_trigger
    BEFORE INSERT ON public.delivery_order
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_delivery_public_id();

-- Function to update rider wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'credit' THEN
            UPDATE public.rider_wallet
            SET balance_kes = balance_kes + NEW.amount_kes, updated_at = now()
            WHERE rider_id = NEW.rider_id;
        ELSIF NEW.type = 'debit' THEN
            UPDATE public.rider_wallet
            SET balance_kes = balance_kes - NEW.amount_kes, updated_at = now()
            WHERE rider_id = NEW.rider_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_balance_trigger
    AFTER INSERT ON public.rider_wallet_txn
    FOR EACH ROW
    EXECUTE FUNCTION public.update_wallet_balance();
