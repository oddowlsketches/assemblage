-- 0006_add_saved_collages_table.sql
-- Add saved_collages table for user-saved collages

-- Saved Collages table for user authentication features
CREATE TABLE IF NOT EXISTS public.saved_collages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  image_data_url text NOT NULL, -- Base64 encoded image data
  thumbnail_url text, -- Optional smaller thumbnail
  template_key text, -- Which template was used
  template_params jsonb DEFAULT '{}', -- Template parameters used
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for saved_collages
ALTER TABLE public.saved_collages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved collages
CREATE POLICY "Users can view their own saved collages" 
  ON public.saved_collages FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own saved collages
CREATE POLICY "Users can insert their own saved collages" 
  ON public.saved_collages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved collages
CREATE POLICY "Users can update their own saved collages" 
  ON public.saved_collages FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own saved collages
CREATE POLICY "Users can delete their own saved collages" 
  ON public.saved_collages FOR DELETE 
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_saved_collages_updated_at
  BEFORE UPDATE ON public.saved_collages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
