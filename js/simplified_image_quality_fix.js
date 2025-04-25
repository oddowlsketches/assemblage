/**
 * Simplified Image Quality Fix for Assemblage
 * 
 * This script focuses exclusively on scaling parameters without
 * modifying drawing methods or waiting for app initialization.
 */

(function() {
    console.log('[Simplified Fix] Loading image quality fix...');
    
    // Direct modification of prototype methods to fix scaling issues
    
    // 1. Fix TilingGenerator scaling parameters if available
    if (window.TilingGenerator && window.TilingGenerator.prototype) {
        console.log('[Simplified Fix] Modifying TilingGenerator.prototype methods...');
        
        // Fix the getScale method
        const originalGetScale = window.TilingGenerator.prototype.getScale;
        window.TilingGenerator.prototype.getScale = function(useDramaticScaling = false) {
            // Conservative scaling values from older version
            const minScale = 0.9;
            const maxScale = useDramaticScaling ? 1.8 : 1.4; // Reduced from 3.0/2.5
            
            // Calculate scale using more conservative range
            return minScale + Math.random() * (maxScale - minScale);
        };
        
        // Fix the calculateBaseSize method
        const originalCalcBaseSize = window.TilingGenerator.prototype.calculateBaseSize;
        window.TilingGenerator.prototype.calculateBaseSize = function(canvasWidth, canvasHeight, useDramaticScaling = false) {
            // Restore original larger divisors for smaller tiles
            const baseSizeMultiplier = useDramaticScaling ? 6 : 8; // Increased from 4/6
            
            // Calculate more conservative base size
            const baseSize = Math.min(canvasWidth, canvasHeight) / baseSizeMultiplier;
            return baseSize;
        };
        
        console.log('[Simplified Fix] TilingGenerator methods modified');
    }
    
    // 2. Fix FragmentsGenerator scaling parameters if available
    if (window.FragmentsGenerator && window.FragmentsGenerator.prototype) {
        console.log('[Simplified Fix] Modifying FragmentsGenerator.prototype methods...');
        
        // Patch the original generateFragments method
        const originalGenFrag = window.FragmentsGenerator.prototype.generateFragments;
        
        window.FragmentsGenerator.prototype.generateFragments = function(images, fortuneText, parameters = {}) {
            // Adjust parameters before calling original method
            if (parameters && parameters.scaleRange) {
                // Conservative scaling for fragments
                parameters.scaleRange = {
                    min: Math.max(0.8, parameters.scaleRange.min || 0.8),
                    max: Math.min(1.5, parameters.scaleRange.max || 1.5)
                };
            }
            
            // Call original method with adjusted parameters
            return originalGenFrag.call(this, images, fortuneText, parameters);
        };
        
        console.log('[Simplified Fix] FragmentsGenerator methods modified');
    }
    
    // 3. Fix MosaicGenerator scaling parameters if available
    if (window.MosaicGenerator && window.MosaicGenerator.prototype) {
        console.log('[Simplified Fix] Modifying MosaicGenerator.prototype methods...');
        
        // Patch the generateMosaic method
        const originalGenMosaic = window.MosaicGenerator.prototype.generateMosaic;
        
        window.MosaicGenerator.prototype.generateMosaic = function(images, parameters = {}) {
            // Define more conservative scaling values for mosaic tiles
            if (parameters && parameters.scaleRange) {
                parameters.scaleRange = {
                    min: Math.max(0.8, parameters.scaleRange.min || 0.8),
                    max: Math.min(1.6, parameters.scaleRange.max || 1.6)
                };
            }
            
            // Call original method with adjusted parameters
            return originalGenMosaic.call(this, images, parameters);
        };
        
        console.log('[Simplified Fix] MosaicGenerator methods modified');
    }
    
    // 4. Optional: Add integer pixel coordinate enforcement
    // This is a lightweight fix that improves edge quality
    if (Math.originalFloor === undefined) {
        Math.originalFloor = Math.floor;
        
        // Extend Math.floor to handle arrays and objects recursively
        Math.floor = function(value) {
            if (typeof value === 'number') {
                return Math.originalFloor(value);
            } else if (Array.isArray(value)) {
                return value.map(item => Math.floor(item));
            } else if (typeof value === 'object' && value !== null) {
                const result = {};
                for (const key in value) {
                    result[key] = Math.floor(value[key]);
                }
                return result;
            }
            return value;
        };
        
        console.log('[Simplified Fix] Added enhanced Math.floor for better pixel alignment');
    }
    
    // 5. Attempt to find and fix CollageGenerator if it's available
    setTimeout(function() {
        // Try to access via window or document objects
        let generator = null;
        
        if (window.app && window.app.collageGenerator) {
            generator = window.app.collageGenerator;
        } else if (window.collageGenerator) {
            generator = window.collageGenerator;
        } else {
            // Look for any object that might be the collage generator
            for (const key in window) {
                if (window[key] && typeof window[key] === 'object' && 
                    window[key].generate && window[key].drawTile) {
                    generator = window[key];
                    break;
                }
            }
        }
        
        if (generator) {
            console.log('[Simplified Fix] Found CollageGenerator, applying direct fixes...');
            
            // Fix parameters if they exist
            if (generator.parameters) {
                // Fix tiling parameters
                if (generator.parameters.tiling) {
                    console.log('[Simplified Fix] Fixing tiling parameters...');
                    generator.parameters.tiling.smallCountMode = {
                        minScale: 0.8,
                        maxScale: 1.2,
                        overlapFactor: 1.5
                    };
                    generator.parameters.tiling.largeCountMode = {
                        minScale: 0.3,
                        maxScale: 0.7,
                        overlapFactor: 0.5
                    };
                }
                
                // Fix crystal parameters if they exist
                if (generator.parameters.crystal) {
                    console.log('[Simplified Fix] Fixing crystal parameters...');
                    generator.parameters.crystalComplexity = Math.min(generator.parameters.crystalComplexity || 5, 7);
                    generator.parameters.crystalDensity = Math.min(generator.parameters.crystalDensity || 5, 7);
                    generator.parameters.crystalOpacity = Math.max(generator.parameters.crystalOpacity || 0.7, 0.6);
                }
                
                // Fix effect settings if they exist
                if (generator.effectSettings && generator.effectSettings.crystal) {
                    console.log('[Simplified Fix] Fixing crystal effect settings...');
                    generator.effectSettings.crystal.maxFacets = Math.min(
                        generator.effectSettings.crystal.maxFacets || 25, 15
                    );
                }
            }
            
            console.log('[Simplified Fix] CollageGenerator fixes applied');
        } else {
            console.log('[Simplified Fix] Could not find CollageGenerator, using prototype-based fixes only');
        }
    }, 2000); // Wait 2 seconds to ensure app is loaded
    
    console.log('[Simplified Fix] Image quality fix applied');
})();
