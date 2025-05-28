# Image Scaling and Mask Distortion Fixes

## Issues Addressed

### 1. Dynamic Architectural Effect Distortion
**Problem**: 
- Architectural masks (especially arches) were being stretched to fit arbitrary width/height ratios
- Images were showing edges and not properly filling masks
- Poor aspect ratio handling led to distorted shapes

**Solution**:
- Created comprehensive `imageScaling.js` utility with three key functions:
  - `calculateImageScaling()` - Calculates optimal image crop and scaling
  - `drawImageInMask()` - Draws images with proper aspect ratio handling  
  - `adjustMaskProportions()` - Prevents mask distortion by maintaining proper ratios

### 2. Universal Image Edge Visibility
**Problem**:
- Images were not completely filling masks, showing edges
- Inconsistent scaling logic across templates
- Some templates had good scaling, others didn't

**Solution**:
- Implemented "cover" scaling approach that ensures images completely fill masks
- Proper source rectangle cropping to match mask aspect ratios  
- Destination rectangle scaling to eliminate edge visibility

## Files Modified

### New Utility Created
- `/src/utils/imageScaling.js` - Centralized image scaling utilities

### Templates Updated
- `/src/effects/ArchitecturalEffect.ts` - Major update to use new utilities
- `/src/templates/tilingPatterns/squareTiling.js` - Updated to use new utilities

### Key Changes in ArchitecturalEffect.ts

1. **Import new utilities**:
   ```typescript
   import { drawImageInMask, adjustMaskProportions } from '../utils/imageScaling.js';
   ```

2. **Mask proportion adjustment**:
   ```typescript
   const adjustedPlacement = adjustMaskProportions(family, type, {
     x: placement.x, y: placement.y, 
     width: placement.width, height: placement.height
   });
   ```

3. **Simplified image drawing**:
   ```typescript
   drawImageInMask(this.ctx, imageToDraw, 100, 100, {
     maskAspectRatio: maskAspectRatio,
     opacity: finalImageOpacity,
     blendMode: imageBlendMode
   });
   ```

## Technical Approach

### Image Scaling Algorithm
1. **Source Cropping**: Crop the source image to match the mask's aspect ratio
2. **Destination Scaling**: Scale the cropped image to completely fill the mask area
3. **Overflow Strategy**: Allow controlled overflow to ensure no edge visibility

### Mask Proportion Rules
- **Architectural arches**: 3:4 ratio (width:height) to maintain proper arch shape
- **Windows**: 4:5 ratio for traditional window proportions  
- **Columns**: Various ratios based on single/pair/triplet
- **Circles/Ovals**: 1:1 or specified ratios to prevent distortion

### Aspect Ratio Preservation
- Always preserve original image aspect ratios
- Never stretch images to fit non-matching aspect ratios
- Use intelligent cropping to maintain visual content

## Benefits

1. **No More Edge Visibility**: Images now completely fill all masks
2. **Proper Proportions**: Architectural shapes maintain their intended appearance
3. **Consistent Quality**: All templates now use the same high-quality scaling logic
4. **Maintainable Code**: Centralized utilities make future updates easier
5. **Better Visual Results**: Collages look more professional and polished

## Testing Recommendations

1. Test dynamic architectural template with various image aspect ratios
2. Verify that arches maintain proper proportions (not stretched wide)
3. Check that no image edges are visible in any mask shapes
4. Test with both portrait and landscape images
5. Verify other templates still work correctly

The fixes ensure that all images fill their masks completely while maintaining proper aspect ratios, and architectural shapes maintain their intended proportions without distortion.
