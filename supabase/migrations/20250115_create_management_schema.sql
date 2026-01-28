-- MtaaLoop Management Database Schema Migration
-- Run this in Supabase SQL Editor to create all management tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CORE BUSINESS TABLES
-- ===========================================

-- 1. Business Types
CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  business_model TEXT NOT NULL DEFAULT 'product' CHECK (business_model IN ('product', 'service', 'hybrid')),
  icon TEXT,
  description TEXT,
  requires_booking BOOLEAN DEFAULT false,
  supports_delivery BOOLEAN DEFAULT true,
  supports_inventory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type_id UUID REFERENCES business_types(id),
  description TEXT,
  location TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  operating_hours JSONB,
  delivery_zones JSONB,
  delivery_radius_km INTEGER DEFAULT 5,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Vendor Staff
CREATE TABLE vendor_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, user_id)
);

-- ===========================================
-- PRODUCTS & SERVICES TABLES
-- ===========================================

-- 4. Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_type_id, name)
);

-- 5. Products Services (Unified table)
CREATE TABLE products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service', 'package')),

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  unit TEXT DEFAULT 'unit',

  -- Inventory (for products)
  stock_quantity INTEGER,
  low_stock_threshold INTEGER DEFAULT 10,
  track_inventory BOOLEAN DEFAULT true,

  -- Service-specific fields
  duration_minutes INTEGER,
  requires_booking BOOLEAN DEFAULT false,
  max_capacity INTEGER,
  preparation_time_minutes INTEGER DEFAULT 0,

  -- Media
  images JSONB DEFAULT '[]',
  video_url TEXT,

  -- Status & Visibility
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'discontinued')),

  -- Analytics
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Product Attributes
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_type TEXT DEFAULT 'text' CHECK (attribute_type IN ('text', 'number', 'boolean', 'json')),
  is_filterable BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_service_id, attribute_name)
);

-- 7. Product Variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER,
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Product Packages
CREATE TABLE product_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  item_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (package_id != item_id)
);

-- ===========================================
-- ORDER MANAGEMENT TABLES
-- ===========================================

-- 9. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES vendors(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Order details
  order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup', 'in_store')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Delivery/Pickup details
  delivery_address JSONB,
  delivery_instructions TEXT,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,

  -- Service booking
  booking_date TIMESTAMP WITH TIME ZONE,
  booking_duration_minutes INTEGER,

  -- Metadata
  source TEXT DEFAULT 'app' CHECK (source IN ('app', 'website', 'phone', 'walk_in')),
  notes TEXT,
  cancelled_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_service_id UUID REFERENCES products_services(id),
  variant_id UUID REFERENCES product_variants(id),

  -- Item details
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'package')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Customizations
  special_instructions TEXT,
  selected_attributes JSONB,

  -- Service-specific
  booking_date TIMESTAMP WITH TIME ZONE,
  staff_assigned UUID REFERENCES vendor_staff(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Order Status History
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- FINANCIAL MANAGEMENT TABLES
-- ===========================================

-- 12. Financial Transactions
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'refund', 'payout', 'fee', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',

  -- Payment details
  payment_method TEXT CHECK (payment_method IN ('mpesa', 'card', 'cash', 'bank_transfer')),
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),

  -- Payout details
  payout_id UUID,
  payout_date TIMESTAMP WITH TIME ZONE,

  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Vendor Payouts
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  payout_reference TEXT UNIQUE NOT NULL,

  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  total_sales DECIMAL(10,2) NOT NULL,
  total_fees DECIMAL(10,2) NOT NULL,
  total_refunds DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,

  payout_method TEXT NOT NULL CHECK (payout_method IN ('mpesa', 'bank_transfer')),
  payout_details JSONB,
  payout_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- CUSTOMER MANAGEMENT TABLES
-- ===========================================

-- 14. Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_language TEXT DEFAULT 'en',

  -- Customer analytics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,

  -- Preferences
  favorite_categories JSONB DEFAULT '[]',
  dietary_restrictions JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_vip BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(vendor_id, phone),
  UNIQUE(vendor_id, email)
);

-- 15. Customer Addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Kenya',

  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ANALYTICS & REPORTING TABLES
-- ===========================================

-- 16. Vendor Analytics
CREATE TABLE vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Sales metrics
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,

  -- Product performance
  top_products JSONB DEFAULT '[]',

  -- Customer metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,

  -- Operational metrics
  average_delivery_time_minutes INTEGER,
  order_completion_rate DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, date)
);

-- 17. Product Analytics
CREATE TABLE product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  views INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_service_id, date)
);

-- ===========================================
-- INVENTORY MANAGEMENT TABLES
-- ===========================================

-- 18. Inventory Transactions
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,

  reference_type TEXT CHECK (reference_type IN ('order', 'purchase', 'adjustment', 'return')),
  reference_id UUID,

  reason TEXT,
  notes TEXT,

  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  order_number TEXT UNIQUE,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,

  expected_delivery_date DATE,
  actual_delivery_date DATE,

  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Purchase Order Items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_service_id UUID REFERENCES products_services(id),

  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,

  received_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Core business indexes
