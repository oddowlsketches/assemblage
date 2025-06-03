/**
 * Hexagonal tiling pattern generator
 * Creates a grid of hexagons for use in the tiling template
 */

import { getSafeFillColour } from '../../utils/colorUtils.js';

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
  const { 
    randomRotation = false, 
    debug = false,
    tileOpacity = 1,
    // tileBlendMode is ignored
    applyEcho = false,
    echoColor = '#000000',
    scale = 1 // Passed from drawOptions, but hexagon size is primary driver here
  } = options;

  if (!tile || !tile.points || tile.points.length < 6 || !image || !image.complete) {
    if (debug) console.warn("Hexagonal tile, points, or image invalid for drawing.");
    return;
  }
  
  ctx.save();
  
  // Move to the center of the hexagon (tile.x, tile.y)
  // The tile.points are already relative to this center.
  ctx.translate(tile.x, tile.y);
  
  // Create clipping path for the hexagon using its relative points
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

  // Optional rotation around the hexagon's center (which is 0,0 in current translated coords)
  if (randomRotation) {
    const rotationAngle = Math.floor(Math.random() * 6) * (60 * Math.PI / 180); // 0, 60, 120, etc. degrees
    if (rotationAngle > 0) {
        ctx.rotate(rotationAngle);
    }
  }
  
  // Echo and Image drawing
  if (applyEcho && echoColor && typeof echoColor === 'string' && echoColor.startsWith('#')) {
    // Use the safe fill color utility
    const isBW = image && image.is_black_and_white !== false;
    const safeColors = getSafeFillColour(isBW, echoColor, 0.15);
    
    // Color block echo is active: Draw color base first
    ctx.globalAlpha = tileOpacity * safeColors.opacity / 0.2; // Scale to tile opacity
    ctx.fillStyle = safeColors.fillColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fill(); // Fill the clipped and transformed path
  }

  // Always draw the image with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = tileOpacity;
  drawImageInHexagon(ctx, image, tile.size, debug);
  
  if (debug) {
    // Stroke again after clipping/drawing to see final boundary
    ctx.strokeStyle = 'rgba(255,0,0,0.8)'; 
    ctx.lineWidth = 1.5;
    ctx.beginPath(); // Must re-trace path for stroke after fill/clip
    ctx.moveTo(tile.points[0].x, tile.points[0].y);
    for (let i = 1; i < tile.points.length; i++) {
        ctx.lineTo(tile.points[i].x, tile.points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
}

// Helper to draw the image within the hexagonal boundaries
function drawImageInHexagon(ctx, image, hexSize, debug) {
  if (!image || !image.complete || hexSize <= 0) return;

  // For a flat-topped hexagon, the bounding box is width = 2 * size, height = sqrt(3) * size.
  // However, to ensure coverage when rotated, it's safer to use a circular bounding area of radius = hexSize.
  // We want to cover a square of side length 2 * hexSize, centered at (0,0) in current coords.
  const diameter = hexSize * 2;
  const boundingBoxWidth = diameter;
  const boundingBoxHeight = diameter; // Use diameter to ensure coverage for all rotations

  const imageAspect = image.width / image.height;
  const boxAspect = boundingBoxWidth / boundingBoxHeight; // This will be 1

  let drawWidth, drawHeight;
  const bleedFactor = 1.1; // Ensure image slightly larger than bounding box

  if (imageAspect > boxAspect) { // Image wider than bounding box (or box is square)
    drawHeight = boundingBoxHeight * bleedFactor;
    drawWidth = drawHeight * imageAspect;
  } else { // Image taller or same aspect as bounding box
    drawWidth = boundingBoxWidth * bleedFactor;
    drawHeight = drawWidth / imageAspect;
  }

  // Center the scaled image at (0,0) in the current translated coordinate system
  const drawX = -drawWidth / 2;
  const drawY = -drawHeight / 2;
  
  ctx.drawImage(image, 0, 0, image.width, image.height, drawX, drawY, drawWidth, drawHeight);

  if (debug) {
    // console.log("drawImageInHexagon:", { hexSize, diameter, imageAspect, drawX, drawY, drawWidth, drawHeight });
  }
}
