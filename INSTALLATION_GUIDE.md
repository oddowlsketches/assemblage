# Tiling Collage Fix - Installation & Testing Guide

This guide will help you install and test the improved tiling collage generator for your Assemblage app.

## Quick Install

The easiest way to install the improved tiling generator is using the provided script:

1. Open Terminal
2. Navigate to your Assemblage project folder:
   ```
   cd /Users/emilyschwartzman/assemblage-fresh
   ```
3. Make the installation script executable:
   ```
   chmod +x install_improved_tiling.sh
   ```
4. Run the installation script:
   ```
   ./install_improved_tiling.sh
   ```

This will automatically back up your current version and install the improved version.

## Manual Installation

If you prefer to install manually:

1. Create a backup of your current tiling generator:
   ```
   cp js/collage/tilingGenerator.js js/collage/tilingGenerator.js.bak
   ```
2. Replace it with the improved version:
   ```
   cp js/collage/improvedTilingGenerator.js js/collage/tilingGenerator.js
   ```

## Testing

### Method 1: Use the Testing Page

We've created a dedicated testing page to quickly evaluate the different collage styles:

1. Open the test page in your browser:
   ```
   open test_tiling.html
   ```
   
2. Use the controls to:
   - Toggle image repetition on/off
   - Switch between dramatic and uniform scaling
   - Test focal and field layouts
   - Generate new collages and save them

### Method 2: Use the Main Application

You can also test through the main Assemblage application:

1. Start your local server:
   ```
   ./start_server.command
   ```
   
2. Open the app in your browser:
   ```
   open http://localhost:8000
   ```
   
3. Click "Shift Perspective" to generate new collages
   - The collage type is randomly selected, so keep clicking until you see a tiling collage

## Reverting (If Needed)

If you need to revert to your original version:

```
cp js/collage/tilingGenerator.js.bak js/collage/tilingGenerator.js
```

## Key Features to Check

When testing, look for:

1. **Image repetition control**: With "Allow Image Repetition" turned off, each image should appear only once
2. **Proper scaling**: Images should maintain their aspect ratios
3. **Visual variety**: Dramatic mode should show more size variation
4. **Focal layouts**: Focal mode should have fewer, larger images positioned strategically
5. **Field layouts**: Field mode should have more tiles covering the canvas

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages (F12 or right-click > Inspect > Console)
2. Verify that all image files are loading correctly
3. Try restarting your server
4. If problems persist, restore the backup and try again with added console logging

## Additional Resources

- See `TILING_GENERATOR_DOCUMENTATION.md` for detailed technical documentation
- The original backup is preserved in `assemblage-fresh-apr10/`