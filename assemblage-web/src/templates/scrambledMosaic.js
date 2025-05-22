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
  
  // Fill background
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get parameters with defaults
  const gridSize = params.gridSize || 8;
  const operation = params.operation || 'reveal';
  let revealPct = params.revealPct || 75;
  const swapPct = params.swapPct || 0;
  const rotatePct = params.rotatePct || 0;
  const pattern = params.pattern || 'random';
  
  // For swap and rotate operations, show all tiles
  if (operation === 'swap' || operation === 'rotate') {
    revealPct = 100;
  }
  
  // Calculate cell dimensions
  const cellWidth = canvas.width / gridSize;
  const cellHeight = canvas.height / gridSize;
  
  // Select a single image for the entire mosaic
  const selectedImage = images[Math.floor(Math.random() * images.length)];
  if (!selectedImage || !selectedImage.complete) return;
  
  // Calculate image scaling to fill canvas while maintaining aspect ratio
  const imgRatio = selectedImage.width / selectedImage.height;
  const canvasRatio = canvas.width / canvas.height;
  let scaledWidth, scaledHeight, offsetX = 0, offsetY = 0;
  
  if (imgRatio > canvasRatio) {
    scaledHeight = canvas.height;
    scaledWidth = canvas.height * imgRatio;
    offsetX = (scaledWidth - canvas.width) / 2;
  } else {
    scaledWidth = canvas.width;
    scaledHeight = canvas.width / imgRatio;
    offsetY = (scaledHeight - canvas.height) / 2;
  }
  
  // Create grid of cells
  const cells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Calculate source coordinates from the original image
      const srcX = (x * cellWidth + offsetX) * (selectedImage.width / scaledWidth);
      const srcY = (y * cellHeight + offsetY) * (selectedImage.height / scaledHeight);
      const srcWidth = cellWidth * (selectedImage.width / scaledWidth);
      const srcHeight = cellHeight * (selectedImage.height / scaledHeight);
      
      cells.push({
        x: x * cellWidth,
        y: y * cellHeight,
        width: cellWidth,
        height: cellHeight,
        srcX, srcY, srcWidth, srcHeight,
        visible: Math.random() * 100 < revealPct,
        swapped: Math.random() * 100 < swapPct,
        rotation: Math.random() * 100 < rotatePct ? Math.random() * 360 : 0
      });
    }
  }
  
  // Apply pattern-specific visibility
  switch (pattern) {
    case 'clustered':
      applyClustering(cells, gridSize);
      break;
    case 'silhouette':
      applySilhouette(cells, gridSize);
      break;
    case 'portrait':
      applyPortrait(cells, gridSize);
      break;
    // 'random' is default, no additional processing needed
  }
  
  // Draw cells
  cells.forEach(cell => {
    if (!cell.visible) return;
    
    ctx.save();
    
    // Apply square cell shape clipping
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.width, cell.height);
    ctx.clip();
    
    // Set blend mode
    if (params.useMultiply !== false) {
      ctx.globalCompositeOperation = 'multiply';
    }
    
    // Apply transformations
    if (cell.swapped || cell.rotation) {
      ctx.translate(cell.x + cell.width/2, cell.y + cell.height/2);
      if (cell.rotation) {
        ctx.rotate(cell.rotation * Math.PI / 180);
      }
      if (cell.swapped) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-cell.width/2, -cell.height/2);
    }
    
    // Draw the appropriate section of the image
    ctx.drawImage(
      selectedImage,
      cell.srcX, cell.srcY, cell.srcWidth, cell.srcHeight,
      cell.x, cell.y, cell.width, cell.height
    );
    
    ctx.restore();
  });
  
  return canvas;
}

// Helper functions for patterns
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
    gridSize: { type: 'number', min: 4, max: 16, default: 8 },
    revealPct: { type: 'number', min: 40, max: 100, default: 75 },
    swapPct: { type: 'number', min: 0, max: 100, default: 0 },
    rotatePct: { type: 'number', min: 0, max: 100, default: 0 },
    pattern: { type: 'select', options: ['random', 'clustered', 'silhouette', 'portrait'], default: 'random' },
    operation: { type: 'select', options: ['reveal', 'swap', 'rotate'], default: 'reveal' },
    bgColor: { type: 'color', default: '#ffffff' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default scrambledMosaicTemplate;
