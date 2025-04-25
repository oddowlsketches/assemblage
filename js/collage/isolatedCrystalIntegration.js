/**
 * Isolated Crystal Integration for Assemblage
 * 
 * Provides methods to easily integrate the isolated crystal effect into the main application
 */

import IsolatedCrystalGenerator from './isolatedCrystalGenerator.js';

class IsolatedCrystalIntegration {
    constructor(app) {
        this.app = app;
        this.collageGenerator = app.collageGenerator;
        
        console.log('Initializing IsolatedCrystalIntegration...');
        
        if (!this.collageGenerator) {
            console.error('Collage generator not available for crystal integration');
            return;
        }
        
        // Initialize the crystal generator if not already done
        if (!this.collageGenerator.isolatedCrystalGenerator) {
            try {
                console.log('Initializing isolated crystal generator');
                this.collageGenerator.isolatedCrystalGenerator = new IsolatedCrystalGenerator(
                    this.collageGenerator.ctx, 
                    this.collageGenerator.canvas
                );
                console.log('Isolated crystal generator initialized successfully');
            } catch (error) {
                console.error('Failed to initialize isolated crystal generator:', error);
                return;
            }
        } else {
            console.log('Isolated crystal generator already initialized');
        }
        
        // Add isolated crystal mode to effect settings
        if (!this.collageGenerator.effectSettings) {
            this.collageGenerator.effectSettings = {};
            console.log('Created new effect settings object');
        }

        // Update effect settings with crystal options
        this.collageGenerator.effectSettings.crystal = {
            ...this.collageGenerator.effectSettings.crystal,
            isolatedMode: true,
            addGlow: false, // Explicitly set to false as requested
            complexity: 5,
            maxFacets: 25,
            templates: ['hexagonal', 'irregular', 'angular', 'elongated']
        };
        
        console.log('Updated crystal effect settings:', this.collageGenerator.effectSettings.crystal);
        
        // Make sure we have crystal effect available
        this.collageGenerator.hasCrystalEffect = true;
        
        console.log('Isolated Crystal integration complete');
    }
    
    /**
     * Generate an isolated crystal effect
     * @param {Array} images - Array of images to use
     * @param {string} fortuneText - Fortune text if any
     * @param {Object} parameters - Optional parameters for crystal generation
     * @returns {Promise<boolean>} Success indicator
     */
    async generateIsolatedCrystal(images, fortuneText, parameters = {}) {
        if (!this.collageGenerator || !this.collageGenerator.isolatedCrystalGenerator) {
            console.error('Crystal generator not available');
            return false;
        }
        
        try {
            const crystalParams = {
                ...parameters,
                isolatedMode: true,
                addGlow: false // Always disable glow effect
            };
            
            // DIRECTLY call the generator to avoid any indirection
            console.log('Using isolated crystal generator directly without going through collageGenerator');
            return await this.collageGenerator.isolatedCrystalGenerator.generateIsolatedCrystal(images, fortuneText, crystalParams);
        } catch (error) {
            console.error('Error generating isolated crystal:', error);
            return false;
        }
    }
    
    /**
     * Add isolated crystal generator to the app
     */
    addToEffectsList() {
        // Add isolated crystal to the available effects list if not already there
        if (!this.app.availableEffects) {
            this.app.availableEffects = ['tiling', 'fragments', 'mosaic', 'sliced', 'crystal'];
        } else if (!this.app.availableEffects.includes('crystal')) {
            this.app.availableEffects.push('crystal');
        }
        
        console.log('Added crystal effect to available effects:', this.app.availableEffects);
    }
}

export default IsolatedCrystalIntegration;