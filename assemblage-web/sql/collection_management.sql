-- Add is_public column to image_collections if it doesn't exist
ALTER TABLE image_collections 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add description column if it doesn't exist
ALTER TABLE image_collections 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create an RPC function to update collection visibility
CREATE OR REPLACE FUNCTION update_collection_visibility(
  collection_id UUID,
  make_public BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE image_collections
  SET is_public = make_public
  WHERE id = collection_id;
END;
$$;

-- Create an RPC function to update collection details
CREATE OR REPLACE FUNCTION update_collection_details(
  collection_id UUID,
  new_name TEXT,
  new_description TEXT,
  new_is_public BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE image_collections
  SET 
    name = new_name,
    description = new_description,
    is_public = new_is_public
  WHERE id = collection_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_collection_visibility TO authenticated;
GRANT EXECUTE ON FUNCTION update_collection_details TO authenticated;