-- Fix storage policies for all buckets

-- First, drop ALL existing image-related policies to start fresh
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_2" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;

-- Also drop any other existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can view user images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view CMS images" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages CMS images" ON storage.objects;

-- Create policies for user-images bucket
-- Public read access (anyone can view)
CREATE POLICY "Anyone can view user images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-images');

-- Only authenticated users can upload to their own folder
CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
USING (bucket_id = 'user-images' AND auth.role() = 'authenticated')
WITH CHECK (
  bucket_id = 'user-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own images
CREATE POLICY "Users update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own images
CREATE POLICY "Users delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for cms-images bucket
-- Public read access
CREATE POLICY "Anyone can view CMS images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-images');

-- Only service role can upload/modify CMS images
CREATE POLICY "Service role manages CMS images"
ON storage.objects FOR ALL
USING (bucket_id = 'cms-images' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'cms-images' AND auth.role() = 'service_role');

-- Create policies for the legacy 'images' bucket (if still in use)
-- Public read access
CREATE POLICY "Anyone can view legacy images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Authenticated users can manage their own images in legacy bucket
CREATE POLICY "Users manage own legacy images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for dev-images (similar to user-images)
CREATE POLICY "Anyone can view dev images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dev-images');

CREATE POLICY "Users manage own dev images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'dev-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'dev-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN policyname LIKE '%user-images%' OR policyname LIKE '%user images%' THEN 'user-images'
    WHEN policyname LIKE '%cms%' OR policyname LIKE '%CMS%' THEN 'cms-images'
    WHEN policyname LIKE '%legacy%' THEN 'images'
    WHEN policyname LIKE '%dev%' THEN 'dev-images'
    ELSE 'other'
  END as bucket_context
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY bucket_context, cmd;
