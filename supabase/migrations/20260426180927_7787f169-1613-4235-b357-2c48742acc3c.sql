-- ============================================================
-- Phase 1.4 — Lisa Two (Toiletries) + LISA SERVICES (MiniMart) seeding
-- ============================================================

-- 1) Lisa Two font + story
UPDATE public.vendor_profiles
SET font_display = 'fraunces',
    story = COALESCE(story, 'Curated by Lisa for the Tsavo block — only what we''d put on our own skin.')
WHERE business_name ILIKE 'Lisa Two Toiletries%';

-- 2) LISA SERVICES story
UPDATE public.vendor_profiles
SET story = COALESCE(story, 'The mart on the corner — open early, restocked daily, and the only place that always has airtime.')
WHERE business_name = 'LISA SERVICES';

-- ============================================================
-- 3) Lisa Two backfill (vendor 394e1d03-4f4c-40d0-9f5f-07d6c5d6d969)
-- ============================================================

-- toiletries_category
UPDATE public.products SET toiletries_category = CASE
  WHEN subcategory ILIKE '%shampoo%' OR subcategory ILIKE '%conditioner%' OR name ILIKE '%hair oil%' OR name ILIKE '%hair%treatment%' THEN 'hair'
  WHEN subcategory ILIKE '%shaving%' OR name ILIKE '%razor%' OR name ILIKE '%toothbrush%' OR name ILIKE '%comb%' OR name ILIKE '%brush%' OR name ILIKE '%sponge%' OR name ILIKE '%loofah%' THEN 'tools'
  WHEN subcategory ILIKE '%body wash%' OR subcategory ILIKE '%bar soap%' OR subcategory ILIKE '%body lotion%' OR subcategory ILIKE '%deodorant%' OR name ILIKE '%body spray%' OR name ILIKE '%body oil%' OR name ILIKE '%scrub%' THEN 'body'
  WHEN subcategory ILIKE '%oral care%' OR subcategory ILIKE '%feminine care%' OR subcategory ILIKE '%baby care%' OR name ILIKE '%cleanser%' OR name ILIKE '%moisturiser%' OR name ILIKE '%moisturizer%' OR name ILIKE '%serum%' OR name ILIKE '%sunscreen%' OR name ILIKE '%toner%' OR name ILIKE '%face%' THEN 'skin'
  WHEN name ILIKE '%detergent%' OR name ILIKE '%dish%soap%' OR name ILIKE '%cleaner%' OR name ILIKE '%bleach%' OR name ILIKE '%disinfectant%' OR name ILIKE '%tissue%' OR name ILIKE '%cloth%' OR name ILIKE '%wipes%' THEN 'home-laundry'
  ELSE 'other'
END
WHERE vendor_id = '394e1d03-4f4c-40d0-9f5f-07d6c5d6d969';

-- skin_type
UPDATE public.products SET skin_type = CASE
  WHEN name ILIKE '%oily%' OR name ILIKE '%mattif%' OR name ILIKE '%oil control%' THEN 'oily'
  WHEN name ILIKE '%dry%' OR name ILIKE '%moisturis%' OR name ILIKE '%moisturiz%' OR name ILIKE '%hydrat%' OR name ILIKE '%nourish%' THEN 'dry'
  WHEN name ILIKE '%sensitive%' OR name ILIKE '%fragrance-free%' OR name ILIKE '%hypoallerg%' OR name ILIKE '%baby%' OR name ILIKE '%gentle%' THEN 'sensitive'
  WHEN toiletries_category IN ('home-laundry','tools') THEN 'na'
  ELSE 'all-skin'
END
WHERE vendor_id = '394e1d03-4f4c-40d0-9f5f-07d6c5d6d969';

-- pack_size — extract trailing size token from name (very simple regex)
UPDATE public.products
SET pack_size = COALESCE(pack_size, NULLIF(
  trim(both ' ' from
    regexp_replace(name, '^.*?((?:\d+(?:\.\d+)?\s*(?:ml|g|kg|l|s|x\d+))|(?:x\s*\d+))\s*$', '\1', 'i')
  ), name))
WHERE vendor_id = '394e1d03-4f4c-40d0-9f5f-07d6c5d6d969';

-- Re-clean: only keep pack_size if it differs from full name (heuristic: contains digit)
UPDATE public.products
SET pack_size = CASE WHEN pack_size ~ '\d' AND length(pack_size) <= 12 THEN pack_size ELSE NULL END
WHERE vendor_id = '394e1d03-4f4c-40d0-9f5f-07d6c5d6d969';

