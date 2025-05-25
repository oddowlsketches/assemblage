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
  const { 
    randomRotation = false, 
    debug = false,
    tileOpacity = 1,
    // tileBlendMode is ignored, always multiply for the image
    applyEcho = false,
    echoColor = '#000000',
    scale = 1 // Note: scale from drawOptions is passed but might not be directly used in the same way as squareTiling
  } = options;

  if (!tile || !tile.points || tile.points.length < 3 || !image || !image.complete) {
    if (debug) console.warn("Triangular tile, points, or image invalid for drawing.");
    return;
  }
  
  ctx.save();
  
  // The tile.points are relative to tile.x, tile.y after translation.
  ctx.translate(tile.x, tile.y);
  
  // Create clipping path for the triangle using relative points
  ctx.beginPath();
  ctx.moveTo(tile.points[0].x, tile.points[0].y);
  ctx.lineTo(tile.points[1].x, tile.points[1].y);
  ctx.lineTo(tile.points[2].x, tile.points[2].y);
  ctx.closePath();

  if (debug) {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Green for path outline before clip
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.clip();

  // Optional rotation - needs to happen around the triangle's centroid *after* initial translation
  // and before drawing content.
  if (randomRotation) {
    // Calculate centroid of the relative points for rotation
    const centroidX = (tile.points[0].x + tile.points[1].x + tile.points[2].x) / 3;
    const centroidY = (tile.points[0].y + tile.points[1].y + tile.points[2].y) / 3;
    
    ctx.translate(centroidX, centroidY);
    const rotationAngle = Math.floor(Math.random() * 3) * (120 * Math.PI / 180); // 0, 120, 240 degrees
    ctx.rotate(rotationAngle);
    ctx.translate(-centroidX, -centroidY);
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
  // Pass tile.width and tile.height which represent the cell containing the two triangles.
  // The drawImageInTriangle will use the specific tile.points for the exact triangle shape.
  drawImageInTriangle(ctx, image, tile.points, tile.width, tile.height, scale, debug);
  
  if (debug) {
    // Stroke again after clipping and drawing to see the final clipped area boundary
    ctx.strokeStyle = 'rgba(255,0,0,0.8)'; 
    ctx.lineWidth = 1.5;
    // Must re-trace path to stroke it, as fill/clip consumes current path
    ctx.beginPath();
    ctx.moveTo(tile.points[0].x, tile.points[0].y);
    ctx.lineTo(tile.points[1].x, tile.points[1].y);
    ctx.lineTo(tile.points[2].x, tile.points[2].y);
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
}

// Helper to draw the image within the triangular boundaries
function drawImageInTriangle(ctx, image, points, cellWidth, cellHeight, optionsScale, debug) {
  if (!image || !image.complete || !points || points.length < 3) return;

  // Bounding box of the specific triangle (using its relative points)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  const triBoundingBoxWidth = maxX - minX;
  const triBoundingBoxHeight = maxY - minY;

  if (triBoundingBoxWidth <= 0 || triBoundingBoxHeight <= 0) return;

  const imageAspect = image.width / image.height;
  const boxAspect = triBoundingBoxWidth / triBoundingBoxHeight;

  let drawWidth, drawHeight;
  const bleedFactor = 1.2; // How much larger the image should be than the bounding box to ensure coverage

  if (imageAspect > boxAspect) { // Image is wider than triangle's bounding box
    drawHeight = triBoundingBoxHeight * bleedFactor;
    drawWidth = drawHeight * imageAspect;
  } else { // Image is taller or same aspect
    drawWidth = triBoundingBoxWidth * bleedFactor;
    drawHeight = drawWidth / imageAspect;
  }

  // Center the scaled image over the triangle's bounding box
  // The points are relative to the translated origin (tile.x, tile.y)
  const drawX = minX + (triBoundingBoxWidth - drawWidth) / 2;
  const drawY = minY + (triBoundingBoxHeight - drawHeight) / 2;
  
  ctx.drawImage(image, 0, 0, image.width, image.height, drawX, drawY, drawWidth, drawHeight);
  
  if (debug && (points[0].x === 0 && points[0].y ===0 && points[1].x === cellWidth)) { // only log for one of the triangles in a cell
     console.log("drawImageInTriangle:", {minX, minY, triBoundingBoxWidth, triBoundingBoxHeight,imageAspect,boxAspect, drawX, drawY, drawWidth, drawHeight });
  }
}
