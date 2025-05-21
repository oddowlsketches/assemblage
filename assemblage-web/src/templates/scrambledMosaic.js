// scrambledMosaic.js
// Core functionality for the Scrambled Mosaic template

/**
 * Creates a clustered reveal pattern
 * @param {number} gridSize - Size of the grid
 * @param {number} revealPercentage - Percentage of cells to reveal (0-100)
 * @returns {boolean[][]} Grid of revealed/hidden cells
 */
export function createClusteredPattern(gridSize, revealPercentage) {
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    
    // Start with random seeds
    const numSeeds = Math.max(1, Math.floor((gridSize * gridSize) * 0.05));
    for (let i = 0; i < numSeeds; i++) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        grid[y][x] = true;
    }
    
    // Grow clusters until we reach desired percentage
    let revealed = numSeeds;
    const targetRevealed = Math.floor((gridSize * gridSize) * (revealPercentage / 100));
    
    while (revealed < targetRevealed) {
        // Find a cell that's not revealed but adjacent to a revealed cell
        const candidates = [];
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (grid[y][x]) continue; // Skip already revealed cells
                
                // Check if adjacent to a revealed cell
                const hasRevealedNeighbor = (
                    (x > 0 && grid[y][x-1]) || 
                    (x < gridSize-1 && grid[y][x+1]) || 
                    (y > 0 && grid[y-1][x]) || 
                    (y < gridSize-1 && grid[y+1][x])
                );
                
                if (hasRevealedNeighbor) {
                    candidates.push({x, y});
                }
            }
        }
        
        if (candidates.length === 0) {
            // No candidates found, add a new random seed
            let newSeedFound = false;
            while (!newSeedFound) {
                const x = Math.floor(Math.random() * gridSize);
                const y = Math.floor(Math.random() * gridSize);
                if (!grid[y][x]) {
                    grid[y][x] = true;
                    revealed++;
                    newSeedFound = true;
                }
            }
        } else {
            // Pick a random candidate and reveal it
            const candidate = candidates[Math.floor(Math.random() * candidates.length)];
            grid[candidate.y][candidate.x] = true;
            revealed++;
        }
        
        if (revealed >= targetRevealed) break;
    }
    
    return grid;
}

/**
 * Creates a portrait/face pattern
 * @param {number} gridSize - Size of the grid
 * @returns {boolean[][]} Grid of revealed/hidden cells
 */
export function createPortraitPattern(gridSize) {
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    
    // Create a face-like pattern (eyes, nose, mouth)
    const centerX = Math.floor(gridSize / 2);
    const centerY = Math.floor(gridSize / 2);
    
    // Face outline (roughly oval)
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // Calculate distance from center (normalized to 0-1)
            const dx = (x - centerX) / (gridSize / 2);
            const dy = (y - centerY) / (gridSize / 2);
            
            // Oval equation: (x/a)² + (y/b)² <= 1
            // We make it slightly taller (b=1.2) than wide (a=1.0)
            const inFace = (dx*dx) + (dy*dy / 1.44) <= 1;
            
            // Randomly reveal parts of the face
            if (inFace && Math.random() < 0.7) {
                grid[y][x] = true;
            }
        }
    }
    
    // Ensure certain facial features are revealed
    
    // Left eye region
    const leftEyeX = centerX - Math.floor(gridSize / 5);
    const eyeY = centerY - Math.floor(gridSize / 5);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const x = leftEyeX + dx;
            const y = eyeY + dy;
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                grid[y][x] = true;
            }
        }
    }
    
    // Right eye region
    const rightEyeX = centerX + Math.floor(gridSize / 5);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const x = rightEyeX + dx;
            const y = eyeY + dy;
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                grid[y][x] = true;
            }
        }
    }
    
    // Nose
    const noseY = centerY;
    for (let dy = 0; dy <= Math.floor(gridSize / 10) + 1; dy++) {
        const y = noseY + dy;
        if (y < gridSize) {
            grid[y][centerX] = true;
        }
    }
    
    // Mouth
    const mouthY = centerY + Math.floor(gridSize / 3);
    for (let dx = -Math.floor(gridSize / 6); dx <= Math.floor(gridSize / 6); dx++) {
        const x = centerX + dx;
        if (x >= 0 && x < gridSize && mouthY < gridSize) {
            grid[mouthY][x] = true;
        }
    }
    
    return grid;
}

/**
 * Creates a silhouette pattern
 * @param {number} gridSize - Size of the grid
 * @returns {boolean[][]} Grid of revealed/hidden cells
 */
