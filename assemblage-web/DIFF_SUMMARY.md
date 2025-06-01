# Diff Summary: Echo Color & Scrambled Mosaic Updates

## Overview
Implemented strict color echo rules for color vs B&W images and enhanced scrambled mosaic with grid randomization and variant logic.

## Files Modified:

### 1. **src/templatetools/colorUtils.ts** (NEW)
- Created new TypeScript module for template-specific color utilities
- Added `echoSafeColor()` function that enforces echo color rules:
  - For color images (is_black_and_white === false): echo must be bgColor or #FFFFFF
  - For B&W images (is_black_and_white === true): any color allowed
- Added `applyEchoOpacity()` helper for applying 0-0.15 opacity to echo colors

### 2. **src/templates/scrambledMosaic.js**
- Modified gridSize randomization:
  - Now randomizes between 6-12 if not explicitly provided
  - Line 16: `const gridSize = params.gridSize || (Math.floor(Math.random() * 7) + 6);`
- Added variant logic (30% chance):
  - Can leave 0-3 outer rings untouched
  - Can leave left/right or top/bottom half untouched
  - Lines 68-104: Added variant determination logic
  - Lines 127-146: Modified cell operations to respect untouched cells
- Updated processedParams to include variant information

### 3. **src/utils/imageOverlapUtils.js**
- Updated `getAppropriateEchoColor()` to match new requirements:
  - Now checks `is_black_and_white === false` for color images
  - For color images: returns bgColor (not lightened version)
  - For B&W or unknown: can use complementary colors
  - Now accepts both single image or array of images

### 4. **src/templates/photoStrip.js**
- Fixed color block logic for photo strips:
  - Now checks if images are color using `is_black_and_white === false`
  - For color images: uses only bgColor or white for color blocks
  - For B&W images: allows complementary and vibrant colors
  - Added transparency (0.85 alpha) for color images to prevent muddiness

### 5. **src/templates/packedShapesTemplate.js**
- Fixed color block logic for packed shapes:
  - Now checks if images are color using `is_black_and_white === false`
  - For color images: uses only bgColor or white for color blocks
  - For B&W images: allows complementary and vibrant colors
  - Added transparency (0.85 alpha) for color images to prevent muddiness
  - Removed all uses of complementary colors for color images

### 6. **src/templates/__tests__/scrambledMosaic.test.js** (NEW)
- Created unit test for scrambled mosaic:
  - Tests gridSize randomization (6-12 range)
  - Tests explicit gridSize respect
  - Tests variant application probability (~30%)
  - Tests untouched cell marking

## Key Color Logic Rules:
1. **Color Images** (`is_black_and_white === false`):
   - Echo color MUST be bgColor or #FFFFFF
   - No complementary colors allowed
   - Slight transparency (0.85) to prevent muddy multiply results

2. **B&W Images** (`is_black_and_white === true`):
   - Can use any color including complementary
   - Full opacity allowed

3. **Unknown/Missing Metadata**:
   - Treated as B&W for flexibility

## Total Lines Changed: ~350 lines
- New files: 2 (colorUtils.ts, scrambledMosaic.test.js)
- Modified files: 4 (scrambledMosaic.js, imageOverlapUtils.js, photoStrip.js, packedShapesTemplate.js)
