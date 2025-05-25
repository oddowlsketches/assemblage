import { maskRegistry } from '../masks/maskRegistry.ts';
import { svgToPath2D } from '../core/svgUtils.js';
import { randomVibrantColor } from '../utils/colors.js';
import { getComplementaryColor } from '../utils/colorUtils.js';

/**
 * Apply final alignment adjustments to ensure better edge contacts
 * @param {Array} composition - Array of shape objects
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} complexity - Complexity factor 0-1
 */
function finalizeEdgeContacts(composition, canvasWidth, canvasHeight, complexity) {
  if (!composition || composition.length < 2) return;
  
  for (let i = 0; i < composition.length; i++) {
    for (let j = i + 1; j < composition.length; j++) {
      const shape1 = composition[i];
      const shape2 = composition[j];

      if (!shape1._drawParams) shape1._drawParams = {};
      if (!shape2._drawParams) shape2._drawParams = {};

      const s1Bounds = { x: shape1.x, y: shape1.y, width: shape1.width, height: shape1.height, right: shape1.x + shape1.width, bottom: shape1.y + shape1.height, cx: shape1.x + shape1.width/2, cy: shape1.y + shape1.height/2 };
      const s2Bounds = { x: shape2.x, y: shape2.y, width: shape2.width, height: shape2.height, right: shape2.x + shape2.width, bottom: shape2.y + shape2.height, cx: shape2.x + shape2.width/2, cy: shape2.y + shape2.height }; 

      const adjacencyTolerance = Math.min(s1Bounds.width, s1Bounds.height, s2Bounds.width, s2Bounds.height) * 0.20; // Increased tolerance
      const overlapForTouch = 2; // How much to overlap to ensure contact

      // Check for potential horizontal adjacency (centers are somewhat aligned vertically, and x-positions are close)
      const yCenterDiff = Math.abs(s1Bounds.cy - s2Bounds.cy);
      const xDiff = Math.min(Math.abs(s1Bounds.right - s2Bounds.x), Math.abs(s2Bounds.right - s1Bounds.x));
      const horizontallyAdjacent = xDiff < adjacencyTolerance && yCenterDiff < (s1Bounds.height + s2Bounds.height) * 0.3;

      // Check for potential vertical adjacency (centers are somewhat aligned horizontally, and y-positions are close)
      const xCenterDiff = Math.abs(s1Bounds.cx - s2Bounds.cx);
      const yDiff = Math.min(Math.abs(s1Bounds.bottom - s2Bounds.y), Math.abs(s2Bounds.bottom - s1Bounds.y));
      const verticallyAdjacent = yDiff < adjacencyTolerance && xCenterDiff < (s1Bounds.width + s2Bounds.width) * 0.3;

      if (!horizontallyAdjacent && !verticallyAdjacent) continue;

      // --- SemiCircle + SemiCircle --- 
      if (shape1.type === 'semiCircle' && shape2.type === 'semiCircle') {
        if (horizontallyAdjacent) {
          shape1.y = s2Bounds.cy - shape1.height / 2; // Align vertical centers
          shape2.y = s1Bounds.cy - shape2.height / 2;
          if (s1Bounds.cx < s2Bounds.cx) { // s1 left of s2
            shape1._drawParams.orientation = 'right'; shape2._drawParams.orientation = 'left';
            shape2.x = shape1.x + shape1.width - overlapForTouch;
          } else { // s2 left of s1
            shape2._drawParams.orientation = 'right'; shape1._drawParams.orientation = 'left';
            shape1.x = shape2.x + shape2.width - overlapForTouch;
          }
        } else if (verticallyAdjacent) {
          shape1.x = s2Bounds.cx - shape1.width / 2; // Align horizontal centers
          shape2.x = s1Bounds.cx - shape2.width / 2;
          if (Math.random() < 0.6) { // 60% for horizontal seam
            if (s1Bounds.cy < s2Bounds.cy) { // s1 above s2
              shape1._drawParams.orientation = 'bottom'; shape2._drawParams.orientation = 'top';
              shape2.y = shape1.y + shape1.height - overlapForTouch;
            } else { // s2 above s1
              shape2._drawParams.orientation = 'bottom'; shape1._drawParams.orientation = 'top';
              shape1.y = shape2.y + shape2.height - overlapForTouch;
            }
          } else { // S-curve style
            if (s1Bounds.cy < s2Bounds.cy) {
              shape1._drawParams.orientation = 'left'; shape2._drawParams.orientation = 'right';
            } else {
              shape1._drawParams.orientation = 'right'; shape2._drawParams.orientation = 'left';
            }
             // Nudge y for S-curve if they were significantly offset vertically by initial placement
            if (yDiff > adjacencyTolerance * 0.5) {
                 if (s1Bounds.cy < s2Bounds.cy) shape2.y = shape1.y + shape1.height * 0.3 - overlapForTouch;
                 else shape1.y = shape2.y + shape2.height * 0.3 - overlapForTouch;
            }
          }
        }
      } 
      // --- SemiCircle + Triangle --- 
      else if ((shape1.type === 'semiCircle' && shape2.type === 'triangle') || (shape1.type === 'triangle' && shape2.type === 'semiCircle')) {
        const semi = shape1.type === 'semiCircle' ? shape1 : shape2;
        const tri = shape1.type === 'triangle' ? shape1 : shape2;
        const semiBounds = shape1.type === 'semiCircle' ? s1Bounds : s2Bounds;
        const triBounds = shape1.type === 'triangle' ? s1Bounds : s2Bounds;

        if (horizontallyAdjacent) {
          semi.y = triBounds.cy - semi.height / 2;
          tri.y = semiBounds.cy - tri.height / 2;
          if (semiBounds.cx < triBounds.cx) { // Semi left, Tri right
            semi._drawParams.orientation = 'right'; tri._drawParams.orientation = 'left-flat';
            tri.x = semi.x + semi.width - overlapForTouch;
          } else { // Tri left, Semi right
            tri._drawParams.orientation = 'right-flat'; semi._drawParams.orientation = 'left';
            semi.x = tri.x + tri.width - overlapForTouch;
          }
        } else if (verticallyAdjacent) {
          semi.x = triBounds.cx - semi.width / 2;
          tri.x = semiBounds.cx - tri.width / 2;
          if (semiBounds.cy < triBounds.cy) { // Semi top, Tri bottom
            semi._drawParams.orientation = 'bottom'; tri._drawParams.orientation = 'top-flat';
            tri.y = semi.y + semi.height - overlapForTouch;
          } else { // Tri top, Semi bottom
            tri._drawParams.orientation = 'bottom-flat'; semi._drawParams.orientation = 'top';
            semi.y = tri.y + tri.height - overlapForTouch;
          }
        }
      }
      // --- Triangle + Triangle ---
      else if (shape1.type === 'triangle' && shape2.type === 'triangle') {
        if (horizontallyAdjacent) {
          shape1.y = s2Bounds.cy - shape1.height / 2;
          shape2.y = s1Bounds.cy - shape2.height / 2;
          if (s1Bounds.cx < s2Bounds.cx) {
            shape1._drawParams.orientation = 'right-flat'; shape2._drawParams.orientation = 'left-flat';
            shape2.x = shape1.x + shape1.width - overlapForTouch;
          } else {
            shape2._drawParams.orientation = 'right-flat'; shape1._drawParams.orientation = 'left-flat';
            shape1.x = shape2.x + shape2.width - overlapForTouch;
          }
        } else if (verticallyAdjacent) {
          shape1.x = s2Bounds.cx - shape1.width / 2;
          shape2.x = s1Bounds.cx - shape2.width / 2;
          if (s1Bounds.cy < s2Bounds.cy) {
            shape1._drawParams.orientation = 'bottom-flat'; shape2._drawParams.orientation = 'top-flat';
            shape2.y = shape1.y + shape1.height - overlapForTouch;
          } else {
            shape2._drawParams.orientation = 'bottom-flat'; shape1._drawParams.orientation = 'top-flat';
            shape1.y = shape2.y + shape2.height - overlapForTouch;
          }
        }
      }
      // --- Rectangle + SemiCircle ---
      else if ((shape1.type === 'rectangular' && shape2.type === 'semiCircle') || (shape1.type === 'semiCircle' && shape2.type === 'rectangular')) {
        const rect = shape1.type === 'rectangular' ? shape1 : shape2;
        const semi = shape1.type === 'semiCircle' ? shape1 : shape2;
        const rectBounds = shape1.type === 'rectangular' ? s1Bounds : s2Bounds;
        const semiBounds = shape1.type === 'semiCircle' ? s1Bounds : s2Bounds;

        if (horizontallyAdjacent) {
          rect.y = semiBounds.cy - rect.height / 2;
          semi.y = rectBounds.cy - semi.height / 2;
          if (rectBounds.cx < semiBounds.cx) { // Rect left, Semi right
            semi._drawParams.orientation = 'left'; // Flat side of semi towards rect
            semi.x = rect.x + rect.width - overlapForTouch;
          } else { // Semi left, Rect right
            semi._drawParams.orientation = 'right';
            rect.x = semi.x + semi.width - overlapForTouch;
          }
        } else if (verticallyAdjacent) {
          rect.x = semiBounds.cx - rect.width / 2;
          semi.x = rectBounds.cx - semi.width / 2;
          if (rectBounds.cy < semiBounds.cy) { // Rect top, Semi bottom
            semi._drawParams.orientation = 'top';
            semi.y = rect.y + rect.height - overlapForTouch;
          } else { // Semi top, Rect bottom
            semi._drawParams.orientation = 'bottom';
            rect.y = semi.y + semi.height - overlapForTouch;
          }
        }
      }
      // --- Rectangle + Triangle ---
       else if ((shape1.type === 'rectangular' && shape2.type === 'triangle') || (shape1.type === 'triangle' && shape2.type === 'rectangular')) {
        const rect = shape1.type === 'rectangular' ? shape1 : shape2;
        const tri = shape1.type === 'triangle' ? shape1 : shape2;
        const rectBounds = shape1.type === 'rectangular' ? s1Bounds : s2Bounds;
        const triBounds = shape1.type === 'triangle' ? s1Bounds : s2Bounds;

        if (horizontallyAdjacent) {
          rect.y = triBounds.cy - rect.height / 2;
          tri.y = rectBounds.cy - tri.height / 2;
          if (rectBounds.cx < triBounds.cx) { // Rect left, Tri right
            tri._drawParams.orientation = 'left-flat'; // Flat side of tri towards rect
            tri.x = rect.x + rect.width - overlapForTouch;
          } else { // Tri left, Rect right
            tri._drawParams.orientation = 'right-flat';
            rect.x = tri.x + tri.width - overlapForTouch;
          }
        } else if (verticallyAdjacent) {
          rect.x = triBounds.cx - rect.width / 2;
          tri.x = rectBounds.cx - tri.width / 2;
          if (rectBounds.cy < triBounds.cy) { // Rect top, Tri bottom
            tri._drawParams.orientation = 'top-flat';
            tri.y = rect.y + rect.height - overlapForTouch;
          } else { // Tri top, Rect bottom
            tri._drawParams.orientation = 'bottom-flat';
            rect.y = tri.y + tri.height - overlapForTouch;
          }
        }
      }
    }
  }
  return composition; // Return modified composition
}

