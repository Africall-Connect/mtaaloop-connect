-- MtaaLoop Simplified Management Database Schema
-- This schema focuses on business types, products/services, and categories
-- WITHOUT vendor-specific tables (for management pages only)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CORE TABLES
-- ===========================================

-- 1. Business Types
CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'mart', 'salon', 'plumber', etc.
  display_name TEXT NOT NULL, -- 'Grocery Store', 'Beauty Salon', etc.
  business_model TEXT NOT NULL DEFAULT 'product' CHECK (business_model IN ('product', 'service', 'hybrid')),
  icon TEXT,
  description TEXT,
  requires_booking BOOLEAN DEFAULT false,
  supports_delivery BOOLEAN DEFAULT true,
  supports_inventory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Product Categories (tied to business types)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_type_id, name)
);

-- 3. Products/Services (unified table tied to business types)
CREATE TABLE products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service', 'package')),

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  unit TEXT DEFAULT 'unit', -- 'kg', 'liter', 'piece', 'hour', 'session', etc.

  -- Inventory (for products)
  stock_quantity INTEGER,
  low_stock_threshold INTEGER DEFAULT 10,
  track_inventory BOOLEAN DEFAULT true,

  -- Service-specific fields
  duration_minutes INTEGER, -- For services
  requires_booking BOOLEAN DEFAULT false,
  max_capacity INTEGER, -- For services with limited slots

  -- Media
  images JSONB DEFAULT '[]', -- Array of image URLs
  image_url TEXT, -- Primary image

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

-- 4. Product Attributes (for flexible product/service properties)
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL, -- 'brand', 'size', 'color', 'alcohol_content', etc.
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_service_id, attribute_name)
);

