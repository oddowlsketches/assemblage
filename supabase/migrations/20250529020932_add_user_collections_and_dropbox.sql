-- 20250529020932_add_user_collections_and_dropbox.sql
-- Add user collections and Dropbox token support

-- 1. Create user_collections table
CREATE TABLE IF NOT EXISTS public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. ALTER TABLE images to add new columns
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'upload' CHECK (provider IN ('upload', 'dropbox', 'cms')),
ADD COLUMN IF NOT EXISTS remote_id text,
ADD COLUMN IF NOT EXISTS thumb_src text;

-- Update existing collection_id to reference user_collections instead
-- First, drop NOT NULL constraint if it exists to allow NULL values
ALTER TABLE public.images ALTER COLUMN collection_id DROP NOT NULL;

-- Clear existing collection_id values to avoid foreign key conflicts
UPDATE public.images SET collection_id = NULL WHERE collection_id IS NOT NULL;

-- Drop existing constraint if it exists
ALTER TABLE public.images 
DROP CONSTRAINT IF EXISTS images_collection_id_fkey;

-- Add new constraint safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'images_collection_id_fkey'
    ) THEN
        ALTER TABLE public.images 
        ADD CONSTRAINT images_collection_id_fkey 
        FOREIGN KEY (collection_id) 
        REFERENCES public.user_collections(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create external_tokens table (Dropbox only)
CREATE TABLE IF NOT EXISTS public.external_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider = 'dropbox'),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 4. RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- user_collections policies (owner only) - Safe creation
DROP POLICY IF EXISTS "Users can view their own collections" ON public.user_collections;
CREATE POLICY "Users can view their own collections" 
  ON public.user_collections FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own collections" ON public.user_collections;
CREATE POLICY "Users can insert their own collections" 
  ON public.user_collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON public.user_collections;
CREATE POLICY "Users can update their own collections" 
  ON public.user_collections FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON public.user_collections;
CREATE POLICY "Users can delete their own collections" 
  ON public.user_collections FOR DELETE 
  USING (auth.uid() = user_id);

-- external_tokens policies (owner only) - Safe creation
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.external_tokens;
CREATE POLICY "Users can view their own tokens" 
  ON public.external_tokens FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.external_tokens;
CREATE POLICY "Users can insert their own tokens" 
  ON public.external_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tokens" ON public.external_tokens;
CREATE POLICY "Users can update their own tokens" 
  ON public.external_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.external_tokens;
CREATE POLICY "Users can delete their own tokens" 
  ON public.external_tokens FOR DELETE 
  USING (auth.uid() = user_id);

-- images policies (SELECT: provider='cms' OR user_id=auth.uid(); INSERT/UPDATE/DELETE owner only)
-- First drop existing policies if any
DROP POLICY IF EXISTS "Public can view images" ON public.images;
DROP POLICY IF EXISTS "Anyone can view images" ON public.images;
DROP POLICY IF EXISTS "Users can view CMS or their own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;

CREATE POLICY "Users can view CMS or their own images" 
  ON public.images FOR SELECT 
  USING (provider = 'cms' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" 
  ON public.images FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" 
  ON public.images FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
  ON public.images FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Unique index on images(provider, remote_id) where remote_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_provider_remote_id 
ON public.images(provider, remote_id) 
WHERE remote_id IS NOT NULL;

-- 6. Create storage bucket for user images (handled separately in storage policies)
-- Note: Storage bucket creation must be done via Supabase dashboard or CLI
-- The bucket should be named 'user-images' with public GET and signed PUT

-- Add updated_at trigger for external_tokens - Safe creation
DROP TRIGGER IF EXISTS handle_external_tokens_updated_at ON public.external_tokens;
CREATE TRIGGER handle_external_tokens_updated_at
  BEFORE UPDATE ON public.external_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_provider ON public.images(provider);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON public.user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_external_tokens_user_id ON public.external_tokens(user_id);

-- Migrate existing image_collections data to user_collections (if needed)
-- This assumes existing collections should be available to all users as templates
-- and new user-specific collections will be created fresh
