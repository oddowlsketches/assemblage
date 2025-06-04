/**
 * fillNegativeSpace.ts
 * 
 * Algorithm to auto-fill remaining blank canvas area by scaling & cloning existing shapes
 * rather than spawning new small ones.
 */

import { scaleToCover, ScaleToCoverResult } from './scaleToCover';

export interface MaskElement {
  x: number;
  y: number;
  width: number;
  height: number;
  maskName?: string;
  rotation?: number;
  opacity?: number;
  [key: string]: any; // Allow additional properties
}

export interface FillNegativeSpaceParams {
  canvas: HTMLCanvasElement;
  elements: MaskElement[];
  targetBlankRatio?: number; // Default 0.03 (3%)
  maxIterations?: number; // Default 10
  minBlankAreaSize?: number; // Minimum area size to consider filling (default 1000 pixels)
}

export interface FillNegativeSpaceResult {
  filledElements: MaskElement[];
  finalBlankRatio: number;
  iterations: number;
}

/**
 * Calculate the blank ratio of the canvas
 * Uses a simple pixel sampling approach for performance
 */
function calculateBlankRatio(canvas: HTMLCanvasElement, elements: MaskElement[]): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 1.0;

  // Create a temporary canvas to render elements as a mask
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return 1.0;

  // Clear and fill with black (representing blank space)
  tempCtx.fillStyle = 'black';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw all elements as white rectangles (simplified for performance)
  tempCtx.fillStyle = 'white';
  elements.forEach(element => {
    tempCtx.save();
    
    // Apply rotation if present
    if (element.rotation) {
      tempCtx.translate(element.x + element.width / 2, element.y + element.height / 2);
      tempCtx.rotate(element.rotation * Math.PI / 180);
      tempCtx.translate(-element.width / 2, -element.height / 2);
      tempCtx.fillRect(-element.x, -element.y, element.width, element.height);
    } else {
      tempCtx.fillRect(element.x, element.y, element.width, element.height);
    }
    
    tempCtx.restore();
  });

  // Sample pixels to calculate blank ratio
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  let blankPixels = 0;
  const totalPixels = tempCanvas.width * tempCanvas.height;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) { // Skip 4 pixels at a time
    if (data[i] === 0) { // Black pixel (blank space)
      blankPixels += 4; // Account for skipped pixels
    }
  }

  return blankPixels / totalPixels;
}

/**
 * Find the largest blank rectangular area using a simple grid-based approach
 */
function findLargestBlankRect(
  canvas: HTMLCanvasElement, 
  elements: MaskElement[],
  minSize: number = 1000
): { x: number; y: number; width: number; height: number } | null {
  const gridSize = 20; // Check every 20 pixels for performance
  const width = canvas.width;
  const height = canvas.height;
  
  // Create occupancy grid
  const gridWidth = Math.ceil(width / gridSize);
  const gridHeight = Math.ceil(height / gridSize);
  const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
  
  // Mark occupied cells
  elements.forEach(element => {
    const startX = Math.max(0, Math.floor(element.x / gridSize));
    const endX = Math.min(gridWidth - 1, Math.ceil((element.x + element.width) / gridSize));
    const startY = Math.max(0, Math.floor(element.y / gridSize));
    const endY = Math.min(gridHeight - 1, Math.ceil((element.y + element.height) / gridSize));
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        grid[y][x] = true;
      }
    }
  });
  
  // Find largest blank rectangle using dynamic programming
  let maxArea = 0;
  let bestRect = null;
  
  // For each cell, try to expand a rectangle from that point
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (!grid[y][x]) {
        // Try to expand rectangle from this point
        let maxWidth = gridWidth - x;
        
        for (let h = 1; y + h <= gridHeight && h * gridSize < height; h++) {
          let w = 0;
          
          // Find maximum width for this height
          for (w = 0; w < maxWidth && x + w < gridWidth; w++) {
            if (grid[y + h - 1][x + w]) break;
          }
          
          maxWidth = Math.min(maxWidth, w);
          if (maxWidth === 0) break;
          
          const area = (w * gridSize) * (h * gridSize);
          if (area > maxArea && area >= minSize) {
            maxArea = area;
            bestRect = {
              x: x * gridSize,
              y: y * gridSize,
              width: w * gridSize,
              height: h * gridSize
            };
          }
        }
      }
    }
  }
  
  return bestRect;
}

