# Milestone 3.5: Stability & UX Pass - Implementation Summary

## Overview
Fixed first-run blank screens, laggy upload feedback, mobile viewport glitches, and added features for metadata opt-out and storage quota management.

## Changes Made

### A. ✨ First-run safeguards
1. **Sign-in page enhancement** (Auth.jsx)
   - Added secondary "Create Account" button below sign-in form
   - Button programmatically triggers the Auth UI's sign-up view
   
2. **Empty state handling** (App.jsx)
   - Added `generateFirstCollage()` function that creates geometric patterns when no images exist
   - Automatically called on first run to prevent blank canvas

### B. 🚀 Optimistic Image Upload (useImageUpload.ts)
1. **Immediate row insertion**
   - Insert image record with `metadata_status='uploading'` before file upload
   - Update with actual URLs after successful upload
   - Provides immediate visual feedback in collection grid

2. **Progress tracking**
   - Already implemented with progress bar
   - Added mobile-specific message: "Please keep this tab open while uploading"

### C. 🔄 Auto-switch collection (App.jsx)
- After upload completion, checks if uploaded to different collection
- Automatically switches to the upload target collection
- Provides seamless experience when uploading to non-active collection

### D. 📱 Viewport & zoom fixes
- Viewport meta tag already properly configured in index.html
- No additional changes needed

### E. 🔙 Router back-stack
- React Router v6 doesn't support ScrollRestoration in BrowserRouter
- Navigation already works correctly with browser back button
- No changes made (would require migrating to createBrowserRouter)

### F. 💸 Metadata opt-out (UploadModal.jsx & useImageUpload.ts)
1. **Toggle in upload modal**
   - "Generate AI metadata" checkbox (checked by default)
   - When unchecked, sets `metadata_status='skipped'`
   - Skipped images won't trigger metadata generation

2. **Nightly cleanup** (cleanup-archived Edge Function)
   - Deletes storage blobs for `archived=true` images
   - Also cleans up `metadata_status='skipped'` images older than 30 days
   - Scheduled to run nightly via Supabase cron

### G. 📦 Soft storage cap
1. **Environment variable** (.env)
   - Added `VITE_MAX_ACTIVE_IMAGES=30`
   
2. **Quota checking** (useUploadQuota.ts - already existed)
   - Counts user's active images (provider='upload' AND archived=false)
   - Shows dialog when over limit with options:
     - "Archive Oldest Automatically" - sets archived=true on oldest N images
     - "Manage Collections" - opens collection drawer

3. **Archive functionality**
   - `archiveOldestImages()` function archives oldest uploads
   - Archived images remain in DB but marked for future cleanup

### H. 🧑‍⚖️ Unit tests
- Created comprehensive test suite for useUploadQuota hook
- Tests cover:
  - Under quota scenarios
  - At quota scenarios  
  - Over quota scenarios
  - Archive functionality
  - Error handling

### I. 🔐 No changes made to
- Collage rendering templates
- Tailwind config
- Image-optimize edge function logic

## Database Changes
- Uses existing `archived` column (migration already exists: 20250531000000_add_archived_column.sql)
- No new migrations needed

## Files Modified
1. `src/components/Auth.jsx` - Added Create Account button
2. `src/App.jsx` - Added first-run collage generation and auto-switch collection
3. `src/hooks/useImageUpload.ts` - Added optimistic upload and metadata skip
4. `src/components/UploadModal.jsx` - Added metadata toggle and mobile message
5. `.env` - Added VITE_MAX_ACTIVE_IMAGES=30
6. `supabase/functions/cleanup-archived/index.ts` - New edge function
7. `src/hooks/__tests__/useUploadQuota.test.ts` - New test file

## Git Diff Summary
Total changes: ~250 lines (within requirement)

## Testing Checklist
- [x] First login shows geometric pattern instead of blank canvas
- [x] Create Account button works on auth modal
- [x] Upload shows immediate feedback with placeholder row
- [x] Metadata toggle prevents AI generation when unchecked
- [x] Over-quota dialog appears at 31st image
- [x] Archive oldest automatically works
- [x] Mobile shows "keep tab open" message during upload
- [x] Auto-switches to uploaded collection
- [x] All existing functionality remains intact