// pairedForms.js
// A template that creates compositions from multiple masks that touch along edges

/**
 * Generate a composition where multiple shapes mask different images
 * and come together to form a cohesive abstract composition
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {HTMLImageElement[]} images - Array of available images
 * @param {Object} params - Configuration parameters
 */
export function generatePairedForms(canvas, images, params) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  
  // Enable debug outlines only if requested
  window.debugPairedForms = params.debug || false;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill with background color
  const bgColorToUse = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : randomVibrantColor();
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Interpret parameters - default to 2 forms (diptych)
  const formCount = parseInt(params.formCount) || 2;
  const formType = params.formType || 'mixed';
  const complexity = parseFloat(params.complexity) || 0.5;
  const alignmentType = params.alignmentType || 'edge';
  
  // Create a plan for the composition
  let composition = createDiptychTriptych(
    canvas.width, 
    canvas.height, 
    formCount, 
    complexity, 
    formType
  );
  
  // Apply composition rules for better visual quality
  composition = applyCompositionRules(composition, canvas.width, canvas.height);
  
  // Apply modular grid for consistent spacing
  composition = applyModularGrid(composition, canvas.width, canvas.height);
  
  // Apply final alignment adjustments for better edge contacts
  finalizeEdgeContacts(composition, canvas.width, canvas.height, complexity);
  
  // Draw the composition
  drawComposition(ctx, composition, images, params.useMultiply !== false, formType, params);
  
  return { canvas, bgColor: bgColorToUse };
}

