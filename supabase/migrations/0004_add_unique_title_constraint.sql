-- 0004_add_unique_title_constraint.sql
-- Add a unique constraint on the title column to prevent duplicate images
ALTER TABLE public.images
  ADD CONSTRAINT images_title_unique UNIQUE (title); 