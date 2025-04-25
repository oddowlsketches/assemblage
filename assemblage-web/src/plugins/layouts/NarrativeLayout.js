/**
 * NarrativeLayout - Wrapper for the NarrativeGenerator
 * Provides a consistent interface with other layout plugins
 */

import { NarrativeGenerator } from '@legacy/collage/narrativeGenerator.js';

export default class NarrativeLayout {
    constructor() {
        this.generator = new NarrativeGenerator();
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
            console.error('No valid images provided to NarrativeLayout');
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

        // Use the narrative generator to create the composition
        return this.generator.generateNarrative(ctx, validImages, {
            ...config,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
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
            spacing: parameters.spacing || 20,
            opacity: parameters.opacity || 0.8,
            blendMode: parameters.blendMode || 'multiply'
        };
    }
} 