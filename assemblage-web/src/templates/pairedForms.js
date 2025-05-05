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
  const rotation = parseFloat(params.rotation) || 0;
  
  // Create a plan for the composition
  const composition = createDiptychTriptych(
    canvas.width, 
    canvas.height, 
    formCount, 
    complexity, 
    rotation
  );
  
  // Draw the composition
  drawComposition(ctx, composition, images, params.useMultiply !== false);
  
  return canvas;
}

/**
 * Create a simple diptych or triptych composition
 */
function createDiptychTriptych(width, height, formCount, complexity, rotation) {
  const composition = [];
  const isVerticalSplit = Math.random() < 0.5;
  
  if (isVerticalSplit) {
    // Vertical split (side by side)
    if (formCount === 2) {
      // Simple diptych
      const splitPoint = 0.3 + Math.random() * 0.4; // Between 0.3-0.7
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: Math.floor(width * splitPoint),
        height: height,
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: Math.floor(width * splitPoint),
        y: 0,
        width: width - Math.floor(width * splitPoint),
        height: height,
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
    } else {
      // Triptych
      const split1 = 0.25 + Math.random() * 0.2; // First split around 1/3
      const split2 = 0.6 + Math.random() * 0.2; // Second split around 2/3
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: Math.floor(width * split1),
        height: height,
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: Math.floor(width * split1),
        y: 0,
        width: Math.floor(width * (split2 - split1)),
        height: height,
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: Math.floor(width * split2),
        y: 0,
        width: width - Math.floor(width * split2),
        height: height,
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
    }
  } else {
    // Horizontal split (stacked)
    if (formCount === 2) {
      // Simple stacked diptych
      const splitPoint = 0.3 + Math.random() * 0.4; // Between 0.3-0.7
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: width,
        height: Math.floor(height * splitPoint),
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: Math.floor(height * splitPoint),
        width: width,
        height: height - Math.floor(height * splitPoint),
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
    } else {
      // Stacked triptych
      const split1 = 0.25 + Math.random() * 0.2; // First split around 1/3
      const split2 = 0.6 + Math.random() * 0.2; // Second split around 2/3
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: width,
        height: Math.floor(height * split1),
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: Math.floor(height * split1),
        width: width,
        height: Math.floor(height * (split2 - split1)),
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
      
      composition.push({
        type: 'rectangle',
        x: 0,
        y: Math.floor(height * split2),
        width: width,
        height: height - Math.floor(height * split2),
        angle: rotation * (Math.random() * 0.2),
        imageIndex: Math.floor(Math.random() * 1000)
      });
    }
  }
  
  return composition;
}

/**
 * Draw a composition on the canvas
 */
function drawComposition(ctx, composition, images, useMultiply) {
  // For each shape in the composition
  for (let i = 0; i < composition.length; i++) {
    const shape = composition[i];
    const imageIndex = shape.imageIndex % images.length;
    const img = images[imageIndex];
    
    // Save current context state
    ctx.save();
    
    // Draw the shape
    drawRectangle(ctx, shape, img, useMultiply);
    
    // Restore context
    ctx.restore();
  }
}

/**
 * Draw a rectangular shape with an image
 */
function drawRectangle(ctx, shape, img, useMultiply) {
  // Create clipping path
  ctx.beginPath();
  
  // Apply rotation if specified
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
  
  // Apply multiply blend mode if enabled
  if (useMultiply) {
    ctx.globalCompositeOperation = 'multiply';
  }
  
  // Calculate source rectangle to maintain aspect ratio without distortion
  const imageAspect = img.width / img.height;
  const shapeAspect = shape.width / shape.height;
  
  let sourceX, sourceY, sourceWidth, sourceHeight;
  
  if (imageAspect > shapeAspect) {
    // Image is wider than shape - crop sides
    sourceHeight = img.height;
    sourceWidth = img.height * shapeAspect;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    // Image is taller than shape - crop top/bottom
    sourceWidth = img.width;
    sourceHeight = img.width / shapeAspect;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }
  
  // Draw the image
  if (shape.angle) {
    // For rotated rectangles, drawing coordinates are relative to rotation center
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 
                 -shape.width / 2, -shape.height / 2, shape.width, shape.height);
  } else {
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 
                 shape.x, shape.y, shape.width, shape.height);
  }
  
  // Draw a subtle border for better definition
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// Export the template module
export default {
  name: 'Paired Forms',
  key: 'pairedForms',
  render: generatePairedForms
};
