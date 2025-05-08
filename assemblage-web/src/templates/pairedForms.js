import maskRegistry from '../masks/maskRegistry';
import { svgToPath2D } from '../core/CollageService';

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
    
    // Check if shapes are adjacent
    const horizontallyAdjacent = 
      Math.abs((shape1.x + shape1.width) - shape2.x) < 5 ||
      Math.abs((shape2.x + shape2.width) - shape1.x) < 5;
      
    const verticallyAdjacent = 
      Math.abs((shape1.y + shape1.height) - shape2.y) < 5 ||
      Math.abs((shape2.y + shape2.height) - shape1.y) < 5;
      
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
          // First shape is on the left
          shape1._drawParams.orientation = 'right'; // Flat edge on right
          shape2._drawParams.orientation = 'left';  // Flat edge on left
        } else {
          // First shape is on the right
          shape1._drawParams.orientation = 'left';  // Flat edge on left
          shape2._drawParams.orientation = 'right'; // Flat edge on right
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
  
  // Always enable debug outlines for Paired Forms
  window.debugPairedForms = true;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill with background color
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Interpret parameters
  const formCount = parseInt(params.formCount) || 3;
  const formType = params.formType || 'mixed';
  const complexity = parseFloat(params.complexity) || 0.5;
  const alignmentType = params.alignmentType || 'edge';
  
  // Create a plan for the composition
  const composition = createDiptychTriptych(
    canvas.width, 
    canvas.height, 
    formCount, 
    complexity, 
    formType
  );
  
  // Apply final alignment adjustments for better edge contacts
  finalizeEdgeContacts(composition, canvas.width, canvas.height, complexity);
  
  // Draw the composition
  drawComposition(ctx, composition, images, params.useMultiply !== false, formType);
  
  return canvas;
}

/**
 * Create a simple diptych or triptych composition
 */
