/**
 * TilingLayout - Creates a tiled collage effect from input images
 * Provides a consistent interface with other layout plugins
 */

import { TilingGenerator } from '@legacy/collage/tilingGenerator.js';

export default class TilingLayout {
    constructor() {
        this.generator = null;
    }

    async render(ctx, images, canvas, parameters = {}) {
        // Set up the canvas context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save the context state
        ctx.save();
        
        // Generate and apply background color
        const bgColor = this.generateBackgroundColor();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set blend mode for interesting visual effects
        ctx.globalCompositeOperation = 'multiply';

        // Validate images
        if (!images || !Array.isArray(images) || images.length === 0) {
            console.error('No valid images provided to TilingLayout');
            ctx.restore();
            return;
        }

        // Ensure all images are loaded
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
        if (validImages.length === 0) {
            console.error('No valid loaded images found');
            ctx.restore();
            return;
        }

        // Create a new generator instance with the current canvas
        this.generator = new TilingGenerator(canvas, {
            ...this.configureParameters(parameters),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        });

        // Generate and draw the tiling layout
        const fragments = await this.generator.generateTiling(validImages, this.configureParameters(parameters));
        
        // Restore the context state
        ctx.restore();
        
        return fragments;
    }

    generateBackgroundColor() {
        // Generate a light, muted background color
        const hue = Math.random() * 360;
        return `hsl(${hue}, 20%, 95%)`;
    }

    configureParameters(parameters) {
        return {
            complexity: parameters.complexity || 0.5,
            variation: parameters.variation || 'default',
            spacing: parameters.spacing || 10,
            opacity: parameters.opacity || 0.8,
            blendMode: parameters.blendMode || 'multiply',
            tileSize: parameters.tileSize || 100,
            overlap: parameters.overlap || false,
            rotateShards: parameters.rotateShards || true
        };
    }
} 