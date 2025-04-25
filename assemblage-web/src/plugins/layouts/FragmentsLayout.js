/**
 * Fragments Layout for Assemblage
 * Port of legacy fragments generator with full parity
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';
import { EnhancedFragmentsGenerator } from '@legacy/collage/enhancedFragmentsGenerator.js';

export default class FragmentsLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.generator = null;
    }

    render(ctx, images, { variation = 'Classic', complexity = 6, maxFragments = 8 } = {}) {
        if (!ctx || !ctx.canvas) {
            console.error('Invalid canvas context provided to FragmentsLayout');
            return;
        }

        const prev = ctx.globalCompositeOperation;
        try {
            // Set up canvas context
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Initialize generator if needed
            if (!this.fragmentsGenerator) {
                this.fragmentsGenerator = new EnhancedFragmentsGenerator(ctx, ctx.canvas);
            }

            // Generate fragments effect
            return this.fragmentsGenerator.generateFragments(images, {
                variation,
                complexity,
                maxFragments,
                minVisibility: 0.7
            });
        } catch (error) {
            console.error('Error generating fragments effect:', error);
            throw error;
        } finally {
            ctx.globalCompositeOperation = prev;
        }
    }
} 