# Storage Optimization Implementation Summary

## Overview
This implementation optimizes storage usage for Assemblage by implementing client-side image processing, storage limits, and efficient thumbnail generation to keep the total storage under 1GB while prototyping.

## Key Changes

### 1. Database Schema Updates (`sql/storage-optimization.sql`)
- Added new columns to `images` table:
  - `storage_key_original` - Storage path for original image
  - `storage_key_thumb` - Storage path for thumbnail
  - `width`, `height` - Image dimensions
  - `size_bytes` - File size in bytes
  - `is_bw` - Whether image is black and white
- Created trigger `check_user_storage_limit_trigger` to enforce:
  - **30 images maximum per user**
  - **15MB total storage per user**
- Added function `get_user_storage_stats()` for real-time quota tracking
- Created proper storage bucket policies for `user-images`

### 2. Client-Side Image Processing (`hooks/useImageUpload.ts`)
- **Resize**: Images larger than 2560px are resized (maintaining aspect ratio)
- **Compress**: 85% JPEG quality or WebP when supported
- **Thumbnail**: 400px JPEG thumbnails generated client-side
- **Black & White Detection**: Automatic detection for better organization
- **File Deduplication**: SHA-1 hash prevents duplicate uploads

### 3. UI Updates (`components/UploadModal.jsx`)
- Real-time storage statistics display (X/30 images, Y/15 MB used)
- Clear error messages when limits are exceeded
- Information about automatic resizing and compression

### 4. Migration Script (`migrate-images-storage.js`)
- Updates existing images with storage optimization data
- Extracts storage keys from existing URLs
- Calculates approximate dimensions and file sizes

## Storage Calculations

With these limits, the maximum storage usage will be:
- **Per user**: 15MB original images + ~3MB thumbnails = ~18MB total
- **100 users**: 1.8GB maximum (but realistically much less)
- **Current usage**: 0.66GB → will likely reduce after migration due to compression

## How It Works

1. **Upload Flow**:
   ```
   User selects images → Validate file type/size → 
   Resize to max 2560px → Compress to 85% JPEG/WebP →
   Generate 400px thumbnail → Check storage limits →
   Upload both files → Save metadata to database
   ```

2. **Storage Limit Enforcement**:
   - Database trigger checks limits BEFORE insert
   - Prevents exceeding 30 images or 15MB
   - Returns user-friendly error messages
   - UI shows current usage statistics

3. **Optimization Benefits**:
   - ~70% reduction in file size through compression
   - Thumbnails prevent loading full images in galleries
   - WebP support where available (even smaller files)
   - Client-side processing reduces server load

## Running the Migration

1. First, apply the SQL changes:
   ```sql
   -- Run sql/storage-optimization.sql in Supabase SQL Editor
   ```

2. Update environment variables if needed:
   ```
   VITE_MAX_ACTIVE_IMAGES=30  # Optional, defaults to 30
   ```

3. Run the migration script (optional, for existing images):
   ```bash
   cd assemblage-web
   node migrate-images-storage.js
   ```

## Error Handling

The system provides clear error messages:
- "You have reached the limit of 30 images..."
- "You have reached the storage limit of 15 MB..."
- Shows current usage and suggests archiving old images

## Future Enhancements

- Automatic archival of old images to cold storage
- Image quality selector (low/medium/high)
- Batch processing progress for large uploads
- Storage analytics dashboard
