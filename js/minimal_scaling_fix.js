/**
 * Minimal Scaling Fix for Assemblage
 * 
 * This is an extremely conservative fix that ONLY adjusts scaling parameters
 * without touching any drawing methods or integration points
 */

(function() {
    console.log('[Minimal Fix] Loading minimal scaling fix...');
    
    // Wait a bit for app to load
    setTimeout(function() {
        console.log('[Minimal Fix] Searching for collage generator...');
        
        // Try to find the generator instance
        let generator = null;
        
        if (window.app && window.app.collageGenerator) {
            generator = window.app.collageGenerator;
            console.log('[Minimal Fix] Found generator via window.app.collageGenerator');
        } else {
            // We couldn't find the generator, so let's be ultra-safe and do nothing
            console.log('[Minimal Fix] Could not find collage generator, aborting');
            return;
        }
        
        console.log('[Minimal Fix] Carefully adjusting minimal scaling parameters...');
        
        // ONLY modify the tilingParameters - this is the safest approach
        if (generator.tilingParameters) {
            // Create a backup of the original parameters
            const origParams = JSON.parse(JSON.stringify(generator.tilingParameters));
            console.log('[Minimal Fix] Original tilingParameters:', origParams);
            
            // Make very conservative adjustments (less aggressive than before)
            if (origParams.smallCountMode && origParams.smallCountMode.maxScale > 1.8) {
                generator.tilingParameters.smallCountMode.maxScale = 1.8;
            }
            
            if (origParams.largeCountMode && origParams.largeCountMode.maxScale > 1.2) {
                generator.tilingParameters.largeCountMode.maxScale = 1.2;
            }
            
            console.log('[Minimal Fix] Adjusted tilingParameters:', generator.tilingParameters);
        }
        
        // Special handling for scale parameters in the TilingGenerator
        if (generator.tilingGenerator) {
            // Backup the original parameters
            if (!generator.tilingGenerator._origParams) {
                generator.tilingGenerator._origParams = {};
            }
            
            // Very carefully modify ONLY the getScale function
            if (generator.tilingGenerator.getScale) {
                const origGetScale = generator.tilingGenerator.getScale;
                
                // Create a wrapper that ONLY constrains the return value
                generator.tilingGenerator.getScale = function(useDramaticScaling = false) {
                    // Call original method to get its result
                    const originalScale = origGetScale.call(this, useDramaticScaling);
                    
                    // Apply a very mild constraint (max 2.0 scaling)
                    const maxAllowedScale = 2.0;
                    return Math.min(originalScale, maxAllowedScale);
                };
                
                console.log('[Minimal Fix] Added conservative scaling constraint to tilingGenerator.getScale');
            }
        }
        
        console.log('[Minimal Fix] Successfully applied minimal scaling constraints');
    }, 2000);
    
    console.log('[Minimal Fix] Minimal scaling fix initialized');
})();
