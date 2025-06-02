-- Storage Optimization SQL
-- This implements storage limits and optimizations for Assemblage

-- 1. Create user-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-images', 'user-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add new columns to images table for storage optimization
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS storage_key_original TEXT,
ADD COLUMN IF NOT EXISTS storage_key_thumb TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS is_bw BOOLEAN DEFAULT false;

-- 3. Create function to check user storage limits
CREATE OR REPLACE FUNCTION check_user_storage_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_image_count INTEGER;
    user_total_bytes BIGINT;
    max_images CONSTANT INTEGER := 30;
    max_bytes CONSTANT BIGINT := 15 * 1024 * 1024; -- 15MB
BEGIN
    -- Only check for uploaded images (not CMS images)
    IF NEW.provider = 'upload' AND NEW.archived = false THEN
        -- Count existing active images for this user
        SELECT COUNT(*), COALESCE(SUM(size_bytes), 0)
        INTO user_image_count, user_total_bytes
        FROM public.images
        WHERE user_id = NEW.user_id
        AND provider = 'upload'
        AND archived = false;
        
        -- Check if limits would be exceeded
        IF user_image_count >= max_images THEN
            RAISE check_violation USING 
                MESSAGE = 'Storage limit exceeded',
                DETAIL = json_build_object(
                    'error', 'IMAGE_COUNT_LIMIT',
                    'message', format('You have reached the limit of %s images. Please delete or archive some images before uploading more.', max_images),
                    'current_count', user_image_count,
                    'max_count', max_images
                )::text;
        END IF;
        
        IF user_total_bytes + COALESCE(NEW.size_bytes, 0) > max_bytes THEN
            RAISE check_violation USING 
                MESSAGE = 'Storage limit exceeded',
                DETAIL = json_build_object(
                    'error', 'STORAGE_SIZE_LIMIT',
                    'message', format('You have reached the storage limit of %s MB. Please delete or archive some images before uploading more.', max_bytes / 1024 / 1024),
                    'current_size_mb', user_total_bytes::float / 1024 / 1024,
                    'max_size_mb', max_bytes::float / 1024 / 1024,
                    'new_file_size_mb', COALESCE(NEW.size_bytes, 0)::float / 1024 / 1024
                )::text;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for storage limit checking
DROP TRIGGER IF EXISTS check_user_storage_limit_trigger ON public.images;
CREATE TRIGGER check_user_storage_limit_trigger
    BEFORE INSERT ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION check_user_storage_limit();

-- 5. Storage bucket policies for user-images
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow public to view all images (since bucket is public)
CREATE POLICY "Public can view all images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'user-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 6. Function to get user storage stats
CREATE OR REPLACE FUNCTION get_user_storage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'image_count', COUNT(*)::int,
        'total_size_bytes', COALESCE(SUM(size_bytes), 0)::bigint,
        'total_size_mb', ROUND(COALESCE(SUM(size_bytes), 0)::numeric / 1024 / 1024, 2),
        'max_images', 30,
        'max_size_mb', 15,
        'remaining_images', GREATEST(0, 30 - COUNT(*)::int),
        'remaining_size_mb', ROUND(GREATEST(0, 15 - COALESCE(SUM(size_bytes), 0)::numeric / 1024 / 1024), 2)
    ) INTO stats
    FROM public.images
    WHERE user_id = p_user_id
    AND provider = 'upload'
    AND archived = false;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- 7. Migration function for existing images
CREATE OR REPLACE FUNCTION migrate_existing_images_to_storage()
RETURNS TABLE (
    migrated_count INT,
    error_count INT,
    total_size_mb NUMERIC
) AS $$
DECLARE
    img_record RECORD;
    migrated INT := 0;
    errors INT := 0;
    total_bytes BIGINT := 0;
BEGIN
    -- Process images that have src but no storage_key_original
    FOR img_record IN 
        SELECT id, src, thumb_src, user_id
        FROM public.images 
        WHERE provider = 'upload'
        AND storage_key_original IS NULL
        AND src IS NOT NULL
        LIMIT 100 -- Process in batches
    LOOP
        BEGIN
            -- Extract storage keys from URLs
            -- Assuming URLs like: https://domain/storage/v1/object/public/user-images/user_id/timestamp_filename
            UPDATE public.images 
            SET 
                storage_key_original = substring(src from 'user-images/(.+)$'),
                storage_key_thumb = substring(thumb_src from 'user-images/(.+)$')
            WHERE id = img_record.id;
            
            migrated := migrated + 1;
        EXCEPTION WHEN OTHERS THEN
            errors := errors + 1;
            RAISE WARNING 'Error processing image %: %', img_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Calculate total storage used
    SELECT COALESCE(SUM(size_bytes), 0) INTO total_bytes
    FROM public.images
    WHERE provider = 'upload'
    AND archived = false;
    
    RETURN QUERY SELECT migrated, errors, ROUND(total_bytes::numeric / 1024 / 1024, 2);
END;
$$ LANGUAGE plpgsql;

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_user_storage 
ON public.images(user_id, provider, archived) 
WHERE provider = 'upload';

CREATE INDEX IF NOT EXISTS idx_images_storage_keys 
ON public.images(storage_key_original, storage_key_thumb);

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_storage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_existing_images_to_storage() TO authenticated;

-- Note: Run the migration function after updating the application code:
-- SELECT * FROM migrate_existing_images_to_storage();
