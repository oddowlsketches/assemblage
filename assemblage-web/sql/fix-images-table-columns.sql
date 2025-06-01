-- Add missing columns to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Update the check constraint if needed
ALTER TABLE public.images 
DROP CONSTRAINT IF EXISTS check_metadata_status;

ALTER TABLE public.images 
ADD CONSTRAINT check_metadata_status 
CHECK (metadata_status IN ('pending', 'pending_llm', 'processing', 'complete', 'error', 'skipped'));

-- Add comment to explain column usage
COMMENT ON COLUMN public.images.archived IS 'Whether the image has been archived/soft deleted by the user';
