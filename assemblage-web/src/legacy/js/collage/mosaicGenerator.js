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
    constructor(canvas, parameters = {}) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.parameters = parameters;
        this.animationFrame = null;
        
        // Set default canvas dimensions if not provided
        if (!this.canvas) {
            console.error('No canvas provided to MosaicGenerator');
            return;
        }
        
        // Ensure canvas has dimensions
        if (!this.canvas.width || !this.canvas.height) {
            console.error('Canvas dimensions not set');
            return;
        }
    }

    /**
     * Generate a mosaic collage
     * @param {Array} images - Array of image objects
     * @param {Object} parameters - Parameters for mosaic generation
     * @returns {Promise<Array>} - Array of fragment objects
     */
    async generateMosaic(images, parameters = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided for mosaic generation');
            return [];
        }

        if (!this.ctx || !this.canvas) {
            console.error('Canvas context not available');
            return [];
        }

        try {
            // Cancel any existing animation frame
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }

            const fragments = [];
            const tileSize = parameters.tileSize || 100;
            const spacing = parameters.spacing || 10;
            const complexity = parameters.complexity || 0.5;
            const overlap = parameters.overlap || false;
            const rotateShards = parameters.rotateShards || true;

            // Calculate grid dimensions
            const cols = Math.ceil(this.canvas.width / tileSize);
            const rows = Math.ceil(this.canvas.height / tileSize);

            // Create a queue of tiles to render
            const tileQueue = [];
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // Calculate base position
                    const x = i * tileSize;
                    const y = j * tileSize;

                    // Add randomness to position if not overlapping
                    const offsetX = overlap ? 0 : (Math.random() - 0.5) * spacing;
                    const offsetY = overlap ? 0 : (Math.random() - 0.5) * spacing;

                    // Select random image
                    const imageIndex = Math.floor(Math.random() * images.length);
                    const image = images[imageIndex];

                    if (!image || !image.complete || image.naturalWidth === 0) {
                        console.warn('Invalid image at index', imageIndex);
                        continue;
                    }

                    // Calculate tile dimensions
                    const width = tileSize * (1 + (Math.random() - 0.5) * 0.2); // ±10% variation
                    const height = tileSize * (1 + (Math.random() - 0.5) * 0.2);

                    // Calculate rotation
                    const rotation = rotateShards ? (Math.random() - 0.5) * 30 : 0; // ±15 degrees if rotation enabled

                    // Add tile to queue
                    tileQueue.push({
                        image,
                        x: x + offsetX,
                        y: y + offsetY,
                        width,
                        height,
                        rotation,
                        opacity: parameters.opacity || 0.8
                    });
                }
            }

            // Function to render a batch of tiles
            const renderBatch = (startIndex, batchSize = 5) => {
                const endIndex = Math.min(startIndex + batchSize, tileQueue.length);
                
                for (let i = startIndex; i < endIndex; i++) {
                    const tile = tileQueue[i];
                    this.drawTile(tile);
                    fragments.push(tile);
                }

                if (endIndex < tileQueue.length) {
                    // Schedule next batch
                    this.animationFrame = requestAnimationFrame(() => renderBatch(endIndex));
                } else {
                    // All tiles rendered, call the callback if provided
                    if (parameters.callback) {
                        parameters.callback(fragments);
                    }
                }
            };

            // Start rendering tiles in batches
            renderBatch(0);

            return fragments;
        } catch (error) {
            console.error('Error generating mosaic:', error);
            if (parameters.callback) {
                parameters.callback([]);
            }
            return [];
        }
    }

    /**
     * Draw a tile on the canvas
     * @param {Object} tile - The tile object containing image and position data
     */
    drawTile(tile) {
        if (!this.ctx || !tile.image || !tile.image.complete || tile.image.naturalWidth === 0) {
            return;
        }

        this.ctx.save();
        
        try {
            // Set the opacity
            this.ctx.globalAlpha = tile.opacity;
            
            // Move to the center of where we want to draw the tile
            this.ctx.translate(tile.x + tile.width/2, tile.y + tile.height/2);
            
            // Rotate around the center point
            if (tile.rotation !== 0) {
                this.ctx.rotate((tile.rotation * Math.PI) / 180);
            }
            
            // Move back to draw the tile
            this.ctx.translate(-(tile.x + tile.width/2), -(tile.y + tile.height/2));
            
            // Calculate aspect ratios
            const imageAspect = tile.image.naturalWidth / tile.image.naturalHeight;
            const targetAspect = tile.width / tile.height;
            
            let sw, sh, sx, sy;
            
            // Maintain aspect ratio while filling the target area
            if (imageAspect > targetAspect) {
                // Image is wider than target
                sw = tile.image.naturalHeight * targetAspect;
                sh = tile.image.naturalHeight;
                sx = (tile.image.naturalWidth - sw) / 2;
                sy = 0;
            } else {
                // Image is taller than target
                sw = tile.image.naturalWidth;
                sh = tile.image.naturalWidth / targetAspect;
                sx = 0;
                sy = (tile.image.naturalHeight - sh) / 2;
            }
            
            // Draw the image
            this.ctx.drawImage(
                tile.image,
                sx, sy, sw, sh,
                tile.x, tile.y, tile.width, tile.height
            );
            
            // Draw a subtle border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
        } catch (error) {
            console.error('Error drawing tile:', error);
        }
        
        this.ctx.restore();
    }

    /**
     * Clean up any resources
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
} 