/**
 * Mask Integration Module
 * 
 * This module provides a safe way to integrate mask shapes into the main Assemblage app.
 * It uses a proxy pattern to hook into the fragment generation pipeline without modifying
 * the core application code.
 */

import { SimpleMaskManager } from './simpleMaskManager.js';

// Default mask settings
const DEFAULT_MASK_SETTINGS = {
    enabled: true,
    probability: 0.2, // 20% chance of applying masks by default
    consistentMasksForMosaic: true, // Use consistent mask type for mosaic layouts
    enabledMaskTypes: ['circle', 'triangle', 'rectangle', 'ellipse']
};

/**
 * MaskIntegration class - handles safely integrating masks into the app
 */
export class MaskIntegration {
    constructor(settings = {}) {
        // Merge default settings with provided settings
        this.settings = {
            ...DEFAULT_MASK_SETTINGS,
            ...settings
        };
        
        // Create mask manager instance
        this.maskManager = new SimpleMaskManager();
        
        // Store original methods to restore later if needed
        this.originalMethods = new Map();
    }
    
    /**
     * Integrates mask functionality into the CollageGenerator
     * @param {CollageGenerator} generator - The collage generator instance
     */
    integrateWithGenerator(generator) {
        if (!generator) {
            console.error('Cannot integrate masks: generator is undefined');
            return false;
        }
        
        console.log('Integrating mask functionality with collage generator');
        
        try {
            // Store original methods
            this.storeOriginalMethod(generator, 'drawFragments');
            this.storeOriginalMethod(generator, 'generateTiling');
            this.storeOriginalMethod(generator, 'generateFragments');
            this.storeOriginalMethod(generator, 'generateMosaic');
            this.storeOriginalMethod(generator, 'generateLayers');
            
            // Override drawFragments to handle masked elements
            this.overrideDrawFragments(generator);
            
            // Override fragment generation methods
            this.overrideFragmentGeneration(generator);
            
            return true;
        } catch (error) {
            console.error('Error integrating mask functionality:', error);
            // Attempt to restore original methods
            this.restoreAllMethods(generator);
            return false;
        }
    }
    
    /**
     * Disables mask integration and restores original methods
     * @param {CollageGenerator} generator - The collage generator instance
     */
    disableIntegration(generator) {
        if (!generator) return false;
        
        console.log('Disabling mask integration');
        return this.restoreAllMethods(generator);
    }
    
    /**
     * Stores an original method for later restoration
     * @private
     */
    storeOriginalMethod(object, methodName) {
        if (!object || !object[methodName] || typeof object[methodName] !== 'function') {
            return false;
        }
        
        const key = `${object.constructor.name}.${methodName}`;
        this.originalMethods.set(key, object[methodName]);
        return true;
    }
    
