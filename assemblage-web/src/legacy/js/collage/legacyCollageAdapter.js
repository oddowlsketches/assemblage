/**
 * Legacy Collage Adapter
 * 
 * This adapter allows using the legacy collage styles alongside the current styles.
 * It provides a way to switch between old and new implementations without modifying either version.
 */

import LegacyCollageStyles from './legacyCollageStyles.js';

export class LegacyCollageAdapter {
    constructor(collageGenerator) {
        this.collageGenerator = collageGenerator;
        this.legacyStyles = new LegacyCollageStyles(collageGenerator);
    }

    /**
     * Generate a collage using legacy styles
     * @param {string} effectType - The type of effect to generate ('mosaic', 'tiling', or 'fragments')
     * @param {Object} parameters - Parameters for the effect
     * @param {string} variation - The variation of the effect
     */
    generate(effectType, parameters = {}, variation = 'Classic') {
        // Set up parameters for legacy styles
        this.legacyStyles.parameters = {
            ...parameters,
            variation: variation
        };

        // Generate the collage based on effect type
        switch (effectType) {
            case 'mosaic':
                this.legacyStyles.generateMosaic();
                break;
            case 'tiling':
                this.legacyStyles.generateTiling();
                break;
            case 'fragments':
                console.warn('Fragments effect not implemented in legacy styles');
                break;
            default:
                console.warn(`Unknown effect type: ${effectType}`);
                break;
        }
    }
} 