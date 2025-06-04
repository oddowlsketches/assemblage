# Template Shape Count and Blend Mode Updates Summary

## Changes Made:

### 1. **Created scaleToCover utility** (`src/lib/layout/scaleToCover.ts`)
- Scales masks to cover at least 90% of target cell area
- Maintains aspect ratio with maxZoom constraint
- Includes comprehensive unit tests

### 2. **Created templateDefaults configuration** (`src/templates/templateDefaults.js`)
- Defines default shape counts for each template:
  - photoStrip: 3 (already optimal)
  - floatingElements: 5
  - moodBoardTemplate: 9
  - scrambledMosaic: 12 (already optimal)
  - pairedForms: 6
  - tilingTemplate: 16
  - crystalEffect: 8
  - dynamicArchitecturalTemplate: 10
  - layeredGeometric: 7
  - mixedMediaTemplate: 8
  - slicedTemplate: 6 (already optimal)
  - packedShapesTemplate: 15
  - narrativeGrid: 9
  - doubleExposure: 2 (already optimal)

### 3. **Updated templates to use getShapeCount()**
- All templates now respect `params.requestedShapes` with default fallbacks
- Removed hard-coded element counts and "spawnMoreIfBlank" logic

### 4. **Fixed blend modes for color images**
- Color images without echo/color blocks now use 'normal' blend mode
- Prevents muddy appearance when multiply is applied to color photos
- B&W images continue to use 'multiply' blend mode as before

### 5. **Templates updated:**
- ✅ floatingElements.js - Increased minimum element sizes
- ✅ tilingTemplate.js - Dynamic grid size based on shape count
- ✅ packedShapesTemplate.js - Uses shape count from defaults
- ✅ layeredGeometric.js - Respects shape count, improved coverage
- ✅ moodBoardTemplate.js - Uses shape count, fixed blend modes
- ✅ narrativeGrid.js - Fixed color image blend mode
- ✅ mixedMediaTemplate.js - Adjusted for fewer, larger elements

### 6. **Templates NOT modified** (already working well):
- photoStrip.js
- slicedTemplate.js
- scrambledMosaic.js
- doubleExposure.js

## Key Improvements:
1. **Fewer, larger shapes** - Better visibility for color photographs
2. **Proper blend modes** - Color images look cleaner without multiply
3. **Consistent API** - All templates use same shape count system
4. **Better coverage** - Larger minimum sizes ensure canvas is filled

## Testing Steps:
1. Generate collages with color photographs
2. Verify shapes are larger and more legible
3. Check that color images appear clear (not muddy)
4. Test with `requestedShapes` parameter to override defaults
5. Verify canvas coverage is good with fewer elements
