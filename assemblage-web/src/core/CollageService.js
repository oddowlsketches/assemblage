/**
 * CollageService - Core service for generating collages
 * Mirrors the functionality of the legacy generateNewCollage() method
 */

import { TilingGenerator } from '@legacy/collage/tilingGenerator.js';
import { MosaicGenerator } from '@legacy/collage/mosaicGenerator.js';
import { SlicedCollageGenerator } from '@legacy/collage/slicedCollageGenerator.js';
import { NarrativeCompositionManager } from '@legacy/collage/narrativeCompositionManager.js';
import { EnhancedFragmentsGenerator } from './EnhancedFragmentsGenerator.js';
import CrystalLayout from '../plugins/layouts/CrystalLayout.js';
import FragmentsLayout from '../plugins/layouts/FragmentsLayout.js';

// Initialize layouts
const layouts = {
    crystal: new CrystalLayout(),
    fragments: new FragmentsLayout()
};

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
            { effect: 'narrative', weight: 15 },
            { effect: 'fragments', weight: 15 },
            { effect: 'crystal', weight: 15 }
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
        if (effect === 'fragments') {
            const variations = ['Classic', 'Organic', 'Focal'];
            return variations[Math.floor(Math.random() * variations.length)];
        }
        return null;
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
            case 'layers':
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

    async createCollage(canvas, layoutName = 'fragments', numImages = 4) {
        const ctx = canvas.getContext('2d');
        const layout = this.layouts[layoutName];
        if (!layout) {
            throw new Error(`Layout ${layoutName} not found`);
        }

        const chosenImages = await this.selectImages(numImages);
        
        withDebug(layout.constructor.name, () =>
            layout.render(ctx, chosenImages, canvas, this.opts)
        )();

        return canvas;
    }
} 