-- Function to list images from either default collection or user collection
-- This handles the OR logic for public vs private collections cleanly

CREATE OR REPLACE FUNCTION list_images(collection_uuid uuid)
RETURNS SETOF images
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    default_collection_id uuid := '00000000-0000-0000-0000-000000000001';
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Log for debugging
    RAISE NOTICE 'list_images called with collection_uuid: %, current_user_id: %', collection_uuid, current_user_id;
    
    -- If no user is logged in and it's not the default collection, return empty
    IF current_user_id IS NULL AND collection_uuid != default_collection_id THEN
        RETURN;
    END IF;
    
    -- If it's the default collection, return CMS images
    IF collection_uuid = default_collection_id THEN
        RETURN QUERY
        SELECT * FROM images
        WHERE collection_id = default_collection_id
        AND provider = 'cms'
        ORDER BY created_at DESC;
    ELSE
        -- Otherwise, return user collection images
        -- Include all uploaded images for the collection
        RETURN QUERY
        SELECT * FROM images
        WHERE user_collection_id = collection_uuid
        AND user_id = current_user_id
        AND provider = 'upload'
        ORDER BY created_at DESC;
    END IF;
END;
$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION list_images(uuid) TO authenticated;

-- Also allow anonymous users to access the default collection
GRANT EXECUTE ON FUNCTION list_images(uuid) TO anon;