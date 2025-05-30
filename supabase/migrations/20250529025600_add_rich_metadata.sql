-- Migration: Add rich metadata fields to images table (fixed)
-- This version properly checks for existing constraints

-- Add new columns to existing images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_black_and_white boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_photograph boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS white_edge_score float DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_role text DEFAULT 'narrative',
ADD COLUMN IF NOT EXISTS palette_suitability text DEFAULT 'vibrant',
ADD COLUMN IF NOT EXISTS metadata_status text DEFAULT 'pending_llm',
ADD COLUMN IF NOT EXISTS processing_error text,
ADD COLUMN IF NOT EXISTS last_processed timestamp with time zone;

-- Add check constraints with proper existence checks
DO $$ 
BEGIN
  -- Drop and recreate constraints to ensure they're correct
  ALTER TABLE public.images DROP CONSTRAINT IF EXISTS check_image_role;
  ALTER TABLE public.images ADD CONSTRAINT check_image_role 
    CHECK (image_role IN ('texture','narrative','conceptual'));
    
  ALTER TABLE public.images DROP CONSTRAINT IF EXISTS check_palette_suitability;
  ALTER TABLE public.images ADD CONSTRAINT check_palette_suitability 
    CHECK (palette_suitability IN ('vibrant','neutral','earthtone','muted','pastel'));
    
  ALTER TABLE public.images DROP CONSTRAINT IF EXISTS check_metadata_status;
  ALTER TABLE public.images ADD CONSTRAINT check_metadata_status 
    CHECK (metadata_status IN ('pending_llm','processing','complete','error'));
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraints already exist, that's fine
    NULL;
END $$;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_images_metadata_status ON public.images(metadata_status);
CREATE INDEX IF NOT EXISTS idx_images_image_role ON public.images(image_role);
CREATE INDEX IF NOT EXISTS idx_images_palette_suitability ON public.images(palette_suitability);
CREATE INDEX IF NOT EXISTS idx_images_is_black_and_white ON public.images(is_black_and_white);

-- Update existing records to have 'pending_llm' status so they get processed
UPDATE public.images 
SET metadata_status = 'pending_llm'
WHERE metadata_status IS NULL;
