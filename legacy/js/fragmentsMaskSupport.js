/**
 * Fragment Mask Support
 * 
 * A lightweight module that adds masking capabilities to the fragment layout in Assemblage.
 * This is designed as a safe, minimal extension without modifying the core code.
 */

/**
 * Applies a mask to a fragment context.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Object} fragment - The fragment to mask
 * @param {string} maskType - The type of mask to apply
 * @returns {boolean} - Whether the mask was successfully applied
 */
export function applyMaskToFragment(ctx, fragment, maskType) {
    if (!ctx || !fragment || !maskType) return false;
    
    try {
        ctx.beginPath();
        
        switch (maskType) {
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
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = centerX + hexRadius * Math.cos(angle);
                    const y = centerY + hexRadius * Math.sin(angle);
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
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
                const arcCenterX = fragment.x + fragment.width / 2;
                const arcCenterY = fragment.y + fragment.height / 2;
                const arcRadius = Math.min(fragment.width, fragment.height) / 2;
                const arcWidth = arcRadius * 0.3;
                
                // Draw the outer arc
                ctx.arc(arcCenterX, arcCenterY, arcRadius, 0, Math.PI, false);
                
                // Draw the inner arc in reverse to create the arc shape
                ctx.arc(arcCenterX, arcCenterY, arcRadius - arcWidth, Math.PI, 0, true);
                ctx.closePath();
                break;
                
            case 'arch':
                const archCenterX = fragment.x + fragment.width / 2;
                const archTopY = fragment.y;
                const archBottomY = fragment.y + fragment.height;
                const archWidth = fragment.width;
                const archRadius = archWidth / 2;
                
                // Start at bottom left corner
                ctx.moveTo(fragment.x, archBottomY);
                
                // Draw left side (vertical line)
                ctx.lineTo(fragment.x, archTopY + archRadius);
                
                // Draw the arch (half-circle) at the top
                ctx.arc(archCenterX, archTopY + archRadius, archRadius, Math.PI, 0, false);
                
                // Draw right side (vertical line)
                ctx.lineTo(fragment.x + archWidth, archBottomY);
                
                // Close path (bottom line)
                ctx.closePath();
                break;
                
            default:
                return false;
        }
        
        // Apply the clip
        ctx.clip();
        return true;
    } catch (error) {
        console.error('Error applying mask to fragment:', error);
        return false;
    }
}

/**
 * An extended version of the fragment drawing function that supports masking.
 * This can be used to override the standard fragment drawing.
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} fragment - The fragment object
 * @param {HTMLImageElement} img - The image to draw
 * @param {number} opacity - The opacity to use
 */
export function drawMaskedFragment(ctx, fragment, img, opacity) {
    if (!ctx || !fragment || !img || !img.complete) return;
    
    try {
        ctx.save();
        
        // Set opacity
        ctx.globalAlpha = opacity;
        
        // Apply rotation if needed
        if (fragment.rotation) {
            const centerX = fragment.x + fragment.width / 2;
            const centerY = fragment.y + fragment.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(fragment.rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        
        // Apply mask if specified
        if (fragment.maskType) {
            applyMaskToFragment(ctx, fragment, fragment.maskType);
        }
        
        // Draw the image with aspect ratio preservation
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
        
        // Add a very small random offset for more natural feeling
        drawX += (Math.random() - 0.5) * 2;
        drawY += (Math.random() - 0.5) * 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        ctx.restore();
    } catch (error) {
        console.error('Error drawing masked fragment:', error);
    }
}

/**
 * Adds mask data to a subset of fragments.
 * @param {Array} fragments - The fragments to process
 * @param {Object} options - Options for mask application
 * @returns {Array} - The processed fragments
 */
export function applyMasksToFragments(fragments, options = {}) {
    if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
        return fragments;
    }
    
    // Default options
    const defaultOptions = {
        probability: 0.2, // 20% chance of applying a mask
        maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'],
        consistentMasks: false // Whether to use the same mask type for all fragments
    };
    
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Skip if probability is 0 or no enabled mask types
    if (mergedOptions.probability <= 0 || !mergedOptions.maskTypes || mergedOptions.maskTypes.length === 0) {
        return fragments;
    }
    
    // Create a deep copy of fragments to avoid modifying the originals
    const processedFragments = JSON.parse(JSON.stringify(fragments));
    
    // If using consistent masks, select one mask type for all
    let selectedMaskType = null;
    if (mergedOptions.consistentMasks) {
        const index = Math.floor(Math.random() * mergedOptions.maskTypes.length);
        selectedMaskType = mergedOptions.maskTypes[index];
        console.log(`Using consistent mask type: ${selectedMaskType}`);
    }
    
    // Apply masks based on probability
    processedFragments.forEach(fragment => {
        if (Math.random() < mergedOptions.probability) {
            const maskType = selectedMaskType || 
                mergedOptions.maskTypes[Math.floor(Math.random() * mergedOptions.maskTypes.length)];
            
            fragment.maskType = maskType;
        }
    });
    
    return processedFragments;
}
