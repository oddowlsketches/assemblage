# Debugging Upload Issues

## The Problem
The 400 (Bad Request) errors indicate that the database is rejecting queries that reference columns that don't exist yet:
- `user_collection_id` 
- `file_hash`

## Solution Steps

### 1. Apply the Database Migration

First, check if the migration has been applied:

```bash
# Check current migrations
npx supabase db list

# Apply the migration if not already applied
npx supabase db push
```

Or manually in Supabase Dashboard:
1. Go to SQL Editor
2. Run the migration from: `supabase/migrations/20250529_fix_images_collections_fk.sql`

### 2. Verify Columns Exist

Run this SQL in Supabase Dashboard to check:

```sql
-- Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name IN ('user_collection_id', 'file_hash', 'provider')
ORDER BY column_name;
```

You should see:
- `file_hash` (text, nullable)
- `provider` (text, not null)
- `user_collection_id` (uuid, nullable)

### 3. Check Existing Data

```sql
-- Check if there are any existing images that might violate the new constraints
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN provider = 'cms' THEN 1 END) as cms_images,
    COUNT(CASE WHEN provider = 'upload' THEN 1 END) as upload_images,
    COUNT(CASE WHEN provider IS NULL THEN 1 END) as null_provider
FROM images;
```

### 4. If Migration Fails

If the migration fails due to existing data, you might need to:

```sql
-- First, update any NULL providers to 'cms' (assuming existing images are CMS)
UPDATE images 
SET provider = 'cms' 
WHERE provider IS NULL;

-- Then ensure CMS images have collection_id set
UPDATE images 
SET collection_id = '00000000-0000-0000-0000-000000000001'
WHERE provider = 'cms' AND collection_id IS NULL;
```

### 5. Test Upload

After applying the migration, test uploading:
1. Create a new collection
2. Upload an image to that collection
3. Check browser console for errors

## Multiple Supabase Instance Warning

This has been fixed by using a consistent global variable `window.__supabaseGlobalInstance` across all files.

## Expected Behavior After Fix

1. No more 400 errors when uploading
2. No "Multiple GoTrueClient instances" warnings
3. Duplicate uploads should be detected and skipped
4. Images should properly associate with user collections
