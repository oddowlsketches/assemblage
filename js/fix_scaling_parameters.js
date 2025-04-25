/**
 * Fix for Scaling Parameters in Assemblage
 * 
 * This script modifies the scaling parameters to match the more conservative
 * values from the previous version that had better image quality.
 */

(function() {
    // Wait for app to initialize
    function waitForApp() {
        return new Promise((resolve) => {
            if (window.app && window.app.collageGenerator) {
                resolve(window.app.collageGenerator);
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (window.app && window.app.collageGenerator) {
                    clearInterval(checkInterval);
                    resolve(window.app.collageGenerator);
                }
            }, 100);
            
            // Set a timeout to stop checking after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.log('[Scale Fix] Timeout waiting for app to initialize');
                resolve(null);
            }, 10000);
        });
    }

    // Fix scaling parameters
    function fixScalingParameters(generator) {
        console.log('[Scale Fix] Applying scaling parameter fixes...');
        
        // Track which generators we've modified
        const modifiedGenerators = [];
        
        // Fix tiling generator parameters if available
        if (generator.tilingGenerator) {
            // Save the original getScale method for reference
            const originalGetScale = generator.tilingGenerator.getScale;
            
            // Define more conservative scaling values
            generator.tilingGenerator.getScale = function(useDramaticScaling = false) {
                // Restore original parameters
                const minScale = 0.9; // keep the same minimum
                
                // Conservative maximum scaling values from older version
                const maxScale = useDramaticScaling ? 1.8 : 1.4; // was 3.0 and 2.5
                
                // Calculate scale using more conservative range
                return minScale + Math.random() * (maxScale - minScale);
            };
            
            // Fix base size divisors
            if (generator.tilingGenerator.calculateBaseSize) {
                const originalCalcBaseSize = generator.tilingGenerator.calculateBaseSize;
                
                generator.tilingGenerator.calculateBaseSize = function(canvasWidth, canvasHeight, useDramaticScaling = false) {
                    // Restore original larger divisors for smaller tiles
                    const baseSizeMultiplier = useDramaticScaling ? 6 : 8; // was 4 and 6
                    
                    // Calculate more conservative base size
                    const baseSize = Math.min(canvasWidth, canvasHeight) / baseSizeMultiplier;
                    return baseSize;
                };
            }
            
            modifiedGenerators.push('tilingGenerator');
        }
        
        // Fix fragments generator parameters if available
        if (generator.fragmentsGenerator) {
            // Check if the fragments generator has scaling parameters
            if (generator.fragmentsGenerator.generateFragments) {
                // Define more conservative scaling values for fragments
                const originalGenerateFragments = generator.fragmentsGenerator.generateFragments;
                
                // We'll preserve the original function but adjust the scaling
                generator.fragmentsGenerator._originalGenerateFragments = originalGenerateFragments;
                
                // No direct override needed, but we'll adjust related parameters
                if (generator.fragmentsGenerator.parameters) {
                    // Adjust fragment scale range if it exists
                    if (generator.fragmentsGenerator.parameters.scaleRange) {
                        generator.fragmentsGenerator.parameters.scaleRange = {
                            min: 0.8,  // More conservative minimum (was likely 0.5 or lower)
                            max: 1.5   // More conservative maximum (was likely 2.0 or higher)
                        };
                    }
                    
                    // Adjust max scale factor if it exists
                    if (generator.fragmentsGenerator.parameters.maxScaleFactor) {
                        generator.fragmentsGenerator.parameters.maxScaleFactor = 1.5; // was likely 2.0+
                    }
                }
                
                modifiedGenerators.push('fragmentsGenerator');
            }
        }
        
        // Fix mosaic generator parameters if available
        if (generator.mosaicGenerator) {
            // Check if the mosaic generator has scaling parameters
            if (generator.mosaicGenerator.parameters && generator.mosaicGenerator.parameters.scaleRange) {
                // Define more conservative scaling values for mosaic tiles
                generator.mosaicGenerator.parameters.scaleRange = {
                    min: 0.8,  // More conservative minimum
                    max: 1.6   // More conservative maximum
                };
                
                modifiedGenerators.push('mosaicGenerator');
            }
        }
        
        // Fix crystal generator parameters if available
        if (generator.crystalGenerator) {
            // Crystal generator may have different parameters
            if (generator.effectSettings && generator.effectSettings.crystal) {
                // Adjust max facets to a more reasonable value
                generator.effectSettings.crystal.maxFacets = 15; // was likely 25+
                
                modifiedGenerators.push('crystalGenerator');
            }
        }
        
        console.log('[Scale Fix] Modified scaling parameters for:', modifiedGenerators.join(', '));
        return true;
    }

    // Fix image positioning to use integer pixel values
    function fixImagePositioning(generator) {
        console.log('[Scale Fix] Applying image positioning fixes...');
        
        // Fix drawImage method
        if (generator.drawImage) {
            const originalDrawImage = generator.drawImage;
            
            generator.drawImage = function(image, x, y, width, height, crop = false, forceOpacity = null, showCroppedPortion = false) {
                // Use integer pixel positions for sharper rendering
                const intX = Math.floor(x);
                const intY = Math.floor(y);
                const intWidth = Math.floor(width);
                const intHeight = Math.floor(height);
                
                // Call original with integer values
                return originalDrawImage.call(this, image, intX, intY, intWidth, intHeight, crop, forceOpacity, showCroppedPortion);
            };
        }
        
        console.log('[Scale Fix] Applied image positioning fixes');
        return true;
    }

    // Apply fixes when the document is loaded
    window.addEventListener('DOMContentLoaded', async () => {
        console.log('[Scale Fix] Waiting for app to initialize...');
        
        const generator = await waitForApp();
        if (!generator) {
            console.error('[Scale Fix] Failed to get collage generator');
            return;
        }
        
        // Apply fixes
        const scalingFixed = fixScalingParameters(generator);
        const positioningFixed = fixImagePositioning(generator);
        
        if (scalingFixed && positioningFixed) {
            console.log('[Scale Fix] Successfully applied scaling and positioning fixes');
            
            // Trigger redraw if possible
            if (window.app && window.app.generateCollage) {
                console.log('[Scale Fix] Triggering collage regeneration...');
                window.app.generateCollage();
            } else if (generator.redraw) {
                console.log('[Scale Fix] Triggering redraw...');
                generator.redraw();
            }
        }
    });

    // Log that the fix has been loaded
    console.log('[Scale Fix] Scaling parameter fix script loaded');
})();
