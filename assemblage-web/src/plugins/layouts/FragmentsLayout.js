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

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async render(ctx, images, canvas, opts = {}) {
        if (!ctx || !ctx.canvas) {
            console.error('Invalid canvas context provided to FragmentsLayout');
            return;
        }

        const prev = ctx.globalCompositeOperation;
        try {
            // Set up canvas context
            ctx.globalCompositeOperation = 'multiply';
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Initialize generator if needed
            if (!this.fragmentsGenerator) {
                this.fragmentsGenerator = new EnhancedFragmentsGenerator(ctx, canvas, {
                    variation: opts.variation || 'Classic',
                    complexity: opts.complexity || 6,
                    maxFragments: opts.maxFragments || 8,
                    minVisibility: 0.7
                });
            }

            // skip legacy loader if we already have Image objects
            const imgs = await Promise.all(images.map(img =>
                img instanceof HTMLImageElement ? img : this.loadImage(img)
            ));

            // Generate fragments effect
            await this.fragmentsGenerator.generate(imgs);
        } catch (error) {
            console.error('Error generating fragments effect:', error);
            throw error;
        } finally {
            ctx.globalCompositeOperation = prev;
        }
    }
} 