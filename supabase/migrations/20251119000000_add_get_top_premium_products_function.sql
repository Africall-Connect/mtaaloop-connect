CREATE OR REPLACE FUNCTION get_top_premium_products_for_vendor(vendor_uuid UUID, time_range TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  price NUMERIC,
  image_url TEXT,
  total_quantity BIGINT,
  stock_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    SUM(oi.quantity) AS total_quantity,
    p.stock_quantity
  FROM
    premium_order_items oi
  JOIN
    premium_orders o ON oi.premium_order_id = o.id
  JOIN
    products p ON oi.product_id = p.id
  WHERE
    o.vendor_id = vendor_uuid
    AND o.created_at >= NOW() - CASE
      WHEN time_range = 'today' THEN INTERVAL '1 day'
      WHEN time_range = 'week' THEN INTERVAL '7 day'
      WHEN time_range = 'month' THEN INTERVAL '1 month'
      WHEN time_range = 'year' THEN INTERVAL '1 year'
      ELSE INTERVAL '7 day'
    END
  GROUP BY
    p.id, p.name, p.price, p.image_url, p.stock_quantity
  ORDER BY
    total_quantity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
