-- Check images missing descriptions
-- Run this in Supabase SQL Editor to see how many need reprocessing

SELECT 
  COUNT(*) as total_images,
  COUNT(description) as with_description,
  COUNT(*) - COUNT(description) as missing_description,
  COUNT(CASE WHEN description = '' THEN 1 END) as empty_description
FROM public.images;

-- Show specific images missing descriptions
SELECT id, title, src, metadata_status, description, last_processed
FROM public.images 
WHERE description IS NULL OR description = ''
ORDER BY created_at DESC
LIMIT 20;
