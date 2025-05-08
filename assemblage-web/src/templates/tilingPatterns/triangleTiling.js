/**
 * Triangle tiling pattern generator
 * Creates a grid of triangles for use in the tiling template
 */

/**
 * Generate data for triangular tiling
 * @param {number} count - Approximate number of tiles to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of tile objects with position and dimensions
 */
export function createTriangularTiling(count, width, height, options = {}) {
  const { spacing = 0, fillStyle = 'fullBleed' } = options;
  
  // For triangular tiling, we need more tiles to fill the same area
  // as squares, so we adjust the count
  const adjustedCount = count * 1.5;
  
  // Calculate the grid dimensions
  const aspectRatio = width / height;
  let rowCount = Math.round(Math.sqrt(adjustedCount / aspectRatio));
  let colCount = Math.round(rowCount * aspectRatio);
  
  // Calculate the triangle dimensions
  const cellWidth = width / colCount;
  const cellHeight = height / rowCount;
  
  // Adjust for centered form or full bleed
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let bleedCols = 0;
  let bleedRows = 0;
  
  if (fillStyle === 'centeredForm') {
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
    offsetX = -cellWidth * scale;
    offsetY = -cellHeight * scale;
  }
  
  // Generate the tiles
  const tiles = [];
  
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const x = offsetX + (col * cellWidth * scale);
      const y = offsetY + (row * cellHeight * scale);
      const w = cellWidth * scale - spacing;
      const h = cellHeight * scale - spacing;
      
      // Create two triangles in each cell (upper-left to lower-right diagonal)
      // First triangle (top)
      tiles.push({
        x,
        y,
        width: w,
        height: h,
        row,
        col,
        type: 'triangleTop',
        points: [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: 0, y: h }
        ]
      });
      
      // Second triangle (bottom)
      tiles.push({
        x,
        y,
        width: w,
        height: h,
        row,
        col,
        type: 'triangleBottom',
        points: [
          { x: w, y: 0 },
          { x: w, y: h },
          { x: 0, y: h }
        ]
      });
    }
  }
  
  return tiles;
}

/**
 * Draw a triangular tile on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} tile - Tile data
 * @param {Image} image - Image to use for the tile
 * @param {Object} options - Additional options
 */
export function drawTriangularTile(ctx, tile, image, options = {}) {
  const { randomRotation = false, debug = false } = options;
  
  // Save context state
  ctx.save();
  
  // Apply translation
  ctx.translate(tile.x, tile.y);
  
  if (randomRotation) {
    // Randomly rotate in multiples of 120° (for triangles)
    const centerX = tile.width / 2;
    const centerY = tile.height / 2;
    ctx.translate(centerX, centerY);
    const rotation = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
  }
  
  // Create clipping path for the triangle
  ctx.beginPath();
  
  // Draw the triangle path
  const points = tile.points;
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
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
      offsetX,
      offsetY,
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
