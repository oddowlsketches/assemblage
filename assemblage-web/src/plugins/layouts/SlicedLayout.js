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

    // Main render method that randomly selects between the three variants
    async render(ctx, images, canvas, options = {}) {
        const r = Math.random();
        if (r < 0.33) {
            return this.renderHorizontal(ctx, images, canvas, options);
        } else if (r < 0.66) {
            return this.renderVertical(ctx, images, canvas, options);
        } else {
            return this.renderRandom(ctx, images, canvas, options);
        }
    }

    // Random sliced layout
    async renderRandom(ctx, images, canvas, options = {}) {
        try {
            // Save context state
            ctx.save();
            
            // Initialize generator if not already done
            if (!this.generator) {
                this.generator = new SlicedCollageGenerator(ctx, canvas);
            }

            // Set up canvas context
            ctx.globalCompositeOperation = 'multiply';
            
            // Configure parameters for random slicing
            const configuredOptions = {
                ...this.configureParameters(options),
                sliceBehavior: 'random',
                maxSlices: 7,
                sliceWidthVariation: 0.1,
                width: canvas.width,
                height: canvas.height
            };
            
            // Generate sliced effect
            await this.generator.generateSliced(images, null, configuredOptions);

            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error('Error in SlicedLayout renderRandom:', error);
            throw error;
        }
    }

    // Horizontal sliced layout
    async renderHorizontal(ctx, images, canvas, options = {}) {
        try {
            // Save context state
            ctx.save();
            
            // Initialize generator if not already done
            if (!this.generator) {
                this.generator = new SlicedCollageGenerator(ctx, canvas);
            }

            // Set up canvas context
            ctx.globalCompositeOperation = 'multiply';
            
            // Configure parameters for horizontal slicing
            const configuredOptions = {
                ...this.configureParameters(options),
                sliceBehavior: 'horizontal',
                maxSlices: 10,
                sliceWidthVariation: 0.15,
                width: canvas.width,
                height: canvas.height
            };
            
            // Generate sliced effect
            await this.generator.generateSliced(images, null, configuredOptions);

            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error('Error in SlicedLayout renderHorizontal:', error);
            throw error;
        }
    }

    // Vertical sliced layout
    async renderVertical(ctx, images, canvas, options = {}) {
        try {
            // Save context state
            ctx.save();
            
            // Initialize generator if not already done
            if (!this.generator) {
                this.generator = new SlicedCollageGenerator(ctx, canvas);
            }

            // Set up canvas context
            ctx.globalCompositeOperation = 'multiply';
            
            // Configure parameters for vertical slicing
            const configuredOptions = {
                ...this.configureParameters(options),
                sliceBehavior: 'vertical',
                maxSlices: 10,
                sliceWidthVariation: 0.15,
                width: canvas.width,
                height: canvas.height
            };
            
            // Generate sliced effect
            await this.generator.generateSliced(images, null, configuredOptions);

            // Restore context state
            ctx.restore();
        } catch (error) {
            console.error('Error in SlicedLayout renderVertical:', error);
            throw error;
        }
    }
} 