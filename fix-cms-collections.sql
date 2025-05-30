-- Fix for CMS upload issue: Create default collection in image_collections table
-- This ensures the constraint images_collection_consistency is satisfied

-- First, check if the default collection exists
-- If not, create it
INSERT INTO image_collections (id, name, description, is_default, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Library',
  'Default CMS image collection',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure any other collections referenced in the images table exist
-- This query will identify any missing collections
SELECT DISTINCT i.collection_id
FROM images i
LEFT JOIN image_collections ic ON i.collection_id = ic.id
WHERE i.collection_id IS NOT NULL
  AND ic.id IS NULL;

-- If the above query returns any results, those collection_ids need to be added to image_collections