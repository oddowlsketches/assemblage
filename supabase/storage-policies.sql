-- Storage bucket policies for Supabase
-- Run these in the Supabase SQL editor after creating the buckets

-- 1. Create storage buckets (if they don't exist)
-- Note: Buckets must be created via Supabase dashboard or CLI first

-- 2. Storage policies for cms-images bucket
-- Allow public read access
CREATE POLICY "Public can view CMS images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-images');

-- Only service role can upload to CMS bucket
CREATE POLICY "Service role can upload CMS images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'cms-images');

-- Only service role can update CMS images
CREATE POLICY "Service role can update CMS images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'cms-images');

-- Only service role can delete CMS images
CREATE POLICY "Service role can delete CMS images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'cms-images');

-- 3. Storage policies for user-images bucket
-- Allow public read access
CREATE POLICY "Public can view user images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-images');

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role has full access to user-images
CREATE POLICY "Service role full access to user images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');