export function createSilhouettePattern(gridSize) {
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
    
    // Create a centered silhouette (e.g., a figure)
    const centerX = Math.floor(gridSize / 2);
    
    // Define a rough human silhouette
    for (let y = 0; y < gridSize; y++) {
        const normalizedY = y / gridSize; // 0 to 1 from top to bottom
        
        // Width of the silhouette at this y-position
        let width;
        
        if (normalizedY < 0.2) {
            // Head (0-20% of height)
            width = 0.15;
        } else if (normalizedY < 0.4) {
            // Shoulders and upper torso (20-40% of height)
            width = 0.25;
        } else if (normalizedY < 0.6) {
            // Torso (40-60% of height)
            width = 0.2;
        } else {
            // Legs (60-100% of height)
            width = 0.15 + (normalizedY - 0.6) * 0.1; // Widen slightly toward bottom
        }
        
        // Convert width from percentage to grid units
        const halfWidth = Math.ceil(width * gridSize / 2);
        
        // Fill in the silhouette
        for (let x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
            if (x >= 0 && x < gridSize) {
                // Add some randomness to the edges
                if (x === centerX - halfWidth || x === centerX + halfWidth) {
                    if (Math.random() < 0.7) {
                        grid[y][x] = true;
                    }
                } else {
                    grid[y][x] = true;
                }
            }
        }
    }
    
    return grid;
}

/**
 * Creates a random grid pattern
 * @param {number} gridSize - Size of the grid
 * @param {number} revealPercentage - Percentage of cells to reveal (0-100)
 * @returns {boolean[][]} Grid of revealed/hidden cells
 */
export function createRandomPattern(gridSize, revealPercentage) {
    return Array(gridSize).fill().map(() => 
        Array(gridSize).fill().map(() => 
            Math.random() * 100 < revealPercentage
        )
    );
}

/**
 * Creates a grid reveal pattern based on selected type and operation
 * @param {string} type - Pattern type (random, cluster, silhouette, portrait)
 * @param {number} gridSize - Size of the grid
 * @param {number} revealPercentage - Percentage of cells to reveal or modify (0-100)
 * @param {string} operation - Operation type (reveal, swap, rotate)
 * @returns {Object} Object containing grid patterns for reveal, rotate, and swap operations
 */
export function createGridPattern(type, gridSize, percentage, operation) {
    // Always start with a full grid of visibility
    const fullGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(true));

    // Helper to make a pattern grid (may hide cells) – used only for reveal op
    const makePatternGrid = () => {
        switch (type) {
            case 'random':
                return createRandomPattern(gridSize, percentage);
            case 'clustered':
                return createClusteredPattern(gridSize, percentage);
            case 'portrait':
                return createPortraitPattern(gridSize);
            case 'silhouette':
                return createSilhouettePattern(gridSize);
            default:
                return createClusteredPattern(gridSize, percentage);
        }
    };

    let revealGrid = fullGrid;
    let rotateGrid = null;
    let swapGrid = null;

    if (operation === 'reveal') {
        revealGrid = makePatternGrid();
    } else if (operation === 'rotate') {
        rotateGrid = makePatternGrid();
    } else if (operation === 'swap') {
        swapGrid = makePatternGrid();
    }

    return { revealGrid, rotateGrid, swapGrid };
}

/**
 * Draw a cell with the specified shape
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Cell width
 * @param {number} height - Cell height
 * @param {string} shapeType - Shape type (square, rectHorizontal, rectVertical, circle, stripe)
 * @param {HTMLImageElement} img - Image to draw
 * @param {number} srcX - Source X in image
 * @param {number} srcY - Source Y in image
 * @param {number} srcWidth - Source width in image
 * @param {number} srcHeight - Source height in image
 * @param {boolean} shouldRotate - Whether to rotate this cell
 * @param {boolean} shouldSwap - Whether to swap this cell
 * @param {boolean} useMultiplyBlend - Whether to use multiply blend mode
 */
export function drawCell(ctx, x, y, width, height, shapeType, img, srcX, srcY, srcWidth, srcHeight, shouldRotate, shouldSwap, useMultiplyBlend) {
    // Save context for clipping and transformations
    ctx.save();
    
    // Round coordinates to ensure pixel-perfect rendering
    const roundedX = Math.floor(x);
    const roundedY = Math.floor(y);
    const roundedWidth = Math.ceil(width) + 1; // Add 1 to ensure no gaps
    const roundedHeight = Math.ceil(height) + 1; // Add 1 to ensure no gaps
    
    // Create clipping shape - only square shape is supported now
    ctx.beginPath();
    ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
    
    // Create a copy of the path for stroking later
    const shapePath = ctx.currentPath || new Path2D(ctx.getPath ? ctx.getPath() : null);
    
    // Clip to the shape
    ctx.save();
    ctx.clip();
    
    // Set blend mode if enabled
    if (useMultiplyBlend) {
        ctx.globalCompositeOperation = 'multiply';
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }

    // Use the source rectangle passed in by the grid logic
    let sourceX = srcX;
    let sourceY = srcY;
    let sourceW = srcWidth;
    let sourceH = srcHeight;
    let drawX = roundedX;
    let drawY = roundedY;
    let drawWidth = roundedWidth;
    let drawHeight = roundedHeight;
    
    // Apply swap operation if specified
    if (shouldSwap) {
        sourceX = (sourceX + sourceW * 0.5) % img.width;
        sourceY = (sourceY + sourceH * 0.5) % img.height;
    }
    
    // Apply rotation if specified
    if (shouldRotate) {
        const origDrawWidth = drawWidth;
        const origDrawHeight = drawHeight;
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(Math.PI / 2); // 90 degrees
        drawWidth = origDrawHeight;
        drawHeight = origDrawWidth;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
    }
    
    // Draw the image
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, drawX, drawY, drawWidth, drawHeight);
    
    // Restore context (removes clipping but keeps transformations for stroke)
    ctx.restore();
    
    // Stroke the shape outline for better definition
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    if (shapePath) {
        ctx.stroke(shapePath);
    } else {
        ctx.beginPath();
        ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
        ctx.stroke();
    }
    
    // Restore the full context
    ctx.restore();
}

