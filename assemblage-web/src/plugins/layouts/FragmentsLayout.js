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
    
    // Helper function for linear interpolation
    const lerp = (min, max, t) => min + (max - min) * t;
    
    return {
        complexity: lerp(0.35, 0.85, r()),  // Increased range from 0.35-0.85
        density: lerp(0.25, 0.75, r()),     // Increased range from 0.25-0.75
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

    async render(canvas, images, params) {
        // Generate seed and parameters if not provided
        const seed = params?.seed || Math.floor(Math.random() * 1e9);
        
        // Helper function for linear interpolation
        const lerp = (min, max, t) => min + (max - min) * t;
        
        // Build a proper parameter object
        const complexityParams = {
            complexity: params?.complexity || lerp(0.35, 0.85, Math.random()),
            density: params?.density || lerp(0.25, 0.75, Math.random()),
            variation: params?.variation || ['Classic', 'Organic', 'Focal'][Math.floor(Math.random() * 3)],
            shapes: params?.shapes || getFragmentShapes(seed),
            imageMode: params?.imageMode || (Math.random() < 0.5 ? 'random' : 'cycle'),
            background: params?.background || '#f2efe9'
        };
        
        console.log('LAYOUT params→', complexityParams);
        
        // Handle different types of canvas input
        let canvasElement;
        let ctx;
        
        if (canvas instanceof CanvasRenderingContext2D) {
            // If canvas is already a context
            ctx = canvas;
            canvasElement = ctx.canvas;
        } else {
            // If canvas is a ref or canvas element
            canvasElement = canvas.current || canvas;
            ctx = canvasElement.getContext('2d');
        }
        
        // Initialize the fragments generator with the canvas context
        this.generator = new FragmentsGenerator(ctx, canvasElement);
        
        // Load images if they're not already Image objects
        const imgs = await Promise.all(
            images.map(i => i instanceof Image ? i : this.loadImage(i))
        );
        
        // Generate fragments with the provided parameters
        let fragments = this.generator.generateFragments(imgs, complexityParams);
        
        console.log('Generated', fragments.length, 'fragments with shapes:', complexityParams.shapes.join(', '));
        
        // Apply narrative composition if available
        try {
            // Legacy behaviour: fresh manager each render
            // Pass the correct parameters to NarrativeCompositionManager
            const narrative = new NarrativeCompositionManager({
                ctx: ctx,
                canvas: canvasElement,
                canvasWidth: canvasElement.width,
                canvasHeight: canvasElement.height
            });
            
            // Call generate with the correct parameters
            narrative.generate(imgs, null, null, complexityParams);
        } catch (error) {
            console.error('Error applying narrative composition:', error);
        }
        
        // Draw the fragments
        this.drawFragments(fragments, ctx, complexityParams);
        
        return fragments;
    }

    // Draw all fragments
    drawFragments(fragments, ctx, params) {
        if (!fragments || fragments.length === 0) return;
        
        const { width, height } = ctx.canvas;
        
        /* ---------- BACKDROP ---------- */
        ctx.save();                              // Take a clean snapshot
        ctx.globalCompositeOperation = 'source-over';   // Reset blend mode
        ctx.clearRect(0, 0, width, height);      // Start from empty
        ctx.fillStyle = params.background || '#f2efe9'; // Set background color
        ctx.fillRect(0, 0, width, height);       // Draw solid color
        ctx.restore();                           // Pop — ctx back to old state
        
        console.log('ctx after backdrop', ctx.globalCompositeOperation);
        
        /* ---------- IMAGE SHARDS ---------- */
        ctx.save();                              // New snapshot
        ctx.globalCompositeOperation = 'multiply';
        
        console.log('ctx while drawing', ctx.globalCompositeOperation);
        
        // Draw each fragment
        fragments.forEach(fragment => {
            ctx.save();
            this.generator.drawFragment(fragment, ctx);
            ctx.restore();
        });
        
        ctx.restore();                           // Leave 'multiply' behind
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