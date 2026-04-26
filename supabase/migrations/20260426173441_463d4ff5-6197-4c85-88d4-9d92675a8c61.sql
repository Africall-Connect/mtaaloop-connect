-- Ilora Flowers
UPDATE public.vendor_profiles SET
  brand_primary='#B23A6E', brand_accent='#F4C2C2', brand_surface='#FFF5F8',
  font_display='fraunces', hero_style='soft',
  tagline=COALESCE(tagline,'Same-day flowers for the people who matter'),
  delivery_time=COALESCE(delivery_time,'Today')
WHERE LOWER(TRIM(business_name))='ilora flowers';

-- MtaaLoop Mart
UPDATE public.vendor_profiles SET
  brand_primary='#1E2A78', brand_accent='#F5A524', brand_surface='#F7F3EC',
  font_display='default', hero_style='default',
  tagline=COALESCE(tagline,'A bit of everything, fast'),
  delivery_time=COALESCE(delivery_time,'Within the hour')
WHERE LOWER(TRIM(business_name)) LIKE 'mtaaloop mart%';

-- MtaaLoop Butchery
UPDATE public.vendor_profiles SET
  brand_primary='#8B1E1E', brand_accent='#F5A524', brand_surface='#FFF8F0',
  font_display='archivo', hero_style='bold',
  tagline=COALESCE(tagline,'Fresh cuts, butchered to order'),
  delivery_time=COALESCE(delivery_time,'45 min')
WHERE LOWER(TRIM(business_name))='mtaaloop butchery';

-- Mpal
UPDATE public.vendor_profiles SET
  brand_primary='#0B0B0F', brand_accent='#F5A524', brand_surface='#F7F3EC',
  font_display='archivo', hero_style='bold',
  tagline=COALESCE(tagline,'Phone, charge, listen — everything mobile'),
  delivery_time=COALESCE(delivery_time,'Within the hour')
WHERE LOWER(TRIM(business_name))='mpal';

-- GREEN FLAME GAS SUPPLIES
UPDATE public.vendor_profiles SET
  brand_primary='#0F7B3B', brand_accent='#F5A524', brand_surface='#FFFEF5',
  font_display='archivo', hero_style='bold',
  tagline=COALESCE(tagline,'Cooking gas, refilled and delivered'),
  delivery_time=COALESCE(delivery_time,'30 min')
WHERE LOWER(TRIM(business_name))='green flame gas supplies';

-- Cleaning Services
UPDATE public.vendor_profiles SET
  brand_primary='#1E5EA8', brand_accent='#F4C2C2', brand_surface='#F5FAFF',
  font_display='inter-tight', hero_style='clinical',
  tagline=COALESCE(tagline,'Book a clean, get it done today'),
  delivery_time=COALESCE(delivery_time,'Same day')
WHERE LOWER(TRIM(business_name))='cleaning services';

-- Africall
UPDATE public.vendor_profiles SET
  brand_primary='#1E2A78', brand_accent='#F5A524', brand_surface='#F7F3EC',
  font_display='inter-tight', hero_style='clinical',
  tagline=COALESCE(tagline,'Calls, support, and ICT for your business'),
  delivery_time=COALESCE(delivery_time,'On request')
WHERE LOWER(TRIM(business_name))='africall';

-- Catch-all defaults so no vendor has NULL in brand tokens
UPDATE public.vendor_profiles SET
  brand_primary=COALESCE(brand_primary,'#1E2A78'),
  brand_accent=COALESCE(brand_accent,'#F5A524'),
  brand_surface=COALESCE(brand_surface,'#F7F3EC'),
  font_display=COALESCE(font_display,'default'),
  hero_style=COALESCE(hero_style,'default'),
  tagline=COALESCE(tagline,'Shop with us today'),
  delivery_time=COALESCE(delivery_time,'Within the hour')
WHERE brand_primary IS NULL
   OR brand_accent IS NULL
   OR brand_surface IS NULL
   OR tagline IS NULL
   OR delivery_time IS NULL;