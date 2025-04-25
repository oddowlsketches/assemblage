/**
 * SlicedLayout - Creates a sliced collage effect from input images
 */

import { SlicedCollageGenerator } from '@legacy/collage/slicedCollageGenerator.js';

export default class SlicedLayout {
    constructor(options = {}) {
        this.options = options;
        this.generator = null;
    }

    configureParameters(parameters) {
        const baseConfig = {
            sliceBehavior: parameters.sliceBehavior || 'random',
            maxSlices: parameters.maxSlices || 50,
            sliceWidthVariation: parameters.sliceWidthVariation || 0.1
        };

        switch (parameters.variation) {
            case 'single-image':
                return {
                    ...baseConfig,
                    sliceBehavior: 'single-image',
                    maxSlices: 50,
                    sliceWidthVariation: 0.2
                };
            case 'alternating':
                return {
                    ...baseConfig,
                    sliceBehavior: 'alternating',
                    maxSlices: 50,
                    sliceWidthVariation: 0.1
                };
            default: // random
                return {
                    ...baseConfig,
                    sliceBehavior: 'random',
                    maxSlices: 7,
                    sliceWidthVariation: 0.1
                };
        }
    }

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async render(ctx, images, canvas, options = {}) {
        try {
            // Save context state
            ctx.save();
            
            // Initialize generator if not already done
            if (!this.generator) {
                this.generator = new SlicedCollageGenerator(ctx, canvas);
            }

            // Set up canvas context
            ctx.globalCompositeOperation = 'multiply';
            
            // Configure parameters based on variation
            const configuredOptions = this.configureParameters(options);
            
            // Generate sliced effect
            await this.generator.generateSliced(images, null, {
                ...configuredOptions,
                width: canvas.width,
                height: canvas.height
            });

            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error('Error in SlicedLayout render:', error);
            throw error;
        }
    }
} 