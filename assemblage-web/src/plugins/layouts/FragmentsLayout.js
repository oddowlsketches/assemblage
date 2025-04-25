/**
 * Fragments Layout for Assemblage
 * Port of legacy fragments generator with full parity
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';

export default class FragmentsLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.generator = null;
    }

    render(ctx, images, parameters = {}) {
        // Initialize generator if needed
        if (!this.generator) {
            this.generator = new FragmentsGenerator(ctx, ctx.canvas);
        }

        // Set up canvas context
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Generate fragments with default parameters if none provided
        return this.generator.generateFragments(images, null, {
            variation: parameters.variation || 'Classic',
            complexity: parameters.complexity || 5,
            maxFragments: parameters.maxFragments || 12,
            ...parameters
        });
    }
} 