-- 5. Product Variants (for size, color variations, etc.)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID REFERENCES products_services(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Small', 'Medium', 'Large', 'Red', 'Blue', etc.
  variant_type TEXT NOT NULL, -- 'size', 'color', 'flavor', etc.
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Additional cost for this variant
  stock_quantity INTEGER,
  sku TEXT, -- Stock Keeping Unit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_products_services_business_type ON products_services(business_type_id);
CREATE INDEX idx_products_services_category ON products_services(category_id);
CREATE INDEX idx_products_services_active ON products_services(is_active) WHERE is_active = true;
CREATE INDEX idx_product_categories_business_type ON product_categories(business_type_id);
CREATE INDEX idx_product_attributes_product ON product_attributes(product_service_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_service_id);

-- Full-text search index
CREATE INDEX idx_products_services_search ON products_services USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ===========================================
-- SEED DATA - BUSINESS TYPES
-- ===========================================

INSERT INTO business_types (name, display_name, business_model, requires_booking, supports_delivery, supports_inventory) VALUES
-- Product-based businesses
('mart', 'MtaaLoop Grocery Store', 'product', false, true, true),
('liquor_store', 'MtaaLoop Liquor Store', 'product', false, true, true),
('pharmacy', 'MtaaLoop Pharmacy', 'product', false, true, true),
('butchery', 'MtaaLoop Butchery', 'product', false, true, true),
('hardware', 'MtaaLoop Hardware Store', 'product', false, true, true),
('electronics', 'MtaaLoop Electronics Store', 'product', false, true, true),
('stationery', 'MtaaLoop Stationery Store', 'product', false, true, true),
('pet_store', 'MtaaLoop Pet Store', 'product', false, true, true),
('gas_station', 'MtaaLoop Gas Station', 'product', false, false, true),
('water_station', 'MtaaLoop Water Station', 'product', false, false, true),
('baby_shop', 'MtaaLoop Baby Shop', 'product', false, true, true),
('boutique', 'MtaaLoop Boutique', 'product', false, true, true),
('furniture_store', 'MtaaLoop Furniture Store', 'product', false, true, true),
('greengrocery', 'MtaaLoop Greengrocery', 'product', false, true, true),

-- Service-based businesses
('salon', 'MtaaLoop Beauty Salon', 'service', true, false, false),
('barbershop', 'MtaaLoop Barbershop', 'service', true, false, false),
('spa', 'MtaaLoop Spa', 'service', true, false, false),
('gym', 'MtaaLoop Gym', 'service', true, false, false),
('car_wash', 'MtaaLoop Car Wash', 'service', false, false, false),
('plumber', 'MtaaLoop Plumbing Services', 'service', true, false, false),
('electrician', 'MtaaLoop Electrical Services', 'service', true, false, false),
('mechanic', 'MtaaLoop Auto Repair', 'service', true, false, false),
('tutor', 'MtaaLoop Tutoring Services', 'service', true, false, false),
('daycare', 'MtaaLoop Daycare', 'service', true, false, false),
('event_planner', 'MtaaLoop Event Planning', 'service', true, false, false),
('cleaning_service', 'MtaaLoop Cleaning Services', 'service', true, false, false),
('pest_control', 'MtaaLoop Pest Control', 'service', true, false, false),
('locksmith', 'MtaaLoop Locksmith Services', 'service', true, false, false),
('courier', 'MtaaLoop Courier Services', 'service', false, true, false),
('tailor', 'MtaaLoop Tailoring Services', 'service', true, true, false),
('dry_cleaner', 'MtaaLoop Dry Cleaning', 'service', false, true, false),
('cybercafe', 'MtaaLoop Cybercafe', 'service', false, false, false),
('mobile_money', 'MtaaLoop Mobile Money Agent', 'service', false, false, false),
('dental_clinic', 'MtaaLoop Dental Clinic', 'service', true, false, false),
('laundry', 'MtaaLoop Laundromat', 'service', false, true, false),

-- Hybrid businesses (both products and services)
('restaurant', 'MtaaLoop Restaurant', 'hybrid', false, true, true),
('bakery', 'MtaaLoop Bakery', 'hybrid', false, true, true),
('caterer', 'MtaaLoop Catering Services', 'hybrid', true, true, true),
('florist', 'MtaaLoop Florist', 'hybrid', false, true, true),
('optical_shop', 'MtaaLoop Optical Shop', 'hybrid', true, true, true);

-- ===========================================
-- SEED DATA - CATEGORIES FOR EACH BUSINESS TYPE
-- ===========================================

-- Mart categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'mart'), 'Produce', 1),
((SELECT id FROM business_types WHERE name = 'mart'), 'Dairy', 2),
((SELECT id FROM business_types WHERE name = 'mart'), 'Household', 3),
((SELECT id FROM business_types WHERE name = 'mart'), 'Beverages', 4),
((SELECT id FROM business_types WHERE name = 'mart'), 'Snacks', 5);

-- Liquor Store categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'liquor_store'), 'Beer', 1),
((SELECT id FROM business_types WHERE name = 'liquor_store'), 'Wine', 2),
((SELECT id FROM business_types WHERE name = 'liquor_store'), 'Spirits', 3),
((SELECT id FROM business_types WHERE name = 'liquor_store'), 'Mixers', 4);

-- Pharmacy categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'pharmacy'), 'Medicines', 1),
((SELECT id FROM business_types WHERE name = 'pharmacy'), 'Supplements', 2),
((SELECT id FROM business_types WHERE name = 'pharmacy'), 'First Aid', 3),
((SELECT id FROM business_types WHERE name = 'pharmacy'), 'Personal Care', 4);

-- Restaurant categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Main Course', 1),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Beverages', 2),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Desserts', 3),
((SELECT id FROM business_types WHERE name = 'restaurant'), 'Appetizers', 4);

-- Salon categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'salon'), 'Hair Services', 1),
((SELECT id FROM business_types WHERE name = 'salon'), 'Nail Services', 2),
((SELECT id FROM business_types WHERE name = 'salon'), 'Makeup', 3),
((SELECT id FROM business_types WHERE name = 'salon'), 'Spa Treatments', 4);

