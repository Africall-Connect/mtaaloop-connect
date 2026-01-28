CREATE OR REPLACE FUNCTION get_top_products_for_vendor(
  vendor_uuid uuid,
  time_range text
)
RETURNS TABLE (
  product_id uuid,
  name text,
  price numeric,
  image_url text,
  total_quantity bigint,
  stock_quantity integer
) AS $$
DECLARE
  start_date timestamptz;
BEGIN
  -- Determine the start date based on the time_range parameter
  start_date := CASE
    WHEN time_range = 'today' THEN now() - interval '1 day'
    WHEN time_range = 'week' THEN now() - interval '7 days'
    WHEN time_range = 'month' THEN now() - interval '1 month'
    WHEN time_range = 'year' THEN now() - interval '1 year'
    ELSE now() - interval '7 days' -- Default to week
  END;

  RETURN QUERY
  WITH sales_by_name AS (
    SELECT
      oi.product_name,
      SUM(oi.quantity) as units_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.vendor_id = vendor_uuid AND o.created_at >= start_date
    GROUP BY oi.product_name
  )
  SELECT
    p.id as product_id,
    p.name,
    p.price,
    p.image_url,
    COALESCE(s.units_sold, 0) AS total_quantity,
    p.stock_quantity
  FROM
    products p
  LEFT JOIN
    sales_by_name s ON p.name = s.product_name
  WHERE
    p.vendor_id = vendor_uuid
  ORDER BY
    total_quantity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
