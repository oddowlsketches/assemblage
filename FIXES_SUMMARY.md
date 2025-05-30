# Assemblage App Fix Summary

## Changes Made

### 1. Database Schema Fix (Migration: 20250529_fix_images_collections_fk.sql)
- Added `user_collection_id` column to images table for user uploads
- Added `file_hash` column for deduplication of local uploads
- Updated unique constraints:
  - `(provider, file_hash)` for uploads
  - `(provider, remote_id)` for external providers
- Added CHECK constraint ensuring correct FK usage based on provider
- Updated RLS policies to properly separate CMS vs user content

### 2. Global Supabase Client (src/lib/supabaseClient.ts)
- Created TypeScript version alongside existing JS file
- Ensures single instance using window global
- Prevents "Multiple GoTrueClient instances" warnings

### 3. Upload Hook Updates (src/hooks/useImageUpload.ts)
- Added SHA-256 file hash calculation for deduplication
- Updated to use `user_collection_id` for uploads (not `collection_id`)
- Added provider='upload' to all uploaded images
- Checks for existing files before uploading to prevent duplicates

### 4. UploadModal UI Fixes (src/components/UploadModal.jsx)
- Fixed sticky footer positioning
- Hide drag instructions when files are selected
- Show smaller "Add more" dropzone after initial selection
- Fixed collection selector to be properly interactive
- Changed file preview grid to flex wrap layout
- Fixed modal overflow handling

### 5. SourceSelector Refactor (src/components/SourceSelector.jsx)
- Complete rewrite to 3-button layout:
  - Button 1: Library dropdown (Default + user collections)
  - Button 2: Image actions (Upload, Dropbox, Saved Collages)
  - Button 3: Collection management gear
- Fixed text wrapping with `whitespace: nowrap` and `minWidth: 12rem`
- Proper dropdown management with refs

### 6. CollectionDrawer Updates (src/components/CollectionDrawer.jsx)
- Removed Default Library card (ID 00000000-0000-0000-0000-000000000001)
- Updated image counts to use `user_collection_id` for uploads
- Added "View Images" button with TODO route placeholder
- Already creates corresponding image_collections entry on new collection

### 7. App.jsx Integration
- Imported and integrated new SourceSelector component
- Removed old inline dropdown implementation
- Connected all handlers properly

## Manual Test Checklist

### Prerequisites
```bash
# Apply database migration
npm run supabase:migrate

# Start dev server
npm run dev
```

### Test Cases

1. **Multiple Supabase Clients Warning**
   - [ ] Open browser console
   - [ ] Navigate around the app
   - [ ] Verify NO "Multiple GoTrueClient instances" warnings appear

2. **Upload Flow**
   - [ ] Click image icon → "Upload Images"
   - [ ] Verify collection dropdown is interactive
   - [ ] Select a collection from dropdown
   - [ ] Drag & drop multiple images
   - [ ] Verify drag instructions disappear after adding files
   - [ ] Verify footer buttons stay at bottom
   - [ ] Click Upload
   - [ ] Verify successful upload without 409 errors

3. **Duplicate File Handling**
   - [ ] Upload an image
   - [ ] Try uploading the same image again
   - [ ] Verify it completes instantly (deduplication working)

4. **Source Selector UI**
   - [ ] Verify 3 buttons appear: Library dropdown, Image icon, Gear icon
   - [ ] Click Library dropdown
   - [ ] Verify text doesn't wrap in dropdown
   - [ ] Verify Default Library and user collections appear
   - [ ] Select a different collection
   - [ ] Verify it loads correctly

5. **Collection Management**
   - [ ] Click gear icon
   - [ ] Verify My Collections drawer opens
   - [ ] Verify Default Library is NOT shown
   - [ ] Create a new collection
   - [ ] Verify it appears in Library dropdown
   - [ ] Click "View Images" on a collection
   - [ ] Verify TODO alert appears

6. **Image Actions Menu**
   - [ ] Click image icon
   - [ ] Verify dropdown shows: Upload Images, Connect Dropbox, Saved Collages
   - [ ] Test each option works as expected

## Edge Cases Handled
- Empty file hash for remote_id nulls
- CMS images use collection_id, uploads use user_collection_id
- Prevents uploading to Default Library
- Handles auth state changes properly
- Collection creation creates both user_collections AND image_collections entries

## Known Limitations
- View Images page not implemented (shows TODO)
- Dropbox integration not fully implemented
- Mobile menu may need updates for new 3-button layout

## Total Diff Size
Approximately 180 lines changed across 7 files.