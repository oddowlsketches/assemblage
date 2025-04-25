/**
 * TilingGenerator class for creating tiling-style collages
 * This class handles the generation of collages with border shards and tiling effects
 */
export class TilingGenerator {
    /**
     * Create a new TilingGenerator
     * @param {HTMLCanvasElement} canvas - The canvas to draw on
     * @param {Object} parameters - Parameters for tiling generation
     */
    constructor(canvas, parameters = {}) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.parameters = parameters;
        
        // Set default canvas dimensions if not provided
        if (!this.canvas) {
            console.error('No canvas provided to TilingGenerator');
            return;
        }
        
        // Ensure canvas has dimensions
        if (!this.canvas.width || !this.canvas.height) {
            console.error('Canvas dimensions not set');
            return;
        }
    }

    /**
     * Generate a tiling collage
     * @param {Array} images - Array of image objects
     * @param {Object} parameters - Parameters for tiling generation
     * @returns {Promise<Array>} - Array of fragment objects
     */
    async generateTiling(images, parameters = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided for tiling generation');
            return [];
        }

        if (!this.ctx || !this.canvas) {
            console.error('Canvas context not available');
            return [];
        }

        try {
            const fragments = [];
            const tileSize = parameters.tileSize || 100;
            const spacing = parameters.spacing || 10;
            const complexity = parameters.complexity || 0.5;
            const overlap = parameters.overlap || false;
            const rotateShards = parameters.rotateShards || true;

            // Calculate grid dimensions
            const cols = Math.ceil(this.canvas.width / tileSize);
            const rows = Math.ceil(this.canvas.height / tileSize);

            // Create border shards
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

                    // Calculate shard dimensions
                    const width = tileSize * (1 + (Math.random() - 0.5) * 0.2); // ±10% variation
                    const height = tileSize * (1 + (Math.random() - 0.5) * 0.2);

                    // Calculate rotation
                    const rotation = rotateShards ? (Math.random() - 0.5) * 30 : 0; // ±15 degrees if rotation enabled

                    // Create mask path for the shard
                    const maskPath = this.generateShardPath(width, height, complexity);

                    // Draw the shard
                    this.drawShard(
                        image,
                        x + offsetX,
                        y + offsetY,
                        width,
                        height,
                        rotation,
                        maskPath,
                        parameters.opacity || 0.8
                    );

                    // Store fragment information
                    fragments.push({
                        image,
                        x: x + offsetX,
                        y: y + offsetY,
                        width,
                        height,
                        rotation,
                        maskPath,
                        opacity: parameters.opacity || 0.8
                    });
                }
            }

            return fragments;
        } catch (error) {
            console.error('Error generating tiling:', error);
            return [];
        }
    }

    /**
     * Generate a path for a shard shape
     * @param {number} width - Width of the shard
     * @param {number} height - Height of the shard
     * @param {number} complexity - Complexity factor for the shard shape
     * @returns {Path2D} - The path for the shard
     */
    generateShardPath(width, height, complexity) {
        const path = new Path2D();
        const numPoints = Math.max(3, Math.floor(6 * complexity)); // 3-6 points based on complexity
        const points = [];

        // Generate random points around the perimeter
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = Math.min(width, height) / 2;
            const variance = radius * 0.2; // 20% variance in radius

            const r = radius + (Math.random() - 0.5) * variance;
            const x = width/2 + Math.cos(angle) * r;
            const y = height/2 + Math.sin(angle) * r;

            points.push({ x, y });
        }

        // Create the path
        path.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            // Use quadratic curves between points for smoother edges
            const xc = (points[i].x + points[i-1].x) / 2;
            const yc = (points[i].y + points[i-1].y) / 2;
            path.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
        }
        // Close the path back to the first point
        const xc = (points[0].x + points[points.length-1].x) / 2;
        const yc = (points[0].y + points[points.length-1].y) / 2;
        path.quadraticCurveTo(points[points.length-1].x, points[points.length-1].y, xc, yc);
        path.closePath();

        return path;
    }

    /**
     * Draw a shard on the canvas
     * @param {HTMLImageElement} image - The image to draw
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width of the shard
     * @param {number} height - Height of the shard
     * @param {number} rotation - Rotation angle in degrees
     * @param {Path2D} maskPath - The path to use as a mask
     * @param {number} opacity - Opacity value (0-1)
     */
    drawShard(image, x, y, width, height, rotation, maskPath, opacity) {
        if (!this.ctx || !image || !image.complete || image.naturalWidth === 0) {
            return;
        }

        this.ctx.save();
        
        try {
            // Set the opacity
            this.ctx.globalAlpha = opacity;
            
            // Move to the center of where we want to draw the shard
            this.ctx.translate(x + width/2, y + height/2);
            
            // Rotate around the center point
            if (rotation !== 0) {
                this.ctx.rotate((rotation * Math.PI) / 180);
            }
            
            // Move back to draw the shard
            this.ctx.translate(-(x + width/2), -(y + height/2));
            
            // Create a clipping mask
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.clip(maskPath);
            
            // Calculate aspect ratios
            const imageAspect = image.naturalWidth / image.naturalHeight;
            const targetAspect = width / height;
            
            let sw, sh, sx, sy;
            
            // Maintain aspect ratio while filling the target area
            if (imageAspect > targetAspect) {
                // Image is wider than target
                sw = image.naturalHeight * targetAspect;
                sh = image.naturalHeight;
                sx = (image.naturalWidth - sw) / 2;
                sy = 0;
            } else {
                // Image is taller than target
                sw = image.naturalWidth;
                sh = image.naturalWidth / targetAspect;
                sx = 0;
                sy = (image.naturalHeight - sh) / 2;
            }
            
            // Draw the image within the clipping mask
            this.ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
            
            // Restore the clipping context
            this.ctx.restore();
            
            // Draw a subtle border around the shard
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.translate(x, y);
            this.ctx.stroke(maskPath);
        } catch (error) {
            console.error('Error drawing shard:', error);
        }
        
        // Restore the main context
        this.ctx.restore();
    }
}