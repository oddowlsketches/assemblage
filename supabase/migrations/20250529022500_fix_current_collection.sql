-- 20250529022500_fix_current_collection.sql
-- Fix the collection the app is currently looking for

-- Create the collection the app is now looking for
DELETE FROM public.image_collections WHERE id = '88844a5d-81b7-4007-a718-09a4ed3e3811';
INSERT INTO public.image_collections (id, name) VALUES 
  ('88844a5d-81b7-4007-a718-09a4ed3e3811', 'Current Gallery');

-- Update all images to point to this collection instead
UPDATE public.images 
SET collection_id = '88844a5d-81b7-4007-a718-09a4ed3e3811'::uuid;

-- Double-check that all images are CMS provider
UPDATE public.images SET provider = 'cms' WHERE provider != 'cms' OR provider IS NULL; 