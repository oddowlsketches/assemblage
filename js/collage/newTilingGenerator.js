/**
 * Tiling Generator for Assemblage
 * Handles tiling-specific collage generation
 */

export class TilingGenerator {
    constructor(canvas, parameters) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parameters = parameters;
        this.ABSOLUTE_MAX_REPEATS = 3; // Maximum number of times an image can be repeated
        this.imageUsageCount = new Map(); // Track how many times each image is used
    }

    // Helper function to shuffle arrays (used in multiple effects)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper function to preserve aspect ratio when drawing tiles
    preserveAspectRatio(image, x, y, targetWidth, targetHeight) {
        if (!image || !image.complete) return false;
        
        const imgRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgRatio > targetRatio) {
            // Image is wider - match width and center vertically
            drawWidth = targetWidth;
            drawHeight = drawWidth / imgRatio;
            drawX = x;
            drawY = y + (targetHeight - drawHeight) / 2;
        } else {
            // Image is taller - match height and center horizontally
            drawHeight = targetHeight;
            drawWidth = drawHeight * imgRatio;
            drawX = x + (targetWidth - drawWidth) / 2;
            drawY = y;
        }
        
        // Draw with proper dimensions
        this.ctx.drawImage(
            image,
            0, 0, image.width, image.height, // Source
            drawX, drawY, drawWidth, drawHeight // Destination
        );
        
        return true;
    }

    // Enhanced tile drawing with aspect ratio preservation
    drawTileWithAspectRatio(image, x, y, width, height) {
        // Skip missing or incomplete images
        if (!image || !image.complete) return;
        
        // Save current context state
        this.ctx.save();
        
        // Calculate aspect ratio
        const imgAspectRatio = image.width / image.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        // Always preserve original aspect ratio
        if (imgAspectRatio > 1) {
            // Landscape image - match width
            drawWidth = width;
            drawHeight = width / imgAspectRatio;
            drawX = x;
            drawY = y + (height - drawHeight) / 2;
        } else {
            // Portrait image - match height
            drawHeight = height;
            drawWidth = height * imgAspectRatio;
            drawX = x + (width - drawWidth) / 2;
            drawY = y;
        }
        
        // Draw with proper dimensions
        this.ctx.drawImage(
            image,
            0, 0, image.width, image.height, // Source (full image)
            drawX, drawY, drawWidth, drawHeight // Destination
        );
        
        // Restore context
        this.ctx.restore();
    }

    async generateTile(images, x, y, size) {
        if (!images || images.length === 0) return null;
        
        // Determine if image repetition is allowed based on parameters
        const allowImageRepetition = this.parameters.allowImageRepetition !== null 
            ? this.parameters.allowImageRepetition 
            : false; // Default to no repetition
            
        let imageIndex;
        
        if (allowImageRepetition) {
            // Simply choose a random image if repetition is allowed
            imageIndex = Math.floor(Math.random() * images.length);
        } else {
            // Choose a least-used image if repetition is not allowed
            const usageEntries = Array.from(this.imageUsageCount.entries())
                .sort((a, b) => a[1] - b[1]);
                
            if (usageEntries.length === 0 || usageEntries[0][1] >= this.ABSOLUTE_MAX_REPEATS) {
                // Reset counts if all images have been used the maximum number of times
                this.imageUsageCount.clear();
                imageIndex = Math.floor(Math.random() * images.length);
            } else {
                // Find the least used image
                const leastUsedCount = usageEntries[0][1];
                const leastUsedImages = usageEntries
                    .filter(([_, count]) => count === leastUsedCount)
                    .map(([idx, _]) => idx);
                imageIndex = leastUsedImages[Math.floor(Math.random() * leastUsedImages.length)];
            }
        }
        
        // Update usage count
        const currentCount = this.imageUsageCount.get(imageIndex) || 0;
        this.imageUsageCount.set(imageIndex, currentCount + 1);
        
        const selectedImage = images[imageIndex];
        
        // Validate image
        if (!selectedImage || !selectedImage.complete || !(selectedImage instanceof HTMLImageElement)) {
            console.warn(`Invalid image at index ${imageIndex}`);
            return null;
        }
        
        // Keep tiles within canvas bounds - allow partial overflow for full bleed
        const boundedX = Math.min(x, this.canvas.width);
        const boundedY = Math.min(y, this.canvas.height);
        
        return {
            image: selectedImage,
            x: boundedX,
            y: boundedY,
            width: size,
            height: size,
            rotation: 0,
            forceOpacity: null,
            imageIndex: imageIndex // Track which image was used
        };
    }

    async generateTiles(images) {
        if (!images || images.length === 0) return [];
        
        // Reset image usage tracking at the start of each generation
        this.imageUsageCount.clear();
        
        // Determine if image repetition is allowed based on parameters
        const allowImageRepetition = this.parameters.allowImageRepetition !== null 
            ? this.parameters.allowImageRepetition 
            : false; // Default to no repetition
        
        console.log(`Image repetition ${allowImageRepetition ? 'enabled' : 'disabled'}`);
        
        const isFocalStyle = this.parameters.selectedCompositionStyle === 'Focal';
        // Randomly choose between focal and field modes with bias based on style
        const useFocalMode = isFocalStyle ? Math.random() < 0.7 : Math.random() < 0.3;
        
        console.log(`Generating tiles in ${useFocalMode ? 'focal' : 'field'} mode`);
        
        const tiles = [];
        
        if (useFocalMode) {
            // Focal mode: Few, larger images
            await this.generateFocalTiles(images, tiles, allowImageRepetition);
        } else {
            // Field mode: Many smaller images
            await this.generateFieldTiles(images, tiles, allowImageRepetition);
        }

        console.log(`Generated ${tiles.length} tiles`);
        return tiles;
    }

    async generateFocalTiles(images, tiles, allowImageRepetition) {
        // Similar to current style - few large images
        const baseSize = Math.max(100, this.canvas.width / 4);
        const minScale = 0.6;
        const maxScale = 1.2;
        
        // Generate 3-5 focal points
        const numFocal = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numFocal; i++) {
            const x = Math.random() * (this.canvas.width - baseSize);
            const y = Math.random() * (this.canvas.height - baseSize);
            const scale = minScale + Math.random() * (maxScale - minScale);
            const rotation = (Math.random() - 0.5) * 30;
            
            // Store the current setting temporarily to use in generateTile
            this.parameters.allowImageRepetition = allowImageRepetition;
            
            const tile = await this.generateTile(images, x, y, baseSize * scale);
            
            if (tile) {
                tile.rotation = rotation;
                tile.forceOpacity = 0.5 + Math.random() * 0.3;
                tiles.push(tile);
            }
        }
    }

    async generateFieldTiles(images, tiles, allowImageRepetition) {
        if (!images || images.length === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate base size for better coverage with fewer tiles
        const baseSize = Math.min(
            this.canvas.width / (8 * dpr),  // Increased from 10 for larger tiles
            this.canvas.height / (5 * dpr)   // Increased from 7 for larger tiles
        );
        
        // Scale range for more consistent sizes
        const minScale = 0.9;  // Increased minimum scale
        const maxScale = 1.4;  // Increased maximum scale for better coverage
        
        // Calculate grid with overlap factor for fewer but larger tiles
        const overlapFactor = 0.65; // Slightly more overlap
        const numCols = Math.floor(this.canvas.width / (baseSize * overlapFactor * dpr)) + 1;
        const numRows = Math.floor(this.canvas.height / (baseSize * overlapFactor * dpr)) + 1;
        
        // Calculate target number of tiles (max 120)
        const maxTiles = 120;
        const targetTiles = Math.min(maxTiles, numCols * numRows);
        
        console.log(`Generating field tiles with grid ${numCols}x${numRows}, baseSize: ${baseSize}`);
        console.log(`Canvas dimensions: ${this.canvas.width}x${this.canvas.height}`);
        
        // Calculate cell size for full bleed
        const effectiveWidth = this.canvas.width / dpr;
        const effectiveHeight = this.canvas.height / dpr;
        const cellWidth = effectiveWidth / (numCols - 1);
        const cellHeight = effectiveHeight / (numRows - 1);
        
        // Adjust max uses based on repetition setting
        const maxUsesPerImage = allowImageRepetition ? 
            Math.max(2, Math.ceil(targetTiles / images.length)) : 
            1; // If repetition not allowed, use each image only once
        
        // Track image usage frequency with strict limits
        this.imageUsageCount.clear(); // Reset at the start
        images.forEach((_, idx) => this.imageUsageCount.set(idx, 0));
        
        // Determine if this composition should use rotations
        const useRotations = Math.random() < 0.7; // 70% chance to use rotations
        const rotationAmount = useRotations ? 25 : 0; // Max rotation when enabled
        
        // Generate grid positions with extended bounds for full bleed
        const positions = [];
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                // Skip more positions to reach target tile count
                if (positions.length >= targetTiles) continue;
                
                // Calculate base position at cell center
                const baseX = (col * cellWidth);
                const baseY = (row * cellHeight);
                
                // Add slight randomness but keep within reasonable bounds
                const jitterRange = Math.min(cellWidth, cellHeight) * 0.15;
                const x = baseX + (Math.random() - 0.5) * jitterRange;
                const y = baseY + (Math.random() - 0.5) * jitterRange;
                
                positions.push({x, y});
            }
        }
        
        // Shuffle positions
        positions.sort(() => Math.random() - 0.5);
        positions.length = Math.min(positions.length, targetTiles);
        
        let visibleTiles = 0;
        
        // Pre-determine opacity distribution with more full opacity tiles
        const opacityDistribution = positions.map(() => {
            const rand = Math.random();
            if (rand < 0.15) return 1.0; // 15% full opacity
            if (rand < 0.50) return 0.3 + Math.random() * 0.2; // 35% low opacity (0.3-0.5)
            return 0.6 + Math.random() * 0.3; // 50% medium-high opacity (0.6-0.9)
        });
        
        // Store the repetition setting in parameters
        this.parameters.allowImageRepetition = allowImageRepetition;
        
        // Generate tiles
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            
            // Calculate tile properties with larger scale for better coverage
            const scale = minScale + Math.random() * (maxScale - minScale);
            const finalSize = baseSize * scale;
            
            // Determine if this tile should be rotated
            const shouldRotate = useRotations && Math.random() < 0.3;
            const rotation = shouldRotate ? (Math.random() - 0.5) * rotationAmount : 0;
            
            // Generate tile with adjusted position to account for center-based placement
            const tile = await this.generateTile(
                images,
                (pos.x - finalSize/2) * dpr,
                (pos.y - finalSize/2) * dpr,
                finalSize * dpr
            );
            
            if (tile) {
                tile.rotation = rotation;
                tile.forceOpacity = opacityDistribution[i];
                tiles.push(tile);
                visibleTiles++;
            }
        }
        
        // Log debug information
        const imageStats = {
            uniqueImagesUsed: new Set([...this.imageUsageCount.entries()]
                .filter(([_, count]) => count > 0)
                .map(([idx, _]) => idx)).size,
            maxUsageCount: Math.max(...this.imageUsageCount.values()),
            averageUsageCount: [...this.imageUsageCount.values()].reduce((a, b) => a + b, 0) / images.length,
            rotationsEnabled: useRotations,
            maxRotation: rotationAmount
        };
        
        console.log(`Image usage statistics:`, imageStats);
        console.log(`Generated ${tiles.length} total tiles, ${visibleTiles} should be visible`);
    }

    createDramaticTile(baseSize, dramaticScale, isFocalStyle) {
        const targetFocalPos = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        const dramaticSize = baseSize * dramaticScale;
        const offsetX = (Math.random() - 0.5) * dramaticSize * 0.3;
        const offsetY = (Math.random() - 0.5) * dramaticSize * 0.3;
        const dramaticX = targetFocalPos.x - dramaticSize / 2 + offsetX;
        const dramaticY = targetFocalPos.y - dramaticSize / 2 + offsetY;

        return {
            x: dramaticX, y: dramaticY,
            width: dramaticSize, height: dramaticSize,
            scale: dramaticScale, isDramaticCandidate: true,
            forceOpacity: 1.0
        };
    }

    assignOpacity(tile, dramaticTileData) {
        if (tile.isDramaticCandidate) return 1.0;
        const rand = Math.random();
        if (rand < 0.07) return 1.0;
        if (rand < 0.30) return 0.5 + Math.random() * 0.3;
        return null;
    }

    generateGridTiles(tiles, rows, cols, tileSize, images) {
        const gridScaleFactor = 0.9; // Tighter grid
        const adjustedTileSize = tileSize * gridScaleFactor;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = j * adjustedTileSize;
                const y = i * adjustedTileSize;
                
                const offsetX = (Math.random() - 0.5) * adjustedTileSize * 0.05;
                const offsetY = (Math.random() - 0.5) * adjustedTileSize * 0.05;
                const scale = 1 + (Math.random() - 0.5) * 0.1;
                const imageIndex = Math.floor(Math.random() * images.length);
                
                tiles.push({
                    img: imageIndex,
                    x: x + offsetX,
                    y: y + offsetY,
                    width: adjustedTileSize * scale,
                    height: adjustedTileSize * scale,
                    rotation: (Math.random() - 0.5) * 5,
                    depth: Math.random()
                });
            }
        }
    }
}