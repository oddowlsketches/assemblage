-- 20250529023000_add_missing_columns.sql
-- Add missing columns that frontend expects

-- Add is_black_and_white column if it doesn't exist
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS is_black_and_white BOOLEAN DEFAULT false;

-- Add created_at column if it doesn't exist (for ordering)
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update all images to have proper defaults
UPDATE public.images 
SET 
    is_black_and_white = COALESCE(is_black_and_white, false),
    created_at = COALESCE(created_at, now()),
    collection_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE collection_id != '00000000-0000-0000-0000-000000000001'::uuid OR collection_id IS NULL;

-- Make sure all required fields are not null
UPDATE public.images 
SET 
    provider = COALESCE(provider, 'cms'),
    image_role = COALESCE(image_role, 'narrative')
WHERE provider IS NULL OR image_role IS NULL; 