    /**
     * Restores all original methods
     * @private
     */
    restoreAllMethods(generator) {
        try {
            // Restore drawFragments
            const drawFragmentsKey = `${generator.constructor.name}.drawFragments`;
            if (this.originalMethods.has(drawFragmentsKey)) {
                generator.drawFragments = this.originalMethods.get(drawFragmentsKey);
            }
            
            // Restore fragment generation methods
            const methods = ['generateTiling', 'generateFragments', 'generateMosaic', 'generateLayers'];
            methods.forEach(method => {
                const key = `${generator.constructor.name}.${method}`;
                if (this.originalMethods.has(key)) {
                    generator[method] = this.originalMethods.get(key);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error restoring original methods:', error);
            return false;
        }
    }
    
    /**
     * Overrides the drawFragments method to handle masked elements
     * @private
     */
    overrideDrawFragments(generator) {
        const originalDrawFragments = generator.drawFragments;
        const maskManager = this.maskManager;
        
        generator.drawFragments = function(fragments, fortune) {
            if (!fragments || !Array.isArray(fragments)) {
                console.warn('Invalid fragments passed to drawFragments');
                return originalDrawFragments.call(this, fragments, fortune);
            }
            
            try {
                // Clear the canvas
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Sort fragments by depth if available
                const sortedFragments = [...fragments].sort((a, b) => {
                    return (a.depth || 0) - (b.depth || 0);
                });
                
                // Draw each fragment
                for (const fragment of sortedFragments) {
                    // Skip invalid fragments
                    if (!fragment || typeof fragment.img !== 'object') continue;
                    
                    // Get the image
                    const img = fragment.img;
                    if (!img || !img.complete) continue;
                    
                    // Apply standard drawing
                    if (!fragment.maskType) {
                        // Standard drawing (unmasked)
                        this.ctx.save();
                        
                        // Apply opacity if specified
                        if (fragment.opacity !== undefined) {
                            this.ctx.globalAlpha = fragment.opacity;
                        }
                        
                        // Apply blend mode if specified
                        if (fragment.blendMode) {
                            this.ctx.globalCompositeOperation = fragment.blendMode;
                        }
                        
                        // Apply rotation if specified
                        if (fragment.rotation) {
                            const centerX = fragment.x + fragment.width / 2;
                            const centerY = fragment.y + fragment.height / 2;
                            this.ctx.translate(centerX, centerY);
                            this.ctx.rotate(fragment.rotation * Math.PI / 180);
                            this.ctx.translate(-centerX, -centerY);
                        }
                        
                        // Draw the image
                        if (fragment.clipX !== undefined && fragment.clipY !== undefined &&
                            fragment.clipWidth !== undefined && fragment.clipHeight !== undefined) {
                            // Draw with clip region
                            this.ctx.drawImage(
                                img,
                                fragment.clipX, fragment.clipY,
                                fragment.clipWidth, fragment.clipHeight,
                                fragment.x, fragment.y,
                                fragment.width, fragment.height
                            );
                        } else {
                            // Draw without clip region
                            this.ctx.drawImage(
                                img,
                                fragment.x, fragment.y,
                                fragment.width, fragment.height
                            );
                        }
                        
                        this.ctx.restore();
                    } else {
                        // Masked drawing
                        maskManager.drawMaskedElement(this.ctx, fragment, img);
                    }
                }
                
                // Draw fortune text if provided
                if (fortune && this.drawFortuneText) {
                    this.drawFortuneText(fortune);
                }
                
                return true;
            } catch (error) {
                console.error('Error in drawFragments:', error);
                // Fall back to original method
                return originalDrawFragments.call(this, fragments, fortune);
            }
        };
    }
    
    /**
     * Overrides fragment generation methods to add masks
     * @private
     */
    overrideFragmentGeneration(generator) {
        const self = this;
        
        // Override each fragment generation method
        ['generateTiling', 'generateFragments', 'generateMosaic', 'generateLayers'].forEach(methodName => {
            const originalMethod = generator[methodName];
            
            if (typeof originalMethod !== 'function') {
                console.warn(`Method ${methodName} not found or not a function`);
                return;
            }
            
            generator[methodName] = function(...args) {
                try {
                    // Call the original method
                    const fragments = originalMethod.apply(this, args);
                    
                    // Skip mask application if disabled
                    if (!self.settings.enabled) {
                        return fragments;
                    }
                    
                    // Apply masks to generated fragments
                    const effectType = methodName.replace('generate', '').toLowerCase();
                    return self.applyMasksToFragments(fragments, effectType);
                } catch (error) {
                    console.error(`Error in ${methodName}:`, error);
                    // Fall back to original method
                    return originalMethod.apply(this, args);
                }
            };
        });
    }
    
    /**
     * Apply masks to fragments based on current settings
     * @param {Array} fragments - The fragments to apply masks to
     * @param {string} layoutType - The type of layout (tiling, fragments, mosaic, layers)
     * @returns {Array} - The modified fragments
     */
    applyMasksToFragments(fragments, layoutType) {
        if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
            return fragments;
        }
        
        // Skip if probability is 0 or no enabled mask types
        if (this.settings.probability <= 0 || this.settings.enabledMaskTypes.length === 0) {
            return fragments;
        }
        
        try {
            // Make a copy of fragments to avoid modifying the originals
            const fragmentsCopy = JSON.parse(JSON.stringify(fragments));
            
            // Special handling for mosaic layouts with consistent masks
            if (layoutType === 'mosaic' && this.settings.consistentMasksForMosaic) {
                // Select a single mask type for the entire mosaic
                const maskTypes = this.settings.enabledMaskTypes;
                const selectedMaskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
                
                console.log(`Applying consistent ${selectedMaskType} mask to mosaic layout`);
                
                // Apply the same mask type to a random subset of elements
                fragmentsCopy.forEach(fragment => {
                    // Apply masks with probability adjusted for mosaic (higher than standard)
                    const maskProbability = Math.min(this.settings.probability * 1.5, 0.8);
                    if (Math.random() < maskProbability) {
                        try {
                            const maskedFragment = this.maskManager.maskElement(fragment, selectedMaskType);
                            // Copy new properties back to original fragment
                            Object.assign(fragment, maskedFragment);
                        } catch (error) {
                            console.error('Error applying mask to fragment:', error);
                        }
                    }
                });
            } else {
                // For other layouts, apply varied masks based on probability
                fragmentsCopy.forEach(fragment => {
                    // Apply mask with the configured probability
                    if (Math.random() < this.settings.probability) {
                        // Select a random mask type from enabled types
                        const maskTypes = this.settings.enabledMaskTypes;
                        const selectedMaskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
                        
                        try {
                            const maskedFragment = this.maskManager.maskElement(fragment, selectedMaskType);
                            // Copy new properties back to original fragment
                            Object.assign(fragment, maskedFragment);
                        } catch (error) {
                            console.error('Error applying mask to fragment:', error);
                        }
                    }
                });
            }
            
            return fragmentsCopy;
        } catch (error) {
            console.error('Error in applyMasksToFragments:', error);
            return fragments; // Return original fragments if there's an error
        }
    }
    
    /**
     * Update mask settings
     * @param {Object} newSettings - The new settings to apply
     */
    updateSettings(newSettings) {
        if (!newSettings) return;
        
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        
        console.log('Updated mask settings:', this.settings);
    }
}

// Create a global instance for easy access
const maskIntegration = new MaskIntegration();
export default maskIntegration;
