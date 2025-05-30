CREATE OR REPLACE FUNCTION setup_default_cms_collection()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  default_collection_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert the default collection if it doesn't exist
  INSERT INTO image_collections (id, name, description, is_public)
  VALUES (
    default_collection_id,
    'Default Library',
    'Default CMS image collection',
    false
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Run the function to create the default collection
SELECT setup_default_cms_collection();

-- Verify the constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'images_collection_consistency';