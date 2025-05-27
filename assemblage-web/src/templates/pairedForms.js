import { maskRegistry } from '../masks/maskRegistry.ts';
import { svgToPath2D } from '../core/svgUtils.js';
import { randomVibrantColor, getRandomColorFromPalette } from '../utils/colors.js';
import { getComplementaryColor } from '../utils/colorUtils.js';
import { shouldApplyAutoColorEcho } from '../utils/imageOverlapUtils.js';

/**
* Apply final alignment adjustments to ensure better edge contacts
* @param {Array} composition - Array of shape objects
* @param {number} canvasWidth - Canvas width
* @param {number} canvasHeight - Canvas height
* @param {number} complexity - Complexity factor 0-1
*/
function finalizeEdgeContacts(composition, canvasWidth, canvasHeight, complexity) {
if (!composition || composition.length < 2) return;

const MAX_PASSES = 3; // Number of passes for refinement

for (let pass = 0; pass < MAX_PASSES; pass++) {
for (let i = 0; i < composition.length; i++) {
for (let j = i + 1; j < composition.length; j++) {
const shape1 = composition[i];
const shape2 = composition[j];

if (!shape1._drawParams) shape1._drawParams = {};
if (!shape2._drawParams) shape2._drawParams = {};

        const s1Bounds = { x: shape1.x, y: shape1.y, width: shape1.width, height: shape1.height, right: shape1.x + shape1.width, bottom: shape1.y + shape1.height, cx: shape1.x + shape1.width/2, cy: shape1.y + shape1.height/2 };
        const s2Bounds = { x: shape2.x, y: shape2.y, width: shape2.width, height: shape2.height, right: shape2.x + shape2.width, bottom: shape2.y + shape2.height, cx: shape2.x + shape2.width/2, cy: shape2.y + shape2.height }; 

        const adjacencyTolerance = Math.min(s1Bounds.width, s1Bounds.height, s2Bounds.width, s2Bounds.height) * 0.4; // Increased from 0.3
        const overlapForTouch = 8; // Increased from 5 for better contact

        // Check for potential horizontal adjacency (centers are somewhat aligned vertically, and x-positions are close)
        const yCenterDiff = Math.abs(s1Bounds.cy - s2Bounds.cy);
        const xDiff = Math.min(Math.abs(s1Bounds.right - s2Bounds.x), Math.abs(s2Bounds.right - s1Bounds.x));
        const horizontallyAdjacent = xDiff < adjacencyTolerance && yCenterDiff < (s1Bounds.height + s2Bounds.height) * 0.4; // Increased from 0.3

        // Check for potential vertical adjacency (centers are somewhat aligned horizontally, and y-positions are close)
        const xCenterDiff = Math.abs(s1Bounds.cx - s2Bounds.cx);
        const yDiff = Math.min(Math.abs(s1Bounds.bottom - s2Bounds.y), Math.abs(s2Bounds.bottom - s1Bounds.y));
        const verticallyAdjacent = yDiff < adjacencyTolerance && xCenterDiff < (s1Bounds.width + s2Bounds.width) * 0.4; // Increased from 0.3

        if (!horizontallyAdjacent && !verticallyAdjacent) continue;

        // --- SemiCircle + SemiCircle --- 
        if (shape1.type === 'semiCircle' && shape2.type === 'semiCircle') {
          if (horizontallyAdjacent) {
            // Align vertical centers perfectly
            const avgCenterY = (s1Bounds.cy + s2Bounds.cy) / 2;
            shape1.y = avgCenterY - shape1.height / 2;
            shape2.y = avgCenterY - shape2.height / 2;
            
            if (s1Bounds.cx < s2Bounds.cx) { // s1 left of s2
              shape1._drawParams.orientation = 'right'; 
              shape2._drawParams.orientation = 'left';
              // Position them to touch exactly - no gap
              shape2.x = shape1.x + shape1.width - 1; // Slight overlap to ensure contact
            } else { // s2 left of s1
              shape2._drawParams.orientation = 'right'; 
              shape1._drawParams.orientation = 'left';
              // Position them to touch exactly - no gap
              shape1.x = shape2.x + shape2.width - 1; // Slight overlap to ensure contact
            }
          } else if (verticallyAdjacent) {
            // Align horizontal centers perfectly
            const avgCenterX = (s1Bounds.cx + s2Bounds.cx) / 2;
            shape1.x = avgCenterX - shape1.width / 2;
            shape2.x = avgCenterX - shape2.width / 2;
            
            if (s1Bounds.cy < s2Bounds.cy) { // s1 above s2
              shape1._drawParams.orientation = 'down'; 
              shape2._drawParams.orientation = 'up';
              // Position them to touch exactly - no gap
              shape2.y = shape1.y + shape1.height - 1; // Slight overlap to ensure contact
            } else { // s2 above s1
              shape2._drawParams.orientation = 'down'; 
              shape1._drawParams.orientation = 'up';
              // Position them to touch exactly - no gap
              shape1.y = shape2.y + shape2.height - 1; // Slight overlap to ensure contact
            }
          }
        } 
        // --- Triangle + Triangle ---
        else if (shape1.type === 'triangle' && shape2.type === 'triangle') {
          if (horizontallyAdjacent) {
            shape1.y = s2Bounds.cy - shape1.height / 2; // Align vertical centers
            shape2.y = s1Bounds.cy - shape2.height / 2; // Align vertical centers
            if (s1Bounds.cx < s2Bounds.cx) { // s1 left of s2
              shape1._drawParams.orientation = 'right-flat'; 
              shape2._drawParams.orientation = 'left-flat';
              shape2.x = shape1.x + shape1.width - overlapForTouch;
            } else { // s2 left of s1
              shape2._drawParams.orientation = 'right-flat'; 
              shape1._drawParams.orientation = 'left-flat';
              shape1.x = shape2.x + shape2.width - overlapForTouch;
            }
          } else if (verticallyAdjacent) {
            shape1.x = s2Bounds.cx - shape1.width / 2; // Align horizontal centers
            shape2.x = s1Bounds.cx - shape2.width / 2; // Align horizontal centers
            if (s1Bounds.cy < s2Bounds.cy) { // s1 above s2
              shape1._drawParams.orientation = 'bottom-flat'; 
              shape2._drawParams.orientation = 'top-flat';
              shape2.y = shape1.y + shape1.height - overlapForTouch;
            } else { // s2 above s1
              shape2._drawParams.orientation = 'bottom-flat'; 
              shape1._drawParams.orientation = 'top-flat';
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
  
  // Fill with background color using palette-aware selection
  const bgColorToUse = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : getRandomColorFromPalette(images, 'auto');
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
  
  // Center and scale the composition
  composition = centerAndScaleComposition(composition, canvas.width, canvas.height);
  
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
      // Special case: if we have exactly 2 forms, 50% chance of two rectangles
      if (count === 2 && index === 0 && Math.random() < 0.5) {
        // Store this decision for the second shape
        tempShapesData._forceRectangularPair = true;
        return 'rectangular';
      }
      
      // If we're the second shape and first was forced rectangular
      if (index === 1 && tempShapesData._forceRectangularPair) {
        return 'rectangular';
      }
      
      const types = [
        { type: 'rectangular', weight: 4 }, // Reduced weight for rectangles
        { type: 'semiCircle', weight: 8 }, // Increased weight for semicircles
        { type: 'triangle', weight: 3 }
      ];
      
      const weightedTypes = types.reduce((acc, item) => acc.concat(Array(item.weight).fill(item.type)), []);
      
      const complementaryPairs = {
        'semiCircle': [
          { type: 'semiCircle', weight: 6 }, 
          { type: 'rectangular', weight: 5 }
        ], 
        'triangle': [
          { type: 'triangle', weight: 5 }, 
          { type: 'rectangular', weight: 5 }
        ], 
        'rectangular': [
          { type: 'rectangular', weight: 8 }, // High chance of another rectangle
          { type: 'semiCircle', weight: 3 }, 
          { type: 'triangle', weight: 3 }
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
  const variationFactor = (0.05 + complexity * 0.15); // Reduced variation for more consistent sizing
  
  const useMargins = Math.random() < (complexity * 0.15); // Further reduced chance of margins
  const marginFactor = useMargins ? (0.01 + Math.random() * complexity * 0.03) : 0; // Much smaller margins
  
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
      
      // For rectangles, allow more varied aspect ratios
      if (shapeType === 'rectangular' && formCount === 2 && tempShapesData._forceRectangularPair) {
        // Create more varied rectangular shapes - not always square-like
        const aspectRatioChoice = Math.random();
        if (aspectRatioChoice < 0.4) {
          // Tall rectangles
          shapeHeight = effectiveHeight * (0.8 + Math.random() * 0.15);
          shapeWidth = effectiveWidth * (0.35 + Math.random() * 0.1);
        } else if (aspectRatioChoice < 0.8) {
          // Wide rectangles
          shapeHeight = effectiveHeight * (0.4 + Math.random() * 0.2);
          shapeWidth = effectiveWidth * (0.45 + Math.random() * 0.05);
        } else {
          // Square-ish (original behavior)
          shapeHeight = effectiveHeight * (0.75 + Math.random() * 0.23);
          shapeWidth = effectiveWidth * (0.48 + Math.random() * 0.04);
        }
      } else {
        // Original logic for other shapes
        shapeHeight = effectiveHeight * (0.75 + Math.random() * 0.23); // Range 75-98% (was 55-90%)
        if (formCount === 2) {
          shapeWidth = effectiveWidth * (0.48 + Math.random() * 0.04); // Aim for roughly half each, less variation
        } else {
          shapeWidth = effectiveWidth / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
        }
        shapeWidth = Math.max(effectiveWidth * 0.35, Math.min(shapeWidth, effectiveWidth * 0.75));
      }
      
      // Ensure minimum and maximum bounds
      shapeWidth = Math.max(effectiveWidth * 0.25, Math.min(shapeWidth, effectiveWidth * 0.75));
      const yPos = marginY + (effectiveHeight - shapeHeight) / 2; 
      
      let actualX = currentX;
      if (!useMargins && i > 0 && lastShapeBounds) { // If no margins and not the first shape
         actualX = lastShapeBounds.right - (effectiveWidth * 0.015); // Force slight overlap for better edge contact
      }

      const newShape = { type: shapeType, x: actualX, y: yPos, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) };
      tempShapesData.push(newShape);
      currentX = actualX + shapeWidth + (useMargins ? effectiveWidth * 0.005 : 0); // Even smaller spacing if margins
      lastShapeType = shapeType;
      lastShapeBounds = { right: actualX + shapeWidth };
    }
  } else { // Horizontal split
    let currentY = marginY;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      shapeWidth = effectiveWidth * (0.75 + Math.random() * 0.23); // Range 75-98% (was 55-90%)
      const xPos = marginX + (effectiveWidth - shapeWidth) / 2; 

      if (formCount === 2) {
        shapeHeight = effectiveHeight * (0.48 + Math.random() * 0.04); // Less variation
      } else {
        shapeHeight = effectiveHeight / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
      }
      shapeHeight = Math.max(effectiveHeight * 0.35, Math.min(shapeHeight, effectiveHeight * 0.75)); 

      let actualY = currentY;
      if (!useMargins && i > 0 && lastShapeBounds) {
        actualY = lastShapeBounds.bottom - (effectiveHeight * 0.015); // Force slight overlap for better edge contact
      }
      
      const newShape = { type: shapeType, x: xPos, y: actualY, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) };
      tempShapesData.push(newShape);
      currentY = actualY + shapeHeight + (useMargins ? effectiveHeight * 0.005 : 0);
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
  
  // Clean up our temporary flag
  delete tempShapesData._forceRectangularPair;
  
  composition.push(...tempShapesData);
  return composition;
}

// Add a helper function to check compatibility (can be defined outside or locally)
function areShapesCompatibleForTouching(type1, type2) {
  const compatibleMap = {
    'rectangular': ['rectangular', 'semiCircle', 'triangle'], // Rect can touch all three
    'semiCircle': ['semiCircle', 'rectangular'], // SemiCircle can only touch another SemiCircle or a Rectangle
    'triangle': ['triangle', 'rectangular']     // Triangle can only touch another Triangle or a Rectangle
  };
  return compatibleMap[type1] && compatibleMap[type1].includes(type2);
}

// Debug function to check triangle touching
function checkTriangleTouching(composition) {
  if (window.debugPairedForms) {
    composition.forEach((shape, i) => {
      if (shape.type === 'triangle') {
        console.log(`[DEBUG] Triangle ${i}: x=${shape.x}, y=${shape.y}, w=${shape.width}, h=${shape.height}, orientation=${shape._drawParams?.orientation}`);
      }
    });
  }
}

/**
 * Draw a composition on the canvas
 */
function drawComposition(ctx, composition, images, useMultiply, formType = 'rectangular', params = {}) {
  // Pre-calculate overlaps for each shape
  composition.forEach((shape, i) => {
    let maxOverlap = 0;
    composition.forEach((otherShape, j) => {
      if (i === j) return;
      const overlap = Math.max(0, Math.min(shape.x + shape.width, otherShape.x + otherShape.width) - Math.max(shape.x, otherShape.x)) *
                     Math.max(0, Math.min(shape.y + shape.height, otherShape.y + otherShape.height) - Math.max(shape.y, otherShape.y));
      const shapeArea = shape.width * shape.height;
      if (shapeArea > 0) {
        maxOverlap = Math.max(maxOverlap, overlap / shapeArea);
      }
    });
    shape._maxOverlap = maxOverlap;
  });
  
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

  // Calculate overlap with other shapes to determine if auto echo is needed
  let maxOverlap = shape._maxOverlap || 0;
  
  // Determine if automatic color echo should be applied
  const needsAutoEcho = img && shouldApplyAutoColorEcho(img, maxOverlap, 0.1); // 10% threshold
  
  // Conditional Color Block Echo based on image_role and auto echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';

  if (echoPreference === 'always') {
    applyEcho = true;
  } else if (echoPreference === 'texture_only' && img && img.image_role === 'texture') {
    applyEcho = true;
  } else if (echoPreference === 'default') {
    // Apply echo if:
    // 1. Explicitly set on shape, OR
    // 2. Auto echo needed for overlapping color images, OR 
    // 3. Original logic for texture images
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : 
               (needsAutoEcho || (useMultiply && Math.random() < (img && img.image_role === 'texture' ? 0.85 : 0.45)));
  }
  // if echoPreference is 'never', applyEcho remains false
  
  if (needsAutoEcho) {
    console.log(`[PairedForms] Auto color echo applied - overlap: ${Math.round(maxOverlap * 100)}%, is_black_and_white: ${img?.is_black_and_white}`);
  }

  const bgColorForEcho = shape.bgColor || getRandomColorFromPalette([img], 'auto'); // Use palette-aware color selection

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save();
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.90; 
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
    case 'up': angle = Math.PI; break; // Flat edge up
    case 'down': angle = 0; break; // Flat edge down (default)
    // Default (no orientation or 'down') is angle = 0
  }
  if (angle !== 0) {
    ctx.translate(maskUnitSize / 2, maskUnitSize / 2);
    ctx.rotate(angle);
    ctx.translate(-maskUnitSize / 2, -maskUnitSize / 2);
  }

  ctx.clip(maskPath); // Clip to the (now transformed and scaled) 0-100 unit path

  // Store the mask rotation angle
  const maskAngle = angle;

  // Calculate auto echo needs based on pre-calculated overlap
  const maxOverlap = shape._maxOverlap || 0;
  const needsAutoEcho = img && shouldApplyAutoColorEcho(img, maxOverlap, 0.1);

  // Conditional Color Block Echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';
  if (echoPreference === 'always') applyEcho = true;
  else if (echoPreference === 'texture_only' && img && img.image_role === 'texture') applyEcho = true;
  else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : 
               (needsAutoEcho || (useMultiply && Math.random() < (img && img.image_role === 'texture' ? 0.85 : 0.45)));
  }
  
  if (needsAutoEcho) {
    console.log(`[PairedForms SemiCircle] Auto color echo applied - overlap: ${Math.round(maxOverlap * 100)}%, is_black_and_white: ${img?.is_black_and_white}`);
  }
  const bgColorForEcho = shape.bgColor || getRandomColorFromPalette([img], 'auto');

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save(); // Save before changing GCO for echo
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.90;
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

  // Calculate auto echo needs based on pre-calculated overlap
  const maxOverlap = shape._maxOverlap || 0;
  const needsAutoEcho = img && shouldApplyAutoColorEcho(img, maxOverlap, 0.1);

  // Conditional Color Block Echo logic
  let applyEcho = false;
  const echoPreference = params.echoPreference || 'default';
  if (echoPreference === 'always') applyEcho = true;
  else if (echoPreference === 'texture_only' && img && img.image_role === 'texture') applyEcho = true;
  else if (echoPreference === 'default') {
    applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : 
               (needsAutoEcho || (useMultiply && Math.random() < (img && img.image_role === 'texture' ? 0.85 : 0.45)));
  }
  
  if (needsAutoEcho) {
    console.log(`[PairedForms Triangle] Auto color echo applied - overlap: ${Math.round(maxOverlap * 100)}%, is_black_and_white: ${img?.is_black_and_white}`);
  }
  const bgColorForEcho = shape.bgColor || getRandomColorFromPalette([img], 'auto');

  if (applyEcho) {
    const echoColor = getComplementaryColor(bgColorForEcho);
    ctx.save();
    ctx.fillStyle = echoColor;
    ctx.globalAlpha = 0.90;
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

// Add a new function to center and scale the composition
function centerAndScaleComposition(composition, canvasWidth, canvasHeight) {
  if (!composition || composition.length === 0) return composition;

  const MARGIN_PERCENT = 0.005; // Was 0.01 (1% margin), now 0.5%

  // Calculate current bounding box of the composition
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  composition.forEach(shape => {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  const currentCompWidth = maxX - minX;
  const currentCompHeight = maxY - minY;

  if (currentCompWidth <= 0 || currentCompHeight <= 0) return composition; // Avoid division by zero or negative scales

  // Determine target dimensions with margin
  const targetCanvasWidth = canvasWidth * (1 - MARGIN_PERCENT * 2);
  const targetCanvasHeight = canvasHeight * (1 - MARGIN_PERCENT * 2);

  // Calculate scale factor
  const scaleX = targetCanvasWidth / currentCompWidth;
  const scaleY = targetCanvasHeight / currentCompHeight;
  const scale = Math.min(scaleX, scaleY);

  // Apply scale and translate to new positions
  composition.forEach(shape => {
    // Scale position relative to the composition's top-left corner
    shape.x = (shape.x - minX) * scale;
    shape.y = (shape.y - minY) * scale;
    // Scale dimensions
    shape.width *= scale;
    shape.height *= scale;
  });

  // Calculate new bounding box after scaling
  minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
  composition.forEach(shape => {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });
  
  const scaledCompWidth = maxX - minX;
  const scaledCompHeight = maxY - minY;

  // Calculate translation to center the scaled composition
  const transX = (canvasWidth - scaledCompWidth) / 2 - minX;
  const transY = (canvasHeight - scaledCompHeight) / 2 - minY;

  // Apply translation
  composition.forEach(shape => {
    shape.x += transX;
    shape.y += transY;
  });

  return composition;
}

// Export the main function as default
const pairedForms = {
  key: 'pairedForms',
  name: 'Paired Forms',
  render: generatePairedForms,
  params: {
    formCount: { type: 'number', min: 2, max: 5, default: 2 },
    formType: { type: 'select', options: ['rectangular', 'semiCircle', 'triangle', 'mixed'], default: 'mixed' },
    complexity: { type: 'number', min: 0, max: 1, default: 0.5 },
    alignmentType: { type: 'select', options: ['edge', 'overlap', 'puzzle'], default: 'edge' },
    useMultiply: { type: 'boolean', default: true },
    echoPreference: { type: 'select', options: ['default', 'always', 'never', 'texture_only'], default: 'default' },
    bgColor: { type: 'color', default: '#ffffff' }
  }
};

export default pairedForms;