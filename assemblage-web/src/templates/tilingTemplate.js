// tilingTemplate.js - Main file for the tiling template
// Integrates all tiling pattern generators and rendering functions

import { createSquareTiling, drawSquareTile } from './tilingPatterns/squareTiling';
import { createTriangularTiling, drawTriangularTile } from './tilingPatterns/triangleTiling';
import { createHexagonalTiling, drawHexagonalTile } from './tilingPatterns/hexagonTiling';
import { createModularTiling, drawModularTile } from './tilingPatterns/modularTiling';
import { createVoronoiTiling, drawVoronoiCell } from './tilingPatterns/voronoiTiling';
import { createRhombilleTiling, drawRhombilleTile } from './tilingPatterns/rhombilleTiling';
import { createPenroseTiling, drawPenroseTile, createPenroseSunPatch, createPenroseSunRingPatch, createPenroseHardcodedPatch, createPenroseInflationTiling, createPenroseKnownGoodPatch } from './tilingPatterns/penroseTiling';

/**
 * Main render function for the tiling template
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {Array} images - Array of images to use
 * @param {Object} params - Template parameters
 * @returns {HTMLCanvasElement} The canvas with the rendered tiling
 */
function renderTiling(canvas, images, params) {
  // Get context and clear canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Validate inputs
  if (!canvas || !ctx) {
    console.error('Invalid canvas element');
    return canvas;
  }
  
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.error('No images provided');
    return canvas;
  }
  
  // Set default parameters
  params = params || {};
  const patternType = params.patternType || 'squares';
  let tileCount = params.tileCount || 16;
  if (patternType === 'penrose' && tileCount > 40) tileCount = 40;
  
  // Use parameter for unique images, default to true if not specified
  const useUniqueImages = params.useUniqueImages !== false;
  const randomRotation = params.randomRotation === true;
  const tileSpacing = params.tileSpacing || 0;
  const fillStyle = params.fillStyle || 'fullBleed';
  const debug = params.debug === true;
  const bgColor = params.bgColor || '#FFFFFF';
  const useMultiply = true; // Always use multiply blend mode
  
  // Fill background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Options for tiling generators
  const options = {
    spacing: tileSpacing,
    fillStyle: fillStyle
  };
  
  // Generate the tiles based on pattern type
  let tiles = [];
  
  switch (patternType) {
    case 'squares':
      tiles = createSquareTiling(tileCount, canvas.width, canvas.height, options);
      break;
    case 'triangles':
      tiles = createTriangularTiling(tileCount, canvas.width, canvas.height, options);
      break;
    case 'hexagons':
      tiles = createHexagonalTiling(tileCount, canvas.width, canvas.height, options);
      break;
    case 'modular':
      tiles = createModularTiling(tileCount, canvas.width, canvas.height, options);
      break;
    case 'voronoi':
      tiles = createVoronoiTiling(tileCount, canvas.width, canvas.height, options);
      break;
    case 'rhombille':
      tiles = createRhombilleTiling(tileCount, canvas.width, canvas.height, options);
      break;
    default:
      console.warn(`Unknown pattern type: ${patternType}, falling back to squares`);
      tiles = createSquareTiling(tileCount, canvas.width, canvas.height, options);
  }
  
  // Filter out any invalid tiles
  tiles = tiles.filter(tile => {
    if (!tile.points || !Array.isArray(tile.points) || tile.points.length === 0) {
      return false;
    }
    // Also filter out tiles that are completely outside the canvas
    const minX = Math.min(...tile.points.map(p => p.x));
    const maxX = Math.max(...tile.points.map(p => p.x));
    const minY = Math.min(...tile.points.map(p => p.y));
    const maxY = Math.max(...tile.points.map(p => p.y));
    return !(minX > canvas.width || maxX < 0 || minY > canvas.height || maxY < 0);
  });
  
  console.log(`Generated ${tiles.length} tiles for pattern type: ${patternType}`);
  
  // Options for drawing tiles
  const drawOptions = {
    randomRotation,
    debug
  };
  
  // Draw each tile with an image
  tiles.forEach((tile, index) => {
    // Choose image based on the mode - always use random selection
    const imageIndex = Math.floor(Math.random() * images.length);
    const image = images[imageIndex];
    
    // Skip if image not available
    if (!image || !image.complete) return;
    
    // Set multiply blend mode for all tiles
    ctx.globalCompositeOperation = 'multiply';
    
    // Calculate scale to ensure image fills tile completely with some overflow
    const tileWidth = Math.abs(Math.max(...tile.points.map(p => p.x)) - Math.min(...tile.points.map(p => p.x)));
    const tileHeight = Math.abs(Math.max(...tile.points.map(p => p.y)) - Math.min(...tile.points.map(p => p.y)));
    const imageAspect = image.width / image.height;
    const tileAspect = tileWidth / tileHeight;
    
    let scale;
    if (imageAspect > tileAspect) {
      // Image is wider than tile
      scale = (tileHeight * 1.2) / image.height; // 20% overflow
    } else {
      // Image is taller than tile
      scale = (tileWidth * 1.2) / image.width; // 20% overflow
    }
    
    // Draw the tile based on its type with proper scaling
    switch (tile.type) {
      case 'square':
        drawSquareTile(ctx, tile, image, { ...drawOptions, scale });
        break;
      case 'triangleTop':
      case 'triangleBottom':
        drawTriangularTile(ctx, tile, image, { ...drawOptions, scale });
        break;
      case 'hexagon':
        drawHexagonalTile(ctx, tile, image, { ...drawOptions, scale });
        break;
      case 'modular':
        drawModularTile(ctx, tile, image, { ...drawOptions, scale });
        break;
      case 'voronoi':
        drawVoronoiCell(ctx, tile, image, { ...drawOptions, scale });
        break;
      case 'rhombille':
        drawRhombilleTile(ctx, tile, image, { ...drawOptions, scale });
        break;
      default:
        console.warn(`Unknown tile type: ${tile.type}`);
    }
  });
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw the bounding rectangle for centeredForm mode
  if (debug && fillStyle === 'centeredForm') {
    const scale = 0.8;
    const boundWidth = canvas.width * scale;
    const boundHeight = canvas.height * scale;
    const boundX = (canvas.width - boundWidth) / 2;
    const boundY = (canvas.height - boundHeight) / 2;
    
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boundX, boundY, boundWidth, boundHeight);
  }
  
  return canvas;
}

// Export the main function as default
const tilingTemplate = {
  key: 'tilingTemplate',
  name: 'Tiling Template',
  generate: renderTiling,
  params: {
    patternType: { type: 'select', options: ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille'], default: 'squares' },
    tileCount: { type: 'number', min: 4, max: 64, default: 16 },
    useUniqueImages: { type: 'boolean', default: true },
    randomRotation: { type: 'boolean', default: false },
    tileSpacing: { type: 'number', min: 0, max: 20, default: 0 },
    fillStyle: { type: 'select', options: ['fullBleed', 'centeredForm'], default: 'fullBleed' },
    debug: { type: 'boolean', default: false },
    bgColor: { type: 'color', default: '#ffffff' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default tilingTemplate;
