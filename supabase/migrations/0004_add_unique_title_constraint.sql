-- 0004_add_unique_title_constraint.sql
-- Add a unique constraint on the title column to prevent duplicate images
-- Safe version: only add constraint if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'images_title_unique'
    ) THEN
        ALTER TABLE public.images
        ADD CONSTRAINT images_title_unique UNIQUE (title);
    END IF;
END $$; 