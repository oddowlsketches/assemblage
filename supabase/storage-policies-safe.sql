-- Storage bucket policies for Supabase
-- This version checks for existing policies before creating them

-- For cms-images bucket
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can view CMS images" ON storage.objects;
  DROP POLICY IF EXISTS "Service role can upload CMS images" ON storage.objects;
  DROP POLICY IF EXISTS "Service role can update CMS images" ON storage.objects;
  DROP POLICY IF EXISTS "Service role can delete CMS images" ON storage.objects;
  
  -- Create policies for cms-images
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'cms-images') THEN
    CREATE POLICY "Public can view CMS images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cms-images');

    CREATE POLICY "Service role can upload CMS images"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'cms-images');

    CREATE POLICY "Service role can update CMS images"
    ON storage.objects FOR UPDATE
    TO service_role
    USING (bucket_id = 'cms-images');

    CREATE POLICY "Service role can delete CMS images"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'cms-images');
  END IF;
END $$;

-- For user-images bucket
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
  DROP POLICY IF EXISTS "Service role full access to user images" ON storage.objects;
  
  -- Create policies for user-images
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-images') THEN
    CREATE POLICY "Public can view user images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-images');

    CREATE POLICY "Users can upload their own images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users can update their own images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users can delete their own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'user-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Service role full access to user images"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'user-images')
    WITH CHECK (bucket_id = 'user-images');
  END IF;
END $$;

-- Check what policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%images%'
ORDER BY policyname;
