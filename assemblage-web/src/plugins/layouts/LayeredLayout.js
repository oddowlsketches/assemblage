/**
 * LayeredLayout - Creates a layered collage effect from input images
 */

import { LayeredGenerator } from '@legacy/collage/layeredGenerator.js';
import { PluginRegistry } from '../../core/PluginRegistry.js';

export default class LayeredLayout {
    constructor(options = {}) {
        this.options = options;
        this.generator = null;
    }

    async render(ctx, images, canvas, options = {}) {
        try {
            // Check if we have enough images
            if (images.length < 4) {
                console.warn('Layered: not enough images, switching to Mosaic');
                const mosaicLayout = new PluginRegistry().getLayout('mosaic');
                return mosaicLayout.render(ctx, images, canvas, options);
            }

            // Save context state
            ctx.save();
            
            // Initialize generator if not already done
            if (!this.generator) {
                this.generator = new LayeredGenerator(ctx, canvas);
            }

            // Set up canvas context
            ctx.globalCompositeOperation = 'source-over';
            
            // Configure parameters
            const configuredOptions = {
                ...options,
                width: canvas.width,
                height: canvas.height,
                minOpacity: 0.6,
                maxOpacity: 0.9,
                minScale: 0.8,
                maxScale: 1.2,
                bleedOffEdges: true
            };
            
            // Generate layered effect
            await this.generator.generateLayers(images, configuredOptions);

            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error('Error in LayeredLayout render:', error);
            throw error;
        }
    }
} 