/**
 * Generate a scrambled mosaic on a canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {HTMLImageElement[]} images - Array of images
 * @param {Object} params - Configuration parameters
 */
export function generateMosaic(canvas, images, params) {
    if (!canvas || images.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Map parameters to config
    const config = {
        gridSize: parseInt(params.gridSize),
        revealPercentage: parseFloat(params.revealPct),
        swapPct: parseFloat(params.swapPct ?? 0),
        rotatePct: parseFloat(params.rotatePct ?? 0),
        gridPatternType: params.pattern,
        shapeType: params.cellShape,
        operation: params.operation,
        useMultiplyBlend: params.useMultiply !== false,
        backgroundColor: params.bgColor || '#FFFFFF'
    };
    
    // Fill with background color
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Select a random image
    const img = images[Math.floor(Math.random() * images.length)];
    
    // Create grid patterns for different operations
    const { revealGrid } = createGridPattern(
        config.gridPatternType || 'clustered',
        config.gridSize || 8,
        config.operation === 'reveal' ? config.revealPercentage || 70 : 100, // Only use revealPercentage for reveal operation
        'reveal'
    );
    
    // Build rotate/swap grids based on percentages
    const buildProbabilityGrid = (pct) => {
        if (pct <= 0) return null;
        return revealGrid.map(row => row.map(() => Math.random() * 100 < pct));
    };

    const rotateGrid = buildProbabilityGrid(config.rotatePct);
    const swapGrid = buildProbabilityGrid(config.swapPct);
    
    // Calculate cell size - ensure whole numbers to avoid gaps
    const gridSize = revealGrid.length;
    
    // Calculate cell dimensions with slight overlap to prevent gaps
    const cellWidth = Math.floor(canvas.width / gridSize);
    const cellHeight = Math.floor(canvas.height / gridSize);
    
    // Draw the mosaic
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (revealGrid[y][x]) {
                // Calculate cell position
                const cellX = x * cellWidth;
                const cellY = y * cellHeight;
                
                // Base crop for this tile (proportional region of the image)
                const baseSrcX = (x / gridSize) * img.width;
                const baseSrcY = (y / gridSize) * img.height;
                const baseSrcW = img.width / gridSize;
                const baseSrcH = img.height / gridSize;

                // We will expand this crop to preserve aspect ratio and cover the tile
                let srcX = baseSrcX;
                let srcY = baseSrcY;
                let srcWidth = baseSrcW;
                let srcHeight = baseSrcH;

                const tileAspect = cellWidth / cellHeight;
                const imgAspect = baseSrcW / baseSrcH;
                if (imgAspect > tileAspect) {
                    // crop extra width inside base region
                    const targetW = baseSrcH * tileAspect;
                    srcX += (baseSrcW - targetW) / 2;
                    srcWidth = targetW;
                } else {
                    // crop extra height
                    const targetH = baseSrcW / tileAspect;
                    srcY += (baseSrcH - targetH) / 2;
                    srcHeight = targetH;
                }
                
                // Determine if this cell should rotate or swap
                const shouldRotate = !!(rotateGrid && rotateGrid[y][x]);
                const shouldSwap = !!(swapGrid && swapGrid[y][x]);
                
                // Draw the cell with the specified shape and operations
                drawCell(
                    ctx, 
                    cellX, cellY, 
                    cellWidth, cellHeight, 
                    config.shapeType || 'square', 
                    img, 
                    srcX, srcY, srcWidth, srcHeight,
                    shouldRotate,
                    shouldSwap, 
                    config.useMultiplyBlend !== false
                );
            }
        }
    }
    
    return canvas;
}

// Export the main function as default
const scrambledMosaic = {
  key: 'scrambledMosaic',
  name: 'Scrambled Mosaic',
  generate: generateMosaic,
  // Parameter definitions for the template-review UI
  params: {
    gridSize: { type: 'number', min: 4, max: 16, default: 8 },
    revealPct: { type: 'number', min: 10, max: 100, default: 75 },
    swapPct: { type: 'number', min: 0, max: 100, default: 0 },
    rotatePct: { type: 'number', min: 0, max: 100, default: 0 },
    pattern: { type: 'select', options: ['random', 'clustered', 'silhouette', 'portrait'], default: 'clustered' },
    cellShape: { type: 'select', options: ['square'], default: 'square' },
    operation: { type: 'select', options: ['reveal', 'swap', 'rotate'], default: 'reveal' },
    bgColor: { type: 'color', default: '#ffffff' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default scrambledMosaic;
