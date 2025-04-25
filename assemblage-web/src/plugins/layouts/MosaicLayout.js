/**
 * MosaicLayout - Wrapper for the MosaicGenerator
 * Provides a consistent interface with other layout plugins
 */

import { MosaicGenerator } from '@legacy/collage/mosaicGenerator.js';

export default class MosaicLayout {
    constructor() {
        this.generator = new MosaicGenerator();
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

        // Configure parameters based on variation
        const config = this.configureParameters(parameters);

        // Use the mosaic generator to create the composition
        return this.generator.generateMosaic(ctx, validImages, {
            ...config,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        });
    }

    configureParameters(parameters) {
        const baseConfig = {
            tileSize: parameters.tileSize || 50,
            spacing: parameters.spacing || 2,
            complexity: parameters.complexity || 0.5,
            tilesTouching: parameters.tilesTouching || false
        };

        switch (parameters.variation) {
            case 'overlapping':
                return {
                    ...baseConfig,
                    spacing: -5,
                    tilesTouching: true,
                    complexity: 0.7
                };
            default: // standard
                return baseConfig;
        }
    }

    generateBackgroundColor() {
        // Generate a dark background color
        const hue = Math.random() * 360;
        return `hsl(${hue}, 30%, 15%)`;
    }
} 