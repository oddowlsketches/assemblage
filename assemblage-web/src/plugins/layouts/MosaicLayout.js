/**
 * MosaicLayout - Wrapper for the MosaicGenerator
 * Provides a consistent interface with other layout plugins
 */

import { MosaicGenerator } from '@legacy/collage/mosaicGenerator.js';

export default class MosaicLayout {
    constructor() {
        this.generator = null;
    }

    async render(ctx, images, canvas, parameters = {}) {
        // Set up the canvas context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate background color
        const bgColor = this.generateBackgroundColor();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Validate images
        if (!images || !Array.isArray(images) || images.length === 0) {
            console.error('No valid images provided to MosaicLayout');
            return;
        }

        // Ensure all images are loaded
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
        if (validImages.length === 0) {
            console.error('No valid loaded images found');
            return;
        }

        // Create a new generator instance with the current canvas
        this.generator = new MosaicGenerator(canvas, {
            ...this.configureParameters(parameters),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        });

        // Generate and draw the mosaic layout, wrapped in a Promise
        return new Promise(resolve => {
            this.generator.generateMosaic(validImages, {
                ...this.configureParameters(parameters),
                callback: resolve // Pass the resolve function as the callback
            });
        });
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
            gridSize: parameters.gridSize || 10,
            opacity: parameters.opacity || 0.8,
            blendMode: parameters.blendMode || 'multiply',
            compositionStyle: parameters.compositionStyle || 'Field',
            allowImageRepetition: parameters.allowImageRepetition || false,
            tilesTouching: parameters.tilesTouching || false
        };
    }
} 