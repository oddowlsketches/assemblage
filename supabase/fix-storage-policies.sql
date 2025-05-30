-- Clean up and reset storage policies

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_2" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;

-- Now check if buckets exist and create appropriate policies
DO $$ 
DECLARE
  user_images_exists boolean;
  cms_images_exists boolean;
BEGIN
  -- Check if buckets exist
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'user-images') INTO user_images_exists;
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'cms-images') INTO cms_images_exists;
  
  -- Create policies for user-images bucket if it exists
  IF user_images_exists THEN
    -- Public read access
    CREATE POLICY "Anyone can view user images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-images');

    -- Authenticated users can upload to their own folder
    CREATE POLICY "Users can upload to their folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Users can update their own images
    CREATE POLICY "Users can update own images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Users can delete their own images
    CREATE POLICY "Users can delete own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
    
    RAISE NOTICE 'Created policies for user-images bucket';
  ELSE
    RAISE NOTICE 'user-images bucket does not exist';
  END IF;
  
  -- Create policies for cms-images bucket if it exists
  IF cms_images_exists THEN
    -- Public read access
    CREATE POLICY "Anyone can view CMS images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cms-images');

    -- Only service role can manage CMS images
    CREATE POLICY "Service role manages CMS images"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'cms-images')
    WITH CHECK (bucket_id = 'cms-images');
    
    RAISE NOTICE 'Created policies for cms-images bucket';
  ELSE
    RAISE NOTICE 'cms-images bucket does not exist';
  END IF;
END $$;

-- Show the final state
SELECT 
  'Storage Policies' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- List buckets
SELECT 
  id as bucket_name,
  public as is_public,
  created_at
FROM storage.buckets
ORDER BY created_at;
