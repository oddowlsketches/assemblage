/**
 * Complete fix for the Assemblage project collage generation issue
 * 
 * This script creates a completely new version of drawTile without the HTMLImageElement check
 */

// The fixed drawTile function
const fixedDrawTileFunction = `
    // Helper method to draw individual tiles
    drawTile(tile, index, skippedTiles) {
        const img = tile.image;
        // FIXED: Removed instanceof HTMLImageElement check that was causing failures
        if (!img || !img.complete) {
            skippedTiles.invalid++;
            console.log(\`Tile \${index}: Image validation failed - img exists: \${!!img}, complete: \${img ? img.complete : 'N/A'}\`);
            return false;
        }
        
        // Skip tiles that would be completely outside the canvas
        if (tile.x >= this.canvas.width || tile.y >= this.canvas.height || 
            tile.x + tile.width <= 0 || tile.y + tile.height <= 0) {
            skippedTiles.offCanvas++;
            console.warn(\`Tile \${index}: Off canvas at (\${tile.x}, \${tile.y}) with size \${tile.width}x\${tile.height}\`);
            return false;
        }
        
        try {
            this.ctx.save();
            
            // Set opacity with a minimum value to ensure visibility
            this.ctx.globalAlpha = Math.max(0.6, tile.forceOpacity || 0.8);
            
            // Add slight contrast boost for better visibility
            this.ctx.filter = \`contrast(1.1) brightness(1.05)\`;
            
            // Move to tile center for rotation
            const centerX = tile.x + tile.width / 2;
            const centerY = tile.y + tile.height / 2;
            
            // Log first few tiles for debugging
            if (index < 5) {
                console.log(\`Tile \${index} debug:\`, {
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
            console.log(\`Tile \${index}: Successfully drawn\`);
            
            this.ctx.restore();
            return true;
        } catch (error) {
            skippedTiles.drawError++;
            console.warn(\`Tile \${index}: Error drawing:\`, error);
            return false;
        }
    }
`;

console.log("To fix the image rendering issue:");
console.log("1. Open the file: js/collage/collageGenerator.js");
console.log("2. Locate the drawTile method (around line 470)");
console.log("3. Replace the entire drawTile method with the new version below:");
console.log("\n----------------------------------------\n");
console.log(fixedDrawTileFunction);
console.log("\n----------------------------------------\n");
console.log("4. Save the file and reload your test page");
console.log("5. This will fix the instanceof HTMLImageElement check that's causing the problem");
