-- Temporary fix to update images with error status to complete
-- This allows them to show up in the UI while we fix the metadata column issue

-- First, update any images with error status to complete
UPDATE public.images 
SET metadata_status = 'complete'
WHERE metadata_status = 'error' 
  AND provider = 'upload';

-- Also update any that are stuck in processing
UPDATE public.images 
SET metadata_status = 'complete'
WHERE metadata_status = 'processing' 
  AND provider = 'upload'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Show count of updated images
SELECT 
  COUNT(*) as updated_count,
  provider,
  metadata_status
FROM public.images
WHERE provider = 'upload'
GROUP BY provider, metadata_status;
