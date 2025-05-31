# CMS Upload Fix - Deployment Guide

## Issues Fixed
1. **Duplicate title constraint** - Changed from global unique constraint to per-collection unique constraint
2. **Collection permissions** - Fixed RLS policies for image_collections table
3. **CMS image visibility** - Ensured CMS images are properly viewable

## SQL Scripts to Run in Supabase

### 1. First, run the constraint fix migration:
```sql
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
```

### 2. Then run the permissions fix:
```sql
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
```

## Deploy the Code Changes

```bash
cd /Users/emilyschwartzman/assemblage-app
git add -A
git commit -m "Fix CMS upload: per-collection unique titles and permissions"
git push
```

## What This Fixes
1. **Upload errors** - You can now upload images with the same filename to different collections
2. **Collection access** - The CMS can properly fetch and display collections
3. **Image visibility** - CMS images are properly viewable in the app

After running these SQL scripts and deploying, the CMS upload pipeline should work correctly!