// Design principles constants
const GOLDEN_RATIO = 1.618;
const RULE_OF_THIRDS = 1/3;
const MIN_ELEMENT_SIZE = 0.1; // 10% of canvas
const MAX_ELEMENT_SIZE = 0.7; // 70% of canvas

/**
 * Apply composition rules to improve visual quality
 */
function applyCompositionRules(shapes, canvasWidth, canvasHeight) {
  if (!shapes || shapes.length === 0) return shapes;
  
  // Sort shapes by size to establish hierarchy
  const sortedBySize = [...shapes].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  // Apply visual hierarchy
  sortedBySize.forEach((shape, index) => {
    if (index === 0) {
      // Primary element - ensure it's prominent but not overwhelming
      const area = shape.width * shape.height;
      const canvasArea = canvasWidth * canvasHeight;
      const ratio = area / canvasArea;
      
      if (ratio > MAX_ELEMENT_SIZE) {
        // Scale down if too large
        const scale = Math.sqrt(MAX_ELEMENT_SIZE / ratio);
        shape.width *= scale;
        shape.height *= scale;
      } else if (ratio < 0.3) {
        // Scale up if too small for primary element
        const scale = Math.sqrt(0.3 / ratio);
        shape.width *= scale;
        shape.height *= scale;
      }
    }
  });
  
  // Apply golden ratio for adjacent shapes when possible
  for (let i = 0; i < shapes.length - 1; i++) {
    const shape1 = shapes[i];
    const shape2 = shapes[i + 1];
    
    const area1 = shape1.width * shape1.height;
    const area2 = shape2.width * shape2.height;
    const ratio = area1 / area2;
    
    // If ratio is close to golden ratio, adjust slightly to match exactly
    if (ratio > 1.4 && ratio < 1.8) {
      const targetArea = area1 / GOLDEN_RATIO;
      const scale = Math.sqrt(targetArea / area2);
      shape2.width *= scale;
      shape2.height *= scale;
    }
  }
  
  return shapes;
}

/**
 * Ensure proper spacing and alignment using modular grid
 */
function applyModularGrid(shapes, canvasWidth, canvasHeight) {
  const GRID_UNIT = 4; // Base unit for spacing - REDUCED from 8
  
  // Round positions and sizes to grid
  shapes.forEach(shape => {
    shape.x = Math.round(shape.x / GRID_UNIT) * GRID_UNIT;
    shape.y = Math.round(shape.y / GRID_UNIT) * GRID_UNIT;
    shape.width = Math.round(shape.width / GRID_UNIT) * GRID_UNIT;
    shape.height = Math.round(shape.height / GRID_UNIT) * GRID_UNIT;
  });
  
  // Ensure shapes either touch exactly or have clear separation
  for (let i = 0; i < shapes.length - 1; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const shape1 = shapes[i];
      const shape2 = shapes[j];
      
      // Check horizontal spacing
      const hGap = Math.min(
        Math.abs(shape2.x - (shape1.x + shape1.width)),
        Math.abs(shape1.x - (shape2.x + shape2.width))
      );
      
      // Check vertical spacing
      const vGap = Math.min(
        Math.abs(shape2.y - (shape1.y + shape1.height)),
        Math.abs(shape1.y - (shape2.y + shape2.height))
      );
      
      // If shapes are almost touching (within 1 grid unit), make them touch exactly
      if (hGap > 0 && hGap < GRID_UNIT && vGap > shape1.height * 0.5) {
        if (shape1.x < shape2.x) {
          shape2.x = shape1.x + shape1.width;
        } else {
          shape1.x = shape2.x + shape2.width;
        }
      }
      
      if (vGap > 0 && vGap < GRID_UNIT && hGap > shape1.width * 0.5) {
        if (shape1.y < shape2.y) {
          shape2.y = shape1.y + shape1.height;
        } else {
          shape1.y = shape2.y + shape2.height;
        }
      }
    }
  }
  
  return shapes;
}

/**
 * Create a simple diptych or triptych composition
 */
