/**
 * Minimal Mobile Image Quality Fix for Assemblage
 * 
 * A conservative, targeted approach to improve mobile image quality
 * with minimal changes to the existing application.
 */

(function() {
    // Wait for a short time after page load to ensure app is initialized
    setTimeout(function() {
        if (window.app && window.app.generator) {
            applyMinimalFix(window.app.generator);
        } else {
            console.log('[Mobile Fix] App not initialized yet, waiting...');
            
            // Try again after a short delay
            setTimeout(function() {
                if (window.app && window.app.generator) {
                    applyMinimalFix(window.app.generator);
                } else {
                    console.log('[Mobile Fix] Could not find app.generator');
                }
            }, 1000);
        }
    }, 500);
    
    function applyMinimalFix(generator) {
        if (!generator || !generator.canvas) {
            console.log('[Mobile Fix] Cannot apply fix: generator or canvas not available');
            return;
        }
        
        console.log('[Mobile Fix] Applying minimal quality enhancement');
        
        // Apply high-quality image rendering styles to the canvas
        const canvas = generator.canvas;
        canvas.style.imageRendering = 'high-quality';
        canvas.style.imageRendering = '-webkit-optimize-contrast';
        
        // For mobile browsers, ensure proper pixel ratio handling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && generator.ctx) {
            console.log('[Mobile Fix] Applying mobile-specific adjustments');
            
            // Apply high-quality image smoothing
            generator.ctx.imageSmoothingEnabled = true;
            generator.ctx.imageSmoothingQuality = 'high';
        }
        
        console.log('[Mobile Fix] Enhancement applied');
    }
})(); 