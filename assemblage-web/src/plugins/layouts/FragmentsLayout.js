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
        if (import.meta.env.DEV) {
            window.__lastLayout = 'Fragments';
            window.__fragmentsImgs = images;
        }

        // Save context state and set initial composite operation
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';   // draw the BG first

        // Initialize the generator if not already done
        if (!this.generator) {
            this.generator = new FragmentsGenerator(ctx, canvas);
        }

        // Clear and fill the background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bg = this.generator.generateBackgroundColor();
        window.__collageBgColor = bg;   // expose for generator
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Switch to multiply for the image drawing phase
        ctx.globalCompositeOperation = 'multiply';

        // Load images if they're not already Image objects
        const load = src => new Promise((res, rej) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = src;
        });
        
        const imgs = await Promise.all(
            images.map(i => i instanceof Image ? i : load(i))
        );
        
        // Generate fragments
        const fragments = this.generator.generateFragments(imgs, parameters.complexity || 0.5);
        console.log(`Generated ${fragments.length} fragments`);
        
        // Draw each fragment
        for (const fragment of fragments) {
            ctx.save();
            ctx.beginPath();               // (clip path is in drawFragment)
            // Set source-in **inside** the save/restore so it doesn't leak
            ctx.globalCompositeOperation = 'source-in';
            this.generator.drawFragment(fragment, ctx);
            ctx.restore();                 // back to multiply for next fragment
        }
        
        // Restore context state
        ctx.restore();
        
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