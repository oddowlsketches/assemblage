/**
 * Modular grid tiling pattern generator
 * Creates a modular grid with variable cell sizes for use in the tiling template
 */

/**
 * Generate data for a modular grid tiling pattern
 * This creates a grid with varying cell sizes based on golden ratio
 * 
 * @param {number} count - Approximate number of cells to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of tile objects with position and dimensions
 */
export function createModularTiling(count, width, height, options = {}) {
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
        type: 'modular'
      });
    }
  }
  
  return tiles;
}

/**
 * Choose an item from an array based on weighted probabilities
 * @param {Array} items - Array of items to choose from
 * @param {Array} weights - Array of weights corresponding to each item
 * @returns {*} The chosen item
 */
function chooseWeighted(items, weights) {
  // Calculate the sum of all weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Generate a random value between 0 and the total weight
  const randomValue = Math.random() * totalWeight;
  
  // Find the item that corresponds to the random value
  let cumulativeWeight = 0;
  
  for (let i = 0; i < items.length; i++) {
    cumulativeWeight += weights[i];
    
    if (randomValue <= cumulativeWeight) {
      return items[i];
    }
  }
  
  // Default to the first item (should never reach here if weights sum to 1)
  return items[0];
}

/**
 * Draw a modular grid cell on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} tile - Tile data
 * @param {Image} image - Image to use for the tile
 * @param {Object} options - Additional options
 */
export function drawModularTile(ctx, tile, image, options = {}) {
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
    // Preserve aspect ratio when drawing the image
    const imgAspect = image.width / image.height;
    const tileAspect = tile.width / tile.height;
    
    let drawWidth = tile.width;
    let drawHeight = tile.height;
    let drawX = -tile.width / 2;
    let drawY = -tile.height / 2;
    
    if (imgAspect > tileAspect) {
      // Image is wider than the tile
      drawHeight = tile.width / imgAspect;
      drawY = -drawHeight / 2;
    } else {
      // Image is taller than the tile
      drawWidth = tile.height * imgAspect;
      drawX = -drawWidth / 2;
    }
    
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.globalCompositeOperation = 'source-over';
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
