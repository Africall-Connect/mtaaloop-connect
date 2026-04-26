-- Phase 1.2.5: Add denormalized product_count to vendor_profiles
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS product_count integer NOT NULL DEFAULT 0;

-- Backfill from products table
UPDATE public.vendor_profiles vp
SET product_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT vendor_id, COUNT(*)::int AS cnt
  FROM public.products
  WHERE is_available = true
  GROUP BY vendor_id
) sub
WHERE vp.id = sub.vendor_id;

-- Trigger function to keep product_count in sync
CREATE OR REPLACE FUNCTION public.sync_vendor_product_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_available = true AND NEW.vendor_id IS NOT NULL THEN
      UPDATE public.vendor_profiles
        SET product_count = product_count + 1
        WHERE id = NEW.vendor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_available = true AND OLD.vendor_id IS NOT NULL THEN
      UPDATE public.vendor_profiles
        SET product_count = GREATEST(product_count - 1, 0)
        WHERE id = OLD.vendor_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- vendor change
    IF COALESCE(OLD.vendor_id::text,'') <> COALESCE(NEW.vendor_id::text,'') THEN
      IF OLD.is_available = true AND OLD.vendor_id IS NOT NULL THEN
        UPDATE public.vendor_profiles
          SET product_count = GREATEST(product_count - 1, 0)
          WHERE id = OLD.vendor_id;
      END IF;
      IF NEW.is_available = true AND NEW.vendor_id IS NOT NULL THEN
        UPDATE public.vendor_profiles
          SET product_count = product_count + 1
          WHERE id = NEW.vendor_id;
      END IF;
    -- availability flipped
    ELSIF OLD.is_available IS DISTINCT FROM NEW.is_available AND NEW.vendor_id IS NOT NULL THEN
      IF NEW.is_available = true THEN
        UPDATE public.vendor_profiles
          SET product_count = product_count + 1
          WHERE id = NEW.vendor_id;
      ELSE
        UPDATE public.vendor_profiles
          SET product_count = GREATEST(product_count - 1, 0)
          WHERE id = NEW.vendor_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_vendor_product_count ON public.products;
CREATE TRIGGER trg_sync_vendor_product_count
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_vendor_product_count();