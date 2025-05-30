-- Add metadata column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Also ensure all other columns exist that the metadata function expects
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS image_role TEXT DEFAULT 'narrative';

-- Update the check constraint if needed
DO $$ 
BEGIN
  -- Drop and recreate the image_role constraint to ensure it exists
  ALTER TABLE public.images DROP CONSTRAINT IF EXISTS check_image_role;
  ALTER TABLE public.images ADD CONSTRAINT check_image_role 
    CHECK (image_role IN ('texture', 'narrative', 'conceptual'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
