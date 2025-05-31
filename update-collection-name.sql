-- Update the default collection name and ensure it's public
UPDATE image_collections 
SET 
  name = 'Emily''s Treasures',
  is_public = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT id, name, is_public 
FROM image_collections 
WHERE id = '00000000-0000-0000-0000-000000000001';
