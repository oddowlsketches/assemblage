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
  const { randomRotation = false, debug = false } = options;
  ctx.save();
  // Move to tile center
  ctx.translate(tile.x, tile.y);
  if (randomRotation) {
    const rotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
    ctx.rotate(rotation);
  }
  // Create rhombus clipping path
  ctx.beginPath();
  const pts = tile.points.map(pt => ({ x: pt.x - tile.x, y: pt.y - tile.y }));
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.clip();
  if (image && image.complete) {
    // Calculate bounding box
    let minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    // Aspect ratio logic: fill the rhombus, centered, with possible bleed
    const imageAspect = image.width / image.height;
    const tileAspect = boxWidth / boxHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imageAspect > tileAspect) {
      drawHeight = boxHeight;
      drawWidth = drawHeight * imageAspect;
      offsetX = (boxWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = boxWidth;
      drawHeight = drawWidth / imageAspect;
      offsetX = 0;
      offsetY = (boxHeight - drawHeight) / 2;
    }
    ctx.drawImage(
      image,
      minX + offsetX,
      minY + offsetY,
      drawWidth,
      drawHeight
    );
  }
  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
} 