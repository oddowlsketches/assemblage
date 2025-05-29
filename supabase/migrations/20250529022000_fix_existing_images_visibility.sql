-- 20250529022000_fix_existing_images_visibility.sql
-- Fix existing images to be publicly visible after RLS policy changes

-- Update all existing images to have provider = 'cms' so they're publicly viewable
-- This makes them accessible under the new RLS policy: "provider = 'cms' OR auth.uid() = user_id"
UPDATE public.images 
SET provider = 'cms' 
WHERE provider = 'upload' OR provider IS NULL;

-- Add a comment for documentation
COMMENT ON TABLE public.images IS 'Images table - existing images set to provider=cms for public visibility'; 