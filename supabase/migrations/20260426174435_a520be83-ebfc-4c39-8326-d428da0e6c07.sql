-- 1. Schema: add occasion_tag + abv to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS occasion_tag text,
  ADD COLUMN IF NOT EXISTS abv numeric(4,1);

-- CHECK constraint for occasion_tag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_occasion_tag_chk'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_occasion_tag_chk
      CHECK (occasion_tag IS NULL OR occasion_tag IN (
        'friday-crew','solo-wind-down','last-minute-gift',
        'celebration','cocktail-night','beer-run','other'
      ));
  END IF;
END$$;

-- 2. Backfill Lika story
UPDATE public.vendor_profiles
SET story = 'Run by James from inside Tsavo — the bar that knows your usual, even on a Tuesday.'
WHERE id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8'
  AND (story IS NULL OR story = '');

-- 3. Backfill occasion_tag for all Lika products
UPDATE public.products p
SET occasion_tag = CASE
  -- Beer / Stout / Cider → beer-run
  WHEN lower(coalesce(p.subcategory,'')) IN ('local beer','imported beer','stout','cider','beer') THEN 'beer-run'

  -- Miniatures → last-minute-gift
  WHEN lower(coalesce(p.subcategory,'')) = 'miniatures' THEN 'last-minute-gift'

  -- Sparkling / Champagne → celebration
  WHEN lower(coalesce(p.subcategory,'')) IN ('champagne','sparkling','sparkling wine','prosecco') THEN 'celebration'
  WHEN lower(p.name) ~ '(champagne|prosecco|moet|veuve|dom perignon|sparkl)' THEN 'celebration'

  -- Premium whisky → solo-wind-down (price gate or known premium names)
  WHEN lower(coalesce(p.subcategory,'')) IN ('whiskey & bourbon','whisky','whiskey','bourbon','scotch')
       AND (p.price >= 3000
            OR lower(p.name) ~ '(macallan|mcvoy|mclaren|single malt|glenfiddich|glenlivet|lagavulin|laphroaig|talisker|highland park|dalmore|chivas 18|johnnie walker (blue|gold|18))')
    THEN 'solo-wind-down'

  -- Mid-tier whisky → friday-crew
  WHEN lower(coalesce(p.subcategory,'')) IN ('whiskey & bourbon','whisky','whiskey','bourbon','scotch') THEN 'friday-crew'

  -- Mixers / cocktail → cocktail-night
  WHEN lower(coalesce(p.subcategory,'')) IN ('mixers','syrups','bitters','cocktail kits','tonic') THEN 'cocktail-night'
  WHEN lower(p.name) ~ '(tonic|mixer|bitters|syrup|grenadine|cocktail kit)' THEN 'cocktail-night'

  -- Wine: red/white → solo-wind-down
  WHEN lower(coalesce(p.subcategory,'')) IN ('red wine','white wine','wine','rose wine','rosé wine') THEN 'solo-wind-down'

  -- Party spirits → friday-crew
  WHEN lower(coalesce(p.subcategory,'')) IN ('vodka','gin','tequila','rum','liqueur','liquor','brandy','cognac') THEN 'friday-crew'

  -- Tobacco / accessories → other
  WHEN lower(coalesce(p.subcategory,'')) IN ('tobacco','cigarettes','cigars','accessories','lighters') THEN 'other'

  -- Default: Lika tagline references Friday crew
  ELSE 'friday-crew'
END
WHERE p.vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8'
  AND (p.occasion_tag IS NULL);

-- 4. Backfill abv for Lika products
UPDATE public.products p
SET abv = CASE
  WHEN lower(coalesce(p.subcategory,'')) IN ('local beer','imported beer','beer') THEN 5.0
  WHEN lower(coalesce(p.subcategory,'')) = 'stout' THEN 5.5
  WHEN lower(coalesce(p.subcategory,'')) = 'cider' THEN 4.5
  WHEN lower(coalesce(p.subcategory,'')) IN ('red wine','white wine','wine','rose wine','rosé wine') THEN 12.0
  WHEN lower(coalesce(p.subcategory,'')) IN ('champagne','sparkling','sparkling wine','prosecco') THEN 11.5
  WHEN lower(coalesce(p.subcategory,'')) = 'liqueur' THEN 17.0
  WHEN lower(coalesce(p.subcategory,'')) IN ('vodka','gin','tequila','rum','brandy') THEN 40.0
  WHEN lower(coalesce(p.subcategory,'')) IN ('whiskey & bourbon','whisky','whiskey','bourbon','scotch','cognac')
    THEN CASE WHEN p.price >= 3000 THEN 43.0 ELSE 40.0 END
  WHEN lower(coalesce(p.subcategory,'')) = 'miniatures'
    THEN CASE
      WHEN lower(p.name) ~ '(beer|tusker|guinness|heineken|stella|budweiser|pilsner)' THEN 5.0
      WHEN lower(p.name) ~ '(wine)' THEN 12.0
      ELSE 40.0
    END
  ELSE NULL  -- tobacco, accessories
END
WHERE p.vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8'
  AND p.abv IS NULL;