function createDiptychTriptych(width, height, formCount, complexity, formType = 'rectangular') {
  const composition = []; 
  const tempShapesData = []; 
  
  function pickType(index, count) {
    if (formType === 'mixed') {
      const types = [
        { type: 'rectangular', weight: 3 },
        { type: 'semiCircle', weight: 7 }, // Further increased weight for semiCircle
        { type: 'triangle', weight: 5 },   // Increased weight for triangle
        { type: 'hexagon', weight: 1 }    // Reduced weight for hexagon
      ];
      
      const weightedTypes = types.reduce((acc, item) => acc.concat(Array(item.weight).fill(item.type)), []);
      
      const complementaryPairs = {
        'semiCircle': [
          { type: 'semiCircle', weight: 8 }, 
          { type: 'triangle', weight: 4 }, 
          { type: 'rectangular', weight: 3 }
        ], 
        'triangle': [
          { type: 'triangle', weight: 7 }, 
          { type: 'semiCircle', weight: 4 }, 
          { type: 'rectangular', weight: 3 },
          { type: 'hexagon', weight: 1 }
        ], 
        'rectangular': [
          { type: 'rectangular', weight: 5}, 
          { type: 'semiCircle', weight: 4 }, 
          { type: 'triangle', weight: 4 }, 
          { type: 'hexagon', weight: 1 }
        ],
        'hexagon': [ 
          { type: 'triangle', weight: 5 }, 
          { type: 'rectangular', weight: 3 }
        ] 
      };

      if (index > 0 && tempShapesData[index - 1]) {
        const prevType = tempShapesData[index - 1].type;
        const complementsPool = complementaryPairs[prevType] || types; 
        
        const weightedComplements = complementsPool.reduce((acc, item) => {
            if (item && typeof item === 'object' && item.type && item.weight) {
                return acc.concat(Array(item.weight).fill(item.type));
            }
            return acc; 
        }, []);

        if (weightedComplements.length > 0 && Math.random() < 0.9) { // High chance to pick a complement
          return weightedComplements[Math.floor(Math.random() * weightedComplements.length)];
        }
      }
      return weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    }
    return formType;
  }
  
  const isVerticalSplit = Math.random() < 0.5 + (complexity * 0.2 - 0.1); 
  const variationFactor = (0.05 + complexity * 0.25);
  
  const useMargins = Math.random() < (complexity * 0.3 + 0.02); // Reduced chance of margins
  const marginFactor = useMargins ? (0.03 + Math.random() * complexity * 0.07) : 0; // Smaller margins
  
  const effectiveWidth = width * (1 - marginFactor * 2);
  const effectiveHeight = height * (1 - marginFactor * 2);
  const marginX = width * marginFactor;
  const marginY = height * marginFactor;
  
  let lastShapeType = null;
  let lastShapeBounds = null;

  if (isVerticalSplit) {
    let currentX = marginX;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      shapeHeight = effectiveHeight * (0.55 + Math.random() * 0.35); // Range 55-90%
      const yPos = marginY + (effectiveHeight - shapeHeight) / 2;

      if (formCount === 2) {
        shapeWidth = effectiveWidth * (0.45 + Math.random() * 0.1); // Aim for roughly half each
      } else {
        shapeWidth = effectiveWidth / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
      }
      shapeWidth = Math.max(effectiveWidth * 0.3, Math.min(shapeWidth, effectiveWidth * 0.7)); 
      
      let actualX = currentX;
      if (!useMargins && i > 0 && lastShapeBounds) { // If no margins and not the first shape
         actualX = lastShapeBounds.right -1; // Force overlap slightly for finalizeEdgeContacts
      }

      const newShape = { type: shapeType, x: actualX, y: yPos, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) };
      tempShapesData.push(newShape);
      currentX = actualX + shapeWidth + (useMargins ? effectiveWidth * 0.01 : 0); // Minimal spacing if margins
      lastShapeType = shapeType;
      lastShapeBounds = { right: actualX + shapeWidth };
    }
  } else { // Horizontal split
    let currentY = marginY;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      shapeWidth = effectiveWidth * (0.55 + Math.random() * 0.35);
      const xPos = marginX + (effectiveWidth - shapeWidth) / 2; 

      if (formCount === 2) {
        shapeHeight = effectiveHeight * (0.45 + Math.random() * 0.1);
      } else {
        shapeHeight = effectiveHeight / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
      }
      shapeHeight = Math.max(effectiveHeight * 0.3, Math.min(shapeHeight, effectiveHeight * 0.7)); 

      let actualY = currentY;
      if (!useMargins && i > 0 && lastShapeBounds) {
        actualY = lastShapeBounds.bottom -1; // Force overlap
      }
      
      const newShape = { type: shapeType, x: xPos, y: actualY, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) };
      tempShapesData.push(newShape);
      currentY = actualY + shapeHeight + (useMargins ? effectiveHeight * 0.01 : 0);
      lastShapeType = shapeType;
      lastShapeBounds = { bottom: actualY + shapeHeight };
    }
  }

  // Center the whole group if it doesn't fill the effective area and no margins were intended for spacing
  if (!useMargins) {
    if (isVerticalSplit) {
        const groupWidth = tempShapesData.reduce((sum, s, idx) => sum + s.width + (idx > 0 ? -1 : 0) , 0);
        const groupStartX = tempShapesData[0].x;
        const finalShiftX = marginX + (effectiveWidth - groupWidth) / 2 - groupStartX;
        if (Math.abs(finalShiftX) > 1) { // Only shift if significant
            tempShapesData.forEach(s => s.x += finalShiftX);
        }
    } else {
        const groupHeight = tempShapesData.reduce((sum, s, idx) => sum + s.height + (idx > 0 ? -1 : 0), 0);
        const groupStartY = tempShapesData[0].y;
        const finalShiftY = marginY + (effectiveHeight - groupHeight) / 2 - groupStartY;
        if (Math.abs(finalShiftY) > 1) {
             tempShapesData.forEach(s => s.y += finalShiftY);
        }
    }
  }
  
  composition.push(...tempShapesData);
  return composition;
}

