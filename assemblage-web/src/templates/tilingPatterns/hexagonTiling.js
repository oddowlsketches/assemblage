/**
 * Hexagonal tiling pattern generator
 * Creates a grid of hexagons for use in the tiling template
 */

/**
 * Generate data for hexagonal tiling
 * @param {number} count - Approximate number of tiles to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of tile objects with position and dimensions
 */
export function createHexagonalTiling(count, width, height, options = {}) {
  const { spacing = 0, fillStyle = 'fullBleed' } = options;
  
  // For hexagons, we need to calculate how many will fit in the canvas
  // Hexagons in a grid are positioned in a staggered pattern
  
  // Calculate grid dimensions for hexagons
  // Using flat-topped hexagons arranged in a grid
  const aspectRatio = width / height;
  let rowCount = Math.round(Math.sqrt(count / aspectRatio) * 0.8); // Adjusted for hexagon packing
  let colCount = Math.round(rowCount * aspectRatio);
  
  // Calculate hexagon dimensions
  // For a flat-topped hexagon, width = 2*size, height = sqrt(3)*size
  const hexWidth = width / colCount;
  const hexHeight = height / rowCount;
  const hexSize = Math.min(hexWidth / 2, hexHeight / Math.sqrt(3));
  const hexHeight2 = Math.sqrt(3) * hexSize; // Height of a flat-topped hexagon
  
  // Adjust for centered form if needed
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
    // Add 2 extra columns and rows so hexagons can extend past the canvas
    bleedCols = 2;
    bleedRows = 2;
    colCount += bleedCols;
    rowCount += bleedRows;
    offsetX = -hexSize * scale;
    offsetY = -hexHeight2 / 2 * scale;
  }
  
  // Generate the hexagon tiles
  const tiles = [];
  
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      // In a hexagonal grid, alternating rows are offset by half a hexagon
      const xOffset = (row % 2 === 0) ? 0 : hexSize;
      
      // Calculate the center of the hexagon
      const centerX = offsetX + (col * 2 * hexSize * scale) + xOffset * scale;
      // Tighter vertical packing: use hexHeight2 * scale as the step
      const centerY = offsetY + (row * hexHeight2 * scale);
      
      // No bounds check for fullBleed, so hexagons can bleed off the edge
      if (fillStyle === 'fullBleed' || (
        centerX - hexSize * scale >= 0 &&
        centerX + hexSize * scale <= width &&
        centerY - hexHeight2/2 * scale >= 0 &&
        centerY + hexHeight2/2 * scale <= height
      )) {
        // Create points for a flat-topped hexagon
        // For a flat-topped hexagon centered at (centerX, centerY)
        const points = [];
        const adjustedSize = hexSize * scale - spacing/2;
        
        for (let i = 0; i < 6; i++) {
          const angleDeg = 60 * i;
          const angleRad = (Math.PI / 180) * angleDeg;
          // For flat-topped: x = centerX + size * cos(angle)
          //                   y = centerY + size * sin(angle)
          const x = adjustedSize * Math.cos(angleRad);
          const y = adjustedSize * Math.sin(angleRad);
          points.push({ x, y });
        }
        
        tiles.push({
          x: centerX,
          y: centerY,
          size: adjustedSize,
          row,
          col,
          type: 'hexagon',
          points
        });
      }
    }
  }
  
  return tiles;
}

/**
 * Draw a hexagonal tile on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} tile - Tile data
 * @param {Image} image - Image to use for the tile
 * @param {Object} options - Additional options
 */
export function drawHexagonalTile(ctx, tile, image, options = {}) {
  const { randomRotation = false, debug = false } = options;
  
  // Save context state
  ctx.save();
  
  // Move to the center of the hexagon
  ctx.translate(tile.x, tile.y);
  
  if (randomRotation) {
    // Randomly rotate in multiples of 60° (for regular hexagons)
    const rotation = Math.floor(Math.random() * 6) * (Math.PI / 3);
    ctx.rotate(rotation);
  }
  
  // Create clipping path for the hexagon
  ctx.beginPath();
  
  // Draw the hexagon path
  const points = tile.points;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  
  // Apply clipping and draw the image
  ctx.clip();
  
  if (image && image.complete) {
    // Calculate dimensions to ensure full coverage while preserving aspect ratio
    const imageAspect = image.width / image.height;
    const diameter = tile.size * 2;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > 1) {
      // Image is wider than tall - fit to height
      drawHeight = diameter;
      drawWidth = drawHeight * imageAspect;
      offsetX = (diameter - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than wide - fit to width
      drawWidth = diameter;
      drawHeight = drawWidth / imageAspect;
      offsetX = 0;
      offsetY = (diameter - drawHeight) / 2;
    }
    
    // Draw the image centered in the hexagon
    ctx.drawImage(
      image,
      -diameter/2 + offsetX,
      -diameter/2 + offsetY,
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
