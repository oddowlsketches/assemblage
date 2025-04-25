/**
 * Minimalist Image Quality Fix for Assemblage
 * 
 * This script ONLY modifies specific scaling parameters
 * without touching any other functionality.
 */

(function() {
    console.log('[Minimalist Fix] Loading minimalist image quality fix...');
    
    // Track which effects we're observing
    let observedEffects = {
        tiling: false,
        fragments: false,
        mosaic: false,
        sliced: false,
        crystal: false
    };
    
    // Function to monitor effect selection
    function monitorEffectSelection() {
        // Store original effect generation methods
        const originalGenerate = window.CollageGenerator?.prototype?.generate;
        
        if (originalGenerate) {
            window.CollageGenerator.prototype.generate = function(images, fortuneText, effect, settings) {
                // Track which effect is being used
                if (effect && typeof effect === 'string') {
                    observedEffects[effect] = true;
                    console.log(`[Minimalist Fix] Observed effect: ${effect}`);
                    
                    // ONLY for tiling and crystal effects, apply conservative scaling
                    if (effect === 'tiling' && settings) {
                        // Clone settings to avoid modifying the original
                        const modifiedSettings = JSON.parse(JSON.stringify(settings));
                        
                        // Apply conservative tiling scaling ONLY
                        if (modifiedSettings.maxScale && modifiedSettings.maxScale > 1.8) {
                            console.log(`[Minimalist Fix] Reducing tiling maxScale from ${modifiedSettings.maxScale} to 1.8`);
                            modifiedSettings.maxScale = 1.8;
                        }
                        
                        // Call original with modified settings
                        return originalGenerate.call(this, images, fortuneText, effect, modifiedSettings);
                    }
                    
                    if (effect === 'crystal' && settings) {
                        // Clone settings to avoid modifying the original
                        const modifiedSettings = JSON.parse(JSON.stringify(settings));
                        
                        // Apply conservative crystal scaling ONLY
                        if (modifiedSettings.crystalSize && modifiedSettings.crystalSize > 0.8) {
                            console.log(`[Minimalist Fix] Reducing crystal size from ${modifiedSettings.crystalSize} to 0.8`);
                            modifiedSettings.crystalSize = 0.8;
                        }
                        
                        // Call original with modified settings
                        return originalGenerate.call(this, images, fortuneText, effect, modifiedSettings);
                    }
                }
                
                // For all other effects, call original without modification
                return originalGenerate.apply(this, arguments);
            };
            
            console.log('[Minimalist Fix] Monitoring effect selection');
        }
    }
    
    // Wait for app to be ready
    function waitForApp() {
        // Check if CollageGenerator is available directly
        if (window.CollageGenerator) {
            console.log('[Minimalist Fix] Found CollageGenerator constructor directly');
            monitorEffectSelection();
            return;
        }
        
        // Check if TilingGenerator is available
        if (window.TilingGenerator) {
            // Fix only the getScale method
            const originalGetScale = window.TilingGenerator.prototype.getScale;
            
            if (originalGetScale) {
                window.TilingGenerator.prototype.getScale = function(useDramaticScaling) {
                    // Original logic
                    const minScale = 0.9;
                    // More conservative maximum scale only
                    const maxScale = useDramaticScaling ? 1.8 : 1.4; // Reduced from 3.0/2.5
                    
                    return minScale + Math.random() * (maxScale - minScale);
                };
                
                console.log('[Minimalist Fix] Fixed TilingGenerator.getScale');
            }
        }
        
        // If not available immediately, check again later
        setTimeout(function() {
            // Try to find CollageGenerator in window/app
            if (window.app && window.app.collageGenerator) {
                console.log('[Minimalist Fix] Found CollageGenerator in app');
                
                // Only fix tiling parameters directly
                const generator = window.app.collageGenerator;
                
                if (generator.tilingParameters) {
                    if (generator.tilingParameters.smallCountMode) {
                        generator.tilingParameters.smallCountMode.maxScale = 1.2; // reduced from something higher
                    }
                    
                    if (generator.tilingParameters.largeCountMode) {
                        generator.tilingParameters.largeCountMode.maxScale = 0.7; // reduced from something higher
                    }
                    
                    console.log('[Minimalist Fix] Adjusted tiling parameters');
                }
                
                // Log observed effects
                console.log('[Minimalist Fix] Observed effects:', Object.keys(observedEffects).filter(key => observedEffects[key]));
            } else {
                console.log('[Minimalist Fix] Could not find CollageGenerator instance, only prototype methods modified');
            }
        }, 3000);
    }
    
    // Start when the page is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForApp);
    } else {
        waitForApp();
    }
    
    // Also try at window.onload
    window.addEventListener('load', function() {
        console.log('[Minimalist Fix] Window loaded, checking for missing effects...');
        setTimeout(function() {
            // Log missing effects
            const missingEffects = Object.keys(observedEffects).filter(key => !observedEffects[key]);
            if (missingEffects.length > 0) {
                console.log('[Minimalist Fix] Some effects may be missing:', missingEffects);
            }
        }, 5000);
    });
    
    console.log('[Minimalist Fix] Minimalist image quality fix loaded');
})();
