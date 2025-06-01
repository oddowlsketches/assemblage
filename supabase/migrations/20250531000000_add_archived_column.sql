-- Add archived column to images table for soft storage cap management
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add index for efficient querying of non-archived images
CREATE INDEX IF NOT EXISTS idx_images_archived ON public.images(archived);

-- Update RLS policies to consider archived status if needed
-- (Most queries will filter archived=false in application code)