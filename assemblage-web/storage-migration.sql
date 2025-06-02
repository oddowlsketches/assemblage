-- Storage Migration SQL
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for collages (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('collages', 'collages', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the collages bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for authenticated users to upload their own collages
CREATE POLICY "Users can upload their own collages" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'collages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Create policy for users to view their own collages
CREATE POLICY "Users can view their own collages" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'collages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Create policy for users to delete their own collages
CREATE POLICY "Users can delete their own collages" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'collages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Add storage_key column to saved_collages table
ALTER TABLE saved_collages 
ADD COLUMN IF NOT EXISTS storage_key TEXT;

-- 7. Create index on storage_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_collages_storage_key 
ON saved_collages(storage_key);

-- 8. Migration function to move existing collages to storage
CREATE OR REPLACE FUNCTION migrate_collages_to_storage()
RETURNS TABLE (
    migrated_count INT,
    error_count INT
) AS $$
DECLARE
    collage_record RECORD;
    storage_path TEXT;
    migrated INT := 0;
    errors INT := 0;
BEGIN
    -- Process each collage with image data
    FOR collage_record IN 
        SELECT id, user_id, image_data_url 
        FROM saved_collages 
        WHERE image_data_url IS NOT NULL 
        AND storage_key IS NULL
        LIMIT 100 -- Process in batches
    LOOP
        BEGIN
            -- Generate storage path: user_id/collage_id.png
            storage_path := collage_record.user_id || '/' || collage_record.id || '.png';
            
            -- Note: Actual file upload must be done via the client
            -- This just updates the database reference
            
            -- Update the record with storage key
            UPDATE saved_collages 
            SET storage_key = storage_path
            WHERE id = collage_record.id;
            
            migrated := migrated + 1;
        EXCEPTION WHEN OTHERS THEN
            errors := errors + 1;
            RAISE WARNING 'Error processing collage %: %', collage_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT migrated, errors;
END;
$$ LANGUAGE plpgsql;

-- Note: The actual migration of image data to storage needs to be done
-- via a client script since we can't directly upload to storage from SQL
