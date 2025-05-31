-- Ensure default CMS collection exists and fix permissions
-- This script ensures the CMS can properly access collections

-- First ensure the default collection exists
INSERT INTO image_collections (id, name, description, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Library',
  'Default CMS image collection',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Enable RLS on image_collections if not already enabled
ALTER TABLE image_collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Public collections are viewable by anyone" ON image_collections;
DROP POLICY IF EXISTS "Authenticated users can view all collections" ON image_collections;
DROP POLICY IF EXISTS "Service role can manage collections" ON image_collections;

-- Create policies for image_collections
-- Allow anyone to view public collections
CREATE POLICY "Public collections are viewable by anyone" 
ON image_collections FOR SELECT 
USING (is_public = true);

-- Allow authenticated users to view all collections (for CMS)
CREATE POLICY "Authenticated users can view all collections" 
ON image_collections FOR SELECT 
TO authenticated
USING (true);

-- Allow service role to manage collections
CREATE POLICY "Service role can manage collections" 
ON image_collections FOR ALL 
TO service_role
USING (true);

-- Ensure images table has proper RLS policies for CMS
DROP POLICY IF EXISTS "CMS images are viewable by anyone" ON images;
DROP POLICY IF EXISTS "Service role has full access to images" ON images;

-- Allow viewing CMS images (those with collection_id)
CREATE POLICY "CMS images are viewable by anyone" 
ON images FOR SELECT 
USING (collection_id IS NOT NULL);

-- Service role can do everything
CREATE POLICY "Service role has full access to images" 
ON images FOR ALL 
TO service_role
USING (true);
