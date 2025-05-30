# Upload Error Fix Summary

## Changes Made

### 1. Fixed the constraint violation
The error `new row for relation "images" violates check constraint "images_collection_consistency"` was caused by not explicitly setting `collection_id` to NULL for uploads.

**Fixed in:** `src/hooks/useImageUpload.ts`
```typescript
// Now explicitly sets:
collection_id: null, // Must be NULL for uploads
user_collection_id: collectionId,
remote_id: null, // Also NULL for uploads
```

### 2. Fixed Multiple Supabase Instances
The `useSupabase.ts` hook was creating its own instance instead of using the global one.

**Fixed in:** `src/hooks/useSupabase.ts`
- Now imports and uses the shared global instance

## Remaining Issues

The 406 (Not Acceptable) errors on GET requests suggest the column might not exist or there's an RLS issue. 

## Quick Database Check

Run this in Supabase SQL Editor to verify the columns exist:

```sql
-- Check the actual columns in the images table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'images'
  AND column_name IN ('user_collection_id', 'file_hash', 'provider', 'collection_id', 'remote_id')
ORDER BY column_name;
```

## If columns are missing

If any columns are missing, run this:

```sql
-- Add missing columns if needed
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS user_collection_id uuid REFERENCES public.user_collections(id) ON DELETE CASCADE;

ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS file_hash text;

-- Check if constraint already exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'images_collection_consistency'
    ) THEN
        ALTER TABLE public.images
        ADD CONSTRAINT images_collection_consistency CHECK (
          CASE
            WHEN provider = 'cms' THEN collection_id IS NOT NULL AND user_collection_id IS NULL
            WHEN provider = 'upload' THEN user_collection_id IS NOT NULL AND collection_id IS NULL
            WHEN provider = 'dropbox' THEN user_collection_id IS NOT NULL AND collection_id IS NULL
            ELSE TRUE
          END
        );
    END IF;
END $$;
```

## Test After Fix

1. Restart the dev server to ensure all changes are loaded
2. Create a new collection
3. Try uploading images again

The errors should now be resolved!
