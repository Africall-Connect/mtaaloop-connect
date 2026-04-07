-- ============================================================================
-- SEED STORES: Butchery + Mpal (Royal Suburbs - Tsavo)
-- Creates two business-only vendor profiles linked to Royal Suburbs - Tsavo
-- and seeds their full product catalogs so they show up in the customer
-- "All stores" section immediately. Idempotent — safe to re-run.
--
-- Requires: 20260407180000_vendor_user_id_nullable.sql (vendor_profiles.user_id NULL allowed)
-- ============================================================================

-- ─── 1. Vendor profiles ─────────────────────────────────────────────────────
INSERT INTO public.vendor_profiles (
  business_name, business_type, business_phone, business_email,
  business_address, business_description, slug, is_approved, is_active, user_id, estate_id
) VALUES
  (
    'MtaaLoop Butchery',
    'Butchery',
    '+254700000001',
    'butchery@mtaaloop.demo',
    'Royal Suburbs - Tsavo',
    'Fresh goat, beef, pork and chicken cuts. Per kg, minced, offal, soup bones, sausages and more — delivered to your door.',
    'mtaaloop-butchery',
    true,
    true,
    NULL,
    (SELECT id FROM public.estates WHERE name ILIKE '%royal suburbs%' AND name ILIKE '%tsavo%' LIMIT 1)
  ),
  (
    'Mpal',
    'Mobile Accessories',
    '+254700000002',
    'mpal@mtaaloop.demo',
    'Royal Suburbs - Tsavo',
    'Mpal — phone cases, screen protectors, chargers, power banks, earbuds, speakers, memory cards and more.',
    'mpal',
    true,
    true,
    NULL,
    (SELECT id FROM public.estates WHERE name ILIKE '%royal suburbs%' AND name ILIKE '%tsavo%' LIMIT 1)
  )
ON CONFLICT (slug) DO NOTHING;

