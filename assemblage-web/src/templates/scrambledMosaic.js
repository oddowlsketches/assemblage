// scrambledMosaic.js
// Template for creating mosaic-like compositions with scrambled tiles

/**
 * Generate a scrambled mosaic composition
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images
 * @param {Object} params
 */
export function generateScrambledMosaic(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill background (this will be visible through revealed tiles)
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get parameters with defaults
  const gridSize = params.gridSize || 8;
  const revealPct = params.revealPct === undefined ? 75 : params.revealPct; // Default 75 if undefined
  const swapPct = params.swapPct || 0;
  const rotatePct = params.rotatePct || 0;
  const operation = params.operation || 'reveal'; // Restore operation parameter
  const pattern = params.pattern || 'random'; // Not used currently, but kept for potential future use
  
  // Calculate cell dimensions
  const cellWidth = canvas.width / gridSize;
  const cellHeight = canvas.height / gridSize;
  
  // Select a single image for the entire mosaic
  const selectedImage = images[Math.floor(Math.random() * images.length)];
  if (!selectedImage || !selectedImage.complete) {
    console.warn('[ScrambledMosaic] Selected image not loaded or invalid.');
    return;
  }
  
  // Calculate image scaling to fill canvas while maintaining aspect ratio (for the base image layer)
  const imgRatio = selectedImage.width / selectedImage.height;
  const canvasRatio = canvas.width / canvas.height;
  let baseImgDrawWidth, baseImgDrawHeight, baseImgOffsetX = 0, baseImgOffsetY = 0;

  if (imgRatio > canvasRatio) { // Image is wider than canvas
    baseImgDrawHeight = canvas.height;
    baseImgDrawWidth = canvas.height * imgRatio;
    baseImgOffsetX = (canvas.width - baseImgDrawWidth) / 2; // Center it
  } else { // Image is taller than or same aspect as canvas
    baseImgDrawWidth = canvas.width;
    baseImgDrawHeight = canvas.width / imgRatio;
    baseImgOffsetY = (canvas.height - baseImgDrawHeight) / 2; // Center it
  }

  // Create grid of cells. Each cell defines a segment of the base image.
  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let isVisible = true;
      if (operation === 'reveal') {
        isVisible = Math.random() * 100 > revealPct; // If true, image part is SHOWN, background NOT revealed
      }
      // For swap/rotate, all tiles are initially visible unless revealPct is also applied for a combined effect (which is not the current request)

      cells.push({
        col: c, row: r, // Store grid position for effects
        destX: c * cellWidth, // Destination on canvas
        destY: r * cellHeight,
        width: cellWidth,
        height: cellHeight,
        // srcX/Y/Width/Height define the part of the *original* image to draw
        // We need to map the canvas cell back to the original image pixels
        imgSrcX: (c * cellWidth - baseImgOffsetX) * (selectedImage.width / baseImgDrawWidth),
        imgSrcY: (r * cellHeight - baseImgOffsetY) * (selectedImage.height / baseImgDrawHeight),
        imgSrcWidth: cellWidth * (selectedImage.width / baseImgDrawWidth),
        imgSrcHeight: cellHeight * (selectedImage.height / baseImgDrawHeight),
        
        visible: isVisible, 
        applySwap: (operation === 'swap') && (Math.random() * 100 < swapPct),
        applyRotate: (operation === 'rotate') && (Math.random() * 100 < rotatePct),
      });
    }
  }
  
  // Draw cells. The base image is NOT drawn directly; only its segments in cells.
  cells.forEach(cell => {
    if (!cell.visible && operation === 'reveal') { // Only skip drawing if operation is 'reveal' and cell is marked not visible
      ctx.restore(); // Assuming ctx.save() was at the start of an outer loop or this cell processing
      return; 
    }
    ctx.save(); // Save for this cell's transformations

    // Clipping to the cell's destination rectangle (BEFORE transformations)
    ctx.beginPath();
    ctx.rect(cell.destX, cell.destY, cell.width, cell.height);
    ctx.clip();

    let currentRotation = 0;
    let currentSwap = false;

    if (cell.applyRotate) {
      currentRotation = (Math.floor(Math.random() * 3) + 1) * 90;
    }
    if (cell.applySwap) { 
      currentSwap = true; 
    }
    
    // Transformations for the content *within* the clipped cell
    ctx.translate(cell.destX + cell.width / 2, cell.destY + cell.height / 2);
    if (currentRotation > 0) {
      ctx.rotate(currentRotation * Math.PI / 180);
    }
    if (currentSwap) {
      ctx.scale(-1, 1); 
    }
    ctx.translate(-(cell.width / 2), -(cell.height / 2));
    
    if (params.useMultiply !== false) {
      ctx.globalCompositeOperation = 'multiply';
    }
    
    ctx.drawImage(
      selectedImage,
      cell.imgSrcX, cell.imgSrcY, cell.imgSrcWidth, cell.imgSrcHeight, 
      0, 0, cell.width, cell.height 
    );
    
    ctx.restore();
  });
  
  return canvas;
}

// Helper functions for patterns (currently not used but kept for reference)
function applyClustering(cells, gridSize) {
  // Create cluster centers
  const clusters = [];
  const clusterCount = 2 + Math.floor(Math.random() * 3); // 2-4 clusters
  for (let i = 0; i < clusterCount; i++) {
    clusters.push({
      x: Math.random() * gridSize,
      y: Math.random() * gridSize
    });
  }
  
  // Set visibility based on distance to nearest cluster
  cells.forEach((cell, i) => {
    const cellX = Math.floor(i % gridSize);
    const cellY = Math.floor(i / gridSize);
    
    // Find distance to nearest cluster
    const minDist = Math.min(...clusters.map(cluster => 
      Math.sqrt(Math.pow(cellX - cluster.x, 2) + Math.pow(cellY - cluster.y, 2))
    ));
    
    cell.visible = minDist < gridSize * 0.3;
  });
}

function applySilhouette(cells, gridSize) {
  // Create a simple silhouette shape (e.g. circle)
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;
  const radius = gridSize * 0.4;
  
  cells.forEach((cell, i) => {
    const cellX = Math.floor(i % gridSize);
    const cellY = Math.floor(i / gridSize);
    
    const dist = Math.sqrt(Math.pow(cellX - centerX, 2) + Math.pow(cellY - centerY, 2));
    cell.visible = dist < radius;
  });
}

function applyPortrait(cells, gridSize) {
  // Create a portrait-like rectangular shape
  const margin = Math.floor(gridSize * 0.2);
  
  cells.forEach((cell, i) => {
    const cellX = Math.floor(i % gridSize);
    const cellY = Math.floor(i / gridSize);
    
    cell.visible = 
      cellX >= margin && 
      cellX < gridSize - margin && 
      cellY >= margin/2 && 
      cellY < gridSize - margin/2;
  });
}

const scrambledMosaicTemplate = {
  key: 'scrambledMosaic',
  name: 'Scrambled Mosaic',
  generate: generateScrambledMosaic,
  params: {
    gridSize: { type: 'number', min: 2, max: 16, default: 8 },
    revealPct: { type: 'number', min: 0, max: 100, default: 75 }, // Applies when operation is 'reveal'
    swapPct: { type: 'number', min: 0, max: 100, default: 0 },   // Applies when operation is 'swap'
    rotatePct: { type: 'number', min: 0, max: 100, default: 0 }, // Applies when operation is 'rotate'
    operation: { type: 'select', options: ['reveal', 'swap', 'rotate', 'none'], default: 'reveal' },
    bgColor: { type: 'color', default: '#FFFFFF' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default scrambledMosaicTemplate;
