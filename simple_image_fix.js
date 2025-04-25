// Fix for the drawTile method
// Place this in collageGenerator.js

drawTile(tile, index, skippedTiles) {
    const img = tile.image;
    if (!img || !img.complete) {
        skippedTiles.invalid++;
        console.log(`Tile ${index}: Invalid image - exists: ${!!img}, complete: ${img ? img.complete : 'N/A'}`);
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
        
        // Extra validation for dimensions
        if (isNaN(drawWidth) || isNaN(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
            console.log(`Tile ${index}: Invalid dimensions - width: ${drawWidth}, height: ${drawHeight}`);
            this.ctx.restore();
            return false;
        }
        
        this.ctx.drawImage(
            img,
            -drawWidth / 2, -drawHeight / 2,
            drawWidth, drawHeight
        );
        
        this.ctx.restore();
        return true;
    } catch (error) {
        skippedTiles.drawError++;
        console.warn(`Tile ${index}: Error drawing:`, error);
        return false;
    }
}