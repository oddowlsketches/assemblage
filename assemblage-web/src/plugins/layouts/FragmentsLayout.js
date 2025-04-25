/**
 * Fragments Layout for Assemblage
 * Creates a fragmented collage effect from the input images
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';
import { EnhancedFragmentsGenerator } from '../../core/EnhancedFragmentsGenerator.js';

export default class FragmentsLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.fragmentsGenerator = null;
    }

    async render(ctx, images, canvas, opts = {}) {
        if (!ctx || !ctx.canvas) {
            console.error('Invalid canvas context provided to FragmentsLayout');
            return;
        }

        ctx.save();
        // Set multiply mode at the start
        ctx.globalCompositeOperation = 'multiply';
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        try {
            // if images are already HTMLImageElement, skip re-loading
            const srcImgs = await Promise.all(
                images.map(img =>
                    img instanceof HTMLImageElement
                        ? img
                        : new Promise((res, rej) => {
                            const i = new Image();
                            i.crossOrigin = 'anonymous';
                            i.onload = () => res(i);
                            i.onerror = rej;
                            i.src = img;
                        })
                )
            );

            // Initialize generator if needed
            if (!this.fragmentsGenerator) {
                this.fragmentsGenerator = new EnhancedFragmentsGenerator(ctx, canvas, {
                    variation: opts.variation || 'Classic',
                    complexity: opts.complexity || 6,
                    maxFragments: opts.maxFragments || 8,
                    minVisibility: 0.7
                });
            }

            // Generate fragments effect and await its completion
            return await this.fragmentsGenerator.generate(srcImgs);
        } catch (error) {
            console.error('Error generating fragments effect:', error);
            throw error;
        } finally {
            // Reset composite operation before restoring context
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }
    }
} 