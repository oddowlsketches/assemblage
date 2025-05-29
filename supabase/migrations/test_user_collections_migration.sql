-- Test script for user collections and Dropbox migrations
-- Run this after migrations to verify everything works

-- Test 1: Verify tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_collections'
) as user_collections_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'external_tokens'
) as external_tokens_exists;

-- Test 2: Verify columns on images table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'images'
AND column_name IN ('user_id', 'provider', 'remote_id', 'thumb_src')
ORDER BY column_name;

-- Test 3: Verify constraints
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('user_collections', 'external_tokens', 'images')
AND tc.constraint_type = 'FOREIGN KEY';

-- Test 4: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_collections', 'external_tokens', 'images');

-- Test 5: Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_collections', 'external_tokens', 'images')
ORDER BY tablename, policyname;

-- Test 6: Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_collections', 'external_tokens', 'images')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test 7: Verify storage bucket exists (will only work if second migration was run)
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-images';
