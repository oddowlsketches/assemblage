/**
 * Collage Generator for Assemblage
 * 
 * Generates artistic collages using various effects and the image collection
 */

class CollageGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.currentEffect = null;
        this.parameters = {
            complexity: 5,
            density: 5,
            contrast: 5,
            cleanTiling: false,
            blendOpacity: 0.3, // Default base opacity
            variation: null // Added variation property
        };
        
        // Composition Settings
        this.compositionTemplates = ['center', 'ruleOfThirds', 'diagonalTLBR', 'diagonalTRBL', 'goldenRatio']; // Added goldenRatio
        this.selectedTemplate = null;
        this.selectedCompositionStyle = null; // Added style property ('Focal' or 'Field')
        this.focalPoints = []; 

        // Initialize canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    setParameters(parameters) {
        this.parameters = { ...this.parameters, ...parameters };
    }
    
    generateBackgroundColor() {
        // Rich, vibrant colors that work well with multiply blend mode
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    calculateImageDimensions(image, targetWidth, targetHeight) {
        if (!image || !image.complete || image.naturalWidth === 0) {
            return null;
        }

        const imageRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;
        
        let width, height, x, y;
        
        if (imageRatio > targetRatio) {
            width = targetWidth;
            height = targetWidth / imageRatio;
            x = 0;
            y = (targetHeight - height) / 2;
        } else {
            height = targetHeight;
            width = targetHeight * imageRatio;
            x = (targetWidth - width) / 2;
            y = 0;
        }
        
        return { x, y, width, height };
    }
    
    drawImage(image, x, y, width, height, crop = false, forceOpacity = null) {
        if (!image || !image.complete || image.naturalWidth === 0) {
            return;
        }

        try {
            // Save the current context state
            this.ctx.save();
            
            // --- Opacity Calculation Update ---
            let finalOpacity;
            if (forceOpacity !== null && forceOpacity >= 0 && forceOpacity <= 1) {
                // Use forced opacity if valid - THIS IS THE INTENDED BEHAVIOR
                finalOpacity = forceOpacity;
            } else {
                // Default low opacity range calculation (0.2 - 0.4)
                const baseOpacity = this.parameters.blendOpacity || 0.3; // Use parameter or default to 0.3
                const opacityVariation = 0.1; // Allow +/- 0.1 variation around base
                let randomOpacity = baseOpacity + (Math.random() * 2 * opacityVariation) - opacityVariation;
                // Clamp the opacity to the desired 0.2 - 0.4 range (or slightly lower/higher based on base)
                finalOpacity = Math.max(0.15, Math.min(0.45, randomOpacity)); 
            }
            // Ensure opacity is clamped between 0 and 1
            this.ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));
            // --- End Opacity Calculation Update ---

            if (crop) {
                // Calculate random crop position, favoring center for larger images
                const cropWidth = image.width * 0.5;
                const cropHeight = image.height * 0.5;
                const cropX = Math.random() * (image.width - cropWidth);
                const cropY = Math.random() * (image.height - cropHeight);
                
                this.ctx.drawImage(
                    image,
                    cropX, cropY, cropWidth, cropHeight,  // Source crop
                    x, y, width, height  // Destination
                );
            } else {
                const dimensions = this.calculateImageDimensions(image, width, height);
                if (dimensions) {
                    this.ctx.drawImage(
                        image,
                        dimensions.x + x,
                        dimensions.y + y,
                        dimensions.width,
                        dimensions.height
                    );
                }
            }

            // Restore the context state
            this.ctx.restore();
        } catch (error) {
            console.warn('Error drawing image:', error);
        }
    }
    
    generate() {
        if (!this.currentEffect || this.images.length === 0) return;
        
        // Select composition style AND template BEFORE generating
        this.selectCompositionStyleAndTemplate();

        // Clear canvas and set background color
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set multiply blend mode for images
        this.ctx.globalCompositeOperation = 'multiply';

        // Generate collage based on current effect
        switch (this.currentEffect) {
            case 'mosaic':
                this.generateMosaic();
                break;
            case 'tiling':
                this.generateTiling();
                break;
            case 'warhol':
                this.generateWarhol();
                break;
            case 'fragments':
                this.generateFragments();
                break;
            case 'layers':
                this.generateLayers();
                break;
        }

        // Reset blend mode
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    generateMosaic() {
        this.ctx.globalCompositeOperation = 'multiply';
        // Use the variation specified in the parameters passed from bridge.html
        const mosaicVariation = this.parameters.variation || 'Classic'; // Default to Classic if not provided
        console.log(`Generating Mosaic - Variation: ${mosaicVariation}`);

        const cells = [];
        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        let currentIndex = 0;
        let focalCellIndex = -1; // Index of the cell designated for 100% opacity

        // --- Generate Cell Data based on Variation ---
        switch (mosaicVariation) {
            case 'Classic': {
                const gridSize = Math.max(3, Math.min(6, 3 + Math.floor(this.parameters.complexity / 2))); // Grid 3x3 to 6x6
                // Ensure precise calculation to avoid floating point gaps
                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;
                
                for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                         // Calculate exact positions and sizes
                        const cellX = Math.round((col / gridSize) * canvasWidth);
                        const cellY = Math.round((row / gridSize) * canvasHeight);
                        const nextCellX = Math.round(((col + 1) / gridSize) * canvasWidth);
                        const nextCellY = Math.round(((row + 1) / gridSize) * canvasHeight);
                        const cellWidth = nextCellX - cellX;
                        const cellHeight = nextCellY - cellY;
                        
                        cells.push({
                            x: cellX, y: cellY,
                            width: cellWidth, height: cellHeight,
                            imageIndex: imageIndices[currentIndex % imageIndices.length],
                            forceOpacity: null // Opacity assigned below
                        });
                        currentIndex++;
                    }
                }
                
                // High Opacity Distribution for Classic Mosaic
                const numCells = cells.length;
                const numFullOpacity = Math.floor(numCells * (0.5 + Math.random() * 0.2)); // 50-70% full opacity
                const indices = Array.from(cells.keys());
                this.shuffleArray(indices); // Shuffle indices to randomize opacity assignment
                
                for(let i = 0; i < numCells; i++) {
                    const cellIndex = indices[i];
                    if (i < numFullOpacity) {
                        cells[cellIndex].forceOpacity = 1.0;
                    } else {
                        // Remaining cells get 50% - 100% opacity
                        cells[cellIndex].forceOpacity = 0.5 + Math.random() * 0.5;
                    }
                }
                break;
            }

            case 'Organic': {
                const baseGridSize = Math.max(2, Math.min(4, 2 + Math.floor(this.parameters.complexity / 3))); // Base 2x2 to 4x4
                const subdivisionChance = 0.3 + (this.parameters.complexity / 20); // 30-80% chance
                const maxDepth = 2; // Limit subdivision depth
                // Reduce gaps significantly, allow tiny overlap possibility
                const gapOverlapRange = 0.01; 

                // Capture cells and currentIndex in closure for subdivideCell
                const capturedCells = cells;
                let capturedCurrentIndex = currentIndex;
                const capturedImageIndices = imageIndices;

                function subdivideCell(x, y, w, h, depth) {
                    const shouldSubdivide = depth > 0 && Math.random() < subdivisionChance;
                    
                    if (!shouldSubdivide) {
                         // Introduce minimal random gap or overlap
                        const sizeAdjust = 1 + (Math.random() * 2 - 1) * gapOverlapRange; 
                        const effectiveW = w * sizeAdjust;
                        const effectiveH = h * sizeAdjust;
                        const offsetX = (w - effectiveW) / 2;
                        const offsetY = (h - effectiveH) / 2;

                        capturedCells.push({
                            x: x + offsetX, y: y + offsetY,
                            width: effectiveW, height: effectiveH,
                            imageIndex: capturedImageIndices[capturedCurrentIndex % capturedImageIndices.length],
                            forceOpacity: null // Opacity assigned later
                        });
                        capturedCurrentIndex++;
                        return;
                    }

                    // Pass captured state down
                    if (Math.random() < 0.5) { // Horizontal split
                        const splitPoint = 0.4 + Math.random() * 0.2; // Split between 40/60 and 60/40
                        subdivideCell(x, y, w * splitPoint, h, depth - 1);
                        subdivideCell(x + w * splitPoint, y, w * (1 - splitPoint), h, depth - 1);
                    } else { // Vertical split
                        const splitPoint = 0.4 + Math.random() * 0.2;
                        subdivideCell(x, y, w, h * splitPoint, depth - 1);
                        subdivideCell(x, y + h * splitPoint, w, h * (1 - splitPoint), depth - 1);
                    }
                }

                const initialCellWidth = this.canvas.width / baseGridSize;
                const initialCellHeight = this.canvas.height / baseGridSize;
                for (let row = 0; row < baseGridSize; row++) {
                    for (let col = 0; col < baseGridSize; col++) {
                        subdivideCell(col * initialCellWidth, row * initialCellHeight, initialCellWidth, initialCellHeight, maxDepth);
                    }
                }
                currentIndex = capturedCurrentIndex; // Update main currentIndex
                
                // Organic Opacity: Pick one prominent cell for full opacity, others higher than default
                if (cells.length > 0) {
                    focalCellIndex = Math.floor(Math.random() * cells.length);
                    cells.forEach((cell, index) => {
                        if (index === focalCellIndex) {
                            cell.forceOpacity = 1.0;
                        } else {
                            // Assign 40% - 80% opacity to others
                            cell.forceOpacity = 0.4 + Math.random() * 0.4;
                        }
                    });
                } else {
                     focalCellIndex = -1; // Ensure it's -1 if no cells generated
                }
                break;
            }

             case 'Focal': {
                // Strategy: Create a main central cell, surround with smaller/subdivided cells
                const centerCellRatio = 0.4 + Math.random() * 0.2; // Central cell takes 40-60% of width/height
                const centerW = this.canvas.width * centerCellRatio;
                const centerH = this.canvas.height * centerCellRatio;
                const centerOffsetX = (this.canvas.width - centerW) / 2;
                const centerOffsetY = (this.canvas.height - centerH) / 2;
                
                // Add the main focal cell
                cells.push({
                    x: centerOffsetX, y: centerOffsetY,
                    width: centerW, height: centerH,
                    imageIndex: imageIndices[currentIndex % imageIndices.length],
                    forceOpacity: 1 // The main focal cell always has full opacity
                });
                currentIndex++;
                focalCellIndex = 0; // The first cell added is the focal one

                // Define surrounding areas (Top, Bottom, Left, Right)
                const areas = [
                    { x: 0, y: 0, w: this.canvas.width, h: centerOffsetY }, // Top
                    { x: 0, y: centerOffsetY + centerH, w: this.canvas.width, h: this.canvas.height - (centerOffsetY + centerH) }, // Bottom
                    { x: 0, y: centerOffsetY, w: centerOffsetX, h: centerH }, // Left
                    { x: centerOffsetX + centerW, y: centerOffsetY, w: this.canvas.width - (centerOffsetX + centerW), h: centerH } // Right
                ];

                const subdivisionChance = 0.4 + (this.parameters.complexity / 15); // Higher chance for focal
                const maxDepth = 2;

                function subdivideArea(x, y, w, h, depth) {
                     if (w < 50 || h < 50 || depth <= 0 || Math.random() > subdivisionChance) { // Min size or chance reached
                        if (w > 0 && h > 0) {
                             cells.push({ x, y, width: w, height: h, imageIndex: imageIndices[currentIndex % imageIndices.length], forceOpacity: null });
                             currentIndex++;
                        }
                        return;
                    }

                    if (w > h) { // Split wider areas vertically
                        const splitPoint = 0.4 + Math.random() * 0.2;
                        subdivideArea(x, y, w * splitPoint, h, depth - 1);
                        subdivideArea(x + w * splitPoint, y, w * (1 - splitPoint), h, depth - 1);
                    } else { // Split taller areas horizontally
                        const splitPoint = 0.4 + Math.random() * 0.2;
                        subdivideArea(x, y, w, h * splitPoint, depth - 1);
                        subdivideArea(x, y + h * splitPoint, w, h * (1 - splitPoint), depth - 1);
                    }
                }
                
                areas.forEach(area => {
                    if (area.w > 0 && area.h > 0) {
                        subdivideArea(area.x, area.y, area.w, area.h, maxDepth);
                    }
                });
                break;
            }
        }

        // --- Draw Cells ---
        // Optional: Shuffle cells slightly for less rigid appearance?
        // this.shuffleArray(cells); // Uncomment to shuffle draw order

        cells.forEach(cell => {
            if (currentIndex % imageIndices.length >= this.images.length) {
                 console.warn("Ran out of unique images for mosaic cells, reusing.");
                 currentIndex = 0; // Reset index if we run out (should have enough usually)
            }
            const img = this.images[cell.imageIndex];
            
            // Determine cropping based on variation
            const shouldCrop = (mosaicVariation === 'Classic');
            
            this.drawImage(img, cell.x, cell.y, cell.width, cell.height, shouldCrop, cell.forceOpacity);
        });

        this.ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    }
    
    generateTiling() {
        this.ctx.globalCompositeOperation = 'multiply';
        const isFocalStyle = this.selectedCompositionStyle === 'Focal';

        // --- Style-Specific Parameters ---
        let baseSize, minScale, maxScale, dramaticScale, overlapFactorMultiplier, sizeBiasPower, tileLimit;
        let useDramaticTile = isFocalStyle; // Only use a distinct dramatic tile in Focal style

        if (isFocalStyle) {
            // Focal Style: One large dramatic tile, smaller surrounding tiles
            baseSize = Math.max(80, this.canvas.width / (this.parameters.density + 4));
            minScale = 0.1;
            maxScale = 0.3 + (this.parameters.complexity / 10 * 2.0); // Regular max: 0.3 - 2.3
            dramaticScale = 3.0 + Math.random() * 2.0; // Dramatic: 3.0 - 5.0
            overlapFactorMultiplier = 0.8; // Less overlap overall
            sizeBiasPower = 2.5; // Strong bias towards smaller regular tiles
            tileLimit = 80; // Limit total tiles
        } else {
            // Field Style: More uniform tiles, higher density, subtle anchor
            baseSize = Math.max(70, this.canvas.width / (this.parameters.density + 1)); // Was max(60, ... / (density+2))
            minScale = 0.4 + (this.parameters.complexity / 10 * 0.4); // Min scale: 0.4 - 0.8 (less variation)
            maxScale = 0.8 + (this.parameters.complexity / 10 * 0.6); // Max scale: 0.8 - 1.4 (less variation)
            dramaticScale = maxScale * 1.1; // Anchor is only slightly larger than max regular
            overlapFactorMultiplier = 0.5; // TUNE: Significantly reduce Field overlap (was 1.2)
            sizeBiasPower = 1.0; // No bias (uniform size distribution)
            tileLimit = 70; // TUNE: Further reduce Field tile limit (was 100)
            useDramaticTile = true; // Still use one slightly larger tile as 100% opacity anchor
        }
        // --- End Style-Specific Parameters ---

        // Grid approximation (adjust based on style)
        const approxTileSize = baseSize * (isFocalStyle ? 1.0 : 0.9); // Was 0.8 for Field
        const rows = Math.ceil(this.canvas.height / approxTileSize) + 2;
        const cols = Math.ceil(this.canvas.width / approxTileSize) + 2;

        const tiles = [];
        let dramaticTileData = null; // Store data for the potential dramatic/anchor tile

        // --- Dramatic/Anchor Tile Prep ---
        if (useDramaticTile) {
            let targetFocalPos = this.getStrategicFocalPoint(); // Use for placement
            const currentDramaticScale = isFocalStyle ? dramaticScale : dramaticScale; // Use calculated scale
            const dramaticSize = baseSize * currentDramaticScale;
            
            // Position near focal point
            const offsetX = (Math.random() - 0.5) * dramaticSize * 0.3;
            const offsetY = (Math.random() - 0.5) * dramaticSize * 0.3;
            let dramaticX = targetFocalPos.x - dramaticSize / 2 + offsetX;
            let dramaticY = targetFocalPos.y - dramaticSize / 2 + offsetY;

            // Force bleed only in Focal style for the dramatic look
            if (isFocalStyle) {
                const edgeChoice = Math.random();
                if (edgeChoice < 0.25) dramaticX = -dramaticSize * (0.2 + Math.random() * 0.3); 
                else if (edgeChoice < 0.5) dramaticX = this.canvas.width - dramaticSize * (0.5 + Math.random() * 0.3); 
                else if (edgeChoice < 0.75) dramaticY = -dramaticSize * (0.2 + Math.random() * 0.3);
                else dramaticY = this.canvas.height - dramaticSize * (0.5 + Math.random() * 0.3);
            }
            
            dramaticTileData = {
                x: dramaticX, y: dramaticY,
                width: dramaticSize, height: dramaticSize,
                scale: currentDramaticScale, isDramaticCandidate: true, 
                forceOpacity: null // Initialize opacity as null
            };
            tiles.push(dramaticTileData);
        }
        // --- End Prep ---

        // Create regular tiles
        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        let currentIndex = 0;

        for (let i = -1; i < rows && tiles.length < tileLimit; i++) {
            for (let j = -1; j < cols && tiles.length < tileLimit; j++) {
                const baseX = j * approxTileSize + (Math.random() - 0.5) * approxTileSize * (isFocalStyle ? 0.8 : 0.4); // More jitter in Focal
                const baseY = i * approxTileSize + (Math.random() - 0.5) * approxTileSize * (isFocalStyle ? 0.8 : 0.4);
                
                let scale = minScale + Math.pow(Math.random(), sizeBiasPower) * (maxScale - minScale);
                const size = baseSize * scale;
                
                let distToDramatic = Infinity;
                if (dramaticTileData) {
                    distToDramatic = Math.sqrt(Math.pow(baseX + size/2 - (dramaticTileData.x + dramaticTileData.width/2), 2) + 
                                                 Math.pow(baseY + size/2 - (dramaticTileData.y + dramaticTileData.height/2), 2));
                    const dramaticInfluenceRadius = dramaticTileData.width * (isFocalStyle ? 0.6 : 0.3); // Smaller influence in Field
                    
                    // Reduce size if close to dramatic/anchor tile (more effect in Focal style)
                    if (distToDramatic < dramaticInfluenceRadius) {
                        const reductionFactor = isFocalStyle ? 0.7 : 0.9; // Aggressive reduction in Focal
                        scale *= (distToDramatic / dramaticInfluenceRadius) * reductionFactor;
                        scale = Math.max(minScale * (isFocalStyle ? 0.5 : 0.8), scale); // Allow smaller near focal in Focal style
                    }
                }
                
                const currentSize = baseSize * scale;
                const baseOverlapFactor = 0.05 + (this.parameters.density / 25); // Base overlap factor
                const overlapFactor = baseOverlapFactor * overlapFactorMultiplier; // Adjust based on style
                const overlap = currentSize * overlapFactor * (isFocalStyle ? (1 - Math.pow(distToDramatic / this.canvas.width, 0.5)) : 1.0); // Reduce overlap near dramatic only in Focal
                
                const tile = {
                    x: baseX - overlap, y: baseY - overlap,
                    width: currentSize + overlap * 2, height: currentSize + overlap * 2,
                    scale: scale, isDramaticCandidate: false,
                    forceOpacity: null // Initialize opacity as null
                };

                // Avoid placing directly on top of dramatic center (more strict in Focal)
                const centerThreshold = dramaticTileData ? dramaticTileData.width * (isFocalStyle ? 0.25 : 0.1) : 0;
                if (distToDramatic > centerThreshold) {
                    // Don't add the dramatic tile data again if it was already added
                    if (tile !== dramaticTileData) { 
                         tiles.push(tile);
                    }
                }
            }
        }

        // --- Assign Opacities Probabilistically --- 
        const targetHighOpacity = 0.30; 
        const targetFullOpacity = 0.07; 
        let assignedMainFocal = false;

        // Find and assign the main dramatic/anchor tile 1.0 opacity
        // Important: Check against the initially created dramaticTileData object if it exists
        if (dramaticTileData) {
            dramaticTileData.forceOpacity = 1.0;
            dramaticTileData.isActuallyDramatic = true;
            assignedMainFocal = true;
            // Ensure the object in the array also gets updated if it's the same
            const tileInArray = tiles.find(t => t === dramaticTileData);
            if(tileInArray) { // Should always be true if dramaticTileData was added
                 tileInArray.forceOpacity = 1.0;
                 tileInArray.isActuallyDramatic = true;
            }
        }
        
        // Fallback if dramatic/anchor tile wasn't added or assigned
        if (!assignedMainFocal && tiles.length > 0) {
            const forcedFocalIndex = Math.floor(Math.random() * tiles.length);
            tiles[forcedFocalIndex].forceOpacity = 1.0;
            tiles[forcedFocalIndex].isActuallyDramatic = true;
            console.warn("Tiling: Had to force assign a 1.0 opacity tile.");
        }

        // Assign opacity to other tiles (that aren't the main focal)
        tiles.forEach(tile => {
            if (tile.isDramaticCandidate) return; // Skip the main one already assigned

            const rand = Math.random();
            if (rand < targetFullOpacity) {
                tile.forceOpacity = 1.0;
            } else if (rand < targetHighOpacity) {
                tile.forceOpacity = 0.5 + Math.random() * 0.3; 
            } else {
                tile.forceOpacity = null; // Default low opacity
            }
            // Ensure non-focal tiles have isActuallyDramatic set to false
            tile.isDramaticCandidate = false; 
        });
        // --- End Opacity Assignment --- 
        
        // Sort tiles: actual dramatic/anchor first, then by scale
        tiles.sort((a, b) => {
            // Use the definitive isActuallyDramatic flag for sorting
            if (a.isActuallyDramatic && !b.isActuallyDramatic) return -1; 
            if (!a.isActuallyDramatic && b.isActuallyDramatic) return 1;
            return b.scale - a.scale;
        });

        // Draw tiles
        tiles.forEach(tile => {
            // Image assignment logic (remains largely the same)
            let imageIndex;
            if(tile.isDramaticCandidate && this.images.length > tiles.length) {
                 const usedIndices = tiles.filter(t => !t.isDramaticCandidate).map(t => t.assignedImageIndex).filter(idx => idx !== undefined);
                 let potentialIndex = Math.floor(Math.random() * this.images.length);
                 let attempts = 0;
                 while(usedIndices.includes(potentialIndex) && attempts < this.images.length) {
                     potentialIndex = (potentialIndex + 1) % this.images.length; attempts++;
                 }
                 imageIndex = potentialIndex;
            } else {
                 imageIndex = imageIndices[currentIndex % imageIndices.length]; currentIndex++;
                 tile.assignedImageIndex = imageIndex;
            }
            const image = this.images[imageIndex];

            if (image && image.complete && image.naturalWidth > 0) {
                this.ctx.save();
                const contrast = 1 + (this.parameters.contrast / 10);
                this.ctx.filter = `contrast(${contrast})`;
                
                const shouldRotate = tile.isActuallyDramatic ? false : Math.random() < (isFocalStyle ? 0.1 : 0.05);
                if (shouldRotate) {
                    const rotation = Math.random() * (isFocalStyle ? 60 : 20) - (isFocalStyle ? 30 : 10);
                    this.ctx.translate(tile.x + tile.width/2, tile.y + tile.height/2);
                    this.ctx.rotate(rotation * Math.PI / 180);
                    this.drawImage(image, -tile.width/2, -tile.height/2, tile.width, tile.height, false, tile.forceOpacity);
                } else {
                    this.drawImage(image, tile.x, tile.y, tile.width, tile.height, false, tile.forceOpacity);
                }
                this.ctx.restore();
            }
        });
    }
    
    generateWarhol() {
        const gridSize = Math.max(2, Math.min(4, Math.floor(this.parameters.complexity / 2)));
        const tileWidth = this.canvas.width / gridSize;
        const tileHeight = this.canvas.height / gridSize;

        // Select a few base images for repetition
        const baseImages = Array(3).fill().map(() => 
            this.images[Math.floor(Math.random() * this.images.length)]
        );

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const baseImage = baseImages[Math.floor(Math.random() * baseImages.length)];
                
                this.ctx.save();
                
                // Apply different filters based on position
                const filters = [
                    `hue-rotate(${Math.random() * 360}deg) saturate(${this.parameters.contrast})`,
                    'invert(1) contrast(1.2)',
                    'grayscale(1) contrast(1.5)',
                    'sepia(1) saturate(1.5)',
                    'brightness(1.2) contrast(1.2)'
                ];
                this.ctx.filter = filters[Math.floor(Math.random() * filters.length)];
                
                this.drawImage(
                    baseImage,
                    i * tileWidth,
                    j * tileHeight,
                    tileWidth,
                    tileHeight
                );
                
                this.ctx.restore();
            }
        }
    }
    
    generateFragments() {
        this.ctx.globalCompositeOperation = 'multiply';
        const isFocalStyle = this.selectedCompositionStyle === 'Focal';

        // --- Style-Specific Parameters ---
        let fragmentCount, baseMinSize, baseMaxSize, focalPointSizeMultiplier, negativeSpaceMultiplier;
        let targetFocalPos = null;
        let focalIndex = -1;

        if (isFocalStyle) {
            // Focal Style: Fewer, larger fragments, one prominent focal point
            fragmentCount = Math.max(3, Math.floor(this.parameters.complexity * 1.2)) + 2; 
            baseMinSize = Math.max(100, this.canvas.width / (this.parameters.density + 4)); // Increased minimum size
            baseMaxSize = Math.min(450, this.canvas.width / (this.parameters.density + 0.5)); 
            focalPointSizeMultiplier = 1.3; 
            negativeSpaceMultiplier = 1.8; 
            focalIndex = Math.floor(Math.random() * fragmentCount); 
            targetFocalPos = this.getStrategicFocalPoint(); 

        } else {
            // Field Style: More, smaller, evenly distributed fragments
            fragmentCount = Math.max(15, Math.floor(this.parameters.complexity * 3)); // Increased minimum count
            baseMinSize = Math.max(80, this.canvas.width / (this.parameters.density + 6)); // Increased minimum size
            // Increased Field max size for more variance
            baseMaxSize = Math.min(300, this.canvas.width / (this.parameters.density + 2)); 
            focalPointSizeMultiplier = 1.15; // Slightly larger anchor
            negativeSpaceMultiplier = 1.0; 
            focalIndex = Math.floor(Math.random() * fragmentCount); 
        }
        // --- End Style-Specific Parameters ---

        // --- Grid-based Occupancy System ---
        // Create a grid to track coverage
        const gridSize = 10; // 10x10 grid for tracking coverage
        const gridCellWidth = this.canvas.width / gridSize;
        const gridCellHeight = this.canvas.height / gridSize;
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        
        // Function to calculate grid cells covered by a fragment
        const getCoveredGridCells = (x, y, size) => {
            const cells = [];
            // Calculate grid cells that would be covered by this fragment
            const minX = Math.max(0, Math.floor((x - size/2) / gridCellWidth));
            const maxX = Math.min(gridSize - 1, Math.floor((x + size/2) / gridCellWidth));
            const minY = Math.max(0, Math.floor((y - size/2) / gridCellHeight));
            const maxY = Math.min(gridSize - 1, Math.floor((y + size/2) / gridCellHeight));
            
            for (let i = minX; i <= maxX; i++) {
                for (let j = minY; j <= maxY; j++) {
                    cells.push({x: i, y: j});
                }
            }
            return cells;
        };
        
        // Function to calculate coverage percentage
        const calculateCoverage = () => {
            let coveredCells = 0;
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    if (grid[i][j] > 0) coveredCells++;
                }
            }
            return (coveredCells / (gridSize * gridSize)) * 100;
        };
        
        // Function to mark grid cells as covered
        const markGridCells = (cells, value) => {
            cells.forEach(cell => {
                grid[cell.x][cell.y] = value;
            });
        };
        // --- End Grid-based Occupancy System ---

        const fragments = [];
        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        let currentIndex = 0;
        const focalFragmentIndex = focalIndex; // Store the initially determined focal index

        // --- Generate Initial Fragments ---
        // First, add 2-3 larger fragments to ensure good coverage
        const largeFragmentCount = Math.min(3, Math.max(2, Math.floor(fragmentCount * 0.2)));
        for (let i = 0; i < largeFragmentCount; i++) {
            const imageIndex = imageIndices[currentIndex % imageIndices.length];
            const image = this.images[imageIndex];
            currentIndex++;
            if (!image || !image.complete || image.naturalWidth === 0) continue;

            // Create larger fragments
            const isFocalCandidate = (i === 0 && focalFragmentIndex === 0);
            let fragmentSize = baseMaxSize * 0.8 + Math.random() * (baseMaxSize * 0.2); // 80-100% of max size
            let targetX, targetY;

            if (isFocalStyle && isFocalCandidate) {
                // Focal Style: Place focal near strategic point
                fragmentSize *= focalPointSizeMultiplier;
                targetX = targetFocalPos.x + (Math.random() - 0.5) * (fragmentSize * 0.2);
                targetY = targetFocalPos.y + (Math.random() - 0.5) * (fragmentSize * 0.2);
            } else {
                // Place in a strategic position to ensure coverage
                if (i === 0) {
                    // First large fragment near center
                    targetX = this.canvas.width * 0.5 + (Math.random() - 0.5) * this.canvas.width * 0.3;
                    targetY = this.canvas.height * 0.5 + (Math.random() - 0.5) * this.canvas.height * 0.3;
                } else if (i === 1) {
                    // Second large fragment in one of the quadrants
                    const quadrant = Math.floor(Math.random() * 4);
                    const offsetX = (quadrant % 2 === 0) ? 0.25 : 0.75;
                    const offsetY = (quadrant < 2) ? 0.25 : 0.75;
                    targetX = this.canvas.width * offsetX + (Math.random() - 0.5) * this.canvas.width * 0.2;
                    targetY = this.canvas.height * offsetY + (Math.random() - 0.5) * this.canvas.height * 0.2;
                } else {
                    // Third large fragment in a different quadrant
                    const quadrant = Math.floor(Math.random() * 4);
                    const offsetX = (quadrant % 2 === 0) ? 0.25 : 0.75;
                    const offsetY = (quadrant < 2) ? 0.25 : 0.75;
                    targetX = this.canvas.width * offsetX + (Math.random() - 0.5) * this.canvas.width * 0.2;
                    targetY = this.canvas.height * offsetY + (Math.random() - 0.5) * this.canvas.height * 0.2;
                }
            }
            
            const cropProbability = isFocalStyle ? 0.2 : 0.1; 

            fragments.push({
                image: image,
                x: targetX, y: targetY,
                size: fragmentSize,
                isFocalCandidate: isFocalCandidate,
                rotation: Math.random() * (isFocalStyle ? 90 : 40) - (isFocalStyle ? 45 : 20), 
                crop: Math.random() < cropProbability, 
                forceOpacity: null
            });
        }

        // Then add the remaining fragments
        for (let i = largeFragmentCount; i < fragmentCount; i++) {
            const imageIndex = imageIndices[currentIndex % imageIndices.length];
            const image = this.images[imageIndex];
            currentIndex++;
            if (!image || !image.complete || image.naturalWidth === 0) continue;

            const isFocalCandidate = (i === focalFragmentIndex);
            let fragmentSize = baseMinSize + Math.random() * (baseMaxSize - baseMinSize);
            let targetX, targetY;

            if (isFocalStyle && isFocalCandidate) {
                // Focal Style: Place focal near strategic point
                fragmentSize *= focalPointSizeMultiplier;
                targetX = targetFocalPos.x + (Math.random() - 0.5) * (fragmentSize * 0.2);
                targetY = targetFocalPos.y + (Math.random() - 0.5) * (fragmentSize * 0.2);
            } else if (isFocalStyle && !isFocalCandidate) {
                // Focal Style: Place others further away, creating space
                const angle = Math.random() * Math.PI * 2;
                const radius = fragmentSize * 1.5 + Math.random() * (this.canvas.width * 0.5); // Ensure space
                targetX = targetFocalPos.x + Math.cos(angle) * radius;
                targetY = targetFocalPos.y + Math.sin(angle) * radius;
            } else {
                // Field Style (or non-focal in Field style): More even distribution
                if (isFocalCandidate) fragmentSize *= focalPointSizeMultiplier; // Subtle size increase for anchor
                
                // Find areas with less coverage
                let bestX = Math.random() * this.canvas.width;
                let bestY = Math.random() * this.canvas.height;
                let minCoverage = Infinity;
                
                // Try 5 random positions and pick the one with least coverage
                for (let attempt = 0; attempt < 5; attempt++) {
                    const testX = Math.random() * this.canvas.width;
                    const testY = Math.random() * this.canvas.height;
                    const cells = getCoveredGridCells(testX, testY, fragmentSize);
                    
                    // Calculate average coverage in these cells
                    let totalCoverage = 0;
                    cells.forEach(cell => {
                        totalCoverage += grid[cell.x][cell.y];
                    });
                    const avgCoverage = totalCoverage / cells.length;
                    
                    if (avgCoverage < minCoverage) {
                        minCoverage = avgCoverage;
                        bestX = testX;
                        bestY = testY;
                    }
                }
                
                targetX = bestX;
                targetY = bestY;
            }
            
            // Clamp fragment size (use general max possible)
            const overallMaxSize = isFocalStyle ? baseMaxSize * focalPointSizeMultiplier : baseMaxSize * focalPointSizeMultiplier;
            // Increase minimum effective size slightly in Focal style
            const minSizeClampFactor = isFocalStyle ? 0.8 : 0.5;
            fragmentSize = Math.max(baseMinSize * minSizeClampFactor, Math.min(overallMaxSize, fragmentSize));
            
            const cropProbability = isFocalStyle ? 0.2 : 0.1; 

            fragments.push({
                image: image,
                x: targetX, y: targetY,
                size: fragmentSize,
                isFocalCandidate: isFocalCandidate,
                rotation: Math.random() * (isFocalStyle ? 90 : 40) - (isFocalStyle ? 45 : 20), 
                crop: Math.random() < cropProbability, 
                forceOpacity: null
            });
        }
        
        // --- Assign Opacities Probabilistically --- 
        const targetHighOpacity = 0.30; // Target ~30% >= 0.5 opacity (includes 1.0)
        const targetFullOpacity = 0.07; // Target ~7% == 1.0 opacity 
        let actualFullOpacityCount = 0;

        // Ensure the main focal fragment gets 1.0 opacity
        if (focalFragmentIndex >= 0 && focalFragmentIndex < fragments.length) {
            fragments[focalFragmentIndex].forceOpacity = 1.0;
            fragments[focalFragmentIndex].isActuallyFocal = true; // Confirm it's the main one
            actualFullOpacityCount = 1;
        }

        // Assign opacity to other fragments
        fragments.forEach((frag, index) => {
            if (index === focalFragmentIndex) return; // Skip the main focal one

            const rand = Math.random();
            if (rand < targetFullOpacity) {
                frag.forceOpacity = 1.0;
                actualFullOpacityCount++;
            } else if (rand < targetHighOpacity) {
                frag.forceOpacity = 0.5 + Math.random() * 0.3; // Range 0.5 - 0.8
            } else {
                frag.forceOpacity = null; // Will default to 0.2 - 0.4 in drawImage
            }
            frag.isActuallyFocal = false; 
        });
        // --- End Opacity Assignment --- 

        // --- Drawing with Spacing and Coverage Tracking --- 
        const drawnAreas = [];
        // Sort the actual focal fragment last for drawing on top
        fragments.sort((a, b) => a.isActuallyFocal ? 1 : (b.isActuallyFocal ? -1 : 0)); 
        
        // First pass: Draw all fragments and track coverage
        fragments.forEach(frag => {
            let placed = false;
            let attempts = 0;
            let currentX = frag.x;
            let currentY = frag.y;

            // Attempt to place, applying spacing logic (more stringent in Focal style)
            while (!placed && attempts < 20) {
                let hasOverlap = false;
                const spacingFactor = isFocalStyle ? (frag.isActuallyFocal ? negativeSpaceMultiplier : 1.0) : 0.5; // Extra space for focal in Focal, less needed in Field
                const requiredSpacing = frag.size * 0.1 * spacingFactor; 
                
                for(const area of drawnAreas) {
                    const dist = Math.sqrt(Math.pow(currentX - area.x, 2) + Math.pow(currentY - area.y, 2));
                    const areaSpacingFactor = isFocalStyle ? (area.isActuallyFocal ? negativeSpaceMultiplier : 1.0) : 0.5;
                    const areaRequiredSpacing = area.size * 0.1 * areaSpacingFactor;
                    const minDist = (frag.size + area.size) / 2 + requiredSpacing + areaRequiredSpacing;
                    
                    if (dist < minDist) {
                        hasOverlap = true;
                        break;
                    }
                }

                if (!hasOverlap) {
                    placed = true;
                } else {
                    // Nudge position slightly if overlapping
                    currentX += (Math.random() - 0.5) * (isFocalStyle ? 20 : 10); // Less nudging in Field
                    currentY += (Math.random() - 0.5) * (isFocalStyle ? 20 : 10);
                    attempts++;
                }
            }
            
            // Draw if placed (or if max attempts reached - place anyway in Field style)
            if(placed || (!isFocalStyle && attempts >= 20)) {
                this.ctx.save();
                const contrast = 1 + (this.parameters.contrast / 10);
                this.ctx.filter = `contrast(${contrast})`;
                this.ctx.translate(currentX, currentY); // Translate to final center position
                this.ctx.rotate(frag.rotation * Math.PI / 180);
                
                this.drawImage(
                    frag.image,
                    -frag.size / 2, -frag.size / 2,
                    frag.size, frag.size,
                    frag.crop,
                    frag.forceOpacity // Use the assigned opacity
                );
                
                this.ctx.restore();
                
                // Track the drawn area
                drawnAreas.push({ x: currentX, y: currentY, size: frag.size, isActuallyFocal: frag.isActuallyFocal }); 
                
                // Update grid coverage
                const coveredCells = getCoveredGridCells(currentX, currentY, frag.size);
                markGridCells(coveredCells, 1);
            }
        });
        
        // Calculate coverage after initial drawing
        let coverage = calculateCoverage();
        console.log(`Initial fragment coverage: ${coverage.toFixed(2)}%`);
        
        // If coverage is below 30%, add more fragments until we reach the minimum
        const MIN_COVERAGE = 30; // Minimum 30% coverage
        let additionalFragmentsAdded = 0;
        const MAX_ADDITIONAL_FRAGMENTS = 10; // Limit to prevent infinite loops
        
        while (coverage < MIN_COVERAGE && additionalFragmentsAdded < MAX_ADDITIONAL_FRAGMENTS) {
            // Find areas with least coverage
            let bestX = 0, bestY = 0;
            let minCoverage = Infinity;
            
            // Check each grid cell
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    if (grid[i][j] < minCoverage) {
                        minCoverage = grid[i][j];
                        bestX = (i + 0.5) * gridCellWidth;
                        bestY = (j + 0.5) * gridCellHeight;
                    }
                }
            }
            
            // Create a new fragment in the area with least coverage
            const imageIndex = imageIndices[currentIndex % imageIndices.length];
            const image = this.images[imageIndex];
            currentIndex++;
            
            if (image && image.complete && image.naturalWidth > 0) {
                // Determine size based on coverage needs
                const fragmentSize = baseMinSize * 1.2 + Math.random() * (baseMaxSize * 0.5 - baseMinSize);
                
                // Create and draw the additional fragment
                this.ctx.save();
                const contrast = 1 + (this.parameters.contrast / 10);
                this.ctx.filter = `contrast(${contrast})`;
                this.ctx.translate(bestX, bestY);
                const rotation = Math.random() * 360 - 180;
                this.ctx.rotate(rotation * Math.PI / 180);
                
                this.drawImage(
                    image,
                    -fragmentSize / 2, -fragmentSize / 2,
                    fragmentSize, fragmentSize,
                    Math.random() < 0.2, // 20% chance of cropping
                    0.5 + Math.random() * 0.5 // Higher opacity for additional fragments
                );
                
                this.ctx.restore();
                
                // Update grid coverage
                const coveredCells = getCoveredGridCells(bestX, bestY, fragmentSize);
                markGridCells(coveredCells, 1);
                
                // Recalculate coverage
                coverage = calculateCoverage();
                additionalFragmentsAdded++;
                
                console.log(`Added fragment #${additionalFragmentsAdded}, new coverage: ${coverage.toFixed(2)}%`);
            }
        }
        
        // Final coverage check
        console.log(`Final fragment coverage: ${coverage.toFixed(2)}%`);
    }

    // Helper to get a strategic focal point (Rule of Thirds / Golden Ratio preferred)
    getStrategicFocalPoint() {
        let strategicPoints = this.focalPoints.filter(p => 
            this.selectedTemplate === 'ruleOfThirds' || this.selectedTemplate === 'goldenRatio'
        );
        if (strategicPoints.length > 0) {
            return strategicPoints[Math.floor(Math.random() * strategicPoints.length)];
        } else if (this.focalPoints.length > 0) {
            // Fallback to any focal point if no thirds/GR points found
            return this.focalPoints[Math.floor(Math.random() * this.focalPoints.length)];
        } else {
            // Absolute fallback to center
            return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        }
    }
    
    generateLayers() {
        this.ctx.globalCompositeOperation = 'multiply';
        const isFocalStyle = this.selectedCompositionStyle === 'Focal';

        // --- Style-Specific Parameters ---
        // let layerCount, baseScale, scaleVariation, flowStrengthMultiplier, focalScaleBoost;
        // let focalLayerIndex = -1;
        
        // --- NEW: Calculate Layer Count (2-4 layers) --- 
        // Complexity slightly influences, but clamped
        const baseLayerCalc = 2 + Math.floor(this.parameters.complexity / 4); // e.g., complexity 0->2, 5->3, 10->4
        const layerCount = Math.max(2, Math.min(4, baseLayerCalc));
        // --- End Layer Count Calculation ---
        
        let baseScale, scaleVariation, flowStrengthMultiplier, focalScaleBoost;
        let focalLayerIndex = -1;

        if (isFocalStyle) {
            // Focal Style: Parameters adjusted for fewer layers
            // layerCount = Math.max(3, Math.floor(this.parameters.complexity / 1.8)) + 1; // REMOVED
            baseScale = 1.0; 
            scaleVariation = 0.5 + this.parameters.complexity * 0.1; 
            flowStrengthMultiplier = 1.0; 
            focalScaleBoost = 1.2; 
            // Select focal from available layers (0 or 1 if count is 2, etc.)
            focalLayerIndex = Math.floor(Math.random() * layerCount);
        } else {
            // Field Style: Parameters adjusted for fewer layers
            // layerCount = Math.max(5, Math.floor(this.parameters.complexity / 1.2)) + 2; // REMOVED
            baseScale = 1.1; // Keep slightly larger base for overlap
            scaleVariation = 0.1 + this.parameters.complexity * 0.03; // Even less variation for Field (0.1 - 0.25)
            flowStrengthMultiplier = 0.5; 
            focalScaleBoost = 1.02; 
            focalLayerIndex = Math.floor(Math.random() * layerCount);
        }
        // --- End Style-Specific Parameters ---

        // Composition flow logic (adjust strength based on style)
        const primaryFocalPoint = this.getStrategicFocalPoint();
        let flowX = 0, flowY = 0;
        const baseFlowStrength = 0.15 * (this.parameters.complexity / 10);
        const flowStrength = baseFlowStrength * flowStrengthMultiplier;
        switch (this.selectedTemplate) {
            case 'diagonalTLBR': flowX = flowStrength; flowY = flowStrength; break;
            case 'diagonalTRBL': flowX = -flowStrength; flowY = flowStrength; break;
            case 'ruleOfThirds': 
            case 'goldenRatio': // Flow away from strategic point
                flowX = (this.canvas.width/2 - primaryFocalPoint.x) / this.canvas.width * flowStrength * 2;
                flowY = (this.canvas.height/2 - primaryFocalPoint.y) / this.canvas.height * flowStrength * 2;
                break;
        }

        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        let currentIndex = 0;

        const layers = [];
        // Generate layer data (WITHOUT forceOpacity initially)
        for (let i = 0; i < layerCount; i++) {
            const imageIndex = imageIndices[currentIndex % imageIndices.length];
            const image = this.images[imageIndex];
            currentIndex++;
            if (!image || !image.complete || image.naturalWidth === 0) continue;

            const isFocalCandidate = (i === focalLayerIndex);
            let scale = baseScale + Math.random() * scaleVariation;
            if(isFocalCandidate) {
                 scale *= focalScaleBoost;
            }
            
            // Determine position 
            const baseOffsetX = (Math.random() - 0.5) * this.canvas.width * (isFocalStyle ? 0.05 : 0.02); // Less offset in Field
            const baseOffsetY = (Math.random() - 0.5) * this.canvas.height * (isFocalStyle ? 0.05 : 0.02);
            const cumulativeFlowX = flowX * i * this.canvas.width;
            const cumulativeFlowY = flowY * i * this.canvas.height;
            
            let x = (this.canvas.width * (1 - scale)) / 2 + baseOffsetX + cumulativeFlowX;
            let y = (this.canvas.height * (1 - scale)) / 2 + baseOffsetY + cumulativeFlowY;
            
            // Nudge focal layer towards strategic point only in Focal style
            if (isFocalStyle && isFocalCandidate) {
                 x += (primaryFocalPoint.x - x) * 0.1;
                 y += (primaryFocalPoint.y - y) * 0.1;
            }
            
            layers.push({ 
                image, x, y, scale, 
                isFocalCandidate: isFocalCandidate, 
                forceOpacity: null // Initialize opacity as null
            });
        }
        
        // --- Assign Opacities Probabilistically --- 
        const targetHighOpacity = 0.25; // TUNE: Reduced target for high opacity (was 0.30)
        const targetFullOpacity = 0.07; 
        let assignedMainFocal = false;

        // Assign 1.0 opacity to the designated focal layer
        if (focalLayerIndex >= 0 && focalLayerIndex < layers.length) {
            layers[focalLayerIndex].forceOpacity = 1.0;
            layers[focalLayerIndex].isActuallyFocal = true;
            assignedMainFocal = true;
        }
         // Add fallback if needed (less likely here but good practice)
        if (!assignedMainFocal && layers.length > 0) {
            const forcedFocalIndex = Math.floor(Math.random() * layers.length);
            layers[forcedFocalIndex].forceOpacity = 1.0;
            layers[forcedFocalIndex].isActuallyFocal = true;
            console.warn("Layers: Had to force assign a 1.0 opacity layer.");
        }

        // Assign opacity to other layers
        layers.forEach((layer, index) => {
            if (layer.isActuallyFocal) return; // Skip the main one

            const rand = Math.random();
            if (rand < targetFullOpacity) {
                layer.forceOpacity = 1.0;
            } else if (rand < targetHighOpacity) {
                layer.forceOpacity = 0.5 + Math.random() * 0.3; // Range 0.5 - 0.8
            } else {
                layer.forceOpacity = null; // Default low opacity
            }
             layer.isActuallyFocal = false; 
        });
        // --- End Opacity Assignment --- 
        
        // Sort layers: primarily by actual focal status, then scale
        layers.sort((a, b) => {
            if (a.isActuallyFocal && !b.isActuallyFocal) return 1; // Focal drawn last
            if (!a.isActuallyFocal && b.isActuallyFocal) return -1;
            return a.scale - b.scale; // Smaller scales drawn first (underneath)
        });

        // --- Drawing Layers --- 
        layers.forEach((layer) => {
            const { image, x, y, scale, forceOpacity } = layer;
            this.ctx.save();
            const contrast = 1 + (this.parameters.contrast / 10);
            // TUNE: Slightly increased brightness (was 0.95)
            this.ctx.filter = `contrast(${contrast}) brightness(0.98)`; 
            const dimensions = this.calculateImageDimensions(image, this.canvas.width * scale, this.canvas.height * scale);
            if (dimensions) {
                this.drawImage(image, dimensions.x + x, dimensions.y + y, dimensions.width, dimensions.height, false, forceOpacity);
            }
            this.ctx.restore();
        });
    }
    
    save() {
        const link = document.createElement('a');
        link.download = 'assemblage-collage.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Selects a random composition style and template, then calculates focal points.
     */
    selectCompositionStyleAndTemplate() {
        // Select Style (40% Focal, 60% Field)
        this.selectedCompositionStyle = Math.random() < 0.4 ? 'Focal' : 'Field';
        
        // Select Template (used primarily for Focal, less so for Field)
        this.selectedTemplate = this.compositionTemplates[Math.floor(Math.random() * this.compositionTemplates.length)];
        
        // Calculate focal points based on the template
        this.focalPoints = this.getFocalPoints(this.selectedTemplate);
        
        console.log(`Selected Style: ${this.selectedCompositionStyle}, Template: ${this.selectedTemplate}`, this.focalPoints); // For debugging
    }

    /**
     * Calculates focal points based on the selected template.
     * @param {string} template - The name of the selected composition template.
     * @returns {Array<object>} An array of {x, y} coordinates for focal points.
     */
    getFocalPoints(template) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const points = [];
        const GR = 1.61803398875; // Golden Ratio

        switch(template) {
            case 'center':
                points.push({ x: w / 2, y: h / 2 });
                break;
            case 'ruleOfThirds':
                const thirdW = w / 3;
                const thirdH = h / 3;
                points.push({ x: thirdW, y: thirdH });      
                points.push({ x: 2 * thirdW, y: thirdH });  
                points.push({ x: thirdW, y: 2 * thirdH });  
                points.push({ x: 2 * thirdW, y: 2 * thirdH });
                break;
            case 'diagonalTLBR': 
                 points.push({ x: w * 0.25, y: h * 0.25 });
                 points.push({ x: w * 0.5, y: h * 0.5 });
                 points.push({ x: w * 0.75, y: h * 0.75 });
                 break;
            case 'diagonalTRBL': 
                 points.push({ x: w * 0.75, y: h * 0.25 });
                 points.push({ x: w * 0.5, y: h * 0.5 });
                 points.push({ x: w * 0.25, y: h * 0.75 });
                 break;
            case 'goldenRatio':
                const grX1 = w / (GR * GR);
                const grX2 = w / GR;
                const grY1 = h / (GR * GR);
                const grY2 = h / GR;
                points.push({ x: grX1, y: grY1 }); // Top-Left Inner
                points.push({ x: grX2, y: grY1 }); // Top-Right Inner
                points.push({ x: grX1, y: grY2 }); // Bottom-Left Inner
                points.push({ x: grX2, y: grY2 }); // Bottom-Right Inner
                // Add outer points as well for more options
                points.push({ x: w - grX2, y: h - grY2 }); // Mirrored Bottom-Right 
                points.push({ x: w - grX1, y: h - grY2 }); // Mirrored Bottom-Left
                points.push({ x: w - grX2, y: h - grY1 }); // Mirrored Top-Right
                points.push({ x: w - grX1, y: h - grY1 }); // Mirrored Top-Left
                break;
            default: 
                 points.push({ x: w / 2, y: h / 2 });
        }
        // Add center point as a fallback if no others exist
        if (points.length === 0) {
             points.push({ x: w / 2, y: h / 2 });
        }
        return points;
    }

    // Helper function to shuffle arrays (used in multiple effects)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

export default CollageGenerator; 