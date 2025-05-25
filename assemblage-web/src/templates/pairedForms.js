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
  
  // Iterate through pairs of shapes
  for (let i = 0; i < composition.length - 1; i++) {
    const shape1 = composition[i];
    const shape2 = composition[i + 1];
    
    // Skip if different shape types
    if (shape1.type !== shape2.type) {
      continue;
    }
    
    // Check if shapes are adjacent (increased tolerance)
    const adjacencyTolerance = 15; // Increased from 5
    const horizontallyAdjacent = 
      Math.abs((shape1.x + shape1.width) - shape2.x) < adjacencyTolerance ||
      Math.abs((shape2.x + shape2.width) - shape1.x) < adjacencyTolerance;
      
    const verticallyAdjacent = 
      Math.abs((shape1.y + shape1.height) - shape2.y) < adjacencyTolerance ||
      Math.abs((shape2.y + shape2.height) - shape1.y) < adjacencyTolerance;
      
    // Handle special case: beam + beam pairing
    if (shape1.type === 'beam' && shape2.type === 'beam') {
      // Initialize drawParams if needed
      if (!shape1._drawParams) shape1._drawParams = {};
      if (!shape2._drawParams) shape2._drawParams = {};
      
      if (horizontallyAdjacent) {
        // Horizontal adjacency - ensure flat edges face each other
        if (shape1.x < shape2.x) {
          // First beam on left, second on right
          shape1._drawParams.orientation = 'horizontal';
          shape2._drawParams.orientation = 'horizontal-flipped';
          alignBeamEdges(shape1, shape2, 'horizontal');
        } else {
          // Second beam on left, first on right
          shape1._drawParams.orientation = 'horizontal-flipped';
          shape2._drawParams.orientation = 'horizontal';
          alignBeamEdges(shape2, shape1, 'horizontal');
        }
      } else if (verticallyAdjacent) {
        // Vertical adjacency - ensure flat edges face each other
        if (shape1.y < shape2.y) {
          // First beam on top, second on bottom
          shape1._drawParams.orientation = 'vertical';
          shape2._drawParams.orientation = 'vertical-flipped';
          alignBeamEdges(shape1, shape2, 'vertical');
        } else {
          // Second beam on top, first on bottom
          shape1._drawParams.orientation = 'vertical-flipped';
          shape2._drawParams.orientation = 'vertical';
          alignBeamEdges(shape2, shape1, 'vertical');
        }
      }
    }
    
    // Handle special case: semi-circle + triangle pairing
    if ((shape1.type === 'semiCircle' && shape2.type === 'triangle') ||
        (shape1.type === 'triangle' && shape2.type === 'semiCircle')) {
      const semiCircle = shape1.type === 'semiCircle' ? shape1 : shape2;
      const triangle = shape1.type === 'triangle' ? shape1 : shape2;
      
      // Initialize drawParams if needed
      if (!semiCircle._drawParams) semiCircle._drawParams = {};
      if (!triangle._drawParams) triangle._drawParams = {};
      
      if (horizontallyAdjacent) {
        // Horizontal adjacency - ensure flat edges face each other
        if (semiCircle.x < triangle.x) {
          // Semi-circle on left, triangle on right
          semiCircle._drawParams.orientation = 'right';
          triangle._drawParams.orientation = 'left-flat';
        } else {
          // Triangle on left, semi-circle on right
          semiCircle._drawParams.orientation = 'left';
          triangle._drawParams.orientation = 'right-flat';
        }
      } else if (verticallyAdjacent) {
        // Vertical adjacency - ensure flat edges face each other
        if (semiCircle.y < triangle.y) {
          // Semi-circle on top, triangle on bottom
          semiCircle._drawParams.orientation = 'bottom';
          triangle._drawParams.orientation = 'top-flat';
        } else {
          // Triangle on top, semi-circle on bottom
          semiCircle._drawParams.orientation = 'top';
          triangle._drawParams.orientation = 'bottom-flat';
        }
      }
    }
    
    if (!horizontallyAdjacent && !verticallyAdjacent) {
      continue;
    }
    
    // For semi-circles that are adjacent
    if (shape1.type === 'semiCircle' && shape2.type === 'semiCircle') {
      // Initialize drawParams if needed
      if (!shape1._drawParams) shape1._drawParams = {};
      if (!shape2._drawParams) shape2._drawParams = {};
      
      // Determine which edge is touching
      if (horizontallyAdjacent) {
        // Align y positions for better visual effect
        const avgY = (shape1.y + shape2.y) / 2;
        shape1.y = avgY;
        shape2.y = avgY;
        
        // Set proper orientation for edge contact
        if (shape1.x < shape2.x) {
          shape1._drawParams.orientation = 'right'; 
          shape2._drawParams.orientation = 'left';  
          console.log(`[PairedForms finalizeContacts] Semi-circles: ${shape1.imageIndex} right, ${shape2.imageIndex} left`);
        } else {
          shape1._drawParams.orientation = 'left';  
          shape2._drawParams.orientation = 'right'; 
          console.log(`[PairedForms finalizeContacts] Semi-circles: ${shape1.imageIndex} left, ${shape2.imageIndex} right`);
        }
      }
      else if (verticallyAdjacent) {
        // Align x positions for better visual effect
        const avgX = (shape1.x + shape2.x) / 2;
        shape1.x = avgX;
        shape2.x = avgX;
        
        // Set proper orientation for edge contact
        if (shape1.y < shape2.y) {
          // First shape is on top
          shape1._drawParams.orientation = 'bottom'; // Flat edge on bottom
          shape2._drawParams.orientation = 'top';    // Flat edge on top
        } else {
          // First shape is on bottom
          shape1._drawParams.orientation = 'top';    // Flat edge on top
          shape2._drawParams.orientation = 'bottom'; // Flat edge on bottom
        }
      }
    }
    
    // For triangles that are adjacent
    if (shape1.type === 'triangle' && shape2.type === 'triangle') {
      // Determine which edge is touching
      if (horizontallyAdjacent) {
        // Make sure they have complementary orientations
        if (!shape1._drawParams) shape1._drawParams = {};
        if (!shape2._drawParams) shape2._drawParams = {};
        
        // If first triangle is on the left of the second
        if (shape1.x < shape2.x) {
          shape1._drawParams.orientation = 'right-flat'; // Flat on right side
          shape2._drawParams.orientation = 'left-flat';  // Flat on left side
        } else {
          shape1._drawParams.orientation = 'left-flat';  // Flat on left side
          shape2._drawParams.orientation = 'right-flat'; // Flat on right side
        }
      }
      else if (verticallyAdjacent) {
        // Make sure they have complementary orientations
        if (!shape1._drawParams) shape1._drawParams = {};
        if (!shape2._drawParams) shape2._drawParams = {};
        
        // If first triangle is above the second
        if (shape1.y < shape2.y) {
          shape1._drawParams.orientation = 'bottom-flat'; // Flat on bottom
          shape2._drawParams.orientation = 'top-flat';   // Flat on top
        } else {
          shape1._drawParams.orientation = 'top-flat';   // Flat on top
          shape2._drawParams.orientation = 'bottom-flat'; // Flat on bottom
        }
      }
    }
    
    // Hexagon adjacency: align flat edges
    if (shape1.type === 'hexagon' && shape2.type === 'hexagon') {
      if (!shape1._drawParams) shape1._drawParams = {};
      if (!shape2._drawParams) shape2._drawParams = {};
      if (horizontallyAdjacent) {
        // Flat left/right
        shape1._drawParams.rotation = Math.PI / 6; // 30deg
        shape2._drawParams.rotation = Math.PI / 6;
      } else if (verticallyAdjacent) {
        // Flat top/bottom
        shape1._drawParams.rotation = 0;
        shape2._drawParams.rotation = 0;
      }
    }
  }
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
  drawComposition(ctx, composition, images, params.useMultiply !== false, formType);
  
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
      const types = ['rectangular', 'semiCircle', 'triangle', 'hexagon'];
      const complementaryPairs = {
        'semiCircle': ['triangle', 'rectangular'], 
        'triangle': ['semiCircle', 'hexagon'], 
        'hexagon': ['triangle', 'rectangular'], 
        'rectangular': ['semiCircle', 'triangle', 'hexagon'] 
      };
      if (index > 0 && tempShapesData[index - 1]) {
        const prevType = tempShapesData[index - 1].type;
        const complements = complementaryPairs[prevType] || types;
        if (Math.random() < 0.8) {
          return complements[Math.floor(Math.random() * complements.length)];
        }
      }
      return types[Math.floor(Math.random() * types.length)];
    }
    return formType;
  }
  
  const isVerticalSplit = Math.random() < 0.5 + (complexity * 0.2 - 0.1); 
  const variationFactor = (0.05 + complexity * 0.25);
  const useMargins = Math.random() < (complexity * 0.6 + 0.1); 
  const marginFactor = useMargins ? (0.05 + Math.random() * complexity * 0.1) : 0; 
  
  const effectiveWidth = width * (1 - marginFactor * 2);
  const effectiveHeight = height * (1 - marginFactor * 2);
  const marginX = width * marginFactor;
  const marginY = height * marginFactor;
  
  if (isVerticalSplit) {
    let currentX = marginX;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      shapeHeight = effectiveHeight * (0.6 + Math.random() * 0.4); // Vary height a bit too
      const yPos = marginY + (effectiveHeight - shapeHeight) / 2; // Center vertically

      if (formCount === 2) {
        shapeWidth = effectiveWidth * (0.35 + Math.random() * 0.25); // Each takes 35-60% of width
      } else if (shapeType === 'hexagon') {
        shapeWidth = effectiveWidth / (formCount * 0.8); // Approximation for denser packing
      } else {
        shapeWidth = effectiveWidth / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
      }
      shapeWidth = Math.max(effectiveWidth * 0.2, shapeWidth); // Min width
      
      tempShapesData.push({ type: shapeType, x: currentX, y: yPos, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) });
      currentX += shapeWidth + (useMargins ? effectiveWidth * 0.05 : 0); // Add some spacing if margins active
    }
  } else { // Horizontal split
    let currentY = marginY;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      shapeWidth = effectiveWidth * (0.6 + Math.random() * 0.4);
      const xPos = marginX + (effectiveWidth - shapeWidth) / 2; // Center horizontally

      if (formCount === 2) {
        shapeHeight = effectiveHeight * (0.35 + Math.random() * 0.25); // Each takes 35-60% of height
      } else if (shapeType === 'hexagon') {
        shapeHeight = effectiveHeight / (formCount * 0.8);
      } else {
        shapeHeight = effectiveHeight / formCount * (1 - variationFactor + Math.random() * variationFactor * 2);
      }
      shapeHeight = Math.max(effectiveHeight * 0.2, shapeHeight); // Min height

      tempShapesData.push({ type: shapeType, x: xPos, y: currentY, width: shapeWidth, height: shapeHeight, imageIndex: Math.floor(Math.random() * 1000) });
      currentY += shapeHeight + (useMargins ? effectiveHeight * 0.05 : 0); // Add spacing if margins
    }
  }

  // Distribute shapes more centrally if they don't fill the space and margins were not primary intent
  if (formCount === 2 && !useMargins) {
      if (isVerticalSplit) {
          const totalWidth = tempShapesData.reduce((sum, s) => sum + s.width, 0);
          let shiftX = (effectiveWidth - totalWidth) / 2;
          if (totalWidth < effectiveWidth * 0.8) { // Only shift if there's significant gap
            tempShapesData.forEach(s => s.x += shiftX);
          }
      } else {
          const totalHeight = tempShapesData.reduce((sum, s) => sum + s.height, 0);
          let shiftY = (effectiveHeight - totalHeight) / 2;
          if (totalHeight < effectiveHeight * 0.8) {
            tempShapesData.forEach(s => s.y += shiftY);
          }
      }
  }

  for (let i = 0; i < tempShapesData.length; i++) {
    const shapeData = { ...tempShapesData[i] }; 
    composition.push({
      type: shapeData.type,
      x: shapeData.x,
      y: shapeData.y,
      width: shapeData.width,
      height: shapeData.height,
      imageIndex: shapeData.imageIndex
    });
  }
  return composition;
}

