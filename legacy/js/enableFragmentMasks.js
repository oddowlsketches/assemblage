/**
 * Enable Fragment Masks
 * 
 * This module enables mask support for fragments in the Assemblage app.
 * It uses a non-invasive approach that safely modifies only the fragments 
 * drawing functionality without touching other parts of the code.
 * 
 * To use: Simply add this script after the main app script:
 * <script type="module" src="js/enableFragmentMasks.js"></script>
 */

import { applyMasksToFragments, drawMaskedFragment } from './fragmentsMaskSupport.js';

// Default configuration
const DEFAULT_CONFIG = {
    enabled: true,
    probability: 0.2, // 20% chance of applying a mask
    maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'],
    consistentMasks: false // Whether to use the same mask type for all fragments
};

// Mask settings - can be adjusted here or via console for testing
const MASK_SETTINGS = { ...DEFAULT_CONFIG };

// Wait for app to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure app is properly initialized
    setTimeout(() => enableFragmentMasks(), 500);
});

/**
 * Main function to enable fragment masks
 */
function enableFragmentMasks() {
    // Get the app instance from window
    const app = window.app;
    
    if (!app) {
        console.warn('Assemblage app not found, will retry in 500ms...');
        setTimeout(() => enableFragmentMasks(), 500);
        return;
    }
    
    console.log('Enabling mask support for fragments...');
    
    try {
        // Get the CollageGenerator instance
        const generator = app.generator;
        
        if (!generator) {
            console.warn('CollageGenerator not found in app');
            return;
        }
        
        // Save the original generateFragments method
        const originalGenerateFragments = generator.generateFragments;
        
        // Override the generateFragments method to add mask support
        generator.generateFragments = async function(images, fortuneText, parameters = {}) {
            try {
                // Check if mask support is enabled
                if (!MASK_SETTINGS.enabled) {
                    // If not enabled, just call the original method
                    return originalGenerateFragments.call(this, images, fortuneText, parameters);
                }
                
                // Get current context state to restore later if needed
                const originalGlobalCompositeOperation = this.ctx.globalCompositeOperation;
                const originalGlobalAlpha = this.ctx.globalAlpha;
                
                // Step 1: Call the original method to get the base fragments
                const fragments = await originalGenerateFragments.call(this, images, fortuneText, parameters);
                
                // Step 2: Apply masks to fragments
                const maskedFragments = applyMasksToFragments(fragments, MASK_SETTINGS);
                
                // Step 3: Draw the masked fragments
                // Clear the canvas first
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Set background color
                const backgroundColor = parameters.backgroundColor || this.generateBackgroundColor();
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Set blend mode
                this.ctx.globalCompositeOperation = 'multiply';
                
                // Sort fragments by depth
                const sortedFragments = [...maskedFragments].sort((a, b) => a.depth - b.depth);
                
                // Draw each fragment
                sortedFragments.forEach(fragment => {
                    // Skip if fragment is invalid
                    if (!fragment || typeof fragment !== 'object') {
                        console.warn('Invalid fragment:', fragment);
                        return;
                    }
                    
                    // Get the image using the img index
                    const img = images[fragment.img];
                    
                    // Skip missing or incomplete images
                    if (!img || !img.complete) {
                        console.warn(`Invalid image at index ${fragment.img}, skipping fragment`);
                        return;
                    }
                    
                    // Calculate opacity based on depth
                    let opacity;
                    if (fragment.forceFullOpacity) {
                        opacity = 1.0;
                    } else if (parameters.variation === 'Classic') {
                        opacity = 0.3 + fragment.depth * 0.6;
                    } else if (parameters.variation === 'Organic') {
                        opacity = 0.25 + fragment.depth * 0.7;
                    } else if (parameters.variation === 'Focal') {
                        opacity = 0.35 + fragment.depth * 0.6;
                    } else {
                        opacity = 0.3 + fragment.depth * 0.6;
                    }
                    
                    // Clamp opacity between 0.25 and 1.0
                    opacity = Math.max(0.25, Math.min(1.0, opacity));
                    
                    // Draw the fragment (with mask if applicable)
                    drawMaskedFragment(this.ctx, fragment, img, opacity);
                });
                
                // Reset blend mode
                this.ctx.globalCompositeOperation = originalGlobalCompositeOperation;
                this.ctx.globalAlpha = originalGlobalAlpha;
                
                // Add fortune text if provided
                if (fortuneText && this.addFortuneText) {
                    this.addFortuneText(fortuneText);
                }
                
                // Return the fragments for potential future use
                return maskedFragments;
            } catch (error) {
                console.error('Error in enhanced generateFragments:', error);
                // Fall back to original method
                return originalGenerateFragments.call(this, images, fortuneText, parameters);
            }
        };
        
        console.log('📊 Fragment mask support successfully enabled!');
        console.log('Current mask settings:', MASK_SETTINGS);
        console.log('To adjust settings, use: window.updateMaskSettings({...})');
        
        // Export utility function to adjust settings
        window.updateMaskSettings = function(newSettings) {
            if (!newSettings || typeof newSettings !== 'object') {
                console.error('Invalid settings object');
                return;
            }
            
            // Update settings
            Object.assign(MASK_SETTINGS, newSettings);
            console.log('Updated mask settings:', MASK_SETTINGS);
        };
        
        // Export utility function to disable mask support
        window.disableFragmentMasks = function() {
            MASK_SETTINGS.enabled = false;
            console.log('Fragment mask support disabled');
        };
        
        // Export utility function to enable mask support
        window.enableFragmentMasks = function() {
            MASK_SETTINGS.enabled = true;
            console.log('Fragment mask support enabled');
        };
    } catch (error) {
        console.error('Error enabling fragment mask support:', error);
    }
}
