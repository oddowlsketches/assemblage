-- Storage Migration SQL
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for collages (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('collages', 'collages', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the collages bucket
-- Note: storage.objects table already has RLS enabled by Supabase

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

-- 8. Migration helper function to identify collages that need migration
CREATE OR REPLACE FUNCTION count_collages_to_migrate()
RETURNS TABLE (
    total_collages BIGINT,
    migrated_collages BIGINT,
    pending_migration BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_collages,
        COUNT(CASE WHEN storage_key IS NOT NULL THEN 1 END) as migrated_collages,
        COUNT(CASE WHEN storage_key IS NULL AND image_data_url IS NOT NULL THEN 1 END) as pending_migration
    FROM saved_collages;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to prepare collages for migration (marks them but doesn't upload)
CREATE OR REPLACE FUNCTION prepare_collages_for_migration(batch_size INT DEFAULT 100)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    created_at TIMESTAMPTZ,
    proposed_storage_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.title,
        sc.created_at,
        sc.user_id::text || '/' || sc.id::text || '.png' as proposed_storage_key
    FROM saved_collages sc
    WHERE sc.storage_key IS NULL 
    AND sc.image_data_url IS NOT NULL
    ORDER BY sc.created_at DESC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Run this to see migration status:
-- SELECT * FROM count_collages_to_migrate();

-- Run this to see which collages would be migrated:
-- SELECT * FROM prepare_collages_for_migration(10);