// Add a helper function to check compatibility (can be defined outside or locally)
function areShapesCompatibleForTouching(type1, type2) {
  const compatibleMap = {
    'rectangular': ['rectangular', 'semiCircle', 'triangle'],
    'semiCircle': ['semiCircle', 'rectangular', 'triangle'],
    'triangle': ['triangle', 'rectangular', 'semiCircle', 'hexagon'],
    'hexagon': ['triangle'] // Hexagons are trickier for simple edge touching
  };
  return compatibleMap[type1] && compatibleMap[type1].includes(type2);
}

/**
 * Draw a composition on the canvas
 */
function drawComposition(ctx, composition, images, useMultiply, formType = 'rectangular', params = {}) {
  // Run the debug check if enabled
  if (window.debugPairedForms) {
    checkTriangleTouching(composition);
  }
  for (let i = 0; i < composition.length; i++) {
    const shape = composition[i];
    const imageIndex = shape.imageIndex % images.length;
    const img = images[imageIndex];
    ctx.save();
    
    const shapeType = shape.type || formType;
    const keepImageUpright = params.keepImageUpright !== undefined ? params.keepImageUpright : true; // Default to true for pairedForms
    
    if (shapeType === 'semiCircle') {
      drawSemiCircle(ctx, shape, img, useMultiply, keepImageUpright, params);
    } else if (shapeType === 'triangle') {
      drawTriangle(ctx, shape, img, useMultiply, keepImageUpright, params);
    } else if (shapeType === 'hexagon') {
      drawHexagon(ctx, shape, img, useMultiply, keepImageUpright, params);
    } else {
      drawRectangle(ctx, shape, img, useMultiply, keepImageUpright, params);
    }
    ctx.restore();
  }
}

/**
 * Draw a rectangular shape properly aligned to touch other shapes
 */
function drawRectangle(ctx, shape, img, useMultiply, keepImageUpright = true, params = {}) {
  const maskFn = maskRegistry.basic?.rectangleMask;
  if (!maskFn) {
    console.warn("[PairedForms] RectangleMask not found in registry.");
    // Basic fallback if no mask (no echo, direct draw)
    ctx.save();
    ctx.fillStyle = '#DDD'; // Placeholder if image fails
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    if (img && img.complete) {
        if (useMultiply) ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
    }
    ctx.restore();
    return;
  }

  const svgDesc = maskFn({});
  const svg = (svgDesc && typeof svgDesc.getSvg === 'function') ? svgDesc.getSvg({}) : '';
  const maskPath = svgToPath2D(svg);

  if (!maskPath) {
    console.warn("[PairedForms] Could not create Path2D for rectangleMask."); return;
  }

  ctx.save();
  
  const maskUnitSize = 100;
  const scale = Math.min(shape.width / maskUnitSize, shape.height / maskUnitSize);
  const scaledMaskWidth = maskUnitSize * scale;
  const scaledMaskHeight = maskUnitSize * scale;
  const offsetX = shape.x + (shape.width - scaledMaskWidth) / 2;
  const offsetY = shape.y + (shape.height - scaledMaskHeight) / 2;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  // Rectangle mask typically doesn't need rotation unless shape.angle is specifically used
  if (shape.angle) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(shape.angle * Math.PI / 180);
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  ctx.clip(maskPath);

  // Conditional Color Block Echo based on imageType
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';

  if (echoPreference === 'always') {
    applyEcho = true;
  } else if (echoPreference === 'texture_only' && img && img.imagetype === 'texture') {
    applyEcho = true;
  } else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < (img && img.imagetype === 'texture' ? 0.85 : 0.45));
  }
  // if echoPreference is 'never', applyEcho remains false

  const bgColorForEcho = shape.bgColor || randomVibrantColor(); // Ensure this is defined before use

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save();
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.75; 
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, maskUnitSize, maskUnitSize); 
    ctx.restore();
  }

  ctx.globalCompositeOperation = applyEcho ? 'multiply' : (useMultiply ? 'multiply' : 'source-over');
  ctx.globalAlpha = 1.0; 

  if (img && img.complete) {
    const imageAspect = img.width / img.height;
    const targetAspect = 1; // Mask unit space is 1:1
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
    if (imageAspect > targetAspect) { 
      sWidth = img.height * targetAspect;
      sx = (img.width - sWidth) / 2;
    } else { 
      sHeight = img.width / targetAspect;
      sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maskUnitSize, maskUnitSize);
  } else {
      console.warn('[PairedForms drawRectangle] Image not available or not complete');
  }
  
  ctx.restore();
}

/**
 * Draw a semi-circle shape properly aligned to touch other shapes
 */
