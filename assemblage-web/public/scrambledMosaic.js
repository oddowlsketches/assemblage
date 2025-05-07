// scrambledMosaic.js
// Core functionality for the Scrambled Mosaic effect

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
export function createGridPattern(type, gridSize, revealPercentage, operation) {
    let grid;
    
    // Create basic grid pattern based on type
    switch (type) {
        case 'random':
            grid = createRandomPattern(gridSize, operation === 'reveal' ? revealPercentage : 100);
            break;
        case 'clustered':
            grid = createClusteredPattern(gridSize, operation === 'reveal' ? revealPercentage : 100);
            break;
        case 'portrait':
            if (operation === 'reveal') {
                grid = createPortraitPattern(gridSize);
            } else {
                // For swap/rotate, use a full grid (all cells visible)
                grid = Array(gridSize).fill().map(() => Array(gridSize).fill(true));
            }
            break;
        case 'silhouette':
            if (operation === 'reveal') {
                grid = createSilhouettePattern(gridSize);
            } else {
                // For swap/rotate, use a full grid (all cells visible)
                grid = Array(gridSize).fill().map(() => Array(gridSize).fill(true));
            }
            break;
        default:
            grid = createClusteredPattern(gridSize, operation === 'reveal' ? revealPercentage : 100);
    }
    
    // For operations other than 'reveal', we need additional patterns
    let rotateGrid = null;
    let swapGrid = null;
    
    if (operation === 'rotate' || operation === 'swap') {
        // Create a new grid where all cells are visible
        const fullGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(true));
        
        // For the specified percentage, mark cells for rotation/swapping
        const operationGrid = Array(gridSize).fill().map(() => 
            Array(gridSize).fill().map(() => 
                Math.random() * 100 < revealPercentage
            )
        );
        
        // Set appropriate grid based on operation
        if (operation === 'rotate') {
            rotateGrid = operationGrid;
        } else if (operation === 'swap') {
            swapGrid = operationGrid;
        }
        
        // For operations other than reveal, use the full grid for visibility
        if (operation !== 'reveal') {
            grid = fullGrid;
        }
    }
    
    return {
        revealGrid: grid,
        rotateGrid,
        swapGrid
    };
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
    const roundedWidth = Math.floor(width) + 1; // Add 1 to avoid gaps
    const roundedHeight = Math.floor(height) + 1; // Add 1 to avoid gaps
    
    // Create clipping shape based on shape type
    ctx.beginPath();
    
    switch (shapeType) {
        case 'square':
            // Perfect square with no gaps
            ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
            break;
        case 'rectHorizontal':
            // Horizontal rectangle that's shorter than the cell
            const rectHHeight = Math.floor(height * 0.6);
            const rectHY = Math.floor(y + (height - rectHHeight) / 2);
            ctx.rect(roundedX, rectHY, roundedWidth, rectHHeight);
            break;
        case 'rectVertical':
            // Vertical rectangle that's narrower than the cell
            const rectVWidth = Math.floor(width * 0.6);
            const rectVX = Math.floor(x + (width - rectVWidth) / 2);
            ctx.rect(rectVX, roundedY, rectVWidth, roundedHeight);
            break;
        case 'circle':
            // Circle inscribed in the cell
            const centerX = roundedX + roundedWidth / 2;
            const centerY = roundedY + roundedHeight / 2;
            const radius = Math.floor(Math.min(width, height) / 2);
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            break;
        case 'stripe':
            // Diagonal stripe across the cell (ensure whole pixel values)
            ctx.moveTo(roundedX, roundedY);
            ctx.lineTo(roundedX + roundedWidth, roundedY + roundedHeight);
            ctx.lineTo(roundedX + roundedWidth, roundedY + roundedHeight - Math.floor(roundedWidth / 4));
            ctx.lineTo(roundedX, roundedY + roundedHeight - Math.floor(roundedWidth / 4));
            ctx.closePath();
            break;
        default:
            // Default to square
            ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
    }
    
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

    // Calculate image drawing dimensions
    // Use the original non-rounded coordinates for calculations
    let drawX = x;
    let drawY = y;
    let drawWidth = width;
    let drawHeight = height;
    let drawSrcX = srcX;
    let drawSrcY = srcY;
    let drawSrcWidth = srcWidth;
    let drawSrcHeight = srcHeight;
    
    // Calculate image aspect ratio
    const imageAspect = img.width / img.height;
    const cellAspect = width / height;
    
    // Instead of maintaining aspect ratio by adjusting the draw area,
    // adjust the source rectangle to match the cell aspect ratio
    if (imageAspect > cellAspect) { // Image is wider than cell
        // Narrow the source width to match cell aspect ratio
        const newSrcWidth = srcHeight * cellAspect;
        drawSrcX = srcX + (srcWidth - newSrcWidth) / 2; // Center horizontally
        drawSrcWidth = newSrcWidth;
    } else { // Image is taller than cell
        // Reduce the source height to match cell aspect ratio
        const newSrcHeight = srcWidth / cellAspect;
        drawSrcY = srcY + (srcHeight - newSrcHeight) / 2; // Center vertically
        drawSrcHeight = newSrcHeight;
    }
    
    // Apply swap operation if specified
    if (shouldSwap) {
        // Swap with a different part of the image
        drawSrcX = (srcX + srcWidth * 2) % img.width;
        drawSrcY = (srcY + srcHeight * 2) % img.height;
        drawSrcWidth = srcWidth;
        drawSrcHeight = srcHeight;
        
        // Apply the same aspect ratio adjustment to the new source area
        if (imageAspect > cellAspect) { // Image is wider than cell
            // Narrow the source width to match cell aspect ratio
            const newSrcWidth = drawSrcHeight * cellAspect;
            drawSrcX = drawSrcX + (drawSrcWidth - newSrcWidth) / 2; // Center horizontally
            drawSrcWidth = newSrcWidth;
        } else { // Image is taller than cell
            // Reduce the source height to match cell aspect ratio
            const newSrcHeight = drawSrcWidth / cellAspect;
            drawSrcY = drawSrcY + (drawSrcHeight - newSrcHeight) / 2; // Center vertically
            drawSrcHeight = newSrcHeight;
        }
    }
    
    // Apply rotation if specified
    if (shouldRotate) {
        // Save current dimensions for later calculation
        const origDrawWidth = drawWidth;
        const origDrawHeight = drawHeight;
        
        // Rotate around the center of the cell
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(Math.PI / 2); // 90 degrees
        
        // Recalculate drawing parameters
        drawWidth = origDrawHeight;
        drawHeight = origDrawWidth;
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
    }
    
    // Draw the image - fill the entire cell with the adjusted source rectangle
    ctx.drawImage(img, drawSrcX, drawSrcY, drawSrcWidth, drawSrcHeight, drawX, drawY, drawWidth, drawHeight);
    
    // Restore context (removes clipping but keeps transformations for stroke)
    ctx.restore();
    
    // Stroke the shape outline for better definition
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    if (shapePath) {
        ctx.stroke(shapePath);
    } else {
        // Recreate the path if needed
        ctx.beginPath();
        switch (shapeType) {
            case 'square':
                ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
                break;
            case 'rectHorizontal':
                const rectHHeight = Math.floor(height * 0.6);
                const rectHY = Math.floor(y + (height - rectHHeight) / 2);
                ctx.rect(roundedX, rectHY, roundedWidth, rectHHeight);
                break;
            case 'rectVertical':
                const rectVWidth = Math.floor(width * 0.6);
                const rectVX = Math.floor(x + (width - rectVWidth) / 2);
                ctx.rect(rectVX, roundedY, rectVWidth, roundedHeight);
                break;
            case 'circle':
                const centerX = roundedX + roundedWidth / 2;
                const centerY = roundedY + roundedHeight / 2;
                const radius = Math.floor(Math.min(width, height) / 2);
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                break;
            case 'stripe':
                ctx.moveTo(roundedX, roundedY);
                ctx.lineTo(roundedX + roundedWidth, roundedY + roundedHeight);
                ctx.lineTo(roundedX + roundedWidth, roundedY + roundedHeight - Math.floor(roundedWidth / 4));
                ctx.lineTo(roundedX, roundedY + roundedHeight - Math.floor(roundedWidth / 4));
                ctx.closePath();
                break;
            default:
                ctx.rect(roundedX, roundedY, roundedWidth, roundedHeight);
        }
        ctx.stroke();
    }
    
    // Restore the full context
    ctx.restore();
}

/**
 * Generate a scrambled mosaic on a canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {HTMLImageElement[]} images - Array of images
 * @param {Object} config - Configuration
 */
export function generateMosaic(canvas, images, config) {
    if (!canvas || images.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with background color
    ctx.fillStyle = config.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Select a random image
    const img = images[Math.floor(Math.random() * images.length)];
    
    // Create grid patterns for different operations
    const { revealGrid, rotateGrid, swapGrid } = createGridPattern(
        config.gridPatternType || 'clustered',
        config.gridSize || 8,
        config.revealPercentage || 70,
        config.operation || 'reveal'
    );
    
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
                
                // Calculate source rectangle in the image
                const srcX = (x / gridSize) * img.width;
                const srcY = (y / gridSize) * img.height;
                const srcWidth = img.width / gridSize;
                const srcHeight = img.height / gridSize;
                
                // Determine if this cell should rotate or swap
                const shouldRotate = rotateGrid && rotateGrid[y][x];
                const shouldSwap = swapGrid && swapGrid[y][x];
                
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
