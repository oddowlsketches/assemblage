# Image Upload Pipeline Implementation

## Overview
This implementation provides a complete image upload pipeline with the following features:
- Direct-to-storage uploads for both CMS and user images
- SHA-1 based deduplication
- Automatic thumbnail generation
- Batch metadata processing using OpenAI
- Client-side image optimization
- Real-time progress feedback

## Database Migration
Run the following migration to add necessary columns:
```bash
supabase db push
```

The migration adds:
- `file_hash` column for deduplication
- `user_collection_id` for user uploads
- Unique constraint on `file_hash`
- Check constraint to ensure proper collection assignment
- `list_pending_images` function for batch processing

## Storage Buckets Setup

### 1. Create Storage Buckets
In Supabase Dashboard:
1. Go to Storage
2. Create two buckets:
   - `cms-images` (public)
   - `user-images` (public)

### 2. Apply Storage Policies
Run the SQL in `supabase/storage-policies.sql` to set up proper access controls.

## Edge Functions Setup

### 1. Deploy Edge Functions
```bash
# Deploy image optimization function
supabase functions deploy optimize-image

# Deploy metadata processing function  
supabase functions deploy enqueue-metadata
```

### 2. Set Up Storage Triggers
In Supabase Dashboard, create a database webhook:
- Table: `storage.objects`
- Events: INSERT
- Function: `optimize-image`

### 3. Schedule Metadata Processing
Set up a cron job to run `enqueue-metadata` every 5 minutes:
```sql
SELECT cron.schedule(
  'process-image-metadata',
  '*/5 * * * *',
  'SELECT net.http_post(
    url := ''https://YOUR_PROJECT.supabase.co/functions/v1/enqueue-metadata'',
    headers := jsonb_build_object(''Authorization'', ''Bearer YOUR_ANON_KEY'')
  );'
);
```

## Client-Side Changes

### Key Updates:
1. **Image Compression**: All images are now optimized to max 4k pixels
2. **SHA-1 Hashing**: Used for deduplication across collections
3. **Duplicate Detection**: Clear error messages when duplicates are found
4. **Progress Tracking**: Real-time upload progress display

## API Endpoints

### User Image Upload (existing)
- Uses `useImageUpload` hook
- Direct upload to `user-images/{user_id}/` bucket
- Automatic thumbnail generation
- Metadata processing via Netlify function

### CMS Image Upload (new)
- Endpoint: `/.netlify/functions/upload-cms-image`
- Requires service role authentication
- Uploads to `cms-images/originals/` bucket
- Same deduplication and metadata processing

## Testing Checklist

### User Upload Flow:
- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Try uploading duplicate (should show error)
- [ ] Verify thumbnails are generated
- [ ] Check metadata is processed after ~30 seconds
- [ ] Verify images appear in collection

### CMS Upload Flow:
- [ ] Upload via CMS interface
- [ ] Verify deduplication works
- [ ] Check images are publicly accessible
- [ ] Verify metadata processing

### Performance:
- [ ] Large images (>5MB) are compressed
- [ ] Upload progress shows accurately
- [ ] Multiple uploads process in parallel
- [ ] Thumbnails load quickly

### Error Handling:
- [ ] Network errors show appropriate message
- [ ] Duplicate uploads show clear explanation
- [ ] Failed uploads can be retried
- [ ] Partial batch failures handled gracefully

## Monitoring

### Check Upload Status:
```sql
-- View pending metadata processing
SELECT id, title, metadata_status, retry_count 
FROM images 
WHERE metadata_status = 'pending_llm'
ORDER BY created_at DESC;

-- Check for errors
SELECT id, title, processing_error 
FROM images 
WHERE metadata_status = 'error';
```

### Storage Usage:
```sql
-- Check storage usage by user
SELECT 
  user_id,
  COUNT(*) as image_count,
  SUM(pg_size_pretty(length(src))::bigint) as approx_size
FROM images
WHERE provider = 'upload'
GROUP BY user_id;
```

## Future Enhancements
1. **Dropbox Integration**: Already scaffolded, just needs OAuth flow
2. **NYPL/External Sources**: Can reuse the same pipeline
3. **Custom Resize Options**: Allow users to choose quality/size tradeoffs
4. **Bulk Operations**: Select multiple images for batch actions
5. **Advanced Deduplication**: Perceptual hashing for similar images