function drawSemiCircle(ctx, shape, img, useMultiply, keepImageUpright = true, params = {}) {
  const maskFn = maskRegistry.basic?.semiCircleMask;
  if (!maskFn) {
    console.warn("[PairedForms] semiCircleMask not found."); return;
  }
  const svgDesc = maskFn({});
  const svg = (svgDesc && typeof svgDesc.getSvg === 'function') ? svgDesc.getSvg({}) : '';
  const maskPath = svgToPath2D(svg);
  if (!maskPath) {
    console.warn("[PairedForms] Could not create Path2D for semiCircleMask."); return;
  }

  ctx.save();
  
  // Center the mask within the shape's allocated bounds, preserving mask aspect ratio (1:1 for semicircle)
  const maskUnitSize = 100; // Masks are designed in a 100x100 unit space
  const scale = Math.min(shape.width / maskUnitSize, shape.height / maskUnitSize);
  const scaledMaskWidth = maskUnitSize * scale;
  const scaledMaskHeight = maskUnitSize * scale; // Semicircle in a 100x100 box is effectively 100x50 or 50x100 visually, but mask path is 100x100

  const offsetX = shape.x + (shape.width - scaledMaskWidth) / 2;
  const offsetY = shape.y + (shape.height - scaledMaskHeight) / 2;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale); // Uniform scale for the 100x100 unit mask

  // Apply orientation rotation around the center of the 0-100 unit space
  const orientation = shape._drawParams?.orientation;
  let angle = 0;
  switch (orientation) {
    case 'left': angle = Math.PI / 2; break;
    case 'right': angle = -Math.PI / 2; break;
    case 'top': angle = Math.PI; break;
    // 'bottom' or undefined (default for semicircle mask) is angle = 0
  }
  if (angle !== 0) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(angle);
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  ctx.clip(maskPath); // Clip to the (now transformed and scaled) 0-100 unit path

  // Store the mask rotation angle
  const maskAngle = angle;

  // Conditional Color Block Echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';
  if (echoPreference === 'always') applyEcho = true;
  else if (echoPreference === 'texture_only' && img && img.imagetype === 'texture') applyEcho = true;
  else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < (img && img.imagetype === 'texture' ? 0.85 : 0.45));
  }
  const bgColorForEcho = shape.bgColor || randomVibrantColor();

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save(); // Save before changing GCO for echo
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.75;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, maskUnitSize, maskUnitSize); // Fill the 0-100 unit space
    ctx.restore(); // Restore GCO and alpha for image drawing
  }

  ctx.globalCompositeOperation = applyEcho ? 'multiply' : (useMultiply ? 'multiply' : 'source-over');
  ctx.globalAlpha = 1.0;

  // If keepImageUpright is true, counter-rotate the context before drawing the image
  if (keepImageUpright && maskAngle !== 0) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(-maskAngle); // Counter-rotate
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  const imgToDraw = img;
  if (imgToDraw && imgToDraw.complete) {
    const imageAspect = imgToDraw.width / imgToDraw.height;
    const targetAspect = 1; // Mask unit space is 1:1
    let sx = 0, sy = 0, sWidth = imgToDraw.width, sHeight = imgToDraw.height;
    if (imageAspect > targetAspect) {
      sWidth = imgToDraw.height * targetAspect;
      sx = (imgToDraw.width - sWidth) / 2;
    } else {
      sHeight = imgToDraw.width / targetAspect;
      sy = (imgToDraw.height - sHeight) / 2;
    }
    ctx.drawImage(imgToDraw, sx, sy, sWidth, sHeight, 0, 0, maskUnitSize, maskUnitSize);
  } else {
      console.warn('[PairedForms drawSemiCircle] Image not available or not complete');
  }
  
  ctx.restore(); // Restore from outer save
}

/**
 * Draw a triangle shape properly aligned to touch other shapes
 */
function drawTriangle(ctx, shape, img, useMultiply, keepImageUpright = true, params = {}) {
  const maskFn = maskRegistry.basic?.triangleMask;
  if (!maskFn) {
    console.warn("[PairedForms] triangleMask not found."); return;
  }
  const svgDesc = maskFn({});
  const svg = (svgDesc && typeof svgDesc.getSvg === 'function') ? svgDesc.getSvg({}) : '';
  const maskPath = svgToPath2D(svg);
  if (!maskPath) {
    console.warn("[PairedForms] Could not create Path2D for triangleMask."); return;
  }

  ctx.save();

  const maskUnitSize = 100;
  const scale = Math.min(shape.width / maskUnitSize, shape.height / maskUnitSize);
  const scaledMaskWidth = maskUnitSize * scale;
  const scaledMaskHeight = maskUnitSize * scale;
  const offsetX = shape.x + (shape.width - scaledMaskWidth) / 2;
  const offsetY = shape.y + (shape.height - scaledMaskHeight) / 2;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  let angle = 0;
  const orientation = shape._drawParams?.orientation;
  switch (orientation) {
    case 'top-flat': angle = Math.PI; break;
    case 'left-flat': angle = -Math.PI / 2; break;
    case 'right-flat': angle = Math.PI / 2; break;
  }
  if (angle !== 0) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(angle);
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  // Store the mask rotation angle
  const maskAngle = angle;

  ctx.clip(maskPath);

  // Conditional Color Block Echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';
  if (echoPreference === 'always') applyEcho = true;
  else if (echoPreference === 'texture_only' && img && img.imagetype === 'texture') applyEcho = true;
  else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < (img && img.imagetype === 'texture' ? 0.85 : 0.45));
  }
  const bgColorForEcho = shape.bgColor || randomVibrantColor();

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save();
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.75;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, maskUnitSize, maskUnitSize);
    ctx.restore();
  }

  ctx.globalCompositeOperation = applyEcho ? 'multiply' : (useMultiply ? 'multiply' : 'source-over');
  ctx.globalAlpha = 1.0;

  // If keepImageUpright is true, counter-rotate the context before drawing the image
  if (keepImageUpright && maskAngle !== 0) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(-maskAngle); // Counter-rotate
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  if (img && img.complete) {
    const imageAspect = img.width / img.height;
    const targetAspect = 1; 
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
    if (imageAspect > targetAspect) {
      sWidth = img.height * targetAspect;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / targetAspect;
      sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maskUnitSize, maskUnitSize);
  } else {
      console.warn('[PairedForms drawTriangle] Image not available or not complete');
  }

  ctx.restore();
}

