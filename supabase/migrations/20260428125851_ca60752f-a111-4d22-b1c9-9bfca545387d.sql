
-- ==========================================================================
-- Replace loremflickr (random) and generic snack-photo product images with
-- stable, on-topic Unsplash stock photos. Keyword-matched per vendor.
-- ==========================================================================

-- ---------- MPAL (Mobile Accessories) ------------------------------------
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1609592424823-43d6df4f8c8b?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND name ILIKE '%power bank%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND (name ILIKE '%charger%' OR name ILIKE '%gan%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND name ILIKE '%cable%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND name ILIKE '%case%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND (name ILIKE '%earbuds%' OR name ILIKE '%headphones%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND name ILIKE '%speaker%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND (name ILIKE '%screen%' OR name ILIKE '%glass%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND (name ILIKE '%microsd%' OR name ILIKE '%sd card%' OR name ILIKE '%memory%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND (name ILIKE '%mount%' OR name ILIKE '%stand%' OR name ILIKE '%holder%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1609592424823-43d6df4f8c8b?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND name ILIKE '%battery%';
-- Mpal fallback for any remaining loremflickr
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=400&h=400&fit=crop'
 WHERE vendor_id = '473b83c4-ca9e-4413-8950-7bd367c6c917' AND image_url ILIKE '%loremflickr%';

-- ---------- ILORA FLOWERS ------------------------------------------------
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%rose%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%lily%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%lilies%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%carnation%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%sunflower%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%orchid%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%tulip%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%daisy%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND name ILIKE '%gerbera%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND (name ILIKE '%bouquet%' OR name ILIKE '%mixed%' OR name ILIKE '%arrangement%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND (name ILIKE '%vase%' OR name ILIKE '%pot%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND (name ILIKE '%card%' OR name ILIKE '%gift%' OR name ILIKE '%balloon%' OR name ILIKE '%chocolate%' OR name ILIKE '%teddy%');
-- Ilora fallback for any remaining loremflickr
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop'
 WHERE vendor_id = '14c740a8-b9a0-4f6a-bf65-28a54aa1f3ab' AND image_url ILIKE '%loremflickr%';

-- ---------- MTAALOOP BUTCHERY --------------------------------------------
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'beef steak%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 't-bone%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE 'beef ribs%' OR name ILIKE 'beef leg%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'beef mince%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606851094291-6efae152bb87?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'beef liver%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1597712050037-4e6e3b4c6e8a?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE '%kidney%' OR name ILIKE '%tongue%' OR name ILIKE '%tripe%' OR name ILIKE '%heart%' OR name ILIKE '%gizzard%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE '%soup bones%' OR name ILIKE '%marrow%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE '%sausage%' OR name ILIKE '%hot dog%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'whole chicken%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'chicken breast%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'chicken drumsticks%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'chicken thighs%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'chicken wings%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'chicken mince%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE 'goat ribs%' OR name ILIKE 'goat leg%' OR name ILIKE 'goat stew%' OR name ILIKE 'goat soup%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'goat mince%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE 'mutton%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND (name ILIKE 'pork ribs%' OR name ILIKE 'pork chops%' OR name ILIKE 'pork belly%' OR name ILIKE 'smoked pork%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'pork mince%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND name ILIKE 'pork sausages%';
-- Butchery fallback for any remaining loremflickr
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'
 WHERE vendor_id = '8e2da004-d59c-45c5-bb33-296c76b19b5e' AND image_url ILIKE '%loremflickr%';

-- ---------- LIKA STORE: snacks/cigarettes/lighters/sodas ----------------
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1625938145744-533e82c5f7d4?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND name ILIKE '%beef jerky%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1604908554049-04d2cca44396?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND name ILIKE '%pretzel%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND (name ILIKE '%mixed nuts%' OR name ILIKE '%peanut%' OR name ILIKE '%corn nuts%' OR name ILIKE '%bamba%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND (name ILIKE '%lays%' OR name ILIKE '%chips%' OR name ILIKE '%crisps%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND (name ILIKE '%cigarette%' OR name ILIKE '%camel%' OR name ILIKE '%marlboro%' OR name ILIKE '%dunhill%' OR name ILIKE '%embassy%' OR name ILIKE '%sportsman%');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND name ILIKE '%lighter%';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop'
 WHERE vendor_id = '85fb494f-73dc-4f64-8ac1-bf185444d2f8' AND (name ILIKE '%coca-cola%' OR name ILIKE '%coke%' OR name ILIKE '%fanta%' OR name ILIKE '%sprite%' OR name ILIKE '%soda%');
