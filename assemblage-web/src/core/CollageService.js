/**
 * CollageService - Core service for generating collages
 * Mirrors the functionality of the legacy generateNewCollage() method
 */

import { TilingGenerator } from '@legacy/collage/tilingGenerator.js';
import { MosaicGenerator } from '@legacy/collage/mosaicGenerator.js';
import { SlicedCollageGenerator } from '@legacy/collage/slicedCollageGenerator.js';
import { NarrativeCompositionManager } from '@legacy/collage/narrativeCompositionManager.js';
import { EnhancedFragmentsGenerator } from './EnhancedFragmentsGenerator.js';
import { CrystalFormationGenerator } from '@legacy/collage/crystalFormationGenerator.js';
import { IsolatedCrystalGenerator } from '@legacy/collage/isolatedCrystalGenerator.js';
import { CrystalGenerator } from '@legacy/collage/crystalGenerator.js';
import { PluginRegistry } from './PluginRegistry.js';

// Initialize plugin registry
const pluginRegistry = new PluginRegistry();

export function withDebug(label, fn) {
  return (...args) => {
    if (import.meta.env.DEV) console.time(label);
    const out = fn(...args);
    if (import.meta.env.DEV) console.timeEnd(label);
    return out;
  };
}

export class CollageService {
    constructor(imagePool, layoutName = 'random') {
        this.imagePool = imagePool;
        this.layoutName = layoutName;
        this.parameters = {
            // Base parameters
            complexity: 6,        // Controls number of images (5-10 recommended)
            density: 5,           // Controls spacing between images (3-8 recommended)
            contrast: 6,          // Controls image contrast (5-7 recommended)
            
            // Tiling specific parameters
            cleanTiling: false,   // Set to false for more artistic layouts
            blendOpacity: 0.6,    // Increased for better visibility
            
            // Image repetition - key new feature
            allowImageRepetition: true,  // Allow some images to repeat
            
            // Variation for fragments effect
            variation: 'Classic',  // Default variation
            
            // Additional parameters for better control
            maxFragments: 8,      // Maximum number of fragments
            minVisibility: 0.7    // Minimum visibility for fragments
        };
    }

    generateBackgroundColor() {
        // Rich, vibrant colors that work well with multiply blend mode
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    selectEffectType() {
        // Define available effects with weights
        const effectWeights = [
            { effect: 'tiling', weight: 15 },
            { effect: 'mosaic', weight: 15 },
            { effect: 'sliced', weight: 15 },
            { effect: 'fragments', weight: 15 },
            { effect: 'crystal', weight: 15 },
            { effect: 'layered', weight: 15 }
        ];
        
        // Calculate total weight
        const totalWeight = effectWeights.reduce((sum, item) => sum + item.weight, 0);
        
        // Generate random number between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Select effect based on weights
        let selectedEffect = effectWeights[0].effect;
        for (const item of effectWeights) {
            if (random < item.weight) {
                selectedEffect = item.effect;
                break;
            }
            random -= item.weight;
        }
        
        return selectedEffect;
    }

    getRandomVariation(effect) {
        switch (effect) {
            case 'fragments':
                const fragmentVariations = ['Classic', 'Organic', 'Focal'];
                return fragmentVariations[Math.floor(Math.random() * fragmentVariations.length)];
            case 'crystal':
                return Math.random() < 0.5 ? 'standard' : 'isolated';
            case 'mosaic':
                const mosaicVariations = ['standard', 'rotated', 'overlapping'];
                return mosaicVariations[Math.floor(Math.random() * mosaicVariations.length)];
            case 'sliced':
                const slicedVariations = ['vertical', 'horizontal', 'diagonal'];
                return slicedVariations[Math.floor(Math.random() * slicedVariations.length)];
            case 'layered':
                const layeredVariations = ['standard', 'overlapping', 'stacked'];
                return layeredVariations[Math.floor(Math.random() * layeredVariations.length)];
            default:
                return 'standard';
        }
    }

    getNumImagesForEffect(effectType) {
        // Base number of images on effect type and complexity
        const baseCount = this.parameters.complexity;
        switch (effectType) {
            case 'tiling':
                return baseCount + 2;  // Tiling needs more images
            case 'fragments':
                return baseCount + 1;  // Fragments work well with slightly more images
            case 'mosaic':
                return Math.max(4, Math.floor(Math.sqrt(baseCount * 2)));  // Square grid
            case 'sliced':
                return baseCount;  // Sliced works well with base count
            case 'layered':
                return Math.min(baseCount, 4);  // Layers work best with fewer images
            default:
                return baseCount;
        }
    }

    async loadImage(src) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = src;
        });
    }

    async selectImages(numImages) {
        const picks = this.imagePool
            .sort(() => 0.5 - Math.random())
            .slice(0, numImages);

        return Promise.all(picks.map((p) => 
            typeof p === 'string' ? this.loadImage(p) : p
        ));
    }

    async createCollage(canvas, layoutName = 'random', numImages = 4) {
        const ctx = canvas.getContext('2d');
        
        // ensure we start fresh for every effect
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.resetClip?.();        // if browser supports it
        ctx.globalCompositeOperation = 'source-over';
        
        if (layoutName === 'random') {
            layoutName = this.selectEffectType();
        }
        
        console.log('Creating collage with layout:', layoutName);
        
        // Get layout from plugin registry or fallback to fragments
        const layout = pluginRegistry.getLayout(layoutName);
        if (!layout) {
            console.warn(`Layout ${layoutName} not found, falling back to fragments`);
            layoutName = 'fragments';
        }

        // Get appropriate number of images for the effect
        const numImagesForEffect = this.getNumImagesForEffect(layoutName);
        console.log(`Using ${numImagesForEffect} images for ${layoutName} effect`);
        
        const chosenImages = await this.selectImages(numImagesForEffect);
        
        // Ensure we have a valid layout before proceeding
        if (!layout) {
            throw new Error(`Layout ${layoutName} not found and fallback failed`);
        }

        const variation = this.getRandomVariation(layoutName);
        console.log(`Using variation: ${variation} for ${layoutName}`);

        // Special handling for sliced layout to randomly select between variants
        if (layoutName === 'sliced') {
            const r = Math.random();
            if (r < 0.33) {
                console.log('Using horizontal sliced layout');
                await layout.renderHorizontal(ctx, chosenImages, canvas, { variation });
            } else if (r < 0.66) {
                console.log('Using vertical sliced layout');
                await layout.renderVertical(ctx, chosenImages, canvas, { variation });
            } else {
                console.log('Using random sliced layout');
                await layout.renderRandom(ctx, chosenImages, canvas, { variation });
            }
        } else {
            // For all other layouts, use the standard render method
            await layout.render(ctx, chosenImages, canvas, { variation });
        }

        // Randomly apply narrative overlay (25% chance)
        if (Math.random() < 0.25) {
            console.log('Applying narrative overlay');
            const narrativeLayout = pluginRegistry.getLayout('narrative');
            await narrativeLayout.render(ctx, chosenImages, canvas, { variation });
        }
    }
} 