/**
 * Draw a composition on the canvas
 */
function drawComposition(ctx, composition, images, useMultiply, formType = 'rectangular') {
  // Run the debug check if enabled
  if (window.debugPairedForms) {
    checkTriangleTouching(composition);
  }
  for (let i = 0; i < composition.length; i++) {
    const shape = composition[i];
    const imageIndex = shape.imageIndex % images.length;
    const img = images[imageIndex];
    ctx.save();
    
    // Use the shape's own type rather than the global formType
    // This enables mixed compositions
    const shapeType = shape.type || formType;
    
    // Draw based on shape type
    if (shapeType === 'semiCircle') {
      drawSemiCircle(ctx, shape, img, useMultiply);
    } else if (shapeType === 'triangle') {
      drawTriangle(ctx, shape, img, useMultiply);
    } else if (shapeType === 'hexagon') {
      drawHexagon(ctx, shape, img, useMultiply);
    } else {
      // Default to rectangular
      drawRectangle(ctx, shape, img, useMultiply);
    }
    ctx.restore();
  }
}

/**
 * Draw a rectangular shape properly aligned to touch other shapes
 */
function drawRectangle(ctx, shape, img, useMultiply) {
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

  const applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < 0.5);
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
function drawSemiCircle(ctx, shape, img, useMultiply) {
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

  // Color Block Echo logic
  const applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < 0.5);
  const bgColorForEcho = shape.bgColor || randomVibrantColor(); // Ensure a valid color for complementary calculation

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
function drawTriangle(ctx, shape, img, useMultiply) {
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

  ctx.clip(maskPath);

  const applyEcho = shape.useColorBlockEcho !== undefined ? shape.useColorBlockEcho : (useMultiply && Math.random() < 0.5);
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
function drawHexagon(ctx, shape, img, useMultiply) {
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
      if (useMultiply) ctx.globalCompositeOperation = 'multiply';
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
  const rotation = shape._drawParams?.rotation || 0;
  const scale = Math.min(shape.width / 100, shape.height / HEX_HEIGHT);
  ctx.translate((shape.width - 100 * scale) / 2, (shape.height - HEX_HEIGHT * scale) / 2);
  ctx.translate(100 * scale / 2, HEX_HEIGHT * scale / 2);
  ctx.rotate(rotation);
  ctx.translate(-100 * scale / 2, -HEX_HEIGHT * scale / 2);
  ctx.scale(scale, scale);
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
  if (useMultiply) ctx.globalCompositeOperation = 'multiply';
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
    bgColor: { type: 'color', default: '#ffffff' }
  }
};

export default pairedForms;