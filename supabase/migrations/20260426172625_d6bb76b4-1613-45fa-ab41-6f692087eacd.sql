-- 1. Add story column to vendor_profiles
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS story text;

-- 2. Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS symptom_category text,
  ADD COLUMN IF NOT EXISTS requires_prescription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dosage_form text;

-- 3. Constraints (drop-if-exists pattern via DO block to stay idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_symptom_category_chk'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_symptom_category_chk
      CHECK (symptom_category IS NULL OR symptom_category IN (
        'cold-flu','pain-relief','baby-care','first-aid','chronic-care','vitamins','personal-care','other'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_dosage_form_chk'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_dosage_form_chk
      CHECK (dosage_form IS NULL OR dosage_form IN (
        'pill','syrup','cream','drops','inhaler','sachet','other'
      ));
  END IF;
END$$;

-- 4. Backfill Tsavo Pharmacy products: symptom_category by keyword
UPDATE public.products SET symptom_category = CASE
  WHEN LOWER(name) ~ 'cough|flu|cold|lozenge|strepsils|benylin|vicks|otrivin|nasal|piriton|claritin|actifed|zirtec|antihistamine' THEN 'cold-flu'
  WHEN LOWER(name) ~ 'panadol|paracetamol|hedex|brufen|ibuprofen|aspirin|disprin|voltaren|pain' THEN 'pain-relief'
  WHEN LOWER(name) ~ 'baby|infant|ors sachet' THEN 'baby-care'
  WHEN LOWER(name) ~ 'bandage|plaster|antiseptic|savlon|betadine|elastoplast|crepe|wound|gauze' THEN 'first-aid'
  WHEN LOWER(name) ~ 'glucometer|test strip|lancet|blood pressure|monitor|coartem|doxycycline|malareich|flagyl|insulin|diabetic|diabetes' THEN 'chronic-care'
  WHEN LOWER(name) ~ 'vitamin|berocca|centrum|calcium|iron|ferrograd|omega|zinc|multivit|supplement|seven seas' THEN 'vitamins'
  WHEN LOWER(name) ~ 'condom|postinor|trust|protector|moistur|e45|fucidin|hydrocortisone|canesten|cream|skin|lotion' THEN 'personal-care'
  ELSE 'other'
END
WHERE vendor_id = '745b841b-2fe3-42e6-9571-74b7e936aa67'
  AND symptom_category IS NULL;

-- 5. Backfill requires_prescription (conservative — antibiotics, antimalarials, prescription-only)
UPDATE public.products SET requires_prescription = true
WHERE vendor_id = '745b841b-2fe3-42e6-9571-74b7e936aa67'
  AND LOWER(name) ~ 'amoxicillin|ciprofloxacin|prednisone|doxycycline|flagyl|coartem|malareich|fucidin|otosporin|postinor';

-- 6. Backfill dosage_form by keyword
UPDATE public.products SET dosage_form = CASE
  WHEN LOWER(name) ~ 'syrup' THEN 'syrup'
  WHEN LOWER(name) ~ 'cream|gel|ointment|vaporub|moisturising' THEN 'cream'
  WHEN LOWER(name) ~ 'drop|spray' THEN 'drops'
  WHEN LOWER(name) ~ 'inhaler' THEN 'inhaler'
  WHEN LOWER(name) ~ 'sachet|powder' THEN 'sachet'
  WHEN LOWER(name) ~ 'tablet|capsule|effervescent|lozenge' THEN 'pill'
  ELSE 'other'
END
WHERE vendor_id = '745b841b-2fe3-42e6-9571-74b7e936aa67'
  AND dosage_form IS NULL;

-- 7. Seed Tsavo's founder story
UPDATE public.vendor_profiles
SET story = 'Run by Catherine Mwangi, dispensing for the Tsavo Royal Suburbs estate since 2024.'
WHERE id = '745b841b-2fe3-42e6-9571-74b7e936aa67'
  AND (story IS NULL OR story = '');

-- 8. Create the prescriptions storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- 9. RLS policies on storage.objects for prescriptions bucket
-- Path convention: {vendor_id}/{user_id}/{filename}
DROP POLICY IF EXISTS "Customers can upload their own prescriptions" ON storage.objects;
CREATE POLICY "Customers can upload their own prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

DROP POLICY IF EXISTS "Customers can read their own prescriptions" ON storage.objects;
CREATE POLICY "Customers can read their own prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

DROP POLICY IF EXISTS "Vendors can read prescriptions for their pharmacy" ON storage.objects;
CREATE POLICY "Vendors can read prescriptions for their pharmacy"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1 FROM public.vendor_profiles vp
    WHERE vp.id::text = (storage.foldername(name))[1]
      AND vp.user_id = auth.uid()
  )
);