-- Plumber categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'plumber'), 'Repairs', 1),
((SELECT id FROM business_types WHERE name = 'plumber'), 'Installation', 2),
((SELECT id FROM business_types WHERE name = 'plumber'), 'Maintenance', 3),
((SELECT id FROM business_types WHERE name = 'plumber'), 'Emergency Service', 4);

-- Hardware categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'hardware'), 'Tools', 1),
((SELECT id FROM business_types WHERE name = 'hardware'), 'Building Materials', 2),
((SELECT id FROM business_types WHERE name = 'hardware'), 'Plumbing', 3),
((SELECT id FROM business_types WHERE name = 'hardware'), 'Electrical', 4),
((SELECT id FROM business_types WHERE name = 'hardware'), 'Paint', 5);

-- Butchery categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'butchery'), 'Beef', 1),
((SELECT id FROM business_types WHERE name = 'butchery'), 'Chicken', 2),
((SELECT id FROM business_types WHERE name = 'butchery'), 'Pork', 3),
((SELECT id FROM business_types WHERE name = 'butchery'), 'Goat', 4),
((SELECT id FROM business_types WHERE name = 'butchery'), 'Processed Meats', 5);

-- Bakery categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'bakery'), 'Bread', 1),
((SELECT id FROM business_types WHERE name = 'bakery'), 'Cakes', 2),
((SELECT id FROM business_types WHERE name = 'bakery'), 'Pastries', 3),
((SELECT id FROM business_types WHERE name = 'bakery'), 'Cookies', 4);

-- Electronics categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'electronics'), 'Phones', 1),
((SELECT id FROM business_types WHERE name = 'electronics'), 'Computers', 2),
((SELECT id FROM business_types WHERE name = 'electronics'), 'Accessories', 3),
((SELECT id FROM business_types WHERE name = 'electronics'), 'Home Appliances', 4);

-- Gym categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'gym'), 'Membership', 1),
((SELECT id FROM business_types WHERE name = 'gym'), 'Personal Training', 2),
((SELECT id FROM business_types WHERE name = 'gym'), 'Group Classes', 3),
((SELECT id FROM business_types WHERE name = 'gym'), 'Day Pass', 4);

-- Car Wash categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'car_wash'), 'Exterior Wash', 1),
((SELECT id FROM business_types WHERE name = 'car_wash'), 'Interior Cleaning', 2),
((SELECT id FROM business_types WHERE name = 'car_wash'), 'Full Service', 3),
((SELECT id FROM business_types WHERE name = 'car_wash'), 'Detailing', 4);

-- Laundry categories
INSERT INTO product_categories (business_type_id, name, sort_order) VALUES
((SELECT id FROM business_types WHERE name = 'laundry'), 'Wash & Fold', 1),
((SELECT id FROM business_types WHERE name = 'laundry'), 'Dry Cleaning', 2),
((SELECT id FROM business_types WHERE name = 'laundry'), 'Ironing', 3),
((SELECT id FROM business_types WHERE name = 'laundry'), 'Bedding', 4);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger
CREATE TRIGGER update_products_services_updated_at 
BEFORE UPDATE ON products_services 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on tables
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access (customize based on your needs)
CREATE POLICY "Allow public read access to business_types" ON business_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access to product_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to products_services" ON products_services FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage products (using proper Supabase auth functions)
CREATE POLICY "Allow authenticated users to insert products" ON products_services FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update products" ON products_services FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete products" ON products_services FOR DELETE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage categories
CREATE POLICY "Allow authenticated users to insert categories" ON product_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update categories" ON product_categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete categories" ON product_categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage attributes and variants
CREATE POLICY "Allow authenticated users to insert attributes" ON product_attributes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update attributes" ON product_attributes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete attributes" ON product_attributes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert variants" ON product_variants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update variants" ON product_variants FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete variants" ON product_variants FOR DELETE USING (auth.uid() IS NOT NULL);

COMMIT;