CREATE INDEX idx_vendors_business_type ON vendors(business_type_id);
CREATE INDEX idx_vendors_user ON vendors(user_id);
CREATE INDEX idx_products_services_vendor ON products_services(vendor_id);
CREATE INDEX idx_products_services_category ON products_services(category_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_customers_vendor ON customers(vendor_id);

-- Performance indexes
CREATE INDEX idx_products_services_active ON products_services(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_vendor_analytics_date ON vendor_analytics(date);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_service_id);

-- Full-text search indexes
CREATE INDEX idx_products_services_search ON products_services USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_vendors_search ON vendors USING gin(to_tsvector('english', business_name || ' ' || description));

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert business types
INSERT INTO business_types (name, display_name, business_model, requires_booking, supports_delivery, supports_inventory) VALUES
('mart', 'Grocery Store', 'product', false, true, true),
('liquor_store', 'Liquor Store', 'product', false, true, true),
('pharmacy', 'Pharmacy', 'product', false, true, true),
('restaurant', 'Restaurant', 'hybrid', false, true, true),
('butchery', 'Butchery', 'product', false, true, true),
('bakery', 'Bakery', 'hybrid', false, true, true),
('greengrocery', 'Greengrocery', 'product', false, true, true),
('salon', 'Beauty Salon', 'service', true, false, false),
('barbershop', 'Barbershop', 'service', true, false, false),
('spa', 'Spa', 'service', true, false, false),
('gym', 'Gym', 'service', true, false, false),
('car_wash', 'Car Wash', 'service', false, false, false),
('plumber', 'Plumbing Services', 'service', true, false, false),
('electrician', 'Electrical Services', 'service', true, false, false),
('mechanic', 'Auto Repair', 'service', true, false, false),
('tutor', 'Tutoring Services', 'service', true, false, false),
('daycare', 'Daycare', 'service', true, false, false),
('caterer', 'Catering Services', 'service', true, true, true),
('event_planner', 'Event Planning', 'service', true, false, false),
('cleaning_service', 'Cleaning Services', 'service', true, false, false),
('pest_control', 'Pest Control', 'service', true, false, false),
('locksmith', 'Locksmith Services', 'service', true, false, false),
('courier', 'Courier Services', 'service', false, true, false),
('hardware', 'Hardware Store', 'product', false, true, true),
('electronics', 'Electronics Store', 'product', false, true, true),
('stationery', 'Stationery Store', 'product', false, true, true),
('pet_store', 'Pet Store', 'product', false, true, true),
('gas_station', 'Gas Station', 'product', false, false, true),
('tailor', 'Tailoring Services', 'service', true, true, false),
('dry_cleaner', 'Dry Cleaning', 'service', false, true, false),
('cybercafe', 'Cybercafe', 'service', false, false, false),
('mobile_money', 'Mobile Money Agent', 'service', false, false, false),
('water_station', 'Water Station', 'product', false, false, true),
('optician', 'Optical Shop', 'hybrid', true, true, true),
('dental_clinic', 'Dental Clinic', 'service', true, false, false),
('baby_shop', 'Baby Shop', 'product', false, true, true),
('boutique', 'Boutique', 'product', false, true, true),
('furniture_store', 'Furniture Store', 'product', false, true, true),
('florist', 'Florist', 'hybrid', false, true, true);

-- Insert sample categories for different business types
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
-- Mart categories
((SELECT id FROM business_types WHERE name = 'mart'), 'Produce', 1),
((SELECT id FROM business_types WHERE name = 'mart'), 'Dairy', 2),
((SELECT id FROM business_types WHERE name = 'mart'), 'Household', 3),
((SELECT id FROM business_types WHERE name = 'mart'), 'Beverages', 4),

-- Salon categories
((SELECT id FROM business_types WHERE name = 'salon'), 'Hair', 1),
((SELECT id FROM business_types WHERE name = 'salon'), 'Nails', 2),
((SELECT id FROM business_types WHERE name = 'salon'), 'Makeup', 3),
((SELECT id FROM business_types WHERE name = 'salon'), 'Spa', 4),

-- Restaurant categories
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Main Course', 1),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Beverages', 2),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Desserts', 3),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Snacks', 4);

-- ===========================================
-- TRIGGERS FOR DATA INTEGRITY
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_payouts_updated_at BEFORE UPDATE ON vendor_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                       LPAD(CAST((SELECT COUNT(*) + 1 FROM orders
                                WHERE DATE(created_at) = CURRENT_DATE) AS TEXT), 3, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply order number generation trigger
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to update product analytics
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_orders and total_revenue in products_services
    UPDATE products_services
    SET
        total_orders = (SELECT COUNT(*) FROM order_items WHERE product_service_id = NEW.product_service_id),
        total_revenue = (SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE product_service_id = NEW.product_service_id)
    WHERE id = NEW.product_service_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply product analytics trigger
CREATE TRIGGER update_product_analytics_trigger AFTER INSERT OR UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_product_analytics();

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these should be customized based on your auth requirements)
-- Vendors can only see their own data
CREATE POLICY "Vendors can view own data" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors can update own data" ON vendors FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies should be created for other tables based on your access control requirements

COMMIT;
