/**
 * Diagnostic Script for Assemblage Effects
 * This script only inspects the app state without modifying anything
 */

(function() {
    console.log('[Diagnostic] Starting effects diagnosis...');
    
    // Track what we find
    const effects = {
        found: [],
        missing: [],
        maskingStatus: 'unknown'
    };
    
    // Wait a moment for app to be fully initialized
    setTimeout(function() {
        // Try different paths to access the app
        let generator = null;
        
        if (window.app && window.app.collageGenerator) {
            generator = window.app.collageGenerator;
            console.log('[Diagnostic] Found generator via window.app.collageGenerator');
        } else if (window.collageGenerator) {
            generator = window.collageGenerator;
            console.log('[Diagnostic] Found generator via window.collageGenerator');
        } else {
            console.log('[Diagnostic] Could not find collage generator');
            return;
        }
        
        // Check which effects are available
        console.log('[Diagnostic] Checking effects availability...');
        
        // Check for tiling effect
        if (generator.tilingGenerator) {
            effects.found.push('tiling');
        } else {
            effects.missing.push('tiling');
        }
        
        // Check for fragments effect
        if (generator.fragmentsGenerator) {
            effects.found.push('fragments');
        } else {
            effects.missing.push('fragments');
        }
        
        // Check for mosaic effect
        if (generator.mosaicGenerator) {
            effects.found.push('mosaic');
        } else {
            effects.missing.push('mosaic');
        }
        
        // Check for layers effect
        if (generator.generateLayers || (typeof generator.generate === 'function' && generator.currentEffect === 'layers')) {
            effects.found.push('layers');
        } else {
            effects.missing.push('layers');
        }
        
        // Check for sliced effect
        if (generator.slicedGenerator) {
            effects.found.push('sliced');
        } else {
            effects.missing.push('sliced');
        }
        
        // Check for crystal effect
        if (generator.crystalGenerator || generator.hasCrystalEffect) {
            effects.found.push('crystal');
        } else {
            effects.missing.push('crystal');
        }
        
        // Check masking functionality
        console.log('[Diagnostic] Checking masking functionality...');
        if (window.maskIntegration || 
            (window.app && window.app.maskIntegration) || 
            (generator && generator.maskIntegration)) {
            effects.maskingStatus = 'integration found';
        } else if (generator.drawFragment) {
            // Check if drawFragment contains masking code
            const drawFragStr = generator.drawFragment.toString();
            if (drawFragStr.includes('fragment.mask') && drawFragStr.includes('mask.enabled')) {
                effects.maskingStatus = 'code present but may be disabled';
            } else {
                effects.maskingStatus = 'mask code missing';
            }
        }
        
        // Report findings
        console.log('[Diagnostic] Effects found:', effects.found);
        console.log('[Diagnostic] Effects missing:', effects.missing);
        console.log('[Diagnostic] Masking status:', effects.maskingStatus);
        
        // Check if there's a fix script active
        const activeFixScripts = [];
        if (window.simplified_image_quality_fix) {
            activeFixScripts.push('simplified_image_quality_fix');
        }
        
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src || '';
            if (src.includes('fix_scaling_parameters.js')) {
                activeFixScripts.push('fix_scaling_parameters');
            }
            if (src.includes('fix_drawing_quality.js')) {
                activeFixScripts.push('fix_drawing_quality');
            }
            if (src.includes('simplified_image_quality_fix.js')) {
                activeFixScripts.push('simplified_image_quality_fix');
            }
        }
        
        console.log('[Diagnostic] Active fix scripts:', activeFixScripts.length ? activeFixScripts : 'none');
        
        // Check if prototype methods have been modified
        console.log('[Diagnostic] Checking for modified prototype methods...');
        if (window.TilingGenerator && window.TilingGenerator.prototype) {
            const tgProto = window.TilingGenerator.prototype;
            console.log('[Diagnostic] TilingGenerator.prototype available');
            
            // Look for any math floor usage in the original methods
            if (tgProto.getScale) {
                const getScaleStr = tgProto.getScale.toString();
                console.log('[Diagnostic] TilingGenerator.getScale modified:', getScaleStr.includes('Math.floor'));
            }
        }
        
        // Provide conclusion
        if (effects.missing.length > 0 || effects.maskingStatus !== 'integration found') {
            console.log('[Diagnostic] ISSUE FOUND: Some effects are missing or masking is not working');
            console.log('[Diagnostic] Recommendation: Try restoring original methods and using minimal scaling fix');
        } else {
            console.log('[Diagnostic] All effects appear to be available, further testing needed for rendering issues');
        }
    }, 2000);
    
    console.log('[Diagnostic] Diagnostic script initialized, waiting for app...');
})();
