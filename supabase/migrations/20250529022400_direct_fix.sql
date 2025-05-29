-- 20250529022400_direct_fix.sql
-- Direct fix without touching triggers

-- Drop foreign key constraint temporarily
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_collection_id_fkey;

-- Simple insert without fancy ON CONFLICT (avoid trigger issues)
-- First delete if exists, then insert
DELETE FROM public.image_collections WHERE id = '215c3f9e-70ff-45e5-95e4-413565b38b0f';
INSERT INTO public.image_collections (id, name) VALUES 
  ('215c3f9e-70ff-45e5-95e4-413565b38b0f', 'Main Gallery');

-- Update all images to point to this collection
UPDATE public.images 
SET collection_id = '215c3f9e-70ff-45e5-95e4-413565b38b0f'::uuid;

-- Ensure all images are CMS provider (already done but making sure)
UPDATE public.images SET provider = 'cms';

-- Re-add the foreign key constraint pointing to image_collections
ALTER TABLE public.images 
ADD CONSTRAINT images_collection_id_fkey 
FOREIGN KEY (collection_id) 
REFERENCES public.image_collections(id) 
ON DELETE SET NULL; 