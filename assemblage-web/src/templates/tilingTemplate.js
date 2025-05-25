// tilingTemplate.js - Main file for the tiling template
// Integrates all tiling pattern generators and rendering functions

import { maskRegistry } from '../masks/maskRegistry.ts';
import { svgToPath2D } from '../core/svgUtils';
import { createSquareTiling, drawSquareTile } from './tilingPatterns/squareTiling';
import { createTriangularTiling, drawTriangularTile } from './tilingPatterns/triangleTiling';
import { createHexagonalTiling, drawHexagonalTile } from './tilingPatterns/hexagonTiling';
import { createModularTiling, drawModularTile } from './tilingPatterns/modularTiling';
import { createVoronoiTiling, drawVoronoiCell } from './tilingPatterns/voronoiTiling';
import { createRhombilleTiling, drawRhombilleTile } from './tilingPatterns/rhombilleTiling';
import { getComplementaryColor } from '../utils/colorUtils.js';
import { randomVibrantColor } from '../utils/colors.js';

/**
 * Main render function for the tiling template
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {Array} images - Array of images to use
 * @param {Object} params - Template parameters
 * @returns {Object} The canvas with the rendered tiling and background color
 */
function renderTiling(canvas, images, params) {
  const ctx = canvas.getContext('2d');
  if (!canvas || !ctx) {
    console.error('Invalid canvas element');
    return { canvas, bgColor: '#ffffff' };
  }
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.error('No images provided');
    return { canvas, bgColor: '#ffffff' };
  }

  // Ensure params is an object
  params = params || {};

  // Randomize pattern type if not provided or if it's the default 'squares'
  const patternTypes = ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille'];
  let patternType = params.patternType;
  if (!patternType || patternType.toLowerCase() === 'squares') {
    patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    console.log(`[TilingTemplate] No specific patternType or default 'squares' received, randomized to: ${patternType}`);
  }
  
  // Randomize echo parameters if not explicitly set to true or false
  if (params.useColorBlockEcho === undefined || params.useColorBlockEcho === false) {
    params.useColorBlockEcho = Math.random() < 0.35; // 35% chance for tiling echo
    console.log(`[TilingTemplate] Randomized useColorBlockEcho to: ${params.useColorBlockEcho}`);
  }
  
  // Ensure echoPolicy has a default if not provided
  if (params.echoPolicy === undefined) {
    params.echoPolicy = 'subset';
  }

  let tileCount = params.tileCount || 16;
  if (patternType === 'penrose' && tileCount > 40) tileCount = 40;
  
  const randomRotation = params.randomRotation === true;
  const tileSpacing = params.tileSpacing || 0;
  const fillStyle = params.fillStyle || 'fullBleed';
  const debug = params.debug === true;
  const bgColor = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : randomVibrantColor();
  const tileOpacity = params.tileOpacity !== undefined ? params.tileOpacity : 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let calculatedEchoColor = null;
  if (params.useColorBlockEcho) {
    console.log(`[TilingTemplate] Initial attempt to set echoColor. bgColor: ${bgColor}`);
    calculatedEchoColor = getComplementaryColor(bgColor); 
    console.log(`[TilingTemplate] Initial calculatedEchoColor set to: ${calculatedEchoColor}`);
  }

  const options = { spacing: tileSpacing, fillStyle: fillStyle };
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
  
  // Filter out tiles that are completely outside the canvas
  tiles = tiles.filter(tile => {
    if (!tile.points || !Array.isArray(tile.points) || tile.points.length === 0) return false;
    const minX = Math.min(...tile.points.map(p => p.x));
    const maxX = Math.max(...tile.points.map(p => p.x));
    const minY = Math.min(...tile.points.map(p => p.y));
    const maxY = Math.max(...tile.points.map(p => p.y));
    return !(minX > canvas.width || maxX < 0 || minY > canvas.height || maxY < 0);
  });
  
  console.log(`Generated ${tiles.length} tiles for pattern type: ${patternType}`);

  const imageSources = images.filter(img => img && img.complete && !(img.isBroken && import.meta.env.MODE === 'development'));
  if (imageSources.length === 0) {
      console.warn('[TilingTemplate - renderTiling] No valid images to draw.');
      return { canvas, bgColor }; 
  }

  // Determine if we should use a single image for all tiles (25% chance)
  const useSingleImageForAllTiles = Math.random() < 0.25;
  let singleImage = null;
  if (useSingleImageForAllTiles && imageSources.length > 0) {
    singleImage = imageSources[Math.floor(Math.random() * imageSources.length)];
    console.log(`[TilingTemplate] Using single image for all tiles: ${singleImage.src}`);
  }

  tiles.forEach((tile, index) => {
    const image = singleImage ? singleImage : imageSources[Math.floor(Math.random() * imageSources.length)];
    if (!image || !image.complete) return;

    let applyEchoToThisTile = false;
    let finalEchoColorForTile = null; 

    // Determine if echo should apply based on params
    if (params.useColorBlockEcho && calculatedEchoColor) {
      finalEchoColorForTile = calculatedEchoColor; 
      const subsetRoll = Math.random();
      if (params.echoPolicy === 'all' || (params.echoPolicy === 'subset' && subsetRoll < 0.35)) {
        applyEchoToThisTile = true;
        console.log(`[TilingTemplate] Tile ${index}: Applying echo. Policy: ${params.echoPolicy}, Roll: ${subsetRoll.toFixed(3)}, Color: ${finalEchoColorForTile}`);
      }
    }

    const drawOptions = {
      randomRotation,
      debug,
      scale: 1, 
      tileOpacity, 
      applyEcho: applyEchoToThisTile,
      echoColor: finalEchoColorForTile, 
    };

    // Calculate scale to ensure image fills tile completely with some overflow
    const tileWidth = Math.abs(Math.max(...tile.points.map(p => p.x)) - Math.min(...tile.points.map(p => p.x)));
    const tileHeight = Math.abs(Math.max(...tile.points.map(p => p.y)) - Math.min(...tile.points.map(p => p.y)));
    if (tileWidth > 0 && tileHeight > 0) {
        const imageAspect = image.width / image.height;
        const tileAspect = tileWidth / tileHeight;
        // Use larger scale to ensure complete coverage with overflow
        if (imageAspect > tileAspect) {
            drawOptions.scale = (tileHeight * 1.5) / image.height; 
        } else {
            drawOptions.scale = (tileWidth * 1.5) / image.width; 
        }
    }
    
    // The specialized draw functions are expected to use ctx.save() and ctx.restore()
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
      default:
        console.warn(`Unknown tile type: ${tile.type} in renderTiling`);
    }
  });
  
  ctx.globalCompositeOperation = 'source-over';
  
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
  
  return { canvas, bgColor };
}

