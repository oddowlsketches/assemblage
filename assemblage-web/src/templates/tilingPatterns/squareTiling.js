/**
 * Square tiling pattern generator
 * Creates a grid of squares for use in the tiling template
 */

/**
 * Generate data for square tiling
 * @param {number} count - Approximate number of tiles to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of tile objects with position and dimensions
 */
export function createSquareTiling(count, width, height, options = {}) {
  const { spacing = 0, fillStyle = 'fullBleed' } = options;
  
  // Calculate the grid dimensions based on the desired count
  const aspectRatio = width / height;
  let rowCount = Math.round(Math.sqrt(count / aspectRatio));
  let colCount = Math.round(rowCount * aspectRatio);
  
  // Calculate the tile size
  const tileWidth = width / colCount;
  const tileHeight = height / rowCount;
  
  // Adjust for centered form or full bleed
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let bleedCols = 0;
  let bleedRows = 0;
  
  if (fillStyle === 'centeredForm') {
    // Create a centered form with a smaller grid
    scale = 0.8;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    offsetX = (width - scaledWidth) / 2;
    offsetY = (height - scaledHeight) / 2;
  } else {
    // For fullBleed, allow edge bleed: add extra rows/cols and negative offset
    bleedCols = 2;
    bleedRows = 2;
    colCount += bleedCols;
    rowCount += bleedRows;
    offsetX = -tileWidth * scale;
    offsetY = -tileHeight * scale;
  }
  
  // Generate the tiles
  const tiles = [];
  
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const x = offsetX + (col * tileWidth * scale);
      const y = offsetY + (row * tileHeight * scale);
      const w = (tileWidth * scale) - spacing;
      const h = (tileHeight * scale) - spacing;
      
      tiles.push({
        x,
        y,
        width: w,
        height: h,
        // Add points for compatibility with the main tiling renderer
        points: [
          { x: x, y: y },             // Top-left
          { x: x + w, y: y },         // Top-right
          { x: x + w, y: y + h },     // Bottom-right
          { x: x, y: y + h }          // Bottom-left
        ],
        row,
        col,
        type: 'square'
      });
    }
  }
  
  return tiles;
}

/**
 * Draw a square tile on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} tile - Tile data
 * @param {Image} image - Image to use for the tile
 * @param {Object} options - Additional options
 */
export function drawSquareTile(ctx, tile, image, options = {}) {
  const { randomRotation = false, debug = false } = options;
  
  // Save context state
  ctx.save();
  
  // Apply transformations if needed
  ctx.translate(tile.x + tile.width / 2, tile.y + tile.height / 2);
  
  if (randomRotation) {
    // Randomly rotate in 90° increments
    const rotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
    ctx.rotate(rotation);
  }
  
  // Create clipping path
  ctx.beginPath();
  ctx.rect(-tile.width / 2, -tile.height / 2, tile.width, tile.height);
  ctx.closePath();
  
  // Apply clipping and draw the image
  ctx.clip();
  
  if (image && image.complete) {
    // Calculate dimensions to ensure full coverage while preserving aspect ratio
    const imageAspect = image.width / image.height;
    const tileAspect = tile.width / tile.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > tileAspect) {
      // Image is wider than tile - fit to height
      drawHeight = tile.height;
      drawWidth = drawHeight * imageAspect;
      offsetX = (tile.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than tile - fit to width
      drawWidth = tile.width;
      drawHeight = drawWidth / imageAspect;
      offsetX = 0;
      offsetY = (tile.height - drawHeight) / 2;
    }
    
    // Draw the image centered in the tile
    ctx.drawImage(
      image,
      -tile.width / 2 + offsetX,
      -tile.height / 2 + offsetY,
      drawWidth,
      drawHeight
    );
  }
  
  // Debug outline
  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Restore context state
  ctx.restore();
}
