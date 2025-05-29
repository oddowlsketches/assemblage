-- 20250529022600_debug_images.sql
-- Debug: Check if images table has any data, add test image if empty

-- This will show us in the migration output how many images exist
-- (The SELECT result will appear in migration logs)
DO $$
DECLARE
    image_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO image_count FROM public.images;
    RAISE NOTICE 'Current image count: %', image_count;
    
    -- If no images exist, add a test image
    IF image_count = 0 THEN
        RAISE NOTICE 'No images found, inserting test image';
        INSERT INTO public.images (
            id, 
            src, 
            title, 
            description, 
            tags, 
            image_role, 
            provider, 
            collection_id
        ) VALUES (
            gen_random_uuid(),
            'https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Test+Image',
            'Test Image',
            'Test image for debugging',
            ARRAY['test', 'debug'],
            'narrative',
            'cms',
            '88844a5d-81b7-4007-a718-09a4ed3e3811'::uuid
        );
        RAISE NOTICE 'Test image inserted';
    ELSE
        RAISE NOTICE 'Images exist, ensuring they have correct collection_id';
        UPDATE public.images 
        SET collection_id = '88844a5d-81b7-4007-a718-09a4ed3e3811'::uuid
        WHERE collection_id IS NULL OR collection_id != '88844a5d-81b7-4007-a718-09a4ed3e3811'::uuid;
    END IF;
END $$; 