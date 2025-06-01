// scrambledMosaic.js
// Template for creating mosaic-like compositions with scrambled tiles
import { randomVibrantColor, getRandomColorFromPalette } from '../utils/colors.js'; // Import palette-aware color selection

/**
 * Generate a scrambled mosaic composition
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images
 * @param {Object} params
 */
export function generateScrambledMosaic(canvas, images, params = {}) {
  if (!canvas || !images || images.length === 0) return;

  const ctx = canvas.getContext('2d');
  
  // Randomize gridSize between 6-12 if not explicitly provided
  const gridSize = params.gridSize || (Math.floor(Math.random() * 7) + 6); // 6-12
  let { revealPct, swapPct, rotatePct, operation, bgColor, useMultiply } = params;

  // Valid operations array
  const validOperations = ['reveal', 'swap', 'rotate'];
  
  // If no operation is specified or if it's the default, randomly choose one
  if (!operation || operation === 'reveal') {
    operation = validOperations[Math.floor(Math.random() * validOperations.length)];
    console.log(`[ScrambledMosaic] Randomly selected operation: ${operation}`);
  }

  // Enforce only the relevant parameter for the selected operation
  if (operation === 'reveal') {
    revealPct = (typeof revealPct === 'number' && revealPct > 0) ? revealPct : 75;
    swapPct = 0;
    rotatePct = 0;
  } else if (operation === 'swap') {
    swapPct = (typeof swapPct === 'number' && swapPct > 0) ? swapPct : 70;
    revealPct = 0;
    rotatePct = 0;
  } else if (operation === 'rotate') {
    rotatePct = (typeof rotatePct === 'number' && rotatePct > 0) ? rotatePct : 70;
    revealPct = 0;
    swapPct = 0;
  }

  bgColor = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : getRandomColorFromPalette(images, 'auto');
  useMultiply = useMultiply !== false; // Default to true if not specified

  // Clear and fill background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate cell dimensions - ensure square tiles by using the smaller dimension
  const minDimension = Math.min(canvas.width, canvas.height);
  const cellSize = Math.floor(minDimension / gridSize);
  
  // Calculate offsets to center the grid
  const totalWidth = cellSize * gridSize;
  const totalHeight = cellSize * gridSize;
  const offsetX = Math.floor((canvas.width - totalWidth) / 2);
  const offsetY = Math.floor((canvas.height - totalHeight) / 2);
  
  const selectedImageIndex = Math.floor(Math.random() * images.length);
  const selectedImage = images[selectedImageIndex];
  if (!selectedImage || !selectedImage.complete || (selectedImage.isBroken && import.meta.env.MODE === 'development')) {
    console.warn('[ScrambledMosaic] Selected image not available or broken.');
    return; // Don't draw if the image isn't ready
  }

  // Determine variant chance (randomly leave portions untouched)
  const variantChance = Math.random();
  let applyVariant = false;
  let variantType = 'none';
  let untouchedCells = new Set();
  
  if (variantChance < 0.3) { // 30% chance to apply a variant
    applyVariant = true;
    const variantRandom = Math.random();
    
    if (variantRandom < 0.5) {
      // Leave 0-3 outer rings untouched
      variantType = 'rings';
      const ringsToLeave = Math.floor(Math.random() * 4); // 0-3 rings
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const distFromEdge = Math.min(row, col, gridSize - 1 - row, gridSize - 1 - col);
          if (distFromEdge < ringsToLeave) {
            untouchedCells.add(`${row},${col}`);
          }
        }
      }
    } else {
      // Leave half untouched (left/right or top/bottom)
      variantType = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (variantType === 'horizontal' && row < gridSize / 2) {
            untouchedCells.add(`${row},${col}`);
          } else if (variantType === 'vertical' && col < gridSize / 2) {
            untouchedCells.add(`${row},${col}`);
          }
        }
      }
    }
  }

  // Create grid of cells with operations based on the selected operation type
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellKey = `${row},${col}`;
      const isUntouched = untouchedCells.has(cellKey);
      
      const cell = {
        row,
        col,
        x: offsetX + col * cellSize,
        y: offsetY + row * cellSize,
        size: cellSize,
        visible: true,
        shouldRotate: false,
        shouldSwap: false,
        rotationAngle: 0,
        isUntouched
      };

      // Apply operations based on the current operation mode (unless cell is untouched)
      if (!isUntouched) {
        switch (operation) {
          case 'reveal':
            cell.visible = Math.random() * 100 < revealPct;
            break;
          case 'rotate':
            cell.shouldRotate = Math.random() * 100 < rotatePct;
            if (cell.shouldRotate) {
              // Random 90-degree rotation (1-3 times)
              cell.rotationAngle = (Math.floor(Math.random() * 3) + 1) * 90;
            }
            break;
          case 'swap':
            cell.shouldSwap = Math.random() * 100 < swapPct;
            break;
        }
      }
      
      cells.push(cell);
    }
  }
  
  // Draw cells
  cells.forEach(cell => {
    if (!cell.visible && operation === 'reveal') {
      return; // Skip hidden cells in reveal mode
    }

    ctx.save();
    
    // Clip to square cell with 1px overlap to prevent gaps
    ctx.beginPath();
    ctx.rect(cell.x - 0.5, cell.y - 0.5, cell.size + 1, cell.size + 1);
    ctx.clip();

    // Apply transformations
    if (cell.shouldRotate || cell.rotationAngle > 0) {
      // Rotate around cell center
      const centerX = cell.x + cell.size / 2;
      const centerY = cell.y + cell.size / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((cell.rotationAngle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    if (cell.shouldSwap) {
      // Horizontal flip
      ctx.translate(cell.x + cell.size, cell.y);
      ctx.scale(-1, 1);
      ctx.translate(-cell.x, -cell.y);
    }

    if (useMultiply) {
      ctx.globalCompositeOperation = 'multiply';
    }
    
    // Calculate source rectangle from the image
    // Map the grid cell to the corresponding portion of the image
    const imgCellWidth = selectedImage.width / gridSize;
    const imgCellHeight = selectedImage.height / gridSize;
    
    let srcX = cell.col * imgCellWidth;
    let srcY = cell.row * imgCellHeight;
    let srcWidth = imgCellWidth;
    let srcHeight = imgCellHeight;
    
    // For swap operation, use a different part of the image
    if (cell.shouldSwap) {
      srcX = ((cell.col + Math.floor(gridSize / 2)) % gridSize) * imgCellWidth;
      srcY = ((cell.row + Math.floor(gridSize / 2)) % gridSize) * imgCellHeight;
    }
    
    // Maintain aspect ratio when drawing into square cells
    const srcAspect = srcWidth / srcHeight;
    const cellAspect = 1; // Square cells
    
    let drawX = cell.x;
    let drawY = cell.y;
    let drawWidth = cell.size;
    let drawHeight = cell.size;
    
    // Use cover behavior to maintain aspect ratio
    if (srcAspect > cellAspect) {
      // Source is wider - fit to height and crop width
      drawHeight = cell.size;
      drawWidth = drawHeight * srcAspect;
      drawX = cell.x - (drawWidth - cell.size) / 2;
    } else {
      // Source is taller - fit to width and crop height  
      drawWidth = cell.size;
      drawHeight = drawWidth / srcAspect;
      drawY = cell.y - (drawHeight - cell.size) / 2;
    }
    
    // Draw the image portion maintaining aspect ratio
    ctx.drawImage(
      selectedImage,
      srcX, srcY, srcWidth, srcHeight,
      drawX, drawY, drawWidth, drawHeight
    );
    
    // Add subtle outline to prevent visible gaps
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cell.x, cell.y, cell.size, cell.size);
    
    ctx.restore();
  });
  
  // Return processed parameters that were actually used
  const processedParams = {
    gridSize: gridSize,
    operation: operation,
    revealPct: revealPct,
    swapPct: swapPct,
    rotatePct: rotatePct,
    bgColor: bgColor,
    useMultiply: useMultiply,
    selectedImageIndex: selectedImageIndex,
    gridConfiguration: {
      cellSize: cellSize,
      totalWidth: totalWidth,
      totalHeight: totalHeight,
      offsetX: offsetX,
      offsetY: offsetY
    },
    variantApplied: applyVariant,
    variantType: variantType,
    untouchedCellCount: untouchedCells.size,
    cellOperations: cells.map((cell, index) => ({
      index: index,
      row: cell.row,
      col: cell.col,
      visible: cell.visible,
      shouldRotate: cell.shouldRotate,
      shouldSwap: cell.shouldSwap,
      rotationAngle: cell.rotationAngle,
      isUntouched: cell.isUntouched
    })),
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[ScrambledMosaicTemplate] Returning processed params:', processedParams);
  
  return { 
    canvas, 
    bgColor,
    processedParams 
  };
}


const scrambledMosaicTemplate = {
  key: 'scrambledMosaic',
  name: 'Scrambled Mosaic',
  render: generateScrambledMosaic,
  params: {
    gridSize: { type: 'number', min: 2, max: 16, default: 8 },
    revealPct: { type: 'number', min: 0, max: 100, default: 75 }, 
    swapPct: { type: 'number', min: 0, max: 100, default: 0 },
    rotatePct: { type: 'number', min: 0, max: 100, default: 0 },
    operation: { type: 'select', options: ['reveal', 'swap', 'rotate'], default: 'reveal' },
    bgColor: { type: 'color', default: '#FFFFFF' }, // Keep UI default, code will override
    useMultiply: { type: 'boolean', default: true }
  }
};

export default scrambledMosaicTemplate;
