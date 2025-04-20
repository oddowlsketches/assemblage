/**
 * Simple Mask Integration
 * 
 * A minimal script that adds mask support to Assemblage fragments
 * without modifying the core app code.
 * 
 * Usage: Include this script in your index.html after the main app scripts
 */

console.log('Loading fragment mask support...');

// Mask integration settings - can be adjusted via console
const MASK_SETTINGS = {
    enabled: true,
    probability: 0.2, // 20% chance of applying a mask
    maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'],
    consistent: false // Whether to use the same mask type for all fragments
};

// Wait for app to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure app is fully loaded
    setTimeout(enableMasks, 500);
});

// Main function to enable masks
function enableMasks() {
    // Get the app instance
    const app = window.app;
    
    if (!app) {
        console.warn('App not found, retrying in 500ms...');
        setTimeout(enableMasks, 500);
        return;
    }
    
    // Get the generator
    const generator = app.generator;
    
    if (!generator) {
        console.warn('Generator not found, retrying in 500ms...');
        setTimeout(enableMasks, 500);
        return;
    }
    
    console.log('Enabling mask support for fragments...');
    
    try {
        // Save original generateFragments method
        const originalGenerateFragments = generator.generateFragments;
        
        // Override the method
        generator.generateFragments = async function(images, fortuneText, parameters = {}) {
            try {
                // Call the original method to get fragments
                const fragments = await originalGenerateFragments.call(this, images, fortuneText, parameters);
                
                // If mask support is disabled, return the original fragments
                if (!MASK_SETTINGS.enabled) {
                    return fragments;
                }
                
                // Apply masks to the fragments
                const maskedFragments = applyMasksToFragments(fragments);
                
                // Draw the fragments with masks
                await drawMaskedFragments(this, maskedFragments, images, fortuneText);
                
                // Return the masked fragments
                return maskedFragments;
            } catch (error) {
                console.error('Error in enhanced generateFragments:', error);
                // Fall back to original method
                return originalGenerateFragments.call(this, images, fortuneText, parameters);
            }
        };
        
        console.log('Fragment mask support enabled successfully!');
        console.log('Current settings:', MASK_SETTINGS);
        console.log('To adjust settings: window.updateMaskSettings({...})');
        
        // Add global control functions
        window.updateMaskSettings = function(newSettings) {
            if (typeof newSettings !== 'object') return;
            Object.assign(MASK_SETTINGS, newSettings);
            console.log('Updated settings:', MASK_SETTINGS);
        };
        
        window.disableMasks = function() {
            MASK_SETTINGS.enabled = false;
            console.log('Mask support disabled');
        };
        
        window.enableMasks = function() {
            MASK_SETTINGS.enabled = true;
            console.log('Mask support enabled');
        };
    } catch (error) {
        console.error('Error setting up mask support:', error);
    }
}

/**
 * Apply masks to fragments based on settings
 */
function applyMasksToFragments(fragments) {
    if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
        return fragments;
    }
    
    // Skip if no mask types enabled or probability is 0
    if (MASK_SETTINGS.probability <= 0 || MASK_SETTINGS.maskTypes.length === 0) {
        return fragments;
    }
    
    // Create a copy to avoid modifying the original
    const maskedFragments = JSON.parse(JSON.stringify(fragments));
    
    // Select a single mask type for consistency if enabled
    let consistentMaskType = null;
    if (MASK_SETTINGS.consistent) {
        const index = Math.floor(Math.random() * MASK_SETTINGS.maskTypes.length);
        consistentMaskType = MASK_SETTINGS.maskTypes[index];
        console.log(`Using consistent mask type: ${consistentMaskType}`);
    }
    
    // Apply masks based on probability
    maskedFragments.forEach(fragment => {
        if (Math.random() < MASK_SETTINGS.probability) {
            // Use consistent mask or random mask
            const maskType = consistentMaskType || 
                MASK_SETTINGS.maskTypes[Math.floor(Math.random() * MASK_SETTINGS.maskTypes.length)];
            
            // Apply mask
            fragment.maskType = maskType;
        }
    });
    
    return maskedFragments;
}

