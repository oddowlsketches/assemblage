-- 0007_add_image_collections.sql
-- Add image collections functionality

-- Create image_collections table
CREATE TABLE IF NOT EXISTS public.image_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add collection_id column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.image_collections(id) ON DELETE SET NULL;

-- Enable RLS for image_collections
ALTER TABLE public.image_collections ENABLE ROW LEVEL SECURITY;

-- Allow public to read collections
CREATE POLICY "Public can view image collections" 
  ON public.image_collections FOR SELECT 
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_images_collection_id ON public.images(collection_id);

-- Add updated_at trigger for image_collections
CREATE TRIGGER handle_image_collections_updated_at
  BEFORE UPDATE ON public.image_collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default collections
INSERT INTO public.image_collections (id, name, description) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Default Collection', 'Default collection for images'),
  ('00000000-0000-0000-0000-000000000002', 'Architecture', 'Architectural photographs and drawings'),
  ('00000000-0000-0000-0000-000000000003', 'Nature', 'Natural landscapes and organic forms'),
  ('00000000-0000-0000-0000-000000000004', 'Abstract', 'Abstract compositions and textures')
ON CONFLICT (id) DO NOTHING;
