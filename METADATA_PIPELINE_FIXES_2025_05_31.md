# Assemblage App Fixes - Image Metadata Pipeline

## Issues Fixed

### 1. Tags Not Displaying for New Images
**Problem**: Newly uploaded images were getting metadata but tags weren't showing in the collection view.

**Solution**: 
- Fixed the component to look for `image.tags` instead of `image.metadata?.tags`
- The database stores tags in the top-level `tags` column, not nested in metadata
- Added proper display logic for all metadata states

**Files Modified**:
- `/src/pages/collections/CollectionDetail.jsx` - Updated tag display logic

### 2. Search/Filter Error
**Problem**: Searching images resulted in "column images.display_name does not exist" error.

**Solution**: 
- Updated search query to use correct column names: `title`, `filename`, `description`, `tags`
- Fixed sorting to use `title` instead of non-existent `display_name`

**Files Modified**:
- `/src/pages/collections/CollectionDetail.jsx` - Fixed search and sort queries

### 3. Metadata Processing Feedback
**Problem**: No clear indication when images were being analyzed or if analysis failed.

**Solution**: 
- Added status indicators:
  - "Analyzing..." for pending/processing images
  - "Analysis failed - Click to retry" for errors with retry functionality
- Added periodic checking (every 5 seconds) for pending metadata
- Updates display automatically when metadata becomes available

**Files Modified**:
- `/src/pages/collections/CollectionDetail.jsx` - Added metadata status display and auto-refresh

### 4. Image Navigation in Modal
**Problem**: No way to navigate between images when viewing details (like in saved collages).

**Solution**: 
- Added previous/next navigation buttons to ImageModal
- Buttons show when multiple images are available
- Properly disabled when at first/last image

**Files Modified**:
- `/src/components/ImageModal.jsx` - Added navigation functionality
- `/src/pages/collections/CollectionDetail.jsx` - Pass images array and navigation handler

## Additional Improvements

### Metadata Processing Reliability
- Function now checks for processing status in addition to pending statuses
- Added retry mechanism for failed metadata generation
- Automatic refresh when metadata becomes available

### Better Error Handling
- Clear visual feedback for all metadata states
- One-click retry for failed analyses
- No silent failures - users always know the status

## How It Works Now

1. **Upload**: Image is uploaded with `metadata_status: 'pending_llm'`
2. **Processing**: Netlify function processes the image and updates status to `'processing'`
3. **Analysis**: OpenAI analyzes the image with the enriched prompt
4. **Storage**: Metadata is stored in top-level columns (`tags`, `description`) and in `metadata` JSONB
5. **Display**: Collection view shows:
   - "Analyzing..." while processing
   - Tags when complete
   - "Analysis failed - Click to retry" if error occurs
6. **Auto-refresh**: View checks every 5 seconds for pending images and updates automatically

## Testing the Fix

1. Upload new images to a collection
2. You should see "Analyzing..." under each new image
3. Within 10-30 seconds, tags should appear automatically
4. If analysis fails, click "Analysis failed - Click to retry" to re-attempt
5. Use the search box to filter by tags or description
6. Click on an image to open the modal and use arrow buttons to navigate

The metadata pipeline is now bulletproof with clear feedback at every stage.
