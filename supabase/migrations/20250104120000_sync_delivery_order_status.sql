-- Create a function to sync order status when delivery status changes
-- This function runs with SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION sync_order_status_on_delivery_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When delivery status changes to 'picked', update order to 'in_transit'
  IF NEW.status = 'picked' AND OLD.status != 'picked' THEN
    UPDATE orders
    SET status = 'in_transit',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;

  -- When delivery status changes to 'delivered', update order to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE orders
    SET status = 'delivered',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on deliveries table
DROP TRIGGER IF EXISTS trigger_sync_order_status ON deliveries;
CREATE TRIGGER trigger_sync_order_status
  AFTER UPDATE OF status ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_on_delivery_update();

-- Add comment for documentation
COMMENT ON FUNCTION sync_order_status_on_delivery_update() IS 
  'Automatically syncs order status when delivery status changes: picked -> in_transit, delivered -> delivered';