/**
 * Draw fragments with masks
 */
async function drawMaskedFragments(generator, fragments, images, fortuneText) {
    try {
        // Clear the canvas
        generator.ctx.clearRect(0, 0, generator.canvas.width, generator.canvas.height);
        
        // Set background color and blend mode
        const backgroundColor = generator.generateBackgroundColor ? 
            generator.generateBackgroundColor() : '#f5f5f5';
        generator.ctx.fillStyle = backgroundColor;
        generator.ctx.fillRect(0, 0, generator.canvas.width, generator.canvas.height);
        generator.ctx.globalCompositeOperation = 'multiply';
        
        // Sort fragments by depth
        const sortedFragments = [...fragments].sort((a, b) => a.depth - b.depth);
        
        // Draw each fragment
        for (const fragment of sortedFragments) {
            try {
                // Skip invalid fragments
                if (!fragment || typeof fragment !== 'object') {
                    continue;
                }
                
                // Get the image using the img index
                let img;
                if (typeof fragment.img === 'number') {
                    img = images[fragment.img];
                } else if (fragment.img && typeof fragment.img === 'object') {
                    img = fragment.img instanceof HTMLImageElement ? 
                        fragment.img : (fragment.img.img instanceof HTMLImageElement ? fragment.img.img : null);
                }
                
                // Skip if image is invalid
                if (!img || !img.complete) {
                    continue;
                }
                
                // Save context state
                generator.ctx.save();
                
                // Apply opacity based on depth
                let opacity = 0.3 + fragment.depth * 0.6;
                if (fragment.forceFullOpacity) {
                    opacity = 1.0;
                }
                
                generator.ctx.globalAlpha = Math.max(0.25, Math.min(1.0, opacity));
                
                // Apply rotation if specified
                if (fragment.rotation) {
                    const centerX = fragment.x + fragment.width / 2;
                    const centerY = fragment.y + fragment.height / 2;
                    generator.ctx.translate(centerX, centerY);
                    generator.ctx.rotate(fragment.rotation * Math.PI / 180);
                    generator.ctx.translate(-centerX, -centerY);
                }
                
                // Apply mask if specified
                if (fragment.maskType) {
                    applyMaskPath(generator.ctx, fragment);
                }
                
                // Draw the image
                const imgAspectRatio = img.width / img.height;
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspectRatio > 1) {
                    drawWidth = fragment.width * 1.5;
                    drawHeight = drawWidth / imgAspectRatio;
                } else {
                    drawHeight = fragment.height * 1.5;
                    drawWidth = drawHeight * imgAspectRatio;
                }
                
                drawX = fragment.x + (fragment.width - drawWidth) / 2;
                drawY = fragment.y + (fragment.height - drawHeight) / 2;
                
                generator.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                // Restore context state
                generator.ctx.restore();
            } catch (error) {
                console.error('Error drawing fragment:', error);
            }
        }
        
        // Reset blend mode
        generator.ctx.globalCompositeOperation = 'source-over';
        
        // Add fortune text if provided
        if (fortuneText && typeof generator.addFortuneText === 'function') {
            generator.addFortuneText(fortuneText);
        }
    } catch (error) {
        console.error('Error drawing masked fragments:', error);
    }
}

/**
 * Apply a mask path to the context for a fragment
 */
