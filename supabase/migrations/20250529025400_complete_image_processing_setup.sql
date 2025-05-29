-- This migration cleans up and completes the image processing setup

-- First, check what columns already exist and add missing ones
DO $$ 
BEGIN
  -- Add retry_count if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'retry_count') THEN
    ALTER TABLE public.images ADD COLUMN retry_count INT DEFAULT 0;
  END IF;
  
  -- Add provider if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'provider') THEN
    ALTER TABLE public.images ADD COLUMN provider TEXT DEFAULT 'upload' 
      CHECK (provider IN ('upload', 'dropbox'));
  END IF;
END $$;

-- Enable pgvector extension for embeddings (optional)
DO $$ 
BEGIN
  -- Try to create vector extension, but don't fail if not available
  BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'pgvector extension not available, using JSONB for embeddings';
  END;
END $$;

-- Add embedding field (vector or JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'embedding') THEN
    -- Check if vector extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
      ALTER TABLE public.images ADD COLUMN embedding vector(1536);
    ELSE
      -- Fallback to JSONB
      ALTER TABLE public.images ADD COLUMN embedding JSONB;
    END IF;
  END IF;
END $$;

-- Create retry queue table
CREATE TABLE IF NOT EXISTS public.images_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create simple index for retry queue
CREATE INDEX IF NOT EXISTS idx_retry_queue_scheduled 
  ON public.images_retry_queue (scheduled_at);

-- Create embedding usage log table
CREATE TABLE IF NOT EXISTS public.embedding_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_in INT NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_log_user_created 
  ON public.embedding_usage_log (user_id, created_at);

-- Simple KV store for rate limiting
CREATE TABLE IF NOT EXISTS public.kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_kv_expires 
  ON public.kv_store (expires_at) 
  WHERE expires_at IS NOT NULL;

-- Add missing columns to images table
DO $$ 
BEGIN
  -- external_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'external_id') THEN
    ALTER TABLE public.images ADD COLUMN external_id TEXT;
  END IF;
  
  -- user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'user_id') THEN
    ALTER TABLE public.images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- palette
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'palette') THEN
    ALTER TABLE public.images ADD COLUMN palette TEXT[] DEFAULT '{}';
  END IF;
  
  -- dominant_color
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'dominant_color') THEN
    ALTER TABLE public.images ADD COLUMN dominant_color TEXT;
  END IF;
  
  -- thumbnail_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'images' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE public.images ADD COLUMN thumbnail_url TEXT;
  END IF;
END $$;

-- Create index for user_id if missing
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images (user_id);

-- Enable RLS on new tables
ALTER TABLE public.images_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Service role can manage retry queue" ON public.images_retry_queue;
CREATE POLICY "Service role can manage retry queue" ON public.images_retry_queue
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert usage logs" ON public.embedding_usage_log;
CREATE POLICY "Service role can insert usage logs" ON public.embedding_usage_log
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own usage logs" ON public.embedding_usage_log;
CREATE POLICY "Users can view own usage logs" ON public.embedding_usage_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage KV store" ON public.kv_store;
CREATE POLICY "Service role can manage KV store" ON public.kv_store
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Image processing setup completed successfully!';
END $$;
