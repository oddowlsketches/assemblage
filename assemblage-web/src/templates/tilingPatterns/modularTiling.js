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
  const { 
    randomRotation = false, 
    debug = false,
    tileOpacity = 1,
    // tileBlendMode is ignored
    applyEcho = false,
    echoColor = '#000000',
    scale = 1 // Passed from drawOptions, may or may not be used depending on how modular cell size is determined
  } = options;

  if (!tile || !tile.points || tile.points.length < 4 || !image || !image.complete) {
    if (debug) console.warn("Modular tile, points, or image invalid for drawing.");
    return;
  }
  
  ctx.save();
  
  // Modular tiles have absolute points. Create path first.
  ctx.beginPath();
  ctx.moveTo(tile.points[0].x, tile.points[0].y);
  for (let i = 1; i < tile.points.length; i++) {
    ctx.lineTo(tile.points[i].x, tile.points[i].y);
  }
  ctx.closePath();

  if (debug) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Green for path outline before clip
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.clip();

  // Optional rotation around the tile's geometric center
  if (randomRotation) {
    const centerX = tile.x + tile.width / 2; // tile.x, tile.y is top-left of the rectangle
    const centerY = tile.y + tile.height / 2;
    
    const rotationAngle = Math.floor(Math.random() * 4) * (90 * Math.PI / 180); // 0, 90, 180, 270
    if (rotationAngle > 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);
        ctx.translate(-centerX, -centerY);
    }
  }
  
  // Echo and Image drawing
  if (applyEcho) {
    // Color block echo is active: Draw color base first
    ctx.globalAlpha = tileOpacity * 0.75;
    ctx.fillStyle = echoColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fill(); // Fill the clipped and transformed path
  }

  // Always draw the image with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = tileOpacity;
  // tile.width and tile.height are the dimensions of the rectangular cell
  drawImageInModularCell(ctx, image, tile, scale, debug);
  
  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.8)'; 
    ctx.lineWidth = 1.5;
    // Re-trace path for stroke after fill/clip
    ctx.beginPath();
    ctx.moveTo(tile.points[0].x, tile.points[0].y);
    for (let i = 1; i < tile.points.length; i++) {
        ctx.lineTo(tile.points[i].x, tile.points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
}

// Helper to draw the image within the modular (rectangular) cell boundaries
function drawImageInModularCell(ctx, image, tile, scaleOpt, debug) {
  // scaleOpt is the generic scale from drawOptions, tile itself has width/height
  if (!image || !image.complete || !tile || tile.width <= 0 || tile.height <= 0) return;

  const tileWidth = tile.width;
  const tileHeight = tile.height;
  const imageAspect = image.width / image.height;
  const tileAspect = tileWidth / tileHeight;
  
  let drawWidth, drawHeight;
  const bleedFactor = 1.1; // Ensure image slightly larger than tile

  if (imageAspect > tileAspect) { // Image is wider than tile
    drawHeight = tileHeight * bleedFactor;
    drawWidth = drawHeight * imageAspect;
  } else { // Image is taller or same aspect as tile
    drawWidth = tileWidth * bleedFactor;
    drawHeight = drawWidth / imageAspect;
  }

  // Center the scaled image within the tile
  // tile.x, tile.y is the top-left of the tile
  const drawX = tile.x + (tileWidth - drawWidth) / 2;
  const drawY = tile.y + (tileHeight - drawHeight) / 2;
  
  ctx.drawImage(image, 0, 0, image.width, image.height, drawX, drawY, drawWidth, drawHeight);

  if (debug) {
    // console.log("drawImageInModularCell:", { tileX: tile.x, tileY: tile.y, tileWidth, tileHeight, imageAspect, drawX, drawY, drawWidth, drawHeight });
  }
}
