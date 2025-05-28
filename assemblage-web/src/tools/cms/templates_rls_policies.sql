-- RLS policies for templates table
-- Run this in Supabase SQL Editor

-- Enable RLS on templates table (might already be enabled)
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read templates (needed for the app to work)
CREATE POLICY "Allow anonymous read access to templates"
  ON public.templates
  FOR SELECT
  USING (true);

-- Allow anonymous users to insert templates (for CMS seeding)
-- Note: In production, you might want to restrict this to authenticated users
CREATE POLICY "Allow anonymous insert access to templates"
  ON public.templates
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to update templates (for CMS management)
CREATE POLICY "Allow anonymous update access to templates"
  ON public.templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete templates (for CMS management)
CREATE POLICY "Allow anonymous delete access to templates"
  ON public.templates
  FOR DELETE
  USING (true);
