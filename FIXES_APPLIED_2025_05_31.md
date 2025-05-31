# Assemblage App Fixes Summary

## Issues Addressed

### 1. Collection Dropdown Not Showing User Collections
**Problem**: The collection dropdown was inconsistently showing user collections, especially after errors or on refresh.

**Solution**: 
- Updated `loadCollections()` to always fetch the default collection first
- Enhanced error handling to ensure the default collection is shown even if other queries fail
- Updated `fetchUserCollectionsForSelect()` to handle both authenticated and unauthenticated states
- For regular users, now shows both public collections and their own collections

**Files Modified**:
- `/src/App.jsx` - Enhanced collection loading logic

### 2. 404 Error on Collection Detail Page Refresh
**Problem**: When refreshing the page on `/collections/:id`, users would get a 404 error.

**Solution**: 
- Added SPA redirect rule to `netlify.toml` to handle client-side routing
- All routes now properly redirect to index.html with a 200 status

**Files Modified**:
- `/netlify.toml` - Added redirect rule for SPA

### 3. AI Prompt Tone Too Poetic/Flowery
**Problem**: The AI-generated descriptions were too poetic and not practical for image selection.

**Solution**: 
- Updated the Netlify function to use the enriched prompt from the CMS
- Changed default prompt to be more descriptive and analytical
- Added support for additional metadata fields (image_role, is_black_and_white, is_photograph, white_edge_score, palette_suitability)
- The prompt now focuses on practical description rather than poetic language

**Files Modified**:
- `/netlify/functions/process-user-image-metadata.js` - Updated to use CMS prompts and improved default prompt

### 4. CMS Save Error for AI Prompts
**Problem**: Saving AI prompts in the CMS resulted in a row-level security policy error.

**Solution**: 
- Created SQL script to fix kv_store table permissions
- Added proper RLS policies for authenticated users to write to kv_store
- Maintained read access for all users

**Files Created**:
- `/sql/fix-kv-store-permissions.sql` - SQL script to fix permissions

## Next Steps

1. **Deploy the changes** to see them take effect
2. **Run the SQL script** in Supabase to fix the kv_store permissions:
   ```sql
   -- Run the contents of /sql/fix-kv-store-permissions.sql in Supabase SQL editor
   ```
3. **Test the AI prompt customization** in the CMS after fixing permissions
4. **Monitor new image uploads** to ensure they get better, more practical descriptions

## Additional Improvements Made

- Better error handling throughout the collection loading process
- More consistent collection name display
- Improved metadata validation to handle the enriched prompt format
- Added backward compatibility for images without captions
