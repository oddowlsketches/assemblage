# Rich Metadata Implementation for Assemblage

This implementation adds enhanced metadata capabilities to your existing Assemblage app, enabling smarter collage generation based on image characteristics.

## What's Added

### New Database Fields
- `is_black_and_white`: Boolean - whether image is primarily B&W
- `is_photograph`: Boolean - photograph vs illustration
- `white_edge_score`: Float - fraction of white pixels at image borders (0-1)
- `image_role`: Enum - texture/narrative/conceptual for layout decisions
- `palette_suitability`: Enum - vibrant/neutral/earthtone/muted/pastel
- `metadata_status`: Processing status tracking
- `processing_error`: Error messages from AI processing
- `last_processed`: Timestamp of last metadata update

### Enhanced Features
- **Automatic AI Analysis**: OpenAI Vision API analyzes uploaded images
- **Rich CMS Interface**: Edit metadata manually with visual interface
- **Smart Categorization**: Images automatically classified for better collage composition
- **Reprocessing**: Re-analyze images with updated prompts
- **Error Handling**: Track and retry failed processing

## Installation Steps

### 1. Update Database Schema
```bash
# Run the migration to add new columns
node dev-scripts/runMigration.mjs
```

Or manually run the SQL in your Supabase SQL Editor:
```sql
-- Copy content from: supabase/migrations/add_rich_metadata.sql
```

### 2. Process Existing Images
```bash
# Analyze all existing images with AI
node dev-scripts/updateImageMetadata.mjs
```

This will:
- Queue all existing images for processing
- Use OpenAI Vision API to analyze each image
- Extract rich metadata automatically
- Handle errors gracefully with retry logic

### 3. Access Enhanced CMS
Open your CMS at `/cms.html` to see:
- Enhanced image details modal
- Visual metadata editing
- Processing status indicators
- Reprocessing capabilities

## Usage

### Automatic Processing
New uploads will automatically:
1. Get analyzed by OpenAI Vision API
2. Have metadata extracted and stored
3. Be available for smart collage generation

### Manual Editing
In the CMS:
1. Click any image to open details modal
2. Click "Edit" to modify metadata
3. Use "Reprocess" to re-analyze with AI
4. Save changes to update database

### Smart Collage Generation
Your collage generation can now use:
```javascript
// Filter by image role
const textureImages = images.filter(img => img.image_role === 'texture');
const narrativeImages = images.filter(img => img.image_role === 'narrative');

// Filter by palette compatibility
const vibrantImages = images.filter(img => img.palette_suitability === 'vibrant');

// Filter by type
const bwImages = images.filter(img => img.is_black_and_white);
const photos = images.filter(img => img.is_photograph);
```

## Future Enhancements

### Phase 2: Palette & Mask Management
- Dynamic color palette management
- Custom mask upload and editing
- Template parameter tuning

### Phase 3: Smart Composition
- Rule-based image selection
- Theme-based groupings
- User preference learning

## API Costs

OpenAI Vision API costs approximately:
- $0.00425 per image (low detail mode)
- ~$0.43 for 100 images
- Processing is one-time per image

## Configuration

Environment variables needed:
```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Files Modified/Added

### Database
- `supabase/schema.sql` - Updated with new fields
- `supabase/migrations/add_rich_metadata.sql` - Migration script

### Scripts
- `dev-scripts/updateImageMetadata.mjs` - Bulk metadata processing
- `dev-scripts/runMigration.mjs` - Database migration runner

### Frontend
- `src/utils/imageAnalysis.js` - Client-side image analysis utilities
- `src/tools/cms/index.tsx` - Enhanced CMS with metadata editing

This implementation maintains backward compatibility while adding powerful new capabilities for intelligent collage generation.
