-- 20250529023100_debug_query.sql
-- Debug: Check what the frontend query actually returns

DO $$
DECLARE
    total_images INTEGER;
    collection_images INTEGER;
    sample_record RECORD;
BEGIN
    -- Check total images
    SELECT COUNT(*) INTO total_images FROM public.images;
    RAISE NOTICE 'Total images in database: %', total_images;
    
    -- Check images in the specific collection
    SELECT COUNT(*) INTO collection_images 
    FROM public.images 
    WHERE collection_id = '00000000-0000-0000-0000-000000000001'::uuid;
    RAISE NOTICE 'Images in collection 00000000-0000-0000-0000-000000000001: %', collection_images;
    
    -- Show a sample record to see what data looks like
    SELECT id, src, image_role, collection_id, is_black_and_white, created_at
    INTO sample_record
    FROM public.images 
    WHERE collection_id = '00000000-0000-0000-0000-000000000001'::uuid
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Sample record - ID: %, src: %, image_role: %, collection_id: %, is_black_and_white: %', 
            sample_record.id, sample_record.src, sample_record.image_role, sample_record.collection_id, sample_record.is_black_and_white;
    ELSE
        RAISE NOTICE 'No records found in target collection';
    END IF;
    
    -- Check what collection_ids actually exist
    FOR sample_record IN 
        SELECT DISTINCT collection_id, COUNT(*) as count 
        FROM public.images 
        GROUP BY collection_id 
        ORDER BY count DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Collection ID: % has % images', sample_record.collection_id, sample_record.count;
    END LOOP;
    
END $$; 