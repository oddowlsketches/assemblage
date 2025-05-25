/**
 * Square tiling pattern generator
 * Creates a grid of squares for use in the tiling template
 */

import { svgToPath2D } from '../../core/svgUtils'; // Assuming path is correct
import { maskRegistry } from '../../masks/maskRegistry.ts';

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
  if (!tile || !tile.points || tile.points.length < 4) return;
  
  const { 
    randomRotation = false, 
    debug = false, 
    scale = 1, 
    tileOpacity = 1,
    tileBlendMode = 'source-over',
    applyEcho = false,
    useEchoVariation = false,
    echoColor = '#000000'
  } = options;

  ctx.save();

  // Create path for the square tile
  ctx.beginPath();
  ctx.moveTo(tile.points[0].x, tile.points[0].y);
  for (let i = 1; i < tile.points.length; i++) {
    ctx.lineTo(tile.points[i].x, tile.points[i].y);
  }
  ctx.closePath();

  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.clip();

  // Apply rotation if needed
  if (randomRotation) {
    const angle = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, 270
    if (angle > 0) {
      ctx.translate(tile.points[0].x + tile.width / 2, tile.points[0].y + tile.height / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.translate(-(tile.points[0].x + tile.width / 2), -(tile.points[0].y + tile.height / 2));
    }
  }

  // Image drawing logic considering echo
  if (applyEcho && echoColor && typeof echoColor === 'string' && echoColor.startsWith('#')) {
    // Color block echo is active for this tile: Draw color base first
    ctx.globalAlpha = tileOpacity * 0.85; 
    ctx.fillStyle = echoColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fill(); 
    console.log(`[DrawSquareTile] Echo drawn: color=${echoColor}, opacity=${ctx.globalAlpha}`);
    
    // Now draw image on top with multiply
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = tileOpacity; 
    drawImageInTile(ctx, image, tile, scale);
  } else {
    // If not applying echo, draw image as per original blend mode or default to multiply
    ctx.globalCompositeOperation = options.tileBlendMode || 'multiply'; 
    ctx.globalAlpha = tileOpacity; 
    drawImageInTile(ctx, image, tile, scale);
  }
  
  ctx.restore();
}

// Helper to draw the image within the tile boundaries, maintaining aspect ratio
function drawImageInTile(ctx, image, tile, scale) {
  const tileWidth = tile.width;
  const tileHeight = tile.height;
  const imageAspect = image.width / image.height;
  const tileAspect = tileWidth / tileHeight;
  
  // Calculate dimensions to maintain aspect ratio (cover behavior)
  let drawWidth, drawHeight, dx, dy;
  
  if (imageAspect > tileAspect) {
    // Image is wider than tile - fit to height and crop width
    drawHeight = tileHeight * scale;
    drawWidth = drawHeight * imageAspect;
    dx = tile.points[0].x - (drawWidth - tileWidth) / 2;
    dy = tile.points[0].y;
  } else {
    // Image is taller than tile - fit to width and crop height
    drawWidth = tileWidth * scale;
    drawHeight = drawWidth / imageAspect;
    dx = tile.points[0].x;
    dy = tile.points[0].y - (drawHeight - tileHeight) / 2;
  }
  
  // Ensure minimum coverage - if scale results in gaps, increase size
  const minWidth = tileWidth * 1.1; // 10% overflow to prevent gaps
  const minHeight = tileHeight * 1.1;
  
  if (drawWidth < minWidth) {
    const ratio = minWidth / drawWidth;
    drawWidth = minWidth;
    drawHeight *= ratio;
    dx = tile.points[0].x - (drawWidth - tileWidth) / 2;
    dy = tile.points[0].y - (drawHeight - tileHeight) / 2;
  }
  
  if (drawHeight < minHeight) {
    const ratio = minHeight / drawHeight;
    drawHeight = minHeight;
    drawWidth *= ratio;
    dx = tile.points[0].x - (drawWidth - tileWidth) / 2;
    dy = tile.points[0].y - (drawHeight - tileHeight) / 2;
  }

  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}
