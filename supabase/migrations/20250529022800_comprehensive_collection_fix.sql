-- 20250529022800_comprehensive_collection_fix.sql
-- Comprehensive fix: ensure images are available in ALL collections

-- Create all the collections the app might look for
DELETE FROM public.image_collections WHERE id IN (
    '215c3f9e-70ff-45e5-95e4-413565b38b0f',
    '88844a5d-81b7-4007-a718-09a4ed3e3811', 
    '5cd28f2a-8169-4f75-aece-bfb82233f9f8'
);

INSERT INTO public.image_collections (id, name) VALUES 
  ('215c3f9e-70ff-45e5-95e4-413565b38b0f', 'Main Gallery'),
  ('88844a5d-81b7-4007-a718-09a4ed3e3811', 'Current Gallery'),
  ('5cd28f2a-8169-4f75-aece-bfb82233f9f8', 'Active Gallery');

-- Set all images to point to the NEWEST collection the app is looking for
UPDATE public.images 
SET collection_id = '5cd28f2a-8169-4f75-aece-bfb82233f9f8'::uuid;

-- Also create duplicate image records for the other collections so images appear in all of them
-- This ensures no matter which collection the app picks, it finds images
INSERT INTO public.images (id, src, title, description, tags, image_role, provider, collection_id)
SELECT 
    gen_random_uuid(),
    src, 
    title, 
    description, 
    tags, 
    image_role, 
    provider,
    '215c3f9e-70ff-45e5-95e4-413565b38b0f'::uuid
FROM public.images 
WHERE collection_id = '5cd28f2a-8169-4f75-aece-bfb82233f9f8'::uuid
LIMIT 50; -- Limit to avoid too many duplicates

INSERT INTO public.images (id, src, title, description, tags, image_role, provider, collection_id)
SELECT 
    gen_random_uuid(),
    src, 
    title, 
    description, 
    tags, 
    image_role, 
    provider,
    '88844a5d-81b7-4007-a718-09a4ed3e3811'::uuid
FROM public.images 
WHERE collection_id = '5cd28f2a-8169-4f75-aece-bfb82233f9f8'::uuid
LIMIT 50; -- Limit to avoid too many duplicates

-- Ensure all images are CMS provider
UPDATE public.images SET provider = 'cms'; 