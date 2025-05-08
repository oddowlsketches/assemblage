// Minimal Tangram Template - Pure Canvas Edition
// This version avoids using complex SVG->Path2D conversion 
// and directly draws shapes onto the canvas

import { tangramArrangements } from './tangramArrangements';
import maskRegistry from '../masks/maskRegistry';
import { registerTangramPieces } from '../masks/tangramPieces';

// Register tangram pieces
registerTangramPieces(maskRegistry);

// Function to draw a triangle directly on canvas
function drawTriangle(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
}

// Function to draw a square directly on canvas
function drawSquare(ctx, x, y, size) {
  ctx.beginPath();
  ctx.rect(x, y, size, size);
}

// Function to draw a parallelogram directly on canvas
function drawParallelogram(ctx, x, y, width, height, skew) {
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width - skew, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
}

// Main rendering function
export function renderTangram(canvas, images, params) {
  // Get context and clear
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Validate inputs
  if (!canvas || !images || images.length === 0) {
    console.warn('Invalid input to renderTangram');
    return canvas;
  }

  // Set default parameters
  params = params || {};
  
  // Fill background color
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get arrangement
  const arrangementIndex = params.arrangementIndex || 0;
  const arrangement = tangramArrangements[arrangementIndex];
  if (!arrangement || !arrangement.placements) {
    console.warn('No valid arrangement found');
    return canvas;
  }
  
  // Log for debugging
  console.log('Rendering arrangement:', arrangement.key);
  console.log('Placements:', arrangement.placements);
  
  // Canvas dimensions and scale
  const size = Math.min(canvas.width, canvas.height) * 0.8;
  const offsetX = (canvas.width - size) / 2;
  const offsetY = (canvas.height - size) / 2;
  
  // Debug mode
  const debug = params.debug === true;
  
  // Image assignment
  const pieceImageOrder = params.pieceImageOrder || 
    Array.from({ length: arrangement.placements.length }, (_, i) => i);
  
  // Draw each piece directly with canvas commands
  arrangement.placements.forEach((piece, index) => {
    // Pick image
    const imgIndex = pieceImageOrder[index % pieceImageOrder.length] % images.length;
    const img = images[imgIndex];
    if (!img || !img.complete) return;
    
    // Calculate position and size
    const x = offsetX + (piece.x * size);
    const y = offsetY + (piece.y * size);
    const width = piece.width * size;
    const height = piece.height * size;
    
    // Save context for transformation
    ctx.save();
    
    // Position and rotate
    ctx.translate(x, y);
    if (piece.rotation) {
      ctx.rotate(piece.rotation * Math.PI / 180);
    }
    
    // Determine piece type from maskName
    const maskName = piece.maskName.split('/')[1];
    
    // Create clip path based on piece type
    if (maskName.includes('Large')) {
      // Large triangle - right angled triangle
      drawTriangle(ctx, 0, 0, width, 0, 0, height);
    } 
    else if (maskName.includes('Medium')) {
      // Medium triangle
      drawTriangle(ctx, 0, 0, width, 0, width, height);
    }
    else if (maskName.includes('Small')) {
      // Small triangle
      if (maskName.includes('1')) {
        drawTriangle(ctx, 0, 0, width, 0, 0, height);
      } else {
        drawTriangle(ctx, width, 0, width, height, 0, height);
      }
    }
    else if (maskName.includes('Square')) {
      // Square
      drawSquare(ctx, 0, 0, width);
    }
    else if (maskName.includes('Parallelogram')) {
      // Parallelogram
      drawParallelogram(ctx, 0, 0, width, height, width/2);
    }
    
    // Apply clip
    ctx.clip();
    
    // Draw image with multiply blend
    ctx.globalCompositeOperation = 'multiply';
    
    // Simple placement - scale image to fit 
    ctx.drawImage(img, 0, 0, width, height);
    
    // Reset blending
    ctx.globalCompositeOperation = 'source-over';
    
    // Debug outlines
    if (debug) {
      ctx.strokeStyle = 'rgba(255,0,0,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Restore context
    ctx.restore();
  });
  
  // Draw container box in debug mode
  if (debug) {
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, size, size);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0,0,255,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(offsetX + (i/10) * size, offsetY);
      ctx.lineTo(offsetX + (i/10) * size, offsetY + size);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + (i/10) * size);
      ctx.lineTo(offsetX + size, offsetY + (i/10) * size);
      ctx.stroke();
    }
  }
  
  return canvas;
}

// Create arrangement options
export const tangramArrangementOptions = tangramArrangements.map((a, i) => ({ 
  label: a.name || a.key, 
  value: i 
}));

// Export the main function as default
const tangramTemplate = {
  generate: renderTangram
};

export default tangramTemplate;
