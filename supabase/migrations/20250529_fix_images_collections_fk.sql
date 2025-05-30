-- Fix images table foreign key and add proper constraints for user uploads

-- 1. Add user_collection_id column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS user_collection_id uuid REFERENCES public.user_collections(id) ON DELETE CASCADE;

-- 2. Add file_hash column for deduplication
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS file_hash text;

-- 3. Drop the existing unique constraint on (provider, remote_id)
DROP INDEX IF EXISTS idx_images_provider_remote_id;

-- 4. Create new unique constraint on (provider, file_hash) for upload deduplication
CREATE UNIQUE INDEX idx_images_provider_file_hash 
ON public.images(provider, file_hash) 
WHERE provider = 'upload' AND file_hash IS NOT NULL;

-- 5. Keep unique constraint for external providers (dropbox)
CREATE UNIQUE INDEX idx_images_provider_remote_id_external
ON public.images(provider, remote_id) 
WHERE provider != 'upload' AND remote_id IS NOT NULL;

-- 6. Fix the collection_id foreign key to point to image_collections
ALTER TABLE public.images 
DROP CONSTRAINT IF EXISTS images_collection_id_fkey;

ALTER TABLE public.images 
ADD CONSTRAINT images_collection_id_fkey 
FOREIGN KEY (collection_id) 
REFERENCES public.image_collections(id) 
ON DELETE SET NULL;

-- 7. Add CHECK constraint to ensure correct FK usage based on provider
ALTER TABLE public.images
ADD CONSTRAINT images_collection_consistency CHECK (
  CASE
    WHEN provider = 'cms' THEN collection_id IS NOT NULL AND user_collection_id IS NULL
    WHEN provider = 'upload' THEN user_collection_id IS NOT NULL AND collection_id IS NULL
    WHEN provider = 'dropbox' THEN user_collection_id IS NOT NULL AND collection_id IS NULL
    ELSE TRUE
  END
);

-- 8. Update RLS policies for images table
DROP POLICY IF EXISTS "Users can view CMS or their own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;

-- Allow viewing CMS images for everyone, and user's own images
CREATE POLICY "View images based on provider" 
  ON public.images FOR SELECT 
  USING (
    provider = 'cms' 
    OR (provider IN ('upload', 'dropbox') AND auth.uid() = user_id)
  );

-- Allow users to insert their own images
CREATE POLICY "Users insert own images" 
  ON public.images FOR INSERT 
  WITH CHECK (
    provider IN ('upload', 'dropbox') 
    AND auth.uid() = user_id
  );

-- Allow users to update their own images
CREATE POLICY "Users update own images" 
  ON public.images FOR UPDATE 
  USING (
    provider IN ('upload', 'dropbox') 
    AND auth.uid() = user_id
  );

-- Allow users to delete their own images
CREATE POLICY "Users delete own images" 
  ON public.images FOR DELETE 
  USING (
    provider IN ('upload', 'dropbox') 
    AND auth.uid() = user_id
  );

-- 9. Create index on file_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_file_hash ON public.images(file_hash) WHERE file_hash IS NOT NULL;

-- 10. Create index on user_collection_id
CREATE INDEX IF NOT EXISTS idx_images_user_collection_id ON public.images(user_collection_id) WHERE user_collection_id IS NOT NULL;
