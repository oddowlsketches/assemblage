#!/bin/bash

# Comprehensive fix for the Assemblage project collage drawing issue
# Created on April 10, 2025

echo "=========================================================="
echo "Comprehensive Fix for Assemblage Collage Drawing Issue"
echo "=========================================================="
echo

# Configuration
FILE_PATH="js/collage/collageGenerator.js"
BACKUP_FILE="${FILE_PATH}.bak.comprehensive.$(date +%Y%m%d%H%M%S)"

# Create backup
echo "📁 Creating backup of $FILE_PATH to $BACKUP_FILE..."
cp "$FILE_PATH" "$BACKUP_FILE"
echo "✓ Backup created successfully!"
echo

# Approach 1: Try to fix the existing method with sed replacement
echo "🔍 Trying approach 1: Replace HTMLImageElement check..."
MATCH_FOUND=$(grep -c "if (!img || !img.complete || !(img instanceof HTMLImageElement))" "$FILE_PATH")

if [ $MATCH_FOUND -gt 0 ]; then
    echo "✓ Found exact match for the problematic code!"
    sed -i'.tmp' 's/if (!img || !img.complete || !(img instanceof HTMLImageElement)) {/if (!img || !img.complete) {/' "$FILE_PATH"
    rm "${FILE_PATH}.tmp" # Remove temporary file created by sed
    echo "✓ Fixed: Removed 'instanceof HTMLImageElement' check"
    echo "✓ Approach 1 succeeded!"
else
    echo "✗ Exact match not found. Moving to approach 2..."
fi
echo

# Approach 2: Try a more generic pattern match
echo "🔍 Trying approach 2: Look for any instanceof HTMLImageElement check..."
MATCH_FOUND=$(grep -c "instanceof HTMLImageElement" "$FILE_PATH")

if [ $MATCH_FOUND -gt 0 ]; then
    echo "✓ Found instanceof HTMLImageElement check!"
    sed -i'.tmp' 's/|| *!(img instanceof HTMLImageElement)//g' "$FILE_PATH"
    rm "${FILE_PATH}.tmp"
    echo "✓ Fixed: Removed all 'instanceof HTMLImageElement' checks"
    echo "✓ Approach 2 succeeded!"
else
    echo "✗ No instanceof HTMLImageElement check found. Moving to approach 3..."
fi
echo

# Approach 3: Try to replace the entire drawTile method
echo "🔍 Trying approach 3: Replace the entire drawTile method..."
FIXED_DRAW_TILE='    // Helper method to draw individual tiles
    drawTile(tile, index, skippedTiles) {
        const img = tile.image;
        // FIXED: Removed instanceof HTMLImageElement check that was causing failures
        if (!img || !img.complete) {
            skippedTiles.invalid++;
            console.log(`Tile ${index}: Image validation failed - img exists: ${!!img}, complete: ${img ? img.complete : '"N/A"'}`);
            return false;
        }
        
        // Skip tiles that would be completely outside the canvas
        if (tile.x >= this.canvas.width || tile.y >= this.canvas.height || 
            tile.x + tile.width <= 0 || tile.y + tile.height <= 0) {
            skippedTiles.offCanvas++;
            console.warn(`Tile ${index}: Off canvas at (${tile.x}, ${tile.y}) with size ${tile.width}x${tile.height}`);
            return false;
        }
        
        try {
            this.ctx.save();
            
            // Set opacity with a minimum value to ensure visibility
            this.ctx.globalAlpha = Math.max(0.6, tile.forceOpacity || 0.8);
            
            // Add slight contrast boost for better visibility
            this.ctx.filter = `contrast(1.1) brightness(1.05)`;
            
            // Move to tile center for rotation
            const centerX = tile.x + tile.width / 2;
            const centerY = tile.y + tile.height / 2;
            
            // Log first few tiles for debugging
            if (index < 5) {
                console.log(`Tile ${index} debug:`, {
                    position: { x: tile.x, y: tile.y },
                    center: { x: centerX, y: centerY },
                    size: { width: tile.width, height: tile.height },
                    opacity: tile.forceOpacity,
                    rotation: tile.rotation
                });
            }
            
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(tile.rotation * Math.PI / 180);
            
            // Draw the tile with aspect ratio preservation
            const imgRatio = img.width / img.height;
            let drawWidth = tile.width;
            let drawHeight = tile.height;
            
            if (imgRatio > 1) {
                drawHeight = drawWidth / imgRatio;
            } else {
                drawWidth = drawHeight * imgRatio;
            }
            
            this.ctx.drawImage(
                img,
                -drawWidth / 2, -drawHeight / 2,
                drawWidth, drawHeight
            );
            console.log(`Tile ${index}: Successfully drawn`);
            
            this.ctx.restore();
            return true;
        } catch (error) {
            skippedTiles.drawError++;
            console.warn(`Tile ${index}: Error drawing:`, error);
            return false;
        }
    }'

# Create a temporary file with the fixed method
echo "$FIXED_DRAW_TILE" > drawTile_fixed.tmp

echo "⚠️ Cannot automatically replace the entire method with a script."
echo "✏️ Manual instructions:"
echo "   1. Open the file: $FILE_PATH"
echo "   2. Find the 'drawTile' method"
echo "   3. Replace it with the fixed version saved in 'drawTile_fixed.tmp'"
echo
echo "💡 The key change is removing the 'instanceof HTMLImageElement' check"
echo "   from the first if statement in the drawTile method."
echo

# Create a mini version for quick manual edit
echo "🔧 Creating a simplified manual fix script..."
cat > simple_fix.js << EOL
/**
 * SIMPLE MANUAL FIX
 * 
 * Find this line in js/collage/collageGenerator.js:
 * if (!img || !img.complete || !(img instanceof HTMLImageElement)) {
 * 
 * Replace with:
 * if (!img || !img.complete) {
 * 
 * That's it!
 */
EOL
echo "✓ Created 'simple_fix.js' with instructions for a quick manual fix."
echo

echo "🏁 Comprehensive fix script completed!"
echo "🔄 Please refresh your test page to see if the issue is fixed."
echo "📝 If issues persist, follow the manual instructions above."
echo "=========================================================="