-- ─── 2. Butchery products (~35 items) ───────────────────────────────────────
WITH v AS (
  SELECT id FROM public.vendor_profiles WHERE slug = 'mtaaloop-butchery'
)
INSERT INTO public.products (vendor_id, name, description, category, subcategory, price, stock_quantity, low_stock_threshold, is_available, image_url)
SELECT v.id, p.name, p.description, 'Butchery', p.subcategory, p.price, p.stock, 10, true, p.image_url
FROM v, (VALUES
  -- Goat & Mutton
  ('Goat Leg (1 kg)',            'Fresh goat hind leg, perfect for nyama choma or stew.', 'Goat & Mutton', 850::numeric, 25, 'https://images.unsplash.com/photo-1602476572867-1f200b630884?w=400&h=400&fit=crop'),
  ('Mutton Chops (500 g)',       'Tender mutton chops, ideal for grilling.',              'Goat & Mutton', 520::numeric, 30, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  ('Goat Ribs (1 kg)',           'Goat rib cuts, great for slow roasting.',               'Goat & Mutton', 780::numeric, 20, 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&h=400&fit=crop'),
  ('Goat Stew Cut (1 kg)',       'Mixed goat cuts for traditional stews.',                'Goat & Mutton', 700::numeric, 35, 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=400&fit=crop'),
  -- Beef
  ('Beef Steak (500 g)',         'Tender beef steak cuts ready for the pan.',             'Beef',          600::numeric, 40, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  ('Beef Leg (1 kg)',            'Fresh beef leg, suitable for roasts and stews.',        'Beef',          800::numeric, 25, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop'),
  ('T-Bone Steak (500 g)',       'Premium T-bone cut for grilling.',                      'Beef',          950::numeric, 20, 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop'),
  ('Beef Ribs (1 kg)',           'Meaty beef ribs ideal for BBQ.',                        'Beef',          720::numeric, 25, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop'),
  -- Pork
  ('Pork Chops (500 g)',         'Bone-in pork chops, juicy and tender.',                 'Pork',          550::numeric, 30, 'https://images.unsplash.com/photo-1602470521006-13cb3da3a2ae?w=400&h=400&fit=crop'),
  ('Pork Belly (1 kg)',          'Pork belly with the perfect fat-to-meat ratio.',        'Pork',          850::numeric, 20, 'https://images.unsplash.com/photo-1516824501780-3aff8abdc865?w=400&h=400&fit=crop'),
  ('Pork Ribs (1 kg)',           'Meaty pork ribs for BBQ and roasting.',                 'Pork',          780::numeric, 22, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop'),
  -- Chicken (Broiler)
  ('Whole Chicken (1.5 kg)',     'Fresh whole broiler chicken, dressed and ready.',       'Chicken (Broiler)', 650::numeric, 50, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop'),
  ('Chicken Breast (500 g)',     'Boneless skinless chicken breast.',                     'Chicken (Broiler)', 450::numeric, 60, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop'),
  ('Chicken Drumsticks (500 g)', 'Juicy chicken drumsticks.',                             'Chicken (Broiler)', 380::numeric, 55, 'https://images.unsplash.com/photo-1610614819513-58e34989848b?w=400&h=400&fit=crop'),
  ('Chicken Wings (500 g)',      'Chicken wings perfect for frying or grilling.',         'Chicken (Broiler)', 350::numeric, 60, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=400&fit=crop'),
  ('Chicken Thighs (500 g)',     'Bone-in chicken thighs.',                               'Chicken (Broiler)', 400::numeric, 50, 'https://images.unsplash.com/photo-1604908554007-fb8f54142fce?w=400&h=400&fit=crop'),
  -- Minced Meat
  ('Beef Mince (500 g)',         'Freshly ground beef mince.',                            'Minced Meat',   400::numeric, 45, 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'),
  ('Goat Mince (500 g)',         'Ground goat meat for keema and meatballs.',             'Minced Meat',   480::numeric, 30, 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'),
  ('Pork Mince (500 g)',         'Ground pork for sausages and dumplings.',               'Minced Meat',   420::numeric, 25, 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'),
  ('Chicken Mince (500 g)',      'Ground chicken for healthy meals.',                     'Minced Meat',   360::numeric, 35, 'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop'),
  -- Offal & Specialty
  ('Beef Liver (500 g)',         'Fresh beef liver, rich in iron.',                       'Offal & Specialty', 280::numeric, 40, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  ('Goat Heart (250 g)',         'Tender goat heart cuts.',                               'Offal & Specialty', 220::numeric, 30, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  ('Beef Tripe (500 g)',         'Cleaned beef tripe ready for cooking.',                 'Offal & Specialty', 320::numeric, 35, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  ('Beef Kidney (500 g)',        'Fresh beef kidney.',                                    'Offal & Specialty', 280::numeric, 25, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  ('Chicken Gizzard (500 g)',    'Chicken gizzards, perfect for stews.',                  'Offal & Specialty', 260::numeric, 45, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  ('Beef Tongue (1 piece)',      'Whole beef tongue, a traditional delicacy.',            'Offal & Specialty', 650::numeric, 15, 'https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop'),
  -- Soup Bones
  ('Beef Soup Bones (1 kg)',     'Beef bones for rich, hearty soups.',                    'Soup Bones',    250::numeric, 60, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  ('Goat Soup Bones (1 kg)',     'Goat soup bones, packed with flavour.',                 'Soup Bones',    280::numeric, 50, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  ('Mutton Bones (1 kg)',        'Mutton bones for stocks and broths.',                   'Soup Bones',    260::numeric, 40, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  ('Marrow Bones (1 kg)',        'Beef marrow bones for bone broth.',                     'Soup Bones',    350::numeric, 35, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop'),
  -- Sausages & Smoked
  ('Beef Sausages (500 g)',      'Premium beef sausages.',                                'Sausages & Smoked', 480::numeric, 50, 'https://images.unsplash.com/photo-1601924357840-3e50e6c52a88?w=400&h=400&fit=crop'),
  ('Pork Sausages (500 g)',      'Fresh pork sausages for the grill.',                    'Sausages & Smoked', 520::numeric, 40, 'https://images.unsplash.com/photo-1601924357840-3e50e6c52a88?w=400&h=400&fit=crop'),
  ('Smoked Pork Ribs (1 kg)',    'Slow-smoked pork ribs.',                                'Sausages & Smoked', 950::numeric, 20, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop'),
  ('Hot Dogs (Pack of 8)',       'Classic hot dog sausages.',                             'Sausages & Smoked', 380::numeric, 60, 'https://images.unsplash.com/photo-1612392062798-2c4d44f4fce7?w=400&h=400&fit=crop')
) AS p(name, description, subcategory, price, stock, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE vendor_id = (SELECT id FROM v) AND name = p.name
);

-- ─── 3. Mpal — Mobile Accessories products (~25 items) ─────────────────────
WITH v AS (
  SELECT id FROM public.vendor_profiles WHERE slug = 'mpal'
)
INSERT INTO public.products (vendor_id, name, description, category, subcategory, price, stock_quantity, low_stock_threshold, is_available, image_url)
SELECT v.id, p.name, p.description, 'Mobile Accessories', p.subcategory, p.price, p.stock, 10, true, p.image_url
FROM v, (VALUES
  -- Phone Cases
  ('Silicone Case — iPhone 15',     'Soft-touch silicone protective case.',                  'Phone Cases',           850::numeric,  40, 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop'),
  ('Clear Case — Samsung S24',      'Crystal-clear flexible TPU case.',                      'Phone Cases',           650::numeric,  50, 'https://images.unsplash.com/photo-1574535082925-9aa1bcd6f0b1?w=400&h=400&fit=crop'),
  ('Wallet Case — iPhone 13',       'Leather flip wallet case with card slots.',             'Phone Cases',          1250::numeric,  25, 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop'),
  -- Screen Protectors
  ('Tempered Glass — iPhone 15',    '9H hardness tempered glass screen protector.',          'Screen Protectors',     450::numeric,  80, 'https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop'),
  ('Tempered Glass — Samsung S24',  'Edge-to-edge tempered glass.',                          'Screen Protectors',     450::numeric,  80, 'https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop'),
  ('Privacy Screen — Universal',    'Anti-spy privacy tempered glass.',                      'Screen Protectors',     650::numeric,  40, 'https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop'),
  -- Chargers & Cables
  ('USB-C to USB-C Cable 2m',       'Fast-charge braided USB-C cable.',                      'Chargers & Cables',     550::numeric, 100, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop'),
  ('Lightning Cable 1m',            'MFi-compatible Lightning cable for iPhone.',            'Chargers & Cables',     480::numeric,  90, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop'),
  ('20W USB-C Charger',             'Fast PD wall charger.',                                 'Chargers & Cables',     950::numeric,  60, 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&h=400&fit=crop'),
  ('65W GaN Charger',               'Multi-port GaN fast charger.',                          'Chargers & Cables',    2200::numeric,  30, 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&h=400&fit=crop'),
  -- Power Banks
  ('10000mAh Power Bank',           'Slim power bank with USB-C input.',                     'Power Banks',          1850::numeric,  50, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop'),
  ('20000mAh Power Bank',           'High-capacity power bank with three ports.',            'Power Banks',          2850::numeric,  35, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop'),
  ('Solar Power Bank 30000mAh',     'Solar-charging rugged power bank.',                     'Power Banks',          3500::numeric,  20, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop'),
  -- Headphones & Earbuds
  ('Wired Earbuds 3.5mm',           'In-ear wired earbuds with mic.',                        'Headphones & Earbuds',  350::numeric, 100, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop'),
  ('Wireless Earbuds Pro',          'Bluetooth 5.3 earbuds with charging case.',             'Headphones & Earbuds', 2850::numeric,  40, 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop'),
  ('Over-Ear Headphones',           'Comfortable over-ear wireless headphones.',             'Headphones & Earbuds', 3500::numeric,  25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'),
  -- Bluetooth Speakers
  ('Mini BT Speaker',               'Portable mini Bluetooth speaker.',                      'Bluetooth Speakers',   1250::numeric,  50, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'),
  ('Waterproof BT Speaker',         'IPX7 rated outdoor speaker.',                           'Bluetooth Speakers',   2850::numeric,  30, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'),
  -- Memory Cards
  ('MicroSD 64GB',                  'Class 10 high-speed MicroSD.',                          'Memory Cards',          850::numeric,  60, 'https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop'),
  ('MicroSD 128GB',                 'U3 V30 MicroSD for 4K video.',                          'Memory Cards',         1450::numeric,  50, 'https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop'),
  -- Phone Holders & Mounts
  ('Car Phone Mount',               'Magnetic dashboard phone mount.',                       'Phone Holders & Mounts', 750::numeric, 50, 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop'),
  ('Desk Phone Stand',              'Adjustable aluminium desk stand.',                      'Phone Holders & Mounts', 480::numeric, 70, 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop'),
  -- Replacement Batteries
  ('iPhone 11 Battery',             'OEM-grade replacement battery.',                        'Replacement Batteries', 1850::numeric, 25, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop'),
  ('Samsung S20 Battery',           'Replacement battery with installation kit.',            'Replacement Batteries', 1950::numeric, 20, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop')
) AS p(name, description, subcategory, price, stock, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE vendor_id = (SELECT id FROM v) AND name = p.name
);
