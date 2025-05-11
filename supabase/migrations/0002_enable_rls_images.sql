-- 0002_enable_rls_images.sql
-- Enable RLS on images table and allow public SELECT

-- Turn on row level security (if not on)
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to select all rows
CREATE POLICY "Public can select images"
  ON public.images
  FOR SELECT
  USING (true); 