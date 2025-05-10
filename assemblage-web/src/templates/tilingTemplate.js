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
  // Clamp tileCount for Penrose
  if (patternType === 'penrose' && tileCount > 40) tileCount = 40;
  const useUniqueImages = params.useUniqueImages !== false;
  const randomRotation = params.randomRotation === true;
  const tileSpacing = params.tileSpacing || 0;
  const fillStyle = params.fillStyle || 'fullBleed';
  const debug = params.debug === true;
  const bgColor = params.bgColor || '#FFFFFF';
  const useMultiply = params.useMultiply !== false;
  
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
    case 'penrose': {
      tiles = createPenroseKnownGoodPatch(canvas.width, canvas.height);
      // Apply random rotation, mirroring, and scaling to the entire patch if enabled
      if (randomRotation) {
        const angle = Math.random() * 2 * Math.PI;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const flipX = Math.random() < 0.5 ? -1 : 1;
        const flipY = Math.random() < 0.5 ? -1 : 1;
        const scale = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
        tiles = tiles.map(tile => ({
          ...tile,
          points: tile.points.map(p => {
            // Translate to center, scale, flip, rotate, then translate back
            let x = (p.x - cx) * scale * flipX;
            let y = (p.y - cy) * scale * flipY;
            const xRot = x * Math.cos(angle) - y * Math.sin(angle);
            const yRot = x * Math.sin(angle) + y * Math.cos(angle);
            return {
              x: cx + xRot,
              y: cy + yRot
            };
          })
        }));
      }
      break;
    }
    default:
      console.warn(`Unknown pattern type: ${patternType}, falling back to squares`);
      tiles = createSquareTiling(tileCount, canvas.width, canvas.height, options);
  }
  
  console.log(`Generated ${tiles.length} tiles for pattern type: ${patternType}`);
  
  // Options for drawing tiles
  const drawOptions = {
    randomRotation,
    debug
  };
  
  // Apply 'multiply' blending mode globally if needed
  if (useMultiply) {
    ctx.globalCompositeOperation = 'multiply';
  }
  
  // Draw each tile with an image
  let penroseRandomImageIndex = 0;
  if (patternType === 'penrose' && !useUniqueImages) {
    penroseRandomImageIndex = Math.floor(Math.random() * images.length);
  }
  tiles.forEach((tile, index) => {
    // Choose image based on the mode
    let imageIndex = 0;
    if (patternType === 'penrose' && !useUniqueImages) {
      // For Penrose, use the same random image for the whole patch
      imageIndex = penroseRandomImageIndex;
    } else if (useUniqueImages) {
      imageIndex = index % images.length;
    } else {
      imageIndex = 0;
    }
    const image = images[imageIndex];
    
    // Skip if image not available
    if (!image || !image.complete) return;
    
    // Draw the tile based on its type
    switch (tile.type) {
      case 'square':
        drawSquareTile(ctx, tile, image, drawOptions);
        break;
      case 'triangleTop':
      case 'triangleBottom':
        drawTriangularTile(ctx, tile, image, drawOptions);
        break;
      case 'hexagon':
        drawHexagonalTile(ctx, tile, image, drawOptions);
        break;
      case 'modular':
        drawModularTile(ctx, tile, image, drawOptions);
        break;
      case 'voronoi':
        drawVoronoiCell(ctx, tile, image, drawOptions);
        break;
      case 'rhombille':
        drawRhombilleTile(ctx, tile, image, drawOptions);
        break;
      case 'penroseThick':
      case 'penroseThin':
        drawPenroseTile(ctx, tile, image, drawOptions);
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
