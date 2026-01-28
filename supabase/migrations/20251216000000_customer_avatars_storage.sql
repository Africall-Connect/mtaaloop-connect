-- Create storage bucket for customer profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-avatars',
  'customer-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for customer avatars
CREATE POLICY "Anyone can view customer avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-avatars');

CREATE POLICY "Authenticated users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'customer-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-avatars' AND
  (storage.foldername(name))[1] = 'avatars'
);