function createDiptychTriptych(width, height, formCount, complexity, formType = 'rectangular') {
  const composition = [];
  // Helper to pick a random type for 'mixed'
  function pickType(index, count) {
    if (formType === 'mixed') {
      const types = ['rectangular', 'semiCircle', 'triangle', 'hexagon', 'beam'];
      
      // For mixed shapes, try to ensure adjacent shapes can fit well together
      if (index > 0) {
        // Consider what would work well with the previous shape
        const prevType = shapes[index-1].type;
        
        // If we know the previous type, bias selection toward complementary shapes
        if (prevType === 'semiCircle') {
          // After a semi-circle, prefer rectangle or a triangle
          // Triangle edge can meet the curve nicely
          return Math.random() < 0.7 ? 
            (Math.random() < 0.4 ? 'rectangular' : 'triangle') : 
            'semiCircle';
        } 
        else if (prevType === 'triangle') {
          // After a triangle, prefer semi-circle since they create nice contacts
          return Math.random() < 0.7 ? 
            (Math.random() < 0.7 ? 'semiCircle' : 'rectangular') : 
            'triangle';
        }
        // After rectangle, any shape works well
      }
      
      // Default random selection
      return types[Math.floor(Math.random() * types.length)];
    }
    return formType;
  }
  
  // Determine whether to create horizontal or vertical composition
  // complexity affects this probability - higher complexity prefers more varied orientations
  const isVerticalSplit = Math.random() < (complexity * 0.4 + 0.3); // 30-70% chance based on complexity
  
  // Scale factor - higher complexity means more varying sizes between forms
  // But we'll keep it more conservative to ensure shapes display properly
  const variationFactor = 0.1 + complexity * 0.3; // 10-40% size variation
  
  // EDGE-TO-EDGE PLACEMENT FUNCTIONS
  
  // Calculate dimensions for the shapes based on formCount, allowing for size variety
  const shapes = [];
  
  // Add margin factor to create space sometimes (higher complexity = more likely to have margins)
  const useMargins = Math.random() < complexity;
  const marginFactor = useMargins ? 0.05 + (Math.random() * 0.15) : 0; // 5-20% margin when used
  
  // Adjust canvas dimensions to account for margins
  const effectiveWidth = width * (1 - marginFactor * 2);
  const effectiveHeight = height * (1 - marginFactor * 2);
  const marginX = width * marginFactor;
  const marginY = height * marginFactor;
  
  if (isVerticalSplit) {
    // Create vertical split composition (shapes arranged side by side)
    let remainingWidth = effectiveWidth;
    let currentX = marginX;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      if (shapeType === 'hexagon') {
        // For hexagons, use 0.75 * width for edge-to-edge
        shapeWidth = effectiveWidth / (formCount - (formCount - 1) * 0.25);
        shapeHeight = effectiveHeight;
      } else if (shapeType === 'beam') {
        // For beams, treat like rectangles for edge-to-edge
        if (i === formCount - 1) {
          shapeWidth = remainingWidth;
          shapeHeight = effectiveHeight;
        } else {
          const portion = 1 / (formCount - i);
          if (i === 0) {
            shapeWidth = Math.floor(remainingWidth * (portion * (1 - variationFactor/2 + Math.random() * variationFactor)));
          } else {
            shapeWidth = Math.floor(remainingWidth * (portion * (1 - variationFactor/3 + Math.random() * (variationFactor/1.5))));
          }
          shapeHeight = effectiveHeight;
        }
      } else {
        // Last shape gets all remaining width
        if (i === formCount - 1) {
          shapeWidth = remainingWidth;
          shapeHeight = effectiveHeight;
        } else {
          // Determine size as a portion of remaining space with variation
          const portion = 1 / (formCount - i);
          if (i === 0) {
            shapeWidth = Math.floor(remainingWidth * (portion * (1 - variationFactor/2 + Math.random() * variationFactor)));
          } else {
            shapeWidth = Math.floor(remainingWidth * (portion * (1 - variationFactor/3 + Math.random() * (variationFactor/1.5))));
          }
          shapeHeight = effectiveHeight;
        }
      }
      shapes.push({
        type: shapeType,
        x: currentX,
        y: marginY,
        width: shapeWidth,
        height: shapeHeight,
        imageIndex: Math.floor(Math.random() * 1000)
      });
      if (shapeType === 'hexagon') {
        currentX += shapeWidth * 0.75;
        remainingWidth -= shapeWidth * 0.75;
      } else {
        remainingWidth -= shapeWidth;
        currentX += shapeWidth;
      }
    }
  } else {
    // Create horizontal split composition (shapes stacked vertically)
    let remainingHeight = effectiveHeight;
    let currentY = marginY;
    for (let i = 0; i < formCount; i++) {
      let shapeType = pickType(i, formCount);
      let shapeWidth, shapeHeight;
      if (shapeType === 'hexagon') {
        // For hexagons, use 0.75 * height for edge-to-edge
        shapeWidth = effectiveWidth;
        shapeHeight = effectiveHeight / (formCount - (formCount - 1) * 0.25);
      } else if (shapeType === 'beam') {
        // For beams, treat like rectangles for edge-to-edge
        if (i === formCount - 1) {
          shapeWidth = effectiveWidth;
          shapeHeight = remainingHeight;
        } else {
          const portion = 1 / (formCount - i);
          if (i === 0) {
            shapeHeight = Math.floor(remainingHeight * (portion * (1 - variationFactor/2 + Math.random() * variationFactor)));
          } else {
            shapeHeight = Math.floor(remainingHeight * (portion * (1 - variationFactor/3 + Math.random() * (variationFactor/1.5))));
          }
          shapeWidth = effectiveWidth;
        }
      } else {
        // Last shape gets all remaining height
        if (i === formCount - 1) {
          shapeWidth = effectiveWidth;
          shapeHeight = remainingHeight;
        } else {
          // Determine size as a portion of remaining space with variation
          const portion = 1 / (formCount - i);
          if (i === 0) {
            shapeHeight = Math.floor(remainingHeight * (portion * (1 - variationFactor/2 + Math.random() * variationFactor)));
          } else {
            shapeHeight = Math.floor(remainingHeight * (portion * (1 - variationFactor/3 + Math.random() * (variationFactor/1.5))));
          }
          shapeWidth = effectiveWidth;
        }
      }
      shapes.push({
        type: shapeType,
        x: marginX,
        y: currentY,
        width: shapeWidth,
        height: shapeHeight,
        imageIndex: Math.floor(Math.random() * 1000)
      });
      if (shapeType === 'hexagon') {
        currentY += shapeHeight * 0.75;
        remainingHeight -= shapeHeight * 0.75;
      } else {
        remainingHeight -= shapeHeight;
        currentY += shapeHeight;
      }
    }
  }
  
  // Now transform each shape to ensure proper edge touching
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    
    // Apply a slight adjustment to ensure shapes touch
    if (i > 0) {
      const prevShape = shapes[i-1];
      
      if (isVerticalSplit) {
        // For side-by-side shapes, ensure x positions are contiguous
        shape.x = prevShape.x + prevShape.width;
        
        // Ensure vertical alignment - bias toward edge touching based on shape types
        if ((prevShape.type === 'semiCircle' && shape.type === 'triangle') ||
            (prevShape.type === 'triangle' && shape.type === 'semiCircle')) {
          // For semi-circle + triangle pairs, align centers for better visual contact
          const prevCenter = prevShape.y + prevShape.height / 2;
          const shapeCenter = shape.y + shape.height / 2;
          
          // Move the second shape to better align with the first
          shape.y += (prevCenter - shapeCenter) * 0.7; // 70% alignment for some variety
        }
      } else {
        // For stacked shapes, ensure y positions are contiguous
        shape.y = prevShape.y + prevShape.height;
        
        // Ensure horizontal alignment - bias toward edge touching based on shape types
        if ((prevShape.type === 'semiCircle' && shape.type === 'triangle') ||
            (prevShape.type === 'triangle' && shape.type === 'semiCircle')) {
          // For semi-circle + triangle pairs, align centers for better visual contact
          const prevCenter = prevShape.x + prevShape.width / 2;
          const shapeCenter = shape.x + shape.width / 2;
          
          // Move the second shape to better align with the first
          shape.x += (prevCenter - shapeCenter) * 0.7; // 70% alignment for some variety
        }
      }
    }
    
    // Add shape to the final composition
    composition.push({
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      imageIndex: shape.imageIndex
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
    } else if (shapeType === 'beam') {
      drawBeam(ctx, shape, img, useMultiply);
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
  // Use maskRegistry for rectangle
  const maskFn = maskRegistry.basic?.rectangleMask;
  if (maskFn) {
    const svg = maskFn({});
    const maskPath = svgToPath2D(svg);
    if (maskPath) {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.scale(shape.width / 100, shape.height / 100);
      ctx.clip(maskPath);
      if (useMultiply) ctx.globalCompositeOperation = 'multiply';
      // Aspect-ratio logic
      const imageAspect = img.width / img.height;
      const shapeAspect = shape.width / shape.height;
      let sourceX, sourceY, sourceWidth, sourceHeight;
      if (imageAspect > shapeAspect) {
        sourceHeight = img.height;
        sourceWidth = img.height * shapeAspect;
        sourceX = (img.width - sourceWidth) / 2;
        sourceY = 0;
      } else {
        sourceWidth = img.width;
        sourceHeight = img.width / shapeAspect;
        sourceX = 0;
        sourceY = (img.height - sourceHeight) / 2;
      }
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 100, 100);
      ctx.restore();
      return;
    }
  }
  // fallback to old logic if maskRegistry fails
  ctx.beginPath();
  if (shape.angle) {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(shape.angle);
    ctx.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
  } else {
    ctx.rect(shape.x, shape.y, shape.width, shape.height);
  }
  ctx.clip();
  if (useMultiply) ctx.globalCompositeOperation = 'multiply';
  // Aspect-ratio logic
  const imageAspect = img.width / img.height;
  const shapeAspect = shape.width / shape.height;
  let sourceX, sourceY, sourceWidth, sourceHeight;
  if (imageAspect > shapeAspect) {
    sourceHeight = img.height;
    sourceWidth = img.height * shapeAspect;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = img.width;
    sourceHeight = img.width / shapeAspect;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, shape.x, shape.y, shape.width, shape.height);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/**
 * Draw a semi-circle shape properly aligned to touch other shapes
 */
function drawSemiCircle(ctx, shape, img, useMultiply) {
  // Use maskRegistry for semiCircle
  console.log('[drawSemiCircle] maskRegistry.basic keys:', Object.keys(maskRegistry.basic || {}));
  const maskFn = maskRegistry.basic?.semiCircleMask;
  console.log('[drawSemiCircle] maskFn exists:', !!maskFn);
  if (maskFn) {
    const maskObj = maskFn({});
    const svg = maskObj.getSvg ? maskObj.getSvg() : maskObj;
    console.log('[drawSemiCircle] SVG string:', svg);
    const maskPath = svgToPath2D(svg);
    if (maskPath) {
      const orientation = shape._drawParams?.orientation;
      let angle = 0;
      switch (orientation) {
        case 'left': angle = Math.PI / 2; break;
        case 'right': angle = -Math.PI / 2; break;
        case 'top': angle = Math.PI; break;
        // 'bottom' or undefined: angle = 0
      }
      console.log('[drawSemiCircle] orientation:', orientation, 'angle:', angle, 'using maskRegistry');
      ctx.save();
      ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.rotate(angle);
      ctx.translate(-shape.width / 2, -shape.height / 2);
      // Uniform scale and center
      const scale = Math.min(shape.width, shape.height) / 100;
      ctx.translate((shape.width - 100 * scale) / 2, (shape.height - 100 * scale) / 2);
      ctx.scale(scale, scale);
      ctx.clip(maskPath);
      if (useMultiply) ctx.globalCompositeOperation = 'multiply';
      // --- ASPECT RATIO FIX START ---
      // Draw the image to fill the shape's pixel area, preserving aspect ratio (cover)
      // Compute the destination box in mask coordinates (0,0,100,100), but draw into shape.width/height
      // So, after scaling, we want to draw into (0,0,100,100), but the image should be cropped to cover the shape
      // Calculate the aspect ratios
      const destW = 100;
      const destH = 100;
      const destAspect = destW / destH;
      const imgAspect = img.width / img.height;
      let sx, sy, sWidth, sHeight;
      if (imgAspect > destAspect) {
        // Image is wider than mask: crop sides
        sHeight = img.height;
        sWidth = sHeight * destAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        // Image is taller than mask: crop top/bottom
        sWidth = img.width;
        sHeight = sWidth / destAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destW, destH);
      // --- ASPECT RATIO FIX END ---
      ctx.restore();
      return;
    }
  }
  // fallback to old logic if maskRegistry fails
  console.log('[drawSemiCircle] using fallback logic');
  ctx.save();
  ctx.arc(
    shape.x + shape.width / 2,
    shape.y + shape.height,
    Math.min(shape.width, shape.height) / 2,
    Math.PI, 2 * Math.PI
  );
  ctx.closePath();
  ctx.clip();
  if (useMultiply) ctx.globalCompositeOperation = 'multiply';
  // Aspect-ratio logic
  const imageAspect = img.width / img.height;
  const shapeAspect = shape.width / shape.height;
  let sourceX, sourceY, sourceWidth, sourceHeight;
  if (imageAspect > shapeAspect) {
    sourceHeight = img.height;
    sourceWidth = img.height * shapeAspect;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = img.width;
    sourceHeight = img.width / shapeAspect;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, shape.x, shape.y, shape.width, shape.height);
  ctx.restore();
}

/**
 * Draw a triangle shape properly aligned to touch other shapes
 */
function drawTriangle(ctx, shape, img, useMultiply) {
  // Use maskRegistry for triangle
  const maskFn = maskRegistry.basic?.triangleMask;
  if (maskFn) {
    const maskObj = maskFn({});
    const svg = maskObj.getSvg ? maskObj.getSvg() : maskObj;
    const maskPath = svgToPath2D(svg);
    if (maskPath) {
      ctx.save();
      // --- ORIENTATION LOGIC ---
      // Default orientation: flat edge on bottom
      let angle = 0;
      const orientation = shape._drawParams?.orientation;
      switch (orientation) {
        case 'top-flat': angle = Math.PI; break;
        case 'left-flat': angle = -Math.PI / 2; break;
        case 'right-flat': angle = Math.PI / 2; break;
        // 'bottom-flat' or undefined: angle = 0
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
      ctx.restore();
      return;
    }
  }
  // fallback to old logic if maskRegistry fails
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(shape.x + shape.width / 2, shape.y);
  ctx.lineTo(shape.x, shape.y + shape.height);
  ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
  ctx.closePath();
  ctx.clip();
  if (useMultiply) ctx.globalCompositeOperation = 'multiply';
  // Aspect-ratio logic
  const imageAspect = img.width / img.height;
  const shapeAspect = shape.width / shape.height;
  let sourceX, sourceY, sourceWidth, sourceHeight;
  if (imageAspect > shapeAspect) {
    sourceHeight = img.height;
    sourceWidth = img.height * shapeAspect;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = img.width;
    sourceHeight = img.width / shapeAspect;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, shape.x, shape.y, shape.width, shape.height);
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
  generate: generatePairedForms
};

export default pairedForms;