-- Step 1: Add 5 nullable theming columns
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS brand_accent  text,
  ADD COLUMN IF NOT EXISTS brand_surface text,
  ADD COLUMN IF NOT EXISTS font_display  text,
  ADD COLUMN IF NOT EXISTS hero_style    text;

-- Step 2: Backfill defaults for ALL rows by business_type (only fills NULLs)
UPDATE public.vendor_profiles
SET
  brand_primary = COALESCE(brand_primary, CASE business_type
    WHEN 'pharmacy'             THEN '#0F766E'
    WHEN 'liquor-store'         THEN '#7B1E22'
    WHEN 'groceries-essentials' THEN '#F4C2C2'
    WHEN 'living-essentials'    THEN '#F5A524'
    WHEN 'restaurant'           THEN '#C65D3A'
    ELSE '#1E2A78'
  END),
  brand_accent = COALESCE(brand_accent, CASE business_type
    WHEN 'pharmacy'             THEN '#10B981'
    WHEN 'liquor-store'         THEN '#B08D57'
    WHEN 'groceries-essentials' THEN '#E8A4A4'
    WHEN 'living-essentials'    THEN '#000000'
    WHEN 'restaurant'           THEN '#F5A524'
    ELSE '#F5A524'
  END),
  brand_surface = COALESCE(brand_surface, CASE business_type
    WHEN 'pharmacy'             THEN '#FFFFFF'
    WHEN 'liquor-store'         THEN '#1A0F0F'
    WHEN 'groceries-essentials' THEN '#FFF8F5'
    WHEN 'living-essentials'    THEN '#FFFEF5'
    WHEN 'restaurant'           THEN '#FFF8F0'
    ELSE '#F7F3EC'
  END),
  font_display = COALESCE(font_display, CASE business_type
    WHEN 'pharmacy'             THEN 'inter-tight'
    WHEN 'liquor-store'         THEN 'fraunces'
    WHEN 'living-essentials'    THEN 'archivo'
    ELSE 'default'
  END),
  hero_style = COALESCE(hero_style, CASE business_type
    WHEN 'pharmacy'             THEN 'clinical'
    WHEN 'liquor-store'         THEN 'moody'
    WHEN 'groceries-essentials' THEN 'soft'
    WHEN 'living-essentials'    THEN 'bold'
    WHEN 'restaurant'           THEN 'warm'
    ELSE 'default'
  END);