-- refill_cadence_days
UPDATE public.products SET refill_cadence_days = CASE
  WHEN toiletries_category = 'tools' THEN NULL
  WHEN subcategory ILIKE '%shampoo%' OR subcategory ILIKE '%conditioner%' OR subcategory ILIKE '%body wash%' OR subcategory ILIKE '%bar soap%' OR subcategory ILIKE '%body lotion%' OR subcategory ILIKE '%deodorant%' OR subcategory ILIKE '%oral care%' THEN 30
  WHEN toiletries_category = 'home-laundry' THEN 45
  WHEN subcategory ILIKE '%feminine care%' OR subcategory ILIKE '%baby care%' THEN 30
  ELSE NULL
END
WHERE vendor_id = '394e1d03-4f4c-40d0-9f5f-07d6c5d6d969';

-- ============================================================
-- 4) LISA SERVICES backfill (vendor 5424b3d5-6f24-445b-80db-bf5b774263f5)
-- ============================================================

UPDATE public.products SET mart_aisle = CASE
  WHEN subcategory ILIKE '%water%' OR name ILIKE '%water%' OR name ILIKE '%milk%' OR name ILIKE '%juice%' OR name ILIKE '%soda%' OR name ILIKE '%tea%' OR name ILIKE '%coffee%' THEN 'beverages'
  WHEN name ILIKE '%bread%' OR name ILIKE '%egg%' OR name ILIKE '%margarine%' OR name ILIKE '%vegetable%' OR name ILIKE '%fruit%' OR name ILIKE '%fresh milk%' THEN 'fresh'
  WHEN name ILIKE '%rice%' OR name ILIKE '%flour%' OR name ILIKE '%sugar%' OR name ILIKE '%cooking oil%' OR name ILIKE '%maize%' OR name ILIKE '%cooking fat%' OR name ILIKE '%unga%' OR subcategory ILIKE '%groceries%' THEN 'staples'
  WHEN name ILIKE '%crisp%' OR name ILIKE '%biscuit%' OR name ILIKE '%chocolate%' OR name ILIKE '%sweet%' OR name ILIKE '%snack%' THEN 'snacks'
  WHEN subcategory ILIKE '%cleaning%' OR subcategory ILIKE '%household%' OR subcategory ILIKE '%dish soap%' OR subcategory ILIKE '%electrical%' OR subcategory ILIKE '%gas%' OR name ILIKE '%detergent%' OR name ILIKE '%bleach%' OR name ILIKE '%cleaner%' OR name ILIKE '%tissue%' OR name ILIKE '%bin liner%' OR name ILIKE '%foil%' OR name ILIKE '%cling film%' OR name ILIKE '%candle%' OR name ILIKE '%bulb%' OR name ILIKE '%batter%' OR name ILIKE '%towel%' OR name ILIKE '%plate%' OR name ILIKE '%cup%' OR name ILIKE '%sponge%' OR name ILIKE '%bag%' THEN 'household'
  WHEN subcategory ILIKE '%toiletries%' OR name ILIKE '%toothpaste%' OR name ILIKE '%deodorant%' OR name ILIKE '%sanitary%' OR name ILIKE '%pad%' OR name ILIKE '%soap%' THEN 'personal-care'
  WHEN name ILIKE '%diaper%' OR name ILIKE '%baby food%' OR name ILIKE '%baby wipe%' THEN 'baby-kids'
  WHEN name ILIKE '%airtime%' OR name ILIKE '%data bundle%' OR name ILIKE '%bill%' THEN 'airtime-bills'
  ELSE 'other'
END
WHERE vendor_id = '5424b3d5-6f24-445b-80db-bf5b774263f5';

-- pack_size
UPDATE public.products
SET pack_size = NULLIF(
  trim(both ' ' from
    regexp_replace(name, '^.*?((?:\d+(?:\.\d+)?\s*(?:ml|g|kg|l|s|w|x\d+))|(?:x\s*\d+))\s*$', '\1', 'i')
  ), name)
WHERE vendor_id = '5424b3d5-6f24-445b-80db-bf5b774263f5';

UPDATE public.products
SET pack_size = CASE WHEN pack_size ~ '\d' AND length(pack_size) <= 12 THEN pack_size ELSE NULL END
WHERE vendor_id = '5424b3d5-6f24-445b-80db-bf5b774263f5';

-- refill_cadence_days for mini-mart consumables
UPDATE public.products SET refill_cadence_days = CASE
  WHEN mart_aisle IN ('staples','beverages','fresh','household') THEN 14
  WHEN mart_aisle = 'personal-care' THEN 30
  WHEN mart_aisle = 'baby-kids' THEN 14
  ELSE NULL
END
WHERE vendor_id = '5424b3d5-6f24-445b-80db-bf5b774263f5';