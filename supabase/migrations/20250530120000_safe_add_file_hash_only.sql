-- SAFE migration that only adds file_hash without breaking anything

-- 1. Add file_hash column for deduplication (non-breaking)
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 2. Add retry_count for metadata processing (non-breaking)
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- 3. Create function to list pending images (non-breaking)
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

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION list_pending_images TO service_role;

-- 5. Create index for file_hash lookups (non-breaking)
CREATE INDEX IF NOT EXISTS idx_images_file_hash_lookup 
ON public.images(file_hash) 
WHERE file_hash IS NOT NULL;

-- This migration does NOT:
-- - Change any foreign keys
-- - Move any data
-- - Add any constraints that could break existing functionality