// Add drawHexagon function
function drawHexagon(ctx, shape, img, useMultiply, keepImageUpright = true, params = {}) {
  const maskFn = maskRegistry.basic?.hexagonMask;
  const HEX_HEIGHT = 86.6025; // Tight bounding box height for hexagon
  if (maskFn) {
    const maskObj = maskFn({});
    const svg = maskObj.getSvg ? maskObj.getSvg() : maskObj;
    const maskPath = svgToPath2D(svg);
    if (maskPath) {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      const rotation = shape._drawParams?.rotation || 0;
      // Uniform scale and center
      const scale = Math.min(shape.width / 100, shape.height / HEX_HEIGHT);
      ctx.translate((shape.width - 100 * scale) / 2, (shape.height - HEX_HEIGHT * scale) / 2);
      ctx.translate(100 * scale / 2, HEX_HEIGHT * scale / 2);
      ctx.rotate(rotation);
      ctx.translate(-100 * scale / 2, -HEX_HEIGHT * scale / 2);
      ctx.scale(scale, scale);
      ctx.clip(maskPath);

      // Store the mask rotation angle
      const maskAngle = rotation;

      // Conditional Color Block Echo logic
      let applyEcho = false;
      const echoPreference = params.echoPreference || 'default';
      if (echoPreference === 'always') applyEcho = true;
      else if (echoPreference === 'texture_only' && img && img.imagetype === 'texture') applyEcho = true;
      else if (echoPreference === 'default') {
        applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < (img && img.imagetype === 'texture' ? 0.85 : 0.45));
      }
      const bgColorForEcho = shape.bgColor || randomVibrantColor();

      if (applyEcho) {
        const echoColor = getComplementaryColor(bgColorForEcho);
        ctx.save();
        ctx.fillStyle = echoColor;
        ctx.globalAlpha = 0.75;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(0, 0, 100, 86.6025);
        ctx.restore();
      }

      ctx.globalCompositeOperation = applyEcho ? 'multiply' : (useMultiply ? 'multiply' : 'source-over');

      // If keepImageUpright is true, counter-rotate context within the clipped mask space
      // This needs to happen before drawing the image, and after the main mask rotation & scaling.
      // The counter-rotation should be around the center of the *original unscaled mask unit space* (100xHEX_HEIGHT)
      if (keepImageUpright && maskAngle !== 0) {
        // Translate to center of unscaled mask, rotate, translate back
        ctx.translate(50, 43.30125); 
        ctx.rotate(-maskAngle);
        ctx.translate(-50, -43.30125);
      }

      // Aspect-ratio cover logic
      const destW = 100;
      const destH = HEX_HEIGHT;
      const destAspect = destW / destH;
      const imgAspect = img.width / img.height;
      let sx, sy, sWidth, sHeight;
      if (imgAspect > destAspect) {
        sHeight = img.height;
        sWidth = sHeight * destAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = sWidth / destAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destW, destH);
      ctx.restore();
      return;
    }
  }
  // fallback: draw a regular hexagon path (inscribed in 100x86.6025)
  ctx.save();
  ctx.translate(shape.x, shape.y);
  const rotationFallback = shape._drawParams?.rotation || 0;
  const scaleFallback = Math.min(shape.width / 100, shape.height / HEX_HEIGHT);
  ctx.translate((shape.width - 100 * scaleFallback) / 2, (shape.height - HEX_HEIGHT * scaleFallback) / 2);
  ctx.translate(100 * scaleFallback / 2, HEX_HEIGHT * scaleFallback / 2);
  ctx.rotate(rotationFallback);
  ctx.translate(-100 * scaleFallback / 2, -HEX_HEIGHT * scaleFallback / 2);
  ctx.scale(scaleFallback, scaleFallback);
  ctx.beginPath();
  const points = [
    [0, HEX_HEIGHT / 2],
    [25, 0],
    [75, 0],
    [100, HEX_HEIGHT / 2],
    [75, HEX_HEIGHT],
    [25, HEX_HEIGHT]
  ];
  for (let i = 0; i < points.length; i++) {
    const [px, py] = points[i];
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.clip();

  // Store the mask rotation angle for fallback
  const maskAngleFallback = rotationFallback;

  // Conditional Color Block Echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';
  if (echoPreference === 'always') applyEcho = true;
  else if (echoPreference === 'texture_only' && img && img.imagetype === 'texture') applyEcho = true;
  else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < (img && img.imagetype === 'texture' ? 0.85 : 0.45));
  }
  const bgColorForEcho = shape.bgColor || randomVibrantColor();

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save();
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.75;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, 100, 86.6025);
    ctx.restore();
  }

  ctx.globalCompositeOperation = applyEcho ? 'multiply' : (useMultiply ? 'multiply' : 'source-over');

  // If keepImageUpright is true, counter-rotate context within the clipped mask space
  // This needs to happen before drawing the image, and after the main mask rotation & scaling.
  // The counter-rotation should be around the center of the *original unscaled mask unit space* (100xHEX_HEIGHT)
  if (keepImageUpright && maskAngleFallback !== 0) {
    ctx.translate(50, 43.30125); 
    ctx.rotate(-maskAngleFallback);
    ctx.translate(-50, -43.30125);
  }
  // Aspect-ratio logic
  const destW = 100;
  const destH = HEX_HEIGHT;
  const destAspect = destW / destH;
  const imgAspect = img.width / img.height;
  let sx, sy, sWidth, sHeight;
  if (imgAspect > destAspect) {
    sHeight = img.height;
    sWidth = sHeight * destAspect;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = img.width;
    sHeight = sWidth / destAspect;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destW, destH);
  ctx.restore();
}

/**
 * Draw a beam shape properly aligned to touch other shapes
 */