/**
 * Simple grid tiling generator (alternative approach)
 */
export function generateTiling(canvas, images, params) {
  if (!canvas || !images || images.length === 0) {
    console.warn("Tiling (simple grid): Canvas or images not available.");
    return { canvas, bgColor: '#ffffff' };
  }

  // Echo params for this simple tiler - randomize if not explicitly set
  if (params.useColorBlockEcho === undefined || params.useColorBlockEcho === false) {
    params.useColorBlockEcho = Math.random() < 0.35;
    console.log(`[generateTiling] Randomized useColorBlockEcho to: ${params.useColorBlockEcho}`);
  }
  
  if (params.echoPolicy === undefined) {
    params.echoPolicy = 'subset';
  }

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const { 
    numRows = 4, 
    numCols = 4, 
    randomizeSize = false, 
    sizeVariation = 0.2,
    padding = 5,
    rawBgColorParam = params.bgColor,
    tileMask = 'basic/rectangleMask', 
    objectFit = 'cover',
    tileOpacity = 1,
    tileBlendMode = 'source-over'
  } = params;

  const bgColor = (rawBgColorParam && rawBgColorParam.toLowerCase() !== '#ffffff') ? rawBgColorParam : randomVibrantColor();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  let actualEchoColorForGrid = null;
  if (params.useColorBlockEcho) { 
      const initialCalcEchoColor = getComplementaryColor(bgColor);
      console.log(`[generateTiling] Initial echo check: useColorBlockEcho=${params.useColorBlockEcho}, policy=${params.echoPolicy}, bgColor=${bgColor}, initial_calc_echoColor=${initialCalcEchoColor}`);
      if (initialCalcEchoColor && typeof initialCalcEchoColor === 'string' && initialCalcEchoColor.startsWith('#')) {
          actualEchoColorForGrid = initialCalcEchoColor;
      } else {
          console.warn(`[generateTiling] Initial getComplementaryColor for bgColor '${bgColor}' was invalid: ${initialCalcEchoColor}`);
      }
  }
  
  const imageSources = images.filter(img => img && img.complete && !(img.isBroken && import.meta.env.MODE === 'development'));
  if (imageSources.length === 0) {
      console.warn('[TilingTemplate - simple grid] No valid images to draw.');
      return { canvas, bgColor };
  }

  const baseCellWidth = width / numCols;
  const baseCellHeight = height / numRows;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const img = imageSources[(r * numCols + c) % imageSources.length];
      
      let cellWidth = baseCellWidth;
      let cellHeight = baseCellHeight;
      if (randomizeSize) {
        cellWidth *= (1 + (Math.random() - 0.5) * 2 * sizeVariation);
        cellHeight *= (1 + (Math.random() - 0.5) * 2 * sizeVariation);
      }
      
      const x = c * baseCellWidth + (baseCellWidth - cellWidth) / 2 + padding;
      const y = r * baseCellHeight + (baseCellHeight - cellHeight) / 2 + padding;
      const w = cellWidth - 2 * padding;
      const h = cellHeight - 2 * padding;

      if (w <= 0 || h <= 0) continue;

      let applyEchoToThisSpecificTile = false;
      if (params.useColorBlockEcho && actualEchoColorForGrid) { 
        const subsetRoll = Math.random();
        if (params.echoPolicy === 'all' || (params.echoPolicy === 'subset' && subsetRoll < 0.35)) {
            applyEchoToThisSpecificTile = true;
        }
      }

      ctx.save();

      // Create rectangular clipping path
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      // Apply echo color if needed
      if (applyEchoToThisSpecificTile && actualEchoColorForGrid) {
        ctx.fillStyle = actualEchoColorForGrid;
        ctx.fillRect(x, y, w, h);
        ctx.globalCompositeOperation = 'multiply';
      }

      // Draw image
      if (img && img.complete) {
        const imageAspect = img.width / img.height;
        const cellAspect = w / h;
        
        let drawX = x, drawY = y, drawW = w, drawH = h;
        
        if (objectFit === 'cover') {
          if (imageAspect > cellAspect) {
            drawH = h;
            drawW = h * imageAspect;
            drawX = x - (drawW - w) / 2;
          } else {
            drawW = w;
            drawH = w / imageAspect;
            drawY = y - (drawH - h) / 2;
          }
        }
        
        ctx.globalAlpha = tileOpacity;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      ctx.restore();
    }
  }
  
  return { canvas, bgColor };
}

// Template configuration
const tilingTemplate = {
  key: 'tilingTemplate',
  name: 'Tiling Patterns',
  render: renderTiling,
  params: {
    patternType: { 
      type: 'select', 
      options: ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille'], 
      default: 'squares' 
    },
    tileCount: { type: 'number', min: 4, max: 50, default: 16 },
    randomRotation: { type: 'boolean', default: false },
    tileSpacing: { type: 'number', min: 0, max: 20, default: 0 },
    fillStyle: { 
      type: 'select', 
      options: ['fullBleed', 'centeredForm'], 
      default: 'fullBleed' 
    },
    tileOpacity: { type: 'number', min: 0.1, max: 1, step: 0.1, default: 1 },
    useColorBlockEcho: { type: 'boolean', default: false },
    echoPolicy: { 
      type: 'select', 
      options: ['all', 'subset'], 
      default: 'subset' 
    },
    debug: { type: 'boolean', default: false },
    bgColor: { type: 'color', default: '#ffffff' }
  }
};

export default tilingTemplate;
