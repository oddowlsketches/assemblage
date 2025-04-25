/**
 * Targeted Image Quality Fix for Assemblage
 * 
 * This fix ONLY modifies the scaling parameters that cause image quality issues,
 * without affecting any functionality like masking, crystal effects, or sliced effects.
 */

(function() {
    console.log('[Targeted Fix] Loading targeted fix...');
    
    // Store original functions to ensure we can restore them if needed
    const originals = {};
    let appFound = false;
    
    // Wait for window.app to be available
    const checkInterval = setInterval(function() {
        if (window.app && window.app.collageGenerator) {
            clearInterval(checkInterval);
            appFound = true;
            applyFix();
        }
    }, 100);
    
    // Set a timeout to stop checking after 10 seconds
    setTimeout(function() {
        if (!appFound) {
            console.log('[Targeted Fix] Could not find app after timeout, attempting direct fix anyway');
            applyFix();
        }
    }, 10000);
    
    function applyFix() {
        console.log('[Targeted Fix] Starting targeted fix application');
        
        // Fix 1: Apply conservative tilingParameters directly to app object
        if (window.app && window.app.tilingParameters) {
            console.log('[Targeted Fix] Found app.tilingParameters, applying conservative values');
            
            // Store original values
            originals.tilingParameters = JSON.parse(JSON.stringify(window.app.tilingParameters));
            
            // Modify values
            window.app.tilingParameters.complexity = Math.min(window.app.tilingParameters.complexity || 6, 6);
            window.app.tilingParameters.density = Math.min(window.app.tilingParameters.density || 5, 5);
            
            // Fix scale parameters (the main culprit)
            if (window.app.tilingParameters.smallCountMode) {
                window.app.tilingParameters.smallCountMode.maxScale = 1.4; // Reduced from likely 2.5
            }
            
            if (window.app.tilingParameters.largeCountMode) {
                window.app.tilingParameters.largeCountMode.maxScale = 1.0; // Reduced from likely 2.0
            }
            
            console.log('[Targeted Fix] Modified app.tilingParameters:', window.app.tilingParameters);
        }
        
        // Fix 2: Apply conservative effect settings
        if (window.app && window.app.collageGenerator && window.app.collageGenerator.effectSettings) {
            console.log('[Targeted Fix] Found effectSettings, applying conservative values');
            
            const generator = window.app.collageGenerator;
            
            // Store original effectSettings
            originals.effectSettings = JSON.parse(JSON.stringify(generator.effectSettings || {}));
            
            // Update tiling effect settings
            if (generator.effectSettings.tiling) {
                console.log('[Targeted Fix] Found tiling effect settings');
                generator.effectSettings.tiling.smallCountMode = {
                    minScale: 0.8,   // Safe value
                    maxScale: 1.2,   // Reduced from higher value
                    overlapFactor: 1.2  // Reduced from higher value
                };
                
                generator.effectSettings.tiling.largeCountMode = {
                    minScale: 0.3,   // Safe value
                    maxScale: 0.7,   // Reduced from higher value
                    overlapFactor: 0.5  // Safe value
                };
            }
            
            // Update fragments effect settings
            if (generator.effectSettings.fragments) {
                console.log('[Targeted Fix] Found fragments effect settings');
                if (generator.effectSettings.fragments.scaleRange) {
                    generator.effectSettings.fragments.scaleRange = {
                        min: Math.max(0.6, generator.effectSettings.fragments.scaleRange.min || 0.6),
                        max: Math.min(1.5, generator.effectSettings.fragments.scaleRange.max || 1.5)
                    };
                }
            }
            
            // Don't touch crystal or sliced effect settings to maintain functionality
        }
        
        // Fix 3: Patch the TilingGenerator.getScale method on existing instance
        if (window.app && window.app.collageGenerator && window.app.collageGenerator.tilingGenerator) {
            console.log('[Targeted Fix] Found tilingGenerator, patching getScale method');
            
            const tg = window.app.collageGenerator.tilingGenerator;
            
            // Store original method
            if (tg.getScale) {
                originals.getScale = tg.getScale;
                
                // Replace with conservative version
                tg.getScale = function(useDramaticScaling = false) {
                    const minScale = 0.9;
                    const maxScale = useDramaticScaling ? 1.8 : 1.4; // Reduced from likely 3.0/2.5
                    return minScale + Math.random() * (maxScale - minScale);
                };
                
                console.log('[Targeted Fix] Patched tilingGenerator.getScale');
            }
            
            // Also patch calculateBaseSize method if it exists
            if (tg.calculateBaseSize) {
                originals.calculateBaseSize = tg.calculateBaseSize;
                
                // Replace with original version that used larger divisors
                tg.calculateBaseSize = function(canvasWidth, canvasHeight, useDramaticScaling = false) {
                    const baseSizeMultiplier = useDramaticScaling ? 6 : 8; // Increased from 4/6 to 6/8
                    const baseSize = Math.min(canvasWidth, canvasHeight) / baseSizeMultiplier;
                    return baseSize;
                };
                
                console.log('[Targeted Fix] Patched tilingGenerator.calculateBaseSize');
            }
        }
        
        // Patch tile generation for quality
        if (window.app && window.app.collageGenerator && window.app.collageGenerator.drawTile) {
            console.log('[Targeted Fix] Patching drawTile to use integer coordinates');
            
            const generator = window.app.collageGenerator;
            
            // Store original method
            originals.drawTile = generator.drawTile;
            
            // Replace with fixed version
            generator.drawTile = function(tile, index, skippedTiles) {
                const img = tile.image;
                if (!img || !img.complete) {
                    if (skippedTiles) skippedTiles.invalid++;
                    return false;
                }
                
                try {
                    this.ctx.save();
                    
                    // Use original opacity calculation
                    this.ctx.globalAlpha = Math.max(0.5, tile.forceOpacity || 0.8);
                    
                    // Apply modest contrast boost
                    this.ctx.filter = 'contrast(1.1)';
                    
                    // Get integer center coordinates for sharper edges
                    const centerX = Math.floor(tile.x + tile.width / 2);
                    const centerY = Math.floor(tile.y + tile.height / 2);
                    
                    this.ctx.translate(centerX, centerY);
                    this.ctx.rotate(tile.rotation * Math.PI / 180);
                    
                    // Calculate integer width/height for sharper edges
                    const imgRatio = img.width / img.height;
                    let drawWidth = Math.floor(tile.width);
                    let drawHeight = Math.floor(tile.height);
                    
                    if (imgRatio > 1) {
                        drawHeight = Math.floor(drawWidth / imgRatio);
                    } else {
                        drawWidth = Math.floor(drawHeight * imgRatio);
                    }
                    
                    this.ctx.drawImage(
                        img,
                        -Math.floor(drawWidth / 2),
                        -Math.floor(drawHeight / 2),
                        drawWidth,
                        drawHeight
                    );
                    
                    this.ctx.restore();
                    return true;
                } catch (error) {
                    if (skippedTiles) skippedTiles.drawError++;
                    console.warn('Error drawing tile:', error);
                    return false;
                }
            };
            
            console.log('[Targeted Fix] Patched drawTile method');
        }
        
        console.log('[Targeted Fix] All targeted fixes applied successfully');
        
        // Add ability to restore original methods if needed
        window.restoreOriginalMethods = function() {
            console.log('[Targeted Fix] Restoring original methods...');
            
            // Restore tilingParameters
            if (originals.tilingParameters && window.app) {
                window.app.tilingParameters = originals.tilingParameters;
                console.log('[Targeted Fix] Restored original tilingParameters');
            }
            
            // Restore effectSettings
            if (originals.effectSettings && window.app && window.app.collageGenerator) {
                window.app.collageGenerator.effectSettings = originals.effectSettings;
                console.log('[Targeted Fix] Restored original effectSettings');
            }
            
            // Restore getScale method
            if (originals.getScale && window.app && window.app.collageGenerator && window.app.collageGenerator.tilingGenerator) {
                window.app.collageGenerator.tilingGenerator.getScale = originals.getScale;
                console.log('[Targeted Fix] Restored original getScale method');
            }
            
            // Restore calculateBaseSize method
            if (originals.calculateBaseSize && window.app && window.app.collageGenerator && window.app.collageGenerator.tilingGenerator) {
                window.app.collageGenerator.tilingGenerator.calculateBaseSize = originals.calculateBaseSize;
                console.log('[Targeted Fix] Restored original calculateBaseSize method');
            }
            
            // Restore drawTile method
            if (originals.drawTile && window.app && window.app.collageGenerator) {
                window.app.collageGenerator.drawTile = originals.drawTile;
                console.log('[Targeted Fix] Restored original drawTile method');
            }
            
            console.log('[Targeted Fix] All original methods restored');
        };
    }
    
    console.log('[Targeted Fix] Initialization complete, waiting for app...');
})();
