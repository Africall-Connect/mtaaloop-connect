-- Create vendor_categories table
CREATE TABLE IF NOT EXISTS vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Could store icon name or URL
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique category names per vendor
  CONSTRAINT unique_vendor_category UNIQUE (vendor_id, name),
  CONSTRAINT unique_vendor_category_slug UNIQUE (vendor_id, slug)
);

-- Create vendor_subcategories table
CREATE TABLE IF NOT EXISTS vendor_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES vendor_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique subcategory names per vendor and category
  CONSTRAINT unique_vendor_subcategory UNIQUE (vendor_id, category_id, name),
  CONSTRAINT unique_vendor_subcategory_slug UNIQUE (vendor_id, slug)
);

-- Create indexes for better query performance
CREATE INDEX idx_vendor_categories_vendor_id ON vendor_categories(vendor_id);
CREATE INDEX idx_vendor_categories_is_active ON vendor_categories(is_active);
CREATE INDEX idx_vendor_subcategories_vendor_id ON vendor_subcategories(vendor_id);
CREATE INDEX idx_vendor_subcategories_category_id ON vendor_subcategories(category_id);
CREATE INDEX idx_vendor_subcategories_is_active ON vendor_subcategories(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_categories_updated_at
  BEFORE UPDATE ON vendor_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_subcategories_updated_at
  BEFORE UPDATE ON vendor_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_categories
-- Allow public read access to active categories
CREATE POLICY "Public can view active vendor categories"
  ON vendor_categories FOR SELECT
  USING (is_active = true);

-- Allow vendors to manage their own categories
CREATE POLICY "Vendors can insert their own categories"
  ON vendor_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
      AND is_approved = true
    )
  );

CREATE POLICY "Vendors can update their own categories"
  ON vendor_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own categories"
  ON vendor_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for vendor_subcategories
-- Allow public read access to active subcategories
CREATE POLICY "Public can view active vendor subcategories"
  ON vendor_subcategories FOR SELECT
  USING (is_active = true);

-- Allow vendors to manage their own subcategories
CREATE POLICY "Vendors can insert their own subcategories"
  ON vendor_subcategories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
      AND is_approved = true
    )
  );

CREATE POLICY "Vendors can update their own subcategories"
  ON vendor_subcategories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own subcategories"
  ON vendor_subcategories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE id = vendor_id
      AND user_id = auth.uid()
    )
  );

-- Insert some example categories for demonstration
-- (These can be removed or modified based on your needs)
COMMENT ON TABLE vendor_categories IS 'Stores dynamic categories specific to each vendor';
COMMENT ON TABLE vendor_subcategories IS 'Stores dynamic subcategories under vendor categories';
