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
            // Load all images synchronously
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

            // Generate fragments effect
            const fragments = await this.fragmentsGenerator.generate(srcImgs);

            // Draw each fragment with proper masking
            for (const fragment of fragments) {
                ctx.save();
                
                // Apply rotation if specified
                if (fragment.rotation) {
                    const centerX = fragment.x + fragment.width / 2;
                    const centerY = fragment.y + fragment.height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(fragment.rotation);
                    ctx.translate(-centerX, -centerY);
                }

                // Apply mask if enabled
                if (fragment.mask && fragment.mask.enabled) {
                    ctx.beginPath();
                    this.fragmentsGenerator.applyMask(ctx, fragment.mask.type, fragment.width, fragment.height);
                    ctx.closePath();
                    ctx.clip();
                    ctx.globalCompositeOperation = 'source-in';
                }

                // Draw the image
                ctx.drawImage(
                    fragment.image,
                    fragment.x,
                    fragment.y,
                    fragment.width,
                    fragment.height
                );

                ctx.restore();
            }

            return fragments;
        } catch (error) {
            console.error('Error generating fragments effect:', error);
            throw error;
        } finally {
            ctx.restore();
        }
    }
} 