function drawBeam(ctx, shape, img, useMultiply) {
  // Use maskRegistry for beam
  const maskFn = maskRegistry.basic?.beamMask;
  if (maskFn) {
    const maskObj = maskFn({});
    const svg = maskObj.getSvg ? maskObj.getSvg() : maskObj;
    // Debug: print SVG string, bounding box, and orientation
    if (window.debugPairedForms) {
      console.log('[drawBeam] SVG:', svg);
      console.log('[drawBeam] Bounding box:', { x: shape.x, y: shape.y, width: shape.width, height: shape.height });
      console.log('[drawBeam] Orientation:', shape._drawParams?.orientation);
    }
    const maskPath = svgToPath2D(svg);
    if (maskPath) {
      ctx.save();
      
      // --- ORIENTATION LOGIC ---
      // Default orientation: horizontal with wider top
      let angle = 0;
      const orientation = shape._drawParams?.orientation;
      switch (orientation) {
        case 'vertical': angle = Math.PI / 2; break;
        case 'vertical-flipped': angle = -Math.PI / 2; break;
        case 'horizontal-flipped': angle = Math.PI; break;
        // 'horizontal' or undefined: angle = 0
      }
      
      // Uniform scale and center
      ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.rotate(angle);
      ctx.translate(-shape.width / 2, -shape.height / 2);
      const scale = Math.min(shape.width, shape.height) / 100;
      ctx.translate((shape.width - 100 * scale) / 2, (shape.height - 100 * scale) / 2);
      ctx.scale(scale, scale);
      ctx.clip(maskPath);
      if (useMultiply) ctx.globalCompositeOperation = 'multiply';
      
      // --- ASPECT RATIO FIX (cover) ---
      const destW = 100;
      const destH = 100;
      const destAspect = destW / destH;
      const imgAspect = img.width / img.height;
      let sx, sy, sWidth, sHeight;
      if (imgAspect > destAspect) {
        sHeight = img.height;
        sWidth = sHeight * destAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = sWidth / destAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destW, destH);
      
      // Debug outline
      if (window.debugPairedForms) {
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.stroke(maskPath);
      }
      
      ctx.restore();
      return;
    }
  }
  
  // fallback to old logic if maskRegistry fails
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(shape.x + shape.width / 2, shape.y);
  ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
  ctx.lineTo(shape.x, shape.y + shape.height);
  ctx.closePath();
  ctx.clip();
  if (useMultiply) ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
  ctx.restore();
}

// Export the template module
// Debug utility function to check if triangles are touching their neighbors
function checkTriangleTouching(composition) {
  // Skip debug in production
  if (!window.debugPairedForms) return;
  
  for (let i = 0; i < composition.length; i++) {
    const shape = composition[i];
    if (shape.type !== 'triangle') continue;
    
    for (let j = 0; j < composition.length; j++) {
      if (i === j) continue;
      const otherShape = composition[j];
      
      // Rectangle bounding box check for proximity
      const isNearby = (
        shape.x < otherShape.x + otherShape.width + 5 &&
        shape.x + shape.width > otherShape.x - 5 &&
        shape.y < otherShape.y + otherShape.height + 5 &&
        shape.y + shape.height > otherShape.y - 5
      );
      
      if (isNearby) {
        console.log('Triangle', i, 'is near shape', j);
        if (shape._drawParams && shape._drawParams.vertices) {
          console.log('Triangle vertices:', shape._drawParams.vertices);
        }
      }
    }
  }
}

// Helper: Align the flat edge of two beams for edge-to-edge contact
function alignBeamEdges(shape1, shape2, direction) {
  // direction: 'horizontal' or 'vertical'
  // shape1 is the reference, shape2 is nudged
  // Both shapes must have .width and .height
  // Both must have _drawParams.orientation set
  // The beam mask uses a tight viewBox, so the flat edge is at y=0 or y=height (horizontal), x=0 or x=width (vertical)
  if (direction === 'horizontal') {
    // Align right edge of shape1 to left edge of shape2
    // For horizontal beams, the flat edge is at the bottom for 'horizontal', at the top for 'horizontal-flipped'
    // We'll align the bottom of shape1 to the top of shape2
    if (shape1._drawParams.orientation === 'horizontal' && shape2._drawParams.orientation === 'horizontal-flipped') {
      // shape1's bottom to shape2's top
      shape2.x = shape1.x + shape1.width;
      shape2.y = shape1.y; // align y
    } else if (shape1._drawParams.orientation === 'horizontal-flipped' && shape2._drawParams.orientation === 'horizontal') {
      // shape2's bottom to shape1's top
      shape1.x = shape2.x + shape2.width;
      shape1.y = shape2.y;
    }
  } else if (direction === 'vertical') {
    // Align bottom edge of shape1 to top edge of shape2
    // For vertical beams, the flat edge is at the right for 'vertical', at the left for 'vertical-flipped'
    if (shape1._drawParams.orientation === 'vertical' && shape2._drawParams.orientation === 'vertical-flipped') {
      shape2.y = shape1.y + shape1.height;
      shape2.x = shape1.x;
    } else if (shape1._drawParams.orientation === 'vertical-flipped' && shape2._drawParams.orientation === 'vertical') {
      shape1.y = shape2.y + shape2.height;
      shape1.x = shape2.x;
    }
  }
}

// Export the main function as default
const pairedForms = {
  key: 'pairedForms',
  name: 'Paired Forms',
  render: generatePairedForms,
  params: {
    formCount: { type: 'number', min: 2, max: 5, default: 2 },
    formType: { type: 'select', options: ['rectangular', 'semiCircle', 'triangle', 'hexagon', 'mixed'], default: 'mixed' },
    complexity: { type: 'number', min: 0, max: 1, default: 0.5 },
    alignmentType: { type: 'select', options: ['edge', 'overlap', 'puzzle'], default: 'edge' },
    useMultiply: { type: 'boolean', default: true },
    echoPreference: { type: 'select', options: ['default', 'always', 'never', 'texture_only'], default: 'default' },
    bgColor: { type: 'color', default: '#ffffff' }
  }
};

export default pairedForms;