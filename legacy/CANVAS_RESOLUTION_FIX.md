# Canvas Resolution and Size Fix for Assemblage

This document explains the canvas size and resolution issues in the Assemblage app and how to apply the fix.

## Problem Identification

The application was experiencing issues with:

1. **Poor Image Resolution**: Images appeared blurry, especially on high-DPI displays (Retina, etc.)
2. **Size Discrepancies**: The canvas and collage sizes sometimes appeared incorrect, especially on mobile
3. **Double Sizing Issue**: In some cases, the canvas or collage image appeared to be displayed at twice its size

## Root Causes

After code analysis, we identified these root causes:

1. **Incorrect Device Pixel Ratio Handling**: The code wasn't properly accounting for device pixel ratio (DPR) when setting up the canvas dimensions and scales.

2. **Viewport vs. CSS Pixels Inconsistency**: The code was mixing logical (CSS) pixels and device pixels inconsistently, causing size discrepancies.

3. **Context Transformation Issues**: The canvas context wasn't being properly scaled to match the device pixel ratio, leading to resolution loss on high-DPI displays.

## Fix Details

The `fix_canvas_resolution.js` script addresses these issues by:

1. **Proper DPR Handling**: Correctly sets the canvas dimensions accounting for device pixel ratio:
   ```javascript
   canvas.width = viewportWidth * devicePixelRatio;
   canvas.height = viewportHeight * devicePixelRatio;
   ```

2. **CSS Size Consistency**: Ensures CSS dimensions match the viewport for proper display:
   ```javascript
   canvas.style.width = viewportWidth + 'px';
   canvas.style.height = viewportHeight + 'px';
   ```

3. **Context Scaling**: Applies the correct transformation to the context:
   ```javascript
   ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
   ```

4. **Consistent Coordinate System**: Ensures drawing functions use logical (CSS) pixels for positioning and dimensions, maintaining consistency.

## How to Apply the Fix

### Option 1: Automatic Application (Recommended)

1. Make sure you're in the Assemblage root directory
2. Run the provided shell script:
   ```bash
   chmod +x apply_resolution_fix.sh
   ./apply_resolution_fix.sh
   ```

### Option 2: Use the Test Page

1. Open `apply_resolution_fix.html` in your browser
2. Click the "Apply Resolution Fix" button
3. Follow the on-screen instructions

### Option 3: Manual Application

1. Add the following line to `index.html` just before the closing `</body>` tag:
   ```html
   <script src="fix_canvas_resolution.js" type="module"></script>
   ```

## Testing the Fix

After applying the fix, you should see:

1. **Higher Image Quality**: Images should appear sharper, especially on high-DPI displays
2. **Correct Sizing**: The canvas and collage should display at the correct size on all devices
3. **Consistent Behavior**: The app should work consistently across desktop and mobile devices

## Verifying Resolution

To verify the fix is working correctly:

1. Check the browser console for messages from the fix script
2. You should see log messages showing the devicePixelRatio and canvas configuration
3. On high-DPI displays (like Retina), you should see a devicePixelRatio > 1 (typically 2 or 3)
4. The canvas dimensions should be larger than the viewport dimensions by exactly the devicePixelRatio

## Technical Details

### Key Fixed Functions

1. **resizeCanvas()**: Now properly sets physical canvas dimensions while maintaining CSS display size
2. **drawTile()**: Uses consistent coordinate system for drawing tiles
3. **drawFragment()**: Ensures fragments are properly positioned and scaled

### Modified Properties and Values

- **canvas.width/height**: Now set to viewportWidth/Height * devicePixelRatio
- **canvas.style.width/height**: Set to viewportWidth/Height + 'px'
- **ctx.setTransform()**: Scales by devicePixelRatio to maintain proper resolution

## Troubleshooting

If you experience issues after applying the fix:

1. **Images still blurry**: Check the console to ensure the devicePixelRatio is being detected correctly
2. **Size issues persist**: Check if CSS styles in other parts of the app are overriding the canvas dimensions
3. **JavaScript errors**: Ensure the fix script is being loaded after the main app script

## Reverting the Fix

If needed, you can revert to the original behavior by:

1. Removing the `<script>` tag that loads the fix script from index.html
2. Restoring any backup files created during installation

## Support

If you encounter any issues with this fix, please:

1. Check the console for error messages
2. Verify the fix script is being loaded properly
3. Document the issue with screenshots and device information
