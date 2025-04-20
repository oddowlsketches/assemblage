#!/bin/bash

# Direct fix for TilingGenerator to fix image loading issues
# Created on April 10, 2025

echo "==================================================="
echo "Direct Fix for Tiling Collage Generator"
echo "==================================================="

# Make both script files executable
chmod +x comprehensive_fix.sh
chmod +x fix_drawtile_direct.sh

# Configuration
COLLAGE_GEN_PATH="js/collage/collageGenerator.js"
TILING_GEN_PATH="js/collage/tilingGenerator.js"
BACKUP_DIR="backups_$(date +%Y%m%d%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Backup files
cp "$COLLAGE_GEN_PATH" "$BACKUP_DIR/$(basename $COLLAGE_GEN_PATH).bak"
cp "$TILING_GEN_PATH" "$BACKUP_DIR/$(basename $TILING_GEN_PATH).bak"
echo "📁 Backed up original files"

# 1. Fix the drawTile method in collageGenerator.js
echo "🔧 Fixing collageGenerator.js drawTile method..."
if grep -q "instanceof HTMLImageElement" "$COLLAGE_GEN_PATH"; then
    echo "✓ Found instanceof HTMLImageElement check in collageGenerator.js"
    sed -i'.tmp' 's/|| *!(img instanceof HTMLImageElement)//g' "$COLLAGE_GEN_PATH"
    rm -f "${COLLAGE_GEN_PATH}.tmp"
    echo "✓ Removed instanceof HTMLImageElement check from collageGenerator.js"
else
    echo "⚠️ No instanceof HTMLImageElement check found in collageGenerator.js"
fi

# 2. Fix any image validation checks in tilingGenerator.js
echo "🔧 Fixing tilingGenerator.js image validation..."
if grep -q "instanceof HTMLImageElement" "$TILING_GEN_PATH"; then
    echo "✓ Found instanceof HTMLImageElement check in tilingGenerator.js"
    sed -i'.tmp' 's/|| *![a-zA-Z0-9._]*instanceof HTMLImageElement//g' "$TILING_GEN_PATH"
    rm -f "${TILING_GEN_PATH}.tmp"
    echo "✓ Removed instanceof HTMLImageElement check from tilingGenerator.js"
else
    echo "⚠️ No instanceof HTMLImageElement check found in tilingGenerator.js"
fi

# 3. Fix any additional image loading issues in both files
echo "🔧 Fixing additional image loading issues..."

# Create a temporary file with debug logging for image loading
cat > debug_logging.js << EOL
/**
 * Debug Logging Functions
 * Add these to the top of both generator files to help debug image loading
 */

// Debug function to log image properties
function debugImageObject(img, label = 'Image') {
    if (!img) {
        console.log(`${label}: null or undefined`);
        return;
    }
    
    console.log(`${label} properties:`, {
        type: Object.prototype.toString.call(img),
        complete: img.complete,
        width: img.width,
        height: img.height,
        src: img.src ? img.src.substring(0, 50) + '...' : 'none'
    });
}

// Patch for checking valid images without instanceof
function isValidImageForCanvas(img) {
    return img && img.complete && img.width > 0 && img.height > 0;
}
EOL

echo "📝 Created debug_logging.js with helper functions"
echo "✏️ You can manually add these functions to your generator files if needed"

echo "==================================================="
echo "✅ Fix script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Reload your test_tiling.html page"
echo "2. Check the browser console for errors"
echo "3. If errors persist, try manually applying the fixes from:"
echo "   - comprehensive_fix.sh"
echo "   - complete_fix.js"
echo "==================================================="
