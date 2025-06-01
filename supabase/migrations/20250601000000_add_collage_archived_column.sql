-- Add archived column to saved_collages table for quota management
ALTER TABLE public.saved_collages 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add index for efficient querying of non-archived collages
CREATE INDEX IF NOT EXISTS idx_saved_collages_archived ON public.saved_collages(archived);

-- Update existing collages to not be archived
UPDATE public.saved_collages SET archived = false WHERE archived IS NULL; 