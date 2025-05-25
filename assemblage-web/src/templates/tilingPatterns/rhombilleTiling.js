// rhombilleTiling.js
// Rhombille (isometric diamond) tiling pattern generator and draw function

/**
 * Generate data for rhombille tiling
 * @param {number} count - Approximate number of tiles to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of tile objects with position and points
 */
export function createRhombilleTiling(count, width, height, options = {}) {
  const { spacing = 0, fillStyle = 'fullBleed' } = options;
  // Rhombille tiling: each tile is a 60-degree rhombus (diamond)
  // We'll use a grid of points, offset every other row
  const aspectRatio = width / height;
  let rowCount = Math.round(Math.sqrt(count / aspectRatio));
  let colCount = Math.round(rowCount * aspectRatio);
  // Rhombus width and height
  const rhombWidth = width / colCount;
  const rhombHeight = 2 * rhombWidth;
  // For fullBleed, add extra rows/cols and negative offset
  let offsetX = 0, offsetY = 0, scale = 1, bleedCols = 0, bleedRows = 3;
  if (fillStyle === 'centeredForm') {
    scale = 0.8;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    offsetX = (width - scaledWidth) / 2;
    offsetY = (height - scaledHeight) / 2 + (rhombHeight * scale) / 2;
  } else {
    bleedCols = 2;
    colCount += bleedCols;
    rowCount += bleedRows;
    offsetX = -rhombWidth * scale;
    offsetY = -rhombHeight * scale;
  }
  const tiles = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      // Offset every other row by half a rhombus width
      const x = offsetX + (col * rhombWidth * scale) + ((row % 2) * rhombWidth * scale / 2);
      const y = offsetY + (row * rhombHeight * scale * 0.5);
      const w = rhombWidth * scale - spacing;
      const h = rhombHeight * scale - spacing;
      // Four points of the rhombus (centered at x, y)
      const points = [
        { x: x + w / 2, y: y }, // right
        { x: x, y: y + h / 2 }, // bottom
        { x: x - w / 2, y: y }, // left
        { x: x, y: y - h / 2 }  // top
      ];
      tiles.push({
        x, y, width: w, height: h, row, col, type: 'rhombille', points
      });
    }
  }
  return tiles;
}

/**
 * Draw a rhombille tile on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} tile - Tile data
 * @param {Image} image - Image to use for the tile
 * @param {Object} options - Additional options
 */
export function drawRhombilleTile(ctx, tile, image, options = {}) {
  const { 
    randomRotation = false, 
    debug = false,
    tileOpacity = 1,
    tileBlendMode = 'source-over',
    applyEcho = false,
    useEchoVariation = false,
    echoColor = '#000000',
    // Note: The 'scale' parameter from squareTiling options isn't directly used here;
    // scaling is derived from tile geometry and image aspect ratio.
  } = options;

  if (!tile || !tile.points || tile.points.length < 4 || !image || !image.complete) {
    if (debug) console.warn("Rhombille tile, points, or image invalid for drawing.");
    return;
  }

  ctx.save();

  // The tile.x and tile.y are the logical center of the rhombus cell,
  // but the points are absolute. We need to translate to the actual
  // drawing origin if we want to use 0,0 based coordinates for drawing within the rhombus path.
  // However, the original logic created the path using absolute points then clipped.
  // For consistency, let's ensure clipping path is set up first.

  ctx.beginPath();
  ctx.moveTo(tile.points[0].x, tile.points[0].y);
  for (let i = 1; i < tile.points.length; i++) {
    ctx.lineTo(tile.points[i].x, tile.points[i].y);
  }
  ctx.closePath();

  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke(); // Stroke the path before clipping to see its outline
  }
  
  ctx.clip();

  // Optional rotation around the geometric center of the rhombus
  // Calculate geometric center for rotation
  const centerX = tile.points.reduce((sum, p) => sum + p.x, 0) / tile.points.length;
  const centerY = tile.points.reduce((sum, p) => sum + p.y, 0) / tile.points.length;

  if (randomRotation) {
    const rotationAngle = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, 270 degrees
    if (rotationAngle > 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
    }
  }
  
  // Image drawing logic considering echo
  if (applyEcho) {
    // Color block echo is active for this tile: Draw color base first
    ctx.globalAlpha = tileOpacity * 0.75; // Echo block is relative to tileOpacity
    ctx.fillStyle = echoColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fill(); // Fill the clipped path (already transformed for rotation if any)
  }

  // Always draw the image with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = tileOpacity; // Image is drawn with the specified tileOpacity
  drawImageInRhombus(ctx, image, tile.points);
  
  ctx.restore();
}

// Helper to draw the image within the rhombus boundaries
function drawImageInRhombus(ctx, image, points) {
  if (!image || !image.complete || !points || points.length < 4) return;

  // Calculate bounding box of the rhombus from its points
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  if (boxWidth <= 0 || boxHeight <= 0) return;

  // Aspect ratio logic: fill the rhombus's bounding box, centered, with overflow.
  // This aims for a "cover" like effect for the bounding box.
  const imageAspect = image.width / image.height;
  const boxAspect = boxWidth / boxHeight;
  
  let drawWidth, drawHeight, sx, sy, sWidth, sHeight;

  sWidth = image.width;
  sHeight = image.height;
  sx = 0;
  sy = 0;

  // Determine drawing dimensions to cover the bounding box
  if (imageAspect > boxAspect) { // Image is wider than box
    drawHeight = boxHeight * 1.15; // Add a bit of bleed (15%)
    drawWidth = drawHeight * imageAspect;
  } else { // Image is taller than or same aspect as box
    drawWidth = boxWidth * 1.15; // Add a bit of bleed (15%)
    drawHeight = drawWidth / imageAspect;
  }
  
  // Center the image within the bounding box
  const drawX = minX + (boxWidth - drawWidth) / 2;
  const drawY = minY + (boxHeight - drawHeight) / 2;

  ctx.drawImage(
    image,
    sx, sy, sWidth, sHeight, // Source rect (full image)
    drawX, drawY, drawWidth, drawHeight // Destination rect
  );
} 