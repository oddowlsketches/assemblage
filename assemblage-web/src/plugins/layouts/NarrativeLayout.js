/**
 * NarrativeLayout - Wrapper for the NarrativeCompositionManager
 * Provides a consistent interface with other layout plugins
 */

import { NarrativeCompositionManager } from '@legacy/collage/narrativeCompositionManager.js';

export default class NarrativeLayout {
    constructor() {
        this.generator = null;
    }

    render(ctx, images, canvas, parameters = {}) {
        // Initialize generator with canvas context and canvas
        if (!this.generator) {
            this.generator = new NarrativeCompositionManager({
                ctx,
                canvas,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height
            });
        }
        
        // Set up the canvas context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate background color
        const bgColor = this.generateBackgroundColor();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use the narrative generator to create the composition
        return this.generator.generate(images, parameters.fortuneText || '', parameters.effect || 'default', {
            ...parameters,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        });
    }

    generateBackgroundColor() {
        // Generate a dark background color
        const hue = Math.random() * 360;
        return `hsl(${hue}, 20%, 15%)`;
    }
} 