/**
 * Fragments Layout for Assemblage
 * Creates a fragmented collage effect from the input images
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';
import { NarrativeCompositionManager } from '@legacy/collage/narrativeCompositionManager.js';

// Helper function for seeded random number generation
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Helper function to pick complexity parameters
function pickComplexity(seed) {
    // Use seeded random for consistent results
    const r = () => seededRandom(seed++);
    
    return {
        complexity: 0.3 + r() * 0.4,  // 0.3-0.7 range
        density: 0.4 + r() * 0.3,     // 0.4-0.7 range
        variation: ['Classic', 'Organic', 'Focal'][Math.floor(r() * 3)]
    };
}

// Helper function to get fragment shapes
function getFragmentShapes(seed) {
    // Use seeded random for consistent results
    const r = () => seededRandom(seed++);
    
    // Define available shapes
    const allShapes = ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon'];
    
    // Select a subset of shapes based on the seed
    const numShapes = 2 + Math.floor(r() * 3); // 2-4 shapes
    const shapes = [];
    
    for (let i = 0; i < numShapes; i++) {
        const shapeIndex = Math.floor(r() * allShapes.length);
        shapes.push(allShapes[shapeIndex]);
    }
    
    return shapes;
}

export default class FragmentsLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.generator = null;
        this.compositionManager = new NarrativeCompositionManager({
            canvasWidth: opts.canvas?.width || 1200,
            canvasHeight: opts.canvas?.height || 800
        });
    }

    async render(ctx, images, canvas, parameters = {}) {
        if (import.meta.env.DEV) {
            window.__lastLayout = 'Fragments';
            window.__fragmentsImgs = images;
        }

        // Generate seed and parameters
        const seed = Math.floor(Math.random() * 1e9);
        const params = pickComplexity(seed);
        const shapes = getFragmentShapes(seed);
        
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
        
        // Generate fragments with the new parameters and shapes
        let fragments = this.generator.generateFragments(imgs, {...params, shapes});
        console.log(`Generated ${fragments.length} fragments with shapes: ${shapes.join(', ')}`);
        
        // Apply narrative composition if available
        try {
            // Check if the composition manager has the enhanceComposition method
            if (typeof this.compositionManager.enhanceComposition === 'function') {
                const enhanced = this.compositionManager.enhanceComposition(fragments, {
                    compositionType: 'multiple-actors',
                    useGoldenRatio: true,
                    useRuleOfThirds: true,
                    depthOpacity: true
                });
                fragments = enhanced.fragments;
                console.log('Enhanced composition:', enhanced.metadata);
            } else if (typeof this.compositionManager.generate === 'function') {
                // Use the generate method if enhanceComposition is not available
                const enhanced = await this.compositionManager.generate(imgs, null, 'fragments', {
                    ...params,
                    shapes,
                    compositionType: 'multiple-actors',
                    useGoldenRatio: true,
                    useRuleOfThirds: true,
                    depthOpacity: true
                });
                fragments = enhanced.fragments || fragments;
                console.log('Generated composition with narrative manager');
            }
        } catch (error) {
            console.error('Error applying narrative composition:', error);
            // Continue with original fragments if composition fails
        }
        
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
            case 'hexagon':
                const angle = Math.PI / 3;
                const radius = Math.min(width, height) / 2;
                ctx.moveTo(width / 2 + radius * Math.cos(0), height / 2 + radius * Math.sin(0));
                for (let i = 1; i <= 6; i++) {
                    ctx.lineTo(
                        width / 2 + radius * Math.cos(angle * i),
                        height / 2 + radius * Math.sin(angle * i)
                    );
                }
                ctx.closePath();
                break;
            default:
                ctx.rect(0, 0, width, height);
        }
    }
} 