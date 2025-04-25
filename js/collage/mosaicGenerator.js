/**
 * MosaicGenerator class for creating mosaic-style collages
 * This class handles the generation of mosaic-style collages with various composition styles
 */
export class MosaicGenerator {
    /**
     * Create a new MosaicGenerator
     * @param {HTMLCanvasElement} canvas - The canvas to draw on
     * @param {Object} parameters - Parameters for mosaic generation
     */
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.parameters = {};
    }

    generateBackgroundColor() {
        // Use the same background color set as the original app
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Generate a mosaic collage
     * @param {Array} images - Array of image objects
     * @param {Object} parameters - Parameters for mosaic generation
     * @returns {Promise<void>}
     */
    async generateMosaic(images, fortuneText, parameters = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided for mosaic generation');
            return [];
        }

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
        if (validImages.length === 0) {
            console.warn('No valid images found for mosaic generation');
            return [];
        }

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate grid dimensions based on complexity and number of images
        const complexity = parameters.complexity || 0.5;
        
        // Ensure we don't create more cells than we have images
        const maxGridSize = Math.ceil(Math.sqrt(validImages.length));
        const baseGridSize = Math.max(2, Math.min(maxGridSize, Math.ceil(Math.sqrt(validImages.length * complexity))));
        
        // Add some randomness to grid dimensions while maintaining roughly the same area
        let gridCols = baseGridSize;
        let gridRows = baseGridSize;
        
        if (Math.random() < 0.5) {
            // Randomly adjust grid to be more rectangular
            const adjustment = Math.random() < 0.5 ? 1 : -1;
            gridCols += adjustment;
            gridRows -= adjustment;
        }

        // Ensure we don't create more cells than we have images
        const totalCells = gridRows * gridCols;
        if (totalCells > validImages.length) {
            // Reduce grid size to match available images
            const ratio = Math.sqrt(validImages.length / totalCells);
            gridCols = Math.max(1, Math.floor(gridCols * ratio));
            gridRows = Math.max(1, Math.floor(gridRows * ratio));
        }

        // Calculate cell dimensions
        const cellWidth = this.canvas.width / gridCols;
        const cellHeight = this.canvas.height / gridRows;

        // Create shuffled array of image indices
        const imageIndices = Array.from({ length: validImages.length }, (_, i) => i);
        for (let i = imageIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [imageIndices[i], imageIndices[j]] = [imageIndices[j], imageIndices[i]];
        }

        // Generate tiles
        const tiles = [];
        const numFullOpacity = Math.ceil(gridRows * gridCols * 0.4); // 40% of tiles will have full opacity

        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const index = row * gridCols + col;
                if (index >= validImages.length) break;

                const imageIndex = imageIndices[index % validImages.length];
                const image = validImages[imageIndex];

                // Calculate position with slight overlap
                const overlap = 0.1; // 10% overlap
                const x = col * cellWidth * (1 - overlap);
                const y = row * cellHeight * (1 - overlap);
                const width = cellWidth * (1 + overlap);
                const height = cellHeight * (1 + overlap);

                // Determine if this tile should have full opacity
                const isFullOpacity = index < numFullOpacity;
                const opacity = isFullOpacity ? 1 : 0.3 + Math.random() * 0.4;

                // Add subtle rotation
                const rotation = Math.random() < 0.3 ? (Math.random() - 0.5) * 0.1 : 0;

                const tile = {
                    image,
                    x,
                    y,
                    width,
                    height,
                    opacity,
                    rotation,
                    blendMode: this.selectBlendMode(index / (gridRows * gridCols))
                };

                tiles.push(tile);
            }
        }

        // Draw tiles
        tiles.forEach(tile => this.drawTile(tile));

        return tiles;
    }

    selectBlendMode(depthIndex) {
        const blendModes = [
            'normal',
            'multiply',
            'screen',
            'overlay',
            'soft-light'
        ];
        
        // Select blend mode based on position
        if (depthIndex < 0.3) {
            return blendModes[Math.random() < 0.5 ? 1 : 4]; // multiply or soft-light
        } else if (depthIndex < 0.7) {
            return blendModes[Math.random() < 0.5 ? 2 : 3]; // screen or overlay
        } else {
            return blendModes[0]; // normal
        }
    }

    drawTile(tile) {
        this.ctx.save();

        // Set opacity and blend mode
        this.ctx.globalAlpha = tile.opacity;
        this.ctx.globalCompositeOperation = tile.blendMode;

        // Apply rotation around tile center
        if (tile.rotation) {
            this.ctx.translate(tile.x + tile.width / 2, tile.y + tile.height / 2);
            this.ctx.rotate(tile.rotation);
            this.ctx.translate(-(tile.x + tile.width / 2), -(tile.y + tile.height / 2));
        }

        // Draw the image
        this.ctx.drawImage(tile.image, tile.x, tile.y, tile.width, tile.height);

        this.ctx.restore();
    }
} 