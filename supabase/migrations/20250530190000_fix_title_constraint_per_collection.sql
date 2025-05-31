-- Fix title constraint to allow duplicate titles across collections
-- but prevent duplicates within the same collection

-- First, drop the existing unique constraint on title alone
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_title_unique;

-- Add a composite unique constraint on (title, collection_id)
-- This allows the same title in different collections
ALTER TABLE public.images 
ADD CONSTRAINT images_title_collection_unique 
UNIQUE NULLS NOT DISTINCT (title, collection_id);

-- Also add a constraint for user collections
ALTER TABLE public.images 
ADD CONSTRAINT images_title_user_collection_unique 
UNIQUE NULLS NOT DISTINCT (title, user_collection_id);

-- Add a check constraint to ensure images have either collection_id OR user_collection_id (but not both)
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_collection_check;
ALTER TABLE public.images 
ADD CONSTRAINT images_collection_check 
CHECK (
  (collection_id IS NOT NULL AND user_collection_id IS NULL) OR 
  (collection_id IS NULL AND user_collection_id IS NOT NULL)
);
