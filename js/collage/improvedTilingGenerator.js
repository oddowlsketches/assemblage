/**
 * Improved Tiling Generator for Assemblage
 * Combines the working tiling functionality with the advanced features
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

    async generateTile(images, x, y, size, preferredImageIndex = null) {
        if (!images || images.length === 0) return null;
        
        // Determine if image repetition is allowed based on parameters
        const allowImageRepetition = this.parameters.allowImageRepetition !== null 
            ? this.parameters.allowImageRepetition 
            : false; // Default to no repetition
            
        let imageIndex;
        
        if (preferredImageIndex !== null) {
            // Use the preferred image if provided
            imageIndex = preferredImageIndex;
        } else if (allowImageRepetition) {
            // Choose the least used image that hasn't hit the repetition limit
            const availableImages = Array.from({length: images.length}, (_, i) => i)
                .filter(idx => (this.imageUsageCount.get(idx) || 0) < this.ABSOLUTE_MAX_REPEATS);
            
            if (availableImages.length === 0) {
                // All images have hit the max usage limit, reset counts
                this.imageUsageCount.clear();
                imageIndex = Math.floor(Math.random() * images.length);
            } else {
                // Sort by usage count (least used first)
                availableImages.sort((a, b) => 
                    (this.imageUsageCount.get(a) || 0) - (this.imageUsageCount.get(b) || 0)
                );
                
                // Prefer least used images (80% chance) or random from available (20% chance)
                if (Math.random() < 0.8) {
                    // Get all images with the minimum usage count
                    const minUsage = this.imageUsageCount.get(availableImages[0]) || 0;
                    const leastUsedImages = availableImages.filter(idx => 
                        (this.imageUsageCount.get(idx) || 0) === minUsage
                    );
                    imageIndex = leastUsedImages[Math.floor(Math.random() * leastUsedImages.length)];
                } else {
                    // Choose randomly from all available images
                    imageIndex = availableImages[Math.floor(Math.random() * availableImages.length)];
                }
            }
        } else {
            // No repetition - use each image only once
            const unusedImages = Array.from({length: images.length}, (_, i) => i)
                .filter(idx => !(this.imageUsageCount.get(idx) || 0));
                
            if (unusedImages.length === 0) {
                // No more unused images, can't create more tiles
                return null;
            }
            
            imageIndex = unusedImages[Math.floor(Math.random() * unusedImages.length)];
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
        
        // Calculate aspect-preserving dimensions
        const imgRatio = selectedImage.width / selectedImage.height;
        let finalWidth, finalHeight;
        
        if (imgRatio > 1) {
            // Landscape image
            finalWidth = size;
            finalHeight = size / imgRatio;
        } else {
            // Portrait image
            finalHeight = size;
            finalWidth = size * imgRatio;
        }
        
        // Keep tiles within canvas bounds - allow partial overflow for full bleed
        const boundedX = Math.min(x, this.canvas.width);
        const boundedY = Math.min(y, this.canvas.height);
        
        return {
            image: selectedImage,
            x: boundedX,
            y: boundedY,
            width: finalWidth,
            height: finalHeight,
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
        
        // Add variation to the mode selection - random with contextual bias
        const useDramaticMode = Math.random() < 0.3; // 30% chance for dramatic scaling
        const useFocalMode = isFocalStyle ? Math.random() < 0.7 : Math.random() < 0.3;
        
        // Log the selected mode combination
        const modeDescription = useDramaticMode ? 'dramatic scaling' : 'uniform scaling';
        console.log(`Generating tiles in ${useFocalMode ? 'focal' : 'field'} mode with ${modeDescription}`);
        
        const tiles = [];
        
        if (useFocalMode) {
            // Focal mode: Few, larger images
            await this.generateFocalTiles(images, tiles, allowImageRepetition, useDramaticMode);
        } else {
            // Field mode: Many smaller images
            await this.generateFieldTiles(images, tiles, allowImageRepetition, useDramaticMode);
        }

        console.log(`Generated ${tiles.length} tiles`);
        return tiles;
    }

    async generateFocalTiles(images, tiles, allowImageRepetition, useDramaticScaling) {
        // Larger base size for focal tiles
        const baseSize = Math.max(200, this.canvas.width / 3.5);
        
        // Scale ranges with more dramatic options when enabled
        let minScale, maxScale;
        
        if (useDramaticScaling) {
            // Dramatic scaling - greater variation
            minScale = 0.4;
            maxScale = 1.6;
        } else {
            // Uniform scaling - less variation
            minScale = 0.6;
            maxScale = 1.2;
        }
        
        // Generate 3-7 focal points (more with dramatic scaling)
        const minFocal = useDramaticScaling ? 4 : 3;
        const maxFocal = useDramaticScaling ? 7 : 5;
        const numFocal = minFocal + Math.floor(Math.random() * (maxFocal - minFocal + 1));
        
        console.log(`Generating ${numFocal} focal tiles with scale range: ${minScale}-${maxScale}`);
        
        // Prepare image selection
        let imageSequence = [];
        if (!allowImageRepetition) {
            // Create a shuffled sequence of unique images
            imageSequence = this.shuffleArray(Array.from({length: images.length}, (_, i) => i))
                .slice(0, Math.min(numFocal, images.length));
        }
        
        // Positioning strategy - more intentional with dramatic scaling
        let positionStrategy;
        if (useDramaticScaling) {
            // Create a more curated layout for dramatic scaling
            // Define important positions (rule of thirds, golden ratio points)
            const w = this.canvas.width;
            const h = this.canvas.height;
            
            positionStrategy = [
                // Rule of thirds points
                {x: w/3, y: h/3},
                {x: 2*w/3, y: h/3},
                {x: w/3, y: 2*h/3},
                {x: 2*w/3, y: 2*h/3},
                // Golden ratio points
                {x: w * 0.382, y: h * 0.382},
                {x: w * 0.618, y: h * 0.382},
                {x: w * 0.382, y: h * 0.618},
                {x: w * 0.618, y: h * 0.618},
                // Center
                {x: w/2, y: h/2}
            ];
            
            // Shuffle the positions
            this.shuffleArray(positionStrategy);
        }
        
        // Process for creating tiles
        for (let i = 0; i < numFocal; i++) {
            // Determine position based on strategy
            let x, y;
            
            if (useDramaticScaling && i < positionStrategy.length) {
                // Use the strategic positions for dramatic scaling
                const pos = positionStrategy[i];
                // Add slight randomness to avoid perfectly aligned tiles
                const jitter = baseSize * 0.1;
                x = pos.x + (Math.random() - 0.5) * jitter;
                y = pos.y + (Math.random() - 0.5) * jitter;
            } else {
                // Random position
                x = Math.random() * (this.canvas.width - baseSize * minScale);
                y = Math.random() * (this.canvas.height - baseSize * minScale);
            }
            
            // Determine scale with weighted distribution based on dramatic setting
            let scale;
            if (useDramaticScaling) {
                // In dramatic mode, bias toward extremes (very large or small)
                const rand = Math.random();
                if (rand < 0.4) {
                    // 40% chance of large tile
                    scale = maxScale - (Math.random() * 0.3); // 1.3-1.6
                } else if (rand < 0.7) {
                    // 30% chance of small tile
                    scale = minScale + (Math.random() * 0.2); // 0.4-0.6
                } else {
                    // 30% chance of medium tile
                    scale = 0.8 + (Math.random() * 0.4); // 0.8-1.2
                }
            } else {
                // In uniform mode, use a more regular distribution
                scale = minScale + Math.random() * (maxScale - minScale);
            }
            
            // Determine rotation - more dramatic in dramatic mode
            const maxRotation = useDramaticScaling ? 45 : 20;
            const rotation = Math.random() < 0.7 ? (Math.random() - 0.5) * maxRotation : 0;
            
            // Determine preferred image index if not allowing repetition
            const preferredIndex = !allowImageRepetition ? imageSequence[i % imageSequence.length] : null;
            
            // Generate the tile with these specifications
            const tile = await this.generateTile(
                images, 
                x - (baseSize * scale / 2), // Center the tile at the determined position
                y - (baseSize * scale / 2), 
                baseSize * scale,
                preferredIndex
            );
            
            if (tile) {
                // Apply the rotation
                tile.rotation = rotation;
                
                // Set opacity based on settings
                tile.forceOpacity = useDramaticScaling ? 
                    (Math.random() < 0.3 ? 1.0 : 0.5 + Math.random() * 0.4) : // More full opacity tiles in dramatic mode
                    (0.5 + Math.random() * 0.3); // Standard range
                
                tiles.push(tile);
            }
        }
    }

    async generateFieldTiles(images, tiles, allowImageRepetition, useDramaticScaling) {
        if (!images || images.length === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate tile count with wide variation
        // More dramatic mode = fewer, larger tiles
        // Field mode = more, smaller tiles
        const minTiles = useDramaticScaling ? 25 : 40;
        const maxTiles = useDramaticScaling ? 70 : 120;
        const targetTileCount = minTiles + Math.floor(Math.random() * (maxTiles - minTiles + 1));
        
        console.log(`Target tile count: ${targetTileCount}`);
        
        // Calculate base size for tiles
        // More dramatic mode = larger base size
        const baseSizeMultiplier = useDramaticScaling ? 6 : 8;
        const baseSize = Math.min(
            this.canvas.width / (baseSizeMultiplier * dpr),
            this.canvas.height / (5 * dpr)
        );
        
        // Scale ranges with wider variation in dramatic mode
        let minScale, maxScale;
        
        if (useDramaticScaling) {
            // Dramatic scaling - greater variation
            minScale = 0.7;
            maxScale = 1.8;
        } else {
            // Uniform scaling - less variation
            minScale = 0.9;
            maxScale = 1.4;
        }
        
        // Calculate grid parameters for cell-based positioning
        const overlapFactor = useDramaticScaling ? 0.75 : 0.65; // More overlap in dramatic mode
        const numCols = Math.floor(this.canvas.width / (baseSize * overlapFactor * dpr)) + 1;
        const numRows = Math.floor(this.canvas.height / (baseSize * overlapFactor * dpr)) + 1;
        
        // Calculate target number of tiles (but never more than available spaces)
        const maxGridTiles = numCols * numRows;
        const finalTargetTiles = Math.min(targetTileCount, maxGridTiles);
        
        console.log(`Generating field with ${finalTargetTiles} tiles (${numCols}x${numRows} grid)`);
        console.log(`Base size: ${baseSize}, Scale: ${minScale}-${maxScale}`);
        
        // Calculate cell dimensions for positioning
        const effectiveWidth = this.canvas.width / dpr;
        const effectiveHeight = this.canvas.height / dpr;
        const cellWidth = effectiveWidth / (numCols - 1);
        const cellHeight = effectiveHeight / (numRows - 1);
        
        // Generate all possible positions based on the grid
        const positions = [];
        for (let row = -1; row < numRows + 1; row++) {
            for (let col = -1; col < numCols + 1; col++) {
                // Calculate base position
                const baseX = col * cellWidth;
                const baseY = row * cellHeight;
                
                // Add randomness based on scaling mode
                const jitterRange = useDramaticScaling ? 
                    Math.min(cellWidth, cellHeight) * 0.25 : // More randomness in dramatic mode
                    Math.min(cellWidth, cellHeight) * 0.15;
                    
                const x = baseX + (Math.random() - 0.5) * jitterRange;
                const y = baseY + (Math.random() - 0.5) * jitterRange;
                
                positions.push({x, y});
            }
        }
        
        // Shuffle and limit positions
        this.shuffleArray(positions);
        positions.length = Math.min(positions.length, finalTargetTiles);
        
        // Determine rotation settings
        const useRotations = Math.random() < (useDramaticScaling ? 0.9 : 0.7); // Higher chance in dramatic mode
        const maxRotation = useDramaticScaling ? 45 : 25; // More extreme rotations in dramatic mode
        
        // Prepare image selection (only matters for non-repetition mode)
        let currentImageIndex = 0;
        const uniqueImageIndices = this.shuffleArray(Array.from({length: images.length}, (_, i) => i));
        
        // Generate opacity distribution with proper variation
        const opacityDistribution = {
            // Percentage of tiles with full opacity (1.0)
            fullOpacity: useDramaticScaling ? 0.2 : 0.15,
            // Percentage of tiles with high opacity (0.7-0.9)
            highOpacity: useDramaticScaling ? 0.5 : 0.35,
            // Remaining tiles get medium opacity (0.3-0.6)
        };
        
        // Generate tiles
        let generatedTiles = 0;
        for (let i = 0; i < positions.length; i++) {
            // Stop when we've reached the target number
            if (generatedTiles >= finalTargetTiles) break;
            
            const pos = positions[i];
            
            // Determine preferred image index for non-repetition mode
            let preferredIndex = null;
            if (!allowImageRepetition) {
                // Use the next unique image
                if (currentImageIndex >= uniqueImageIndices.length) {
                    // We've used all unique images, can't add more
                    if (generatedTiles < minTiles) {
                        console.warn(`Ran out of unique images after ${generatedTiles} tiles (min: ${minTiles})`);
                    }
                    break;
                }
                preferredIndex = uniqueImageIndices[currentImageIndex++];
            }
            
            // Calculate scale with distribution based on mode
            let scale;
            if (useDramaticScaling) {
                // In dramatic mode, create more variance
                const rand = Math.random();
                if (rand < 0.3) {
                    // 30% chance for large tiles
                    scale = maxScale - Math.random() * 0.3; // 1.5-1.8
                } else if (rand < 0.6) {
                    // 30% chance for small tiles
                    scale = minScale + Math.random() * 0.2; // 0.7-0.9
                } else {
                    // 40% chance for medium tiles
                    scale = 1.0 + Math.random() * 0.3; // 1.0-1.3
                }
            } else {
                // Regular scale distribution
                scale = minScale + Math.random() * (maxScale - minScale);
            }
            
            // Calculate final size with proper scaling
            const finalSize = baseSize * scale;
            
            // Determine rotation
            const shouldRotate = useRotations && Math.random() < (useDramaticScaling ? 0.5 : 0.3);
            const rotation = shouldRotate ? (Math.random() - 0.5) * maxRotation : 0;
            
            // Generate the tile
            const tile = await this.generateTile(
                images,
                (pos.x - finalSize/2) * dpr,
                (pos.y - finalSize/2) * dpr,
                finalSize * dpr,
                preferredIndex
            );
            
            if (tile) {
                // Apply rotation
                tile.rotation = rotation;
                
                // Determine opacity based on distribution
                const opacityRand = Math.random();
                if (opacityRand < opacityDistribution.fullOpacity) {
                    tile.forceOpacity = 1.0; // Full opacity
                } else if (opacityRand < (opacityDistribution.fullOpacity + opacityDistribution.highOpacity)) {
                    tile.forceOpacity = 0.7 + Math.random() * 0.3; // High opacity (0.7-1.0)
                } else {
                    tile.forceOpacity = 0.3 + Math.random() * 0.4; // Medium opacity (0.3-0.7)
                }
                
                tiles.push(tile);
                generatedTiles++;
            }
        }
        
        // Log statistics
        console.log(`Generated ${tiles.length} field tiles (target: ${finalTargetTiles})`);
        
        // Image usage stats
        const imageStats = {
            uniqueImagesUsed: new Set([...this.imageUsageCount.entries()]
                .filter(([_, count]) => count > 0)
                .map(([idx, _]) => idx)).size,
            maxUsageCount: Math.max(...[...this.imageUsageCount.values(), 0]),
            rotationsEnabled: useRotations,
            maxRotation: maxRotation,
            totalTiles: tiles.length
        };
        
        console.log('Field tile generation stats:', imageStats);
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
}