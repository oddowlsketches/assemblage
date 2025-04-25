/**
 * NarrativeGenerator class for creating narrative-style collages
 * This class handles the generation of collages that tell a visual story through image placement and composition
 */
export class NarrativeGenerator {
    /**
     * Create a new NarrativeGenerator
     */
    constructor() {
        this.defaultConfig = {
            spacing: 20,
            opacity: 0.8,
            maxRotation: 15,
            minScale: 0.3,
            maxScale: 1.2
        };
    }

    /**
     * Generate a narrative collage
     * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
     * @param {Array<HTMLImageElement>} images - Array of image objects
     * @param {Object} parameters - Parameters for narrative generation
     * @returns {Promise<Array>} - Array of fragment objects
     */
    async generateNarrative(ctx, images, parameters = {}) {
        if (!ctx || !images || images.length === 0) {
            console.error('Invalid context or no images provided');
            return [];
        }

        const config = { ...this.defaultConfig, ...parameters };
        const { canvasWidth, canvasHeight } = parameters;
        const fragments = [];

        try {
            // Sort images by size to create visual hierarchy
            const sortedImages = [...images].sort((a, b) => {
                const areaA = a.naturalWidth * a.naturalHeight;
                const areaB = b.naturalWidth * b.naturalHeight;
                return areaB - areaA;
            });

            // Calculate the number of focal points based on complexity
            const complexity = parameters.complexity || 0.5;
            const numFocalPoints = Math.max(1, Math.min(4, Math.ceil(sortedImages.length * complexity / 3)));

            // Generate focal points
            const focalPoints = this.generateFocalPoints(numFocalPoints, canvasWidth, canvasHeight);

            // Distribute images around focal points
            let currentImageIndex = 0;
            for (let i = 0; i < focalPoints.length; i++) {
                const focalPoint = focalPoints[i];
                const numImagesForPoint = Math.ceil(sortedImages.length / focalPoints.length);
                
                for (let j = 0; j < numImagesForPoint && currentImageIndex < sortedImages.length; j++) {
                    const image = sortedImages[currentImageIndex];
                    if (!image || !image.complete || image.naturalWidth === 0) {
                        console.warn('Invalid image at index', currentImageIndex);
                        currentImageIndex++;
                        continue;
                    }

                    // Calculate position relative to focal point
                    const angle = (Math.PI * 2 * j) / numImagesForPoint;
                    const distance = config.spacing * (1 + Math.random());
                    const x = focalPoint.x + Math.cos(angle) * distance;
                    const y = focalPoint.y + Math.sin(angle) * distance;

                    // Calculate scale based on distance from focal point
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(x - canvasWidth/2, 2) + 
                        Math.pow(y - canvasHeight/2, 2)
                    );
                    const maxDistance = Math.sqrt(
                        Math.pow(canvasWidth/2, 2) + 
                        Math.pow(canvasHeight/2, 2)
                    );
                    const scale = config.maxScale - 
                        (distanceFromCenter / maxDistance) * 
                        (config.maxScale - config.minScale);

                    // Calculate dimensions maintaining aspect ratio
                    const aspectRatio = image.naturalWidth / image.naturalHeight;
                    let width, height;
                    if (aspectRatio > 1) {
                        width = Math.min(canvasWidth * 0.4, image.naturalWidth) * scale;
                        height = width / aspectRatio;
                    } else {
                        height = Math.min(canvasHeight * 0.4, image.naturalHeight) * scale;
                        width = height * aspectRatio;
                    }

                    // Add some randomness to rotation
                    const rotation = (Math.random() - 0.5) * config.maxRotation;

                    // Calculate opacity based on scale
                    const opacity = config.opacity * (0.7 + (scale - config.minScale) / 
                        (config.maxScale - config.minScale) * 0.3);

                    // Draw the image
                    this.drawImage(
                        ctx,
                        image,
                        x - width/2,
                        y - height/2,
                        width,
                        height,
                        rotation,
                        opacity
                    );

                    // Store fragment information
                    fragments.push({
                        image,
                        x: x - width/2,
                        y: y - height/2,
                        width,
                        height,
                        rotation,
                        opacity,
                        scale
                    });

                    currentImageIndex++;
                }
            }

            return fragments;
        } catch (error) {
            console.error('Error generating narrative:', error);
            return [];
        }
    }

    /**
     * Generate focal points for image placement
     * @param {number} count - Number of focal points to generate
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {Array<{x: number, y: number}>} Array of focal points
     */
    generateFocalPoints(count, width, height) {
        const points = [];
        const margin = Math.min(width, height) * 0.1;

        // Always include center point
        points.push({
            x: width / 2,
            y: height / 2
        });

        // Add additional points in golden ratio spiral
        if (count > 1) {
            const goldenRatio = 1.618033988749895;
            const angleIncrement = Math.PI * 2 * goldenRatio;
            
            for (let i = 1; i < count; i++) {
                const angle = i * angleIncrement;
                const radius = Math.min(width, height) * 0.3 * Math.sqrt(i);
                
                let x = width/2 + Math.cos(angle) * radius;
                let y = height/2 + Math.sin(angle) * radius;
                
                // Ensure points are within margins
                x = Math.max(margin, Math.min(width - margin, x));
                y = Math.max(margin, Math.min(height - margin, y));
                
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Draw an image on the canvas with specified parameters
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {HTMLImageElement} image - The image to draw
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width of the image
     * @param {number} height - Height of the image
     * @param {number} rotation - Rotation angle in degrees
     * @param {number} opacity - Opacity value (0-1)
     */
    drawImage(ctx, image, x, y, width, height, rotation = 0, opacity = 1) {
        if (!ctx || !image || !image.complete || image.naturalWidth === 0) {
            return;
        }

        ctx.save();
        
        try {
            // Set the opacity
            ctx.globalAlpha = opacity;
            
            // Move to the center of where we want to draw the image
            ctx.translate(x + width/2, y + height/2);
            
            // Rotate around the center point
            if (rotation !== 0) {
                ctx.rotate((rotation * Math.PI) / 180);
            }
            
            // Move back to draw the image
            ctx.translate(-(x + width/2), -(y + height/2));
            
            // Draw the image
            ctx.drawImage(image, x, y, width, height);
        } catch (error) {
            console.error('Error drawing image:', error);
        }
        
        ctx.restore();
    }
} 