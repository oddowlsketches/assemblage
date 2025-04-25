# Image Quality Fix for Assemblage

This fix addresses the image resolution and quality issues in the Assemblage app, targeting both desktop and mobile devices. The solution focuses on reverting overly aggressive scaling parameters and improving the drawing methods without breaking core functionality.

## What This Fix Addresses

1. **Aggressive Scaling Parameters**: Reverts scaling factors from 2.5-3.0 back to 1.4-1.8 to prevent over-stretching images.

2. **Base Size Calculations**: Restores original base size divisors from 4/6 to 6/8 to create appropriately sized tiles.

3. **Pixel Alignment Issues**: Enforces integer pixel coordinates to fix blurry edges and anti-aliasing problems.

4. **Drawing Quality**: Enhances image rendering quality through optimized drawing methods.

## Implementation Details

The fix is implemented in two separate scripts that work together:

### 1. Scaling Parameter Fix (`fix_scaling_parameters.js`)

- Modifies scaling parameters across all generators (tiling, fragments, mosaic, crystal)
- Restores conservative scaling ranges from the older version
- Adjusts base size divisors to create smaller, higher-quality tiles
- Uses pixel-perfect positioning for image placement

### 2. Drawing Quality Fix (`fix_drawing_quality.js`)

- Enhances drawing methods to use integer pixel coordinates
- Disables unnecessary image smoothing for sharper edges
- Optimizes fragment drawing with more conservative scaling
- Refines masking operations for better quality

## How to Apply the Fix

### Automatic Installation (Recommended)

1. Make sure you're in the Assemblage root directory
2. Run the provided shell script:
   ```bash
   chmod +x apply_image_quality_fix.sh
   ./apply_image_quality_fix.sh
   ```

### Manual Installation

1. Place the fix scripts in your project's `js` directory:
   - `js/fix_scaling_parameters.js`
   - `js/fix_drawing_quality.js`

2. Add the following lines to your `index.html` before the closing `</body>` tag:
   ```html
   <!-- Image Quality Fix -->
   <script src="js/fix_scaling_parameters.js"></script>
   <script src="js/fix_drawing_quality.js"></script>
   ```

## Verification

After applying the fix, you should observe:

1. **Sharper Image Edges**: The edges of collage elements should appear crisp without anti-aliasing/blurriness
2. **Better Detail Preservation**: Fine details within images should be more clearly visible
3. **Improved Text Legibility**: Text within collage elements should be more readable
4. **Consistent Quality**: The image quality should be consistent across desktop and mobile devices

## Debugging

If you encounter any issues:

1. Open your browser's developer console to check for error messages
2. Look for messages with prefixes `[Scale Fix]` and `[Quality Fix]`
3. Verify that both fix scripts are loading correctly
4. If necessary, try applying just one fix at a time to isolate any problems

## Reverting the Fix

If needed, you can revert to the original behavior by:

1. Removing the script tags from `index.html`:
   ```html
   <!-- Image Quality Fix -->
   <script src="js/fix_scaling_parameters.js"></script>
   <script src="js/fix_drawing_quality.js"></script>
   ```

2. Or by restoring from the backup file created during installation:
   ```bash
   cp index.html.backup-quality-YYYYMMDD-HHMMSS index.html
   ```

## Further Improvements

If these fixes don't fully address your image quality issues, consider these additional steps:

1. Review any custom CSS that might be affecting the canvas display
2. Ensure your source images are being loaded at their original resolution
3. Check for any image preprocessing steps that might be reducing quality
4. Consider adding specific mobile-only optimizations for better mobile display

## Support

If you need help with these fixes or encounter any issues, please:

1. Check the console logs for any error messages
2. Document the specific quality issues you're still seeing
3. Compare the behavior before and after applying the fix
