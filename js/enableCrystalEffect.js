/**
 * Enable Crystal Effect for Assemblage
 * 
 * Simple integration script to enable the isolated crystal effect in the main application
 */

import IsolatedCrystalIntegration from './collage/isolatedCrystalIntegration.js';

/**
 * Enables the isolated crystal effect in the app
 * @param {Object} app - The main application instance
 * @returns {boolean} - Success indicator
 */
export function enableCrystalEffect(app) {
    if (!app) {
        console.error('App not provided to enableCrystalEffect');
        return false;
    }
    
    try {
        // Check if collage generator exists
        if (!app.collageGenerator) {
            console.error('Collage generator not initialized');
            return false;
        }
        
        // Check if integration already exists
        if (!app._crystalIntegration) {
            // Initialize integration
            app._crystalIntegration = new IsolatedCrystalIntegration(app);
            
            // Add to effects list
            app._crystalIntegration.addToEffectsList();
            
            // Set crystal effect as available
            app.collageGenerator.hasCrystalEffect = true;
            
            console.log('Crystal effect successfully enabled');
        } else {
            console.log('Crystal effect already enabled');
        }
        
        return true;
    } catch (error) {
        console.error('Error enabling crystal effect:', error);
        return false;
    }
}

// Auto-enable the crystal effect if the app is available in the window
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure app is initialized
    setTimeout(() => {
        if (window.app) {
            console.log('Auto-enabling crystal effect');
            enableCrystalEffect(window.app);
        } else {
            console.warn('App not available for auto-enabling crystal effect');
        }
    }, 1000);
});

// Export for manual import and activation
export default enableCrystalEffect;