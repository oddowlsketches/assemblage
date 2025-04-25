/**
 * CollageService - Core service for generating collages
 * Mirrors the functionality of the legacy generateNewCollage() method
 */

import { TilingGenerator } from '@legacy/collage/tilingGenerator.js';
import { MosaicGenerator } from '@legacy/collage/mosaicGenerator.js';
import { SlicedCollageGenerator } from '@legacy/collage/slicedCollageGenerator.js';
import { NarrativeCompositionManager } from '@legacy/collage/narrativeCompositionManager.js';
import { EnhancedFragmentsGenerator } from './EnhancedFragmentsGenerator.js';
import { CrystalGenerator } from '@legacy/collage/crystalGenerator.js';

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

    async createCollage(canvasRef) {
        if (!canvasRef || !this.imagePool || this.imagePool.length === 0) {
            console.error('Cannot generate collage: missing canvas or images');
            return;
        }

        const canvas = canvasRef;
        const ctx = canvas.getContext('2d');

        // Clear canvas and set background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const backgroundColor = this.generateBackgroundColor();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Select effect type
        const effectType = this.selectEffectType();
        console.log('[DEBUG] Selected effect type:', effectType);

        // Get variation for the effect
        const variation = this.getRandomVariation(effectType);
        if (variation) {
            this.parameters.variation = variation;
            console.log('[DEBUG] Selected variation:', variation);
        }

        // Get images for the effect
        const numImages = this.getNumImagesForEffect(effectType);
        const images = this.imagePool.slice(0, numImages);

        // Set multiply blend mode for images
        ctx.globalCompositeOperation = 'multiply';

        // Initialize appropriate generator based on effect type
        let generator;
        switch (effectType) {
            case 'tiling':
                generator = new TilingGenerator(canvas, this.parameters);
                await generator.generateTiles(images);
                break;
            case 'fragments':
                generator = new EnhancedFragmentsGenerator(ctx, canvas);
                await generator.generate(images, null, effectType, this.parameters);
                break;
            case 'mosaic':
                generator = new MosaicGenerator(canvas, this.parameters);
                await generator.generateMosaic(images);
                break;
            case 'sliced':
                generator = new SlicedCollageGenerator(ctx, canvas);
                await generator.generateSliced(images, null, this.parameters);
                break;
            case 'narrative':
                generator = new NarrativeCompositionManager({ctx, canvas, ...this.parameters});
                await generator.generate(images, null, 'layers', this.parameters);
                break;
            case 'crystal':
                // Add crystal-specific parameters
                const crystalParams = {
                    ...this.parameters,
                    crystalComplexity: this.parameters.complexity || 5,
                    crystalDensity: this.parameters.density || 5,
                    crystalOpacity: 0.7,
                    isolatedMode: Math.random() > 0.5, // Randomly choose between isolated and regular mode
                    addGlow: Math.random() > 0.7, // Occasionally add glow effect
                    rotationRange: 45 // Maximum rotation angle in degrees
                };
                generator = new CrystalGenerator(canvas, crystalParams);
                await generator.generateCrystalCollage(images);
                break;
            default:
                console.error('Unknown effect type:', effectType);
                return;
        }
    }
} 