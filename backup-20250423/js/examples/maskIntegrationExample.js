/**
 * Mask Integration Example
 * 
 * This file demonstrates how to safely integrate the masking functionality
 * with the main Assemblage app. 
 * 
 * To use in production, simply add a few lines to your main app initialization:
 * 
 * 1. Import the maskIntegration module
 * 2. After initializing your CollageGenerator, call maskIntegration.integrateWithGenerator()
 */

// Import the mask integration module
import maskIntegration from '../maskIntegration.js';

// Example usage in main app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Assume this is your existing app initialization
    const app = window.app;
    
    // Check if the app and its generator are available
    if (app && app.generator) {
        // Configure mask settings if needed
        maskIntegration.updateSettings({
            enabled: true,
            probability: 0.2, // 20% chance of applying masks
            consistentMasksForMosaic: true,
            enabledMaskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'] 
        });
        
        // Integrate masks with the collage generator
        const success = maskIntegration.integrateWithGenerator(app.generator);
        
        if (success) {
            console.log('🎭 Mask integration successfully enabled!');
        } else {
            console.error('Failed to integrate masks with the collage generator');
        }
    } else {
        console.warn('App or generator not available for mask integration');
    }
});

/**
 * To safely test this integration, you can:
 * 
 * 1. Include this script in your index.html after your main app script:
 *    <script type="module" src="js/examples/maskIntegrationExample.js"></script>
 * 
 * 2. If something goes wrong, you can disable the integration:
 *    maskIntegration.disableIntegration(app.generator);
 * 
 * 3. For a more controlled rollout, you could add a UI toggle:
 *    <div class="mask-toggle">
 *        <label>
 *            <input type="checkbox" id="enableMasks" checked>
 *            Enable shape masks
 *        </label>
 *    </div>
 * 
 *    Then add this code:
 *    document.getElementById('enableMasks').addEventListener('change', function(e) {
 *        if (e.target.checked) {
 *            maskIntegration.updateSettings({ enabled: true });
 *            maskIntegration.integrateWithGenerator(app.generator);
 *        } else {
 *            maskIntegration.updateSettings({ enabled: false });
 *            maskIntegration.disableIntegration(app.generator);
 *        }
 *    });
 */
