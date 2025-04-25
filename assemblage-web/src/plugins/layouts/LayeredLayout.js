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
            // Use a loose filter for focal and texture images
            const [focal, ...textures] = images;
            if (!focal) {
                console.warn('Layered: fallback to Mosaic');
                return PluginRegistry.get('mosaic').render(ctx, images, canvas);
            }
            
            // Draw the layered layout with the focal image and textures
            return this.drawLayeredLayout(ctx, focal, textures, canvas);
        } catch (error) {
            console.error('Error in LayeredLayout render:', error);
            throw error;
        }
    }

    async drawLayeredLayout(ctx, focal, textures, canvas) {
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
            width: canvas.width,
            height: canvas.height,
            minOpacity: 0.6,
            maxOpacity: 0.9,
            minScale: 0.8,
            maxScale: 1.2,
            bleedOffEdges: true
        };
        
        // Generate layered effect
        await this.generator.generateLayers([focal, ...textures], configuredOptions);

        // Restore context state
        ctx.restore();
    }
} 