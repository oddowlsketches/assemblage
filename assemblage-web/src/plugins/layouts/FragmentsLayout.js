/**
 * Fragments Layout for Assemblage
 * Creates a fragmented collage effect from the input images
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';

export default class FragmentsLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.generator = null;
    }

    async render(ctx, images, canvas, parameters = {}) {
        // Initialize the generator if not already done
        if (!this.generator) {
            this.generator = new FragmentsGenerator(ctx, canvas);
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background color
        ctx.fillStyle = this.generator.generateBackgroundColor();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate fragments
        const fragments = this.generator.generateFragments(images, parameters.complexity || 0.5);
        console.log(`Generated ${fragments.length} fragments`);
        
        // Draw each fragment
        for (const fragment of fragments) {
            this.generator.drawFragment(fragment, ctx);
        }
        
        return fragments;
    }

    // Simple image loading function to avoid circular dependency
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    applyMask(ctx, maskType, width, height) {
        switch (maskType) {
            case 'circle':
                ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
                break;
            case 'ellipse':
                ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
                break;
            case 'rectangle':
                ctx.rect(0, 0, width, height);
                break;
            case 'triangle':
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                break;
            case 'diamond':
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width, height / 2);
                ctx.lineTo(width / 2, height);
                ctx.lineTo(0, height / 2);
                ctx.closePath();
                break;
            default:
                // Default to rectangle if mask type is not recognized
                ctx.rect(0, 0, width, height);
        }
    }
} 