/**
 * Clone and scale an existing element to fill a target rectangle
 */
function cloneAndScaleElement(
  sourceElement: MaskElement,
  targetRect: { x: number; y: number; width: number; height: number }
): MaskElement {
  // Use scaleToCover to determine optimal dimensions
  const scaled = scaleToCover({
    maskWidth: sourceElement.width,
    maskHeight: sourceElement.height,
    canvasW: targetRect.width,
    canvasH: targetRect.height,
    maxZoom: 2.0
  });
  
  // Center the scaled element in the target rectangle with slight jitter
  const jitterX = (Math.random() - 0.5) * 20;
  const jitterY = (Math.random() - 0.5) * 20;
  
  const x = targetRect.x + (targetRect.width - scaled.w) / 2 + jitterX;
  const y = targetRect.y + (targetRect.height - scaled.h) / 2 + jitterY;
  
  // Clone the element with new dimensions and position
  return {
    ...sourceElement,
    x: x,
    y: y,
    width: scaled.w,
    height: scaled.h,
    // Slightly vary opacity and rotation for visual interest
    opacity: sourceElement.opacity ? sourceElement.opacity * (0.9 + Math.random() * 0.1) : 0.95,
    rotation: sourceElement.rotation ? sourceElement.rotation + (Math.random() - 0.5) * 5 : 0,
    isCloned: true // Mark as cloned for debugging
  };
}

/**
 * Main function to fill negative space by cloning and scaling existing shapes
 */
export function fillNegativeSpace(params: FillNegativeSpaceParams): FillNegativeSpaceResult {
  const {
    canvas,
    elements,
    targetBlankRatio = 0.03,
    maxIterations = 10,
    minBlankAreaSize = 1000
  } = params;
  
  const filledElements = [...elements];
  let currentBlankRatio = calculateBlankRatio(canvas, filledElements);
  let iterations = 0;
  
  console.log(`[fillNegativeSpace] Starting with blank ratio: ${(currentBlankRatio * 100).toFixed(1)}%`);
  
  while (currentBlankRatio > targetBlankRatio && iterations < maxIterations) {
    iterations++;
    
    // Find largest blank area
    const blankRect = findLargestBlankRect(canvas, filledElements, minBlankAreaSize);
    
    if (!blankRect) {
      console.log(`[fillNegativeSpace] No suitable blank areas found after ${iterations} iterations`);
      break;
    }
    
    // Pick a random existing element to clone (prefer larger elements)
    const sourceElements = elements.filter(el => !el.isCloned); // Prefer original elements
    const sortedBySize = (sourceElements.length > 0 ? sourceElements : filledElements)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    // Pick from top 50% of largest elements
    const topHalf = Math.ceil(sortedBySize.length / 2);
    const sourceElement = sortedBySize[Math.floor(Math.random() * topHalf)];
    
    if (!sourceElement) {
      console.log(`[fillNegativeSpace] No source elements available`);
      break;
    }
    
    // Clone and scale the element to fill the blank area
    const newElement = cloneAndScaleElement(sourceElement, blankRect);
    filledElements.push(newElement);
    
    // Recalculate blank ratio
    const newBlankRatio = calculateBlankRatio(canvas, filledElements);
    console.log(`[fillNegativeSpace] Iteration ${iterations}: blank ratio ${(currentBlankRatio * 100).toFixed(1)}% → ${(newBlankRatio * 100).toFixed(1)}%`);
    
    if (newBlankRatio >= currentBlankRatio) {
      // No improvement, stop
      console.log(`[fillNegativeSpace] No improvement in blank ratio, stopping`);
      break;
    }
    
    currentBlankRatio = newBlankRatio;
  }
  
  console.log(`[fillNegativeSpace] Completed with final blank ratio: ${(currentBlankRatio * 100).toFixed(1)}% after ${iterations} iterations`);
  
  return {
    filledElements,
    finalBlankRatio: currentBlankRatio,
    iterations
  };
}
