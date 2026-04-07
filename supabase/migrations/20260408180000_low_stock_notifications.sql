-- ============================================================================
-- LOW STOCK NOTIFICATIONS for vendors
-- After an order_items row is inserted, decrement the product stock
-- and create an order_notification when stock falls to/below threshold.
-- Also backfills any orders accepted without delivery rows so riders can claim them.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Trigger function: decrement stock + low-stock alert
CREATE OR REPLACE FUNCTION public.fn_track_stock_after_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_new_stock integer;
  v_vendor_id uuid;
  v_order_id uuid;
BEGIN
  -- Skip if no product link
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, vendor_id, stock_quantity, low_stock_threshold, track_inventory, name
    INTO v_product
    FROM public.products
    WHERE id = NEW.product_id;

  IF NOT FOUND OR v_product.track_inventory IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_new_stock := COALESCE(v_product.stock_quantity, 0) - COALESCE(NEW.quantity, 0);
  IF v_new_stock < 0 THEN v_new_stock := 0; END IF;

  UPDATE public.products
     SET stock_quantity = v_new_stock,
         in_stock = (v_new_stock > 0)
   WHERE id = v_product.id;

  -- Resolve vendor + order to attach the notification
  v_vendor_id := v_product.vendor_id;
  v_order_id := NEW.order_id;

  IF v_vendor_id IS NOT NULL
     AND v_order_id IS NOT NULL
     AND v_new_stock <= COALESCE(v_product.low_stock_threshold, 5) THEN
    INSERT INTO public.order_notifications (vendor_id, order_id, type, message)
    VALUES (
      v_vendor_id,
      v_order_id,
      CASE WHEN v_new_stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      CASE
        WHEN v_new_stock = 0 THEN format('%s is out of stock', v_product.name)
        ELSE format('%s is running low (%s left)', v_product.name, v_new_stock)
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach trigger
DROP TRIGGER IF EXISTS trg_track_stock_after_order_item ON public.order_items;
CREATE TRIGGER trg_track_stock_after_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_track_stock_after_order_item();

-- 3. Backfill: any accepted/preparing/ready orders that lack a delivery row
INSERT INTO public.deliveries (order_id, estate_id, status, delivery_fee)
SELECT o.id, o.estate_id, 'pending', 50
  FROM public.orders o
  LEFT JOIN public.deliveries d ON d.order_id = o.id
 WHERE d.id IS NULL
   AND o.status IN ('accepted', 'preparing', 'ready');
