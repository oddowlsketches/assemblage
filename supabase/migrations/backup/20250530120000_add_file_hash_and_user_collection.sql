-- Add file_hash column and related functionality for improved upload pipeline
-- This is a simplified version that only adds what's missing

-- 1. Add file_hash column for deduplication (if not exists)
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 2. Create unique constraint on file_hash for deduplication
-- But allow multiple NULL values (for legacy data and external sources)
DROP INDEX IF EXISTS idx_images_file_hash;
CREATE UNIQUE INDEX idx_images_file_hash 
ON public.images(file_hash) 
WHERE file_hash IS NOT NULL;

-- 3. Add/update constraint to ensure proper collection assignment
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS check_collection_consistency;
ALTER TABLE public.images ADD CONSTRAINT check_collection_consistency
CHECK (
  (provider = 'cms' AND user_collection_id IS NULL) OR
  (provider IN ('upload', 'dropbox') AND collection_id IS NULL AND user_collection_id IS NOT NULL)
);

-- 4. Add retry_count column if missing (for metadata processing)
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- 5. Create function to list pending images for batch processing
CREATE OR REPLACE FUNCTION list_pending_images(batch_size INT DEFAULT 25)
RETURNS TABLE (
  id TEXT,
  src TEXT,
  thumb_src TEXT,
  provider TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.src,
    i.thumb_src,
    i.provider
  FROM public.images i
  WHERE i.metadata_status = 'pending_llm'
    AND (i.retry_count IS NULL OR i.retry_count < 3)
  ORDER BY i.created_at ASC
  LIMIT batch_size;
END;
$$;

-- 6. Grant execute permission to service role
GRANT EXECUTE ON FUNCTION list_pending_images TO service_role;

-- 7. Create index on file_hash for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_images_file_hash_lookup 
ON public.images(file_hash) 
WHERE file_hash IS NOT NULL;
