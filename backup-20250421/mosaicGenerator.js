/**
 * MosaicGenerator class for creating mosaic-style collages
 * This class handles the generation of mosaic-style collages with various composition styles
 */
class MosaicGenerator {
    /**
     * Create a new MosaicGenerator
     * @param {HTMLCanvasElement} canvas - The canvas to draw on
     * @param {Object} parameters - Parameters for mosaic generation
     */
    constructor(canvas, parameters = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parameters = parameters;
    }

    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - The array to shuffle
     * @returns {Array} - The shuffled array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate a mosaic collage
     * @param {Array} images - Array of image objects
     * @param {Object} parameters - Parameters for mosaic generation
     * @returns {Promise<void>}
     */
    async generateMosaic(images, parameters = {}) {
        if (!images || images.length === 0) {
            console.warn('No images provided for mosaic generation');
            return [];
        }

        try {
            // Calculate grid size based on number of images and complexity
            const complexity = parameters.complexity || 0.5;
            const baseGridSize = Math.ceil(Math.sqrt(images.length));
            
            // Create more varied tile sizes
            let gridSize;
            const rand = Math.random();
            if (rand < 0.2) { // 20% chance for very large tiles
                gridSize = Math.floor(Math.random() * 2) + 2; // 2-3 rows
            } else if (rand < 0.4) { // 20% chance for large tiles
                gridSize = Math.floor(Math.random() * 2) + 4; // 4-5 rows
            } else if (rand < 0.7) { // 30% chance for medium tiles
                gridSize = Math.floor(Math.random() * 2) + 6; // 6-7 rows
            } else { // 30% chance for smaller tiles
                gridSize = Math.max(8, Math.min(10, Math.ceil(baseGridSize * (1 + complexity))));
            }
            
            // Calculate cell dimensions
            const cellWidth = this.canvas.width / gridSize;
            const cellHeight = this.canvas.height / gridSize;
            
            // Create shuffled array of image indices
            const imageIndices = this.shuffleArray([...Array(images.length).keys()]);
            let currentIndex = 0;
            
            // Determine how many tiles should have full opacity (at least 40%)
            const totalTiles = gridSize * gridSize;
            const fullOpacityCount = Math.max(1, Math.ceil(totalTiles * 0.4));
            const fullOpacityTiles = new Array(totalTiles).fill(false);
            
            // Randomly select tiles for full opacity
            for (let i = 0; i < fullOpacityCount; i++) {
                const randomIndex = Math.floor(Math.random() * totalTiles);
                fullOpacityTiles[randomIndex] = true;
            }
            
            // Determine if tiles should touch without overlap
            const tilesTouching = parameters.tilesTouching || false;
            
            // Array to store fragment information
            const fragments = [];
            
            // Apply composition style
            if (parameters.compositionStyle === 'Focal') {
                // For Focal style, create larger cells towards the center
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const x = i * cellWidth;
                        const y = j * cellHeight;
                        
                        // Calculate distance from center
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
                        
                        // Scale cell size based on distance from center
                        // If tiles are touching, use a smaller scale factor to prevent overlap
                        const scaleFactor = tilesTouching ? 0.5 : 1.0;
                        const scale = 1 + (1 - distance / maxDistance) * 0.5 * scaleFactor;
                        
                        // Select image based on repetition setting
                        let imageIndex;
                        if (parameters.allowImageRepetition) {
                            imageIndex = Math.floor(Math.random() * images.length);
                        } else {
                            imageIndex = imageIndices[currentIndex % imageIndices.length];
                            currentIndex++;
                        }
                        const image = images[imageIndex];
                        
                        // Calculate tile index for opacity assignment
                        const tileIndex = i * gridSize + j;
                        
                        // Determine opacity - at least 70% for all tiles, 100% for selected tiles
                        const opacity = fullOpacityTiles[tileIndex] ? 1.0 : 0.7 + Math.random() * 0.3;
                        
                        // Determine if this tile should show a cropped portion of the image
                        // 40% chance of showing a cropped portion
                        const showCroppedPortion = Math.random() < 0.4;
                        
                        // Calculate final position and dimensions
                        const finalX = x - (cellWidth * scale - cellWidth) / 2;
                        const finalY = y - (cellHeight * scale - cellHeight) / 2;
                        const finalWidth = cellWidth * scale;
                        const finalHeight = cellHeight * scale;
                        
                        // Draw cell with scaled dimensions and proper cropping
                        this.drawImage(
                            image,
                            finalX,
                            finalY,
                            finalWidth,
                            finalHeight,
                            true,
                            opacity,
                            showCroppedPortion
                        );
                        
                        // Store fragment information
                        fragments.push({
                            image,
                            x: finalX,
                            y: finalY,
                            width: finalWidth,
                            height: finalHeight,
                            opacity,
                            showCroppedPortion
                        });
                    }
                }
            } else {
                // For Field style, create more uniform cells with slight variations
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const x = i * cellWidth;
                        const y = j * cellHeight;
                        
                        // Add slight randomness to cell position and size
                        // If tiles are touching, use smaller offsets to prevent overlap
                        const offsetFactor = tilesTouching ? 0.05 : 0.1;
                        const offsetX = (Math.random() - 0.5) * cellWidth * offsetFactor;
                        const offsetY = (Math.random() - 0.5) * cellHeight * offsetFactor;
                        
                        // Scale factor for tile size
                        const scaleFactor = tilesTouching ? 0.2 : 0.2;
                        const scale = 1 + (Math.random() - 0.5) * scaleFactor;
                        
                        // Select image based on repetition setting
                        let imageIndex;
                        if (parameters.allowImageRepetition) {
                            imageIndex = Math.floor(Math.random() * images.length);
                        } else {
                            imageIndex = imageIndices[currentIndex % imageIndices.length];
                            currentIndex++;
                        }
                        const image = images[imageIndex];
                        
                        // Calculate tile index for opacity assignment
                        const tileIndex = i * gridSize + j;
                        
                        // Determine opacity - at least 70% for all tiles, 100% for selected tiles
                        const opacity = fullOpacityTiles[tileIndex] ? 1.0 : 0.7 + Math.random() * 0.3;
                        
                        // Determine if this tile should show a cropped portion of the image
                        // 40% chance of showing a cropped portion
                        const showCroppedPortion = Math.random() < 0.4;
                        
                        // Calculate final position and dimensions
                        const finalX = x + offsetX;
                        const finalY = y + offsetY;
                        const finalWidth = cellWidth * scale;
                        const finalHeight = cellHeight * scale;
                        
                        // Draw cell with slight variations and proper cropping
                        this.drawImage(
                            image,
                            finalX,
                            finalY,
                            finalWidth,
                            finalHeight,
                            true,
                            opacity,
                            showCroppedPortion
                        );
                        
                        // Store fragment information
                        fragments.push({
                            image,
                            x: finalX,
                            y: finalY,
                            width: finalWidth,
                            height: finalHeight,
                            opacity,
                            showCroppedPortion
                        });
                    }
                }
            }
            
            // Return the array of fragments
            return fragments;
        } catch (error) {
            console.error('Error generating mosaic:', error);
            return [];
        }
    }

    /**
     * Draw an image with optional cropping and opacity
     * @param {HTMLImageElement} image - The image to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of the destination rectangle
     * @param {number} height - Height of the destination rectangle
     * @param {boolean} crop - Whether to crop the image
     * @param {number} forceOpacity - Forced opacity value (0-1)
     * @param {boolean} showCroppedPortion - Whether to show a cropped portion
     */
    drawImage(image, x, y, width, height, crop = false, forceOpacity = null, showCroppedPortion = false) {
        if (!image || !image.complete) {
            console.warn('Invalid or incomplete image provided to drawImage');
            return;
        }

        // Save the current context state
        this.ctx.save();
        
        // Set opacity
        let finalOpacity;
        if (forceOpacity !== null && forceOpacity >= 0 && forceOpacity <= 1) {
            finalOpacity = forceOpacity;
        } else {
            // Higher default opacity range for better visibility (0.3 - 0.6)
            const baseOpacity = this.parameters.blendOpacity || 0.45;
            const opacityVariation = 0.15;
            let randomOpacity = baseOpacity + (Math.random() * 2 * opacityVariation) - opacityVariation;
            finalOpacity = Math.max(0.3, Math.min(0.6, randomOpacity));
        }
        this.ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));
        
        // Apply contrast enhancement for better visual definition
        const contrastLevel = this.parameters.contrast / 10;
        this.ctx.filter = `contrast(${1 + contrastLevel})`;

        if (crop) {
            // For mosaic tiles, ensure the image fills the entire tile
            const destRatio = width / height;
            const srcRatio = image.width / image.height;
            
            let cropWidth, cropHeight, cropX, cropY;
            
            if (showCroppedPortion) {
                // When showing a cropped portion, randomly select a portion of the image
                const cropPercentage = 0.3 + Math.random() * 0.7;
                
                if (srcRatio > destRatio) {
                    // Image is wider than destination
                    cropHeight = image.height * cropPercentage;
                    cropWidth = cropHeight * destRatio;
                    
                    // Randomly position the crop horizontally
                    const maxCropX = image.width - cropWidth;
                    cropX = Math.random() * maxCropX;
                    
                    // Center vertically
                    cropY = (image.height - cropHeight) / 2;
                } else {
                    // Image is taller than destination
                    cropWidth = image.width * cropPercentage;
                    cropHeight = cropWidth / destRatio;
                    
                    // Center horizontally
                    cropX = (image.width - cropWidth) / 2;
                    
                    // Randomly position the crop vertically
                    const maxCropY = image.height - cropHeight;
                    cropY = Math.random() * maxCropY;
                }
            } else {
                // Standard cropping to fit the tile
                if (srcRatio > destRatio) {
                    // Image is wider than destination - crop width to match aspect ratio
                    cropHeight = image.height;
                    cropWidth = cropHeight * destRatio;
                    cropX = (image.width - cropWidth) / 2;
                    cropY = 0;
                } else {
                    // Image is taller than destination - crop height to match aspect ratio
                    cropWidth = image.width;
                    cropHeight = cropWidth / destRatio;
                    cropX = 0;
                    cropY = (image.height - cropHeight) / 2;
                }
            }
            
            this.ctx.drawImage(
                image,
                cropX, cropY, cropWidth, cropHeight,  // Source crop
                x, y, width, height  // Destination
            );
        } else {
            // Calculate dimensions to preserve aspect ratio
            const srcRatio = image.width / image.height;
            const destRatio = width / height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (srcRatio > destRatio) {
                // Image is wider than destination
                drawHeight = height;
                drawWidth = drawHeight * srcRatio;
                drawX = x - (drawWidth - width) / 2;
                drawY = y;
            } else {
                // Image is taller than destination
                drawWidth = width;
                drawHeight = drawWidth / srcRatio;
                drawX = x;
                drawY = y - (drawHeight - height) / 2;
            }
            
            this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        }

        // Restore the context state
        this.ctx.restore();
    }
}

// Export the MosaicGenerator class
export { MosaicGenerator }; 