function applyMaskPath(ctx, fragment) {
    if (!fragment.maskType) return;
    
    ctx.beginPath();
    
    switch (fragment.maskType) {
        case 'circle':
            const radius = Math.min(fragment.width, fragment.height) / 2;
            ctx.arc(
                fragment.x + fragment.width / 2,
                fragment.y + fragment.height / 2,
                radius,
                0,
                Math.PI * 2
            );
            break;
            
        case 'triangle':
            ctx.moveTo(fragment.x + fragment.width / 2, fragment.y);
            ctx.lineTo(fragment.x + fragment.width, fragment.y + fragment.height);
            ctx.lineTo(fragment.x, fragment.y + fragment.height);
            ctx.closePath();
            break;
            
        case 'rectangle':
            ctx.rect(fragment.x, fragment.y, fragment.width, fragment.height);
            break;
            
        case 'ellipse':
            ctx.ellipse(
                fragment.x + fragment.width / 2,
                fragment.y + fragment.height / 2,
                fragment.width / 2,
                fragment.height / 2,
                0,
                0,
                Math.PI * 2
            );
            break;
            
        case 'diamond':
            ctx.moveTo(fragment.x + fragment.width / 2, fragment.y);
            ctx.lineTo(fragment.x + fragment.width, fragment.y + fragment.height / 2);
            ctx.lineTo(fragment.x + fragment.width / 2, fragment.y + fragment.height);
            ctx.lineTo(fragment.x, fragment.y + fragment.height / 2);
            ctx.closePath();
            break;
            
        case 'hexagon':
            const hexRadius = Math.min(fragment.width, fragment.height) / 2;
            const centerX = fragment.x + fragment.width / 2;
            const centerY = fragment.y + fragment.height / 2;
            
            // Create a complete path for the hexagon
            ctx.moveTo(centerX, centerY - hexRadius);
            
            // Draw the hexagon clockwise
            for (let i = 1; i <= 6; i++) {
                const angle = (i * Math.PI / 3) - (Math.PI / 6); // Start at top
                const x = centerX + hexRadius * Math.cos(angle);
                const y = centerY + hexRadius * Math.sin(angle);
                ctx.lineTo(x, y);
            }
            
            // Close the path
            ctx.closePath();
            break;
            
        case 'star':
            const starRadius = Math.min(fragment.width, fragment.height) / 2;
            const starCenterX = fragment.x + fragment.width / 2;
            const starCenterY = fragment.y + fragment.height / 2;
            const outerRadius = starRadius;
            const innerRadius = starRadius * 0.4;
            const spikes = 5;
            
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes;
                const x = starCenterX + radius * Math.cos(angle);
                const y = starCenterY + radius * Math.sin(angle);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            break;
            
        case 'arc':
            // Get arc parameters from fragment
            const arcCenterX = fragment.x + fragment.width / 2;
            const arcCenterY = fragment.y + fragment.height / 2;
            const arcOuterRadius = fragment.maskParams?.outerRadius || Math.min(fragment.width, fragment.height) / 2;
            const arcInnerRadius = fragment.maskParams?.innerRadius || (arcOuterRadius * 0.7);
            
            // Create a complete path for the ring using a different approach
            // Draw a rectangle that covers the entire fragment
            ctx.rect(fragment.x, fragment.y, fragment.width, fragment.height);
            
            // Then draw a circle in the center to create a hole
            ctx.arc(arcCenterX, arcCenterY, arcInnerRadius, 0, Math.PI * 2, true);
            
            // Then draw another circle to create the outer boundary
            ctx.arc(arcCenterX, arcCenterY, arcOuterRadius, 0, Math.PI * 2, false);
            break;
            
        case 'arch':
            // Arch mask implementation
            const archCenterX = fragment.x + fragment.width / 2;
            const archTopY = fragment.y;
            const archBottomY = fragment.y + fragment.height;
            const archWidth = fragment.width;
            const archRadius = fragment.maskParams?.archRadius || (archWidth / 2);
            
            // Draw the arch path
            ctx.moveTo(fragment.x, archBottomY);
            ctx.lineTo(fragment.x, archTopY + archRadius);
            ctx.arc(archCenterX, archTopY + archRadius, archRadius, Math.PI, 0, false);
            ctx.lineTo(fragment.x + fragment.width, archBottomY);
            ctx.closePath();
            break;
    }
    
    // Apply the clip
    ctx.clip();
}
