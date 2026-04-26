-- Phase 1.4: Add product columns for Toiletries + MiniMart archetypes
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS skin_type text,
  ADD COLUMN IF NOT EXISTS toiletries_category text,
  ADD COLUMN IF NOT EXISTS pack_size text,
  ADD COLUMN IF NOT EXISTS refill_cadence_days integer,
  ADD COLUMN IF NOT EXISTS mart_aisle text;

-- CHECK constraints (drop-if-exists pattern via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_skin_type_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_skin_type_chk
      CHECK (skin_type IS NULL OR skin_type IN ('oily','dry','combination','sensitive','all-skin','na'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_toiletries_category_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_toiletries_category_chk
      CHECK (toiletries_category IS NULL OR toiletries_category IN ('skin','hair','body','home-laundry','tools','other'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_mart_aisle_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_mart_aisle_chk
      CHECK (mart_aisle IS NULL OR mart_aisle IN ('staples','fresh','snacks','beverages','household','personal-care','baby-kids','airtime-bills','other'));
  END IF;
END $$;