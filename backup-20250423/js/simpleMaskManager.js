/**
 * Simple Mask Manager
 * A lightweight version of the NarrativeCompositionManager that only implements
 * mask functionality for safer integration with the main app.
 */

export class SimpleMaskManager {
    constructor() {
        // No need for complex parameters in this simplified version
    }

    /**
     * Applies a shape-based mask to an element
     * @param {Object} element - The element to mask
     * @param {string} maskType - The type of mask ('circle', 'rectangle', 'triangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch')
     * @param {Object} maskParams - Parameters for the mask
     * @returns {Object} - The masked element
     */
    maskElement(element, maskType = 'circle', maskParams = {}) {
        if (!element) return element;
        
        // Create a deep copy to avoid modifying the original
        const maskedElement = JSON.parse(JSON.stringify(element));
        
        // Set the mask type
        maskedElement.maskType = maskType;
        
        // Initialize maskParams if it doesn't exist
        maskedElement.maskParams = {};
        
        // Set up mask parameters based on mask type
        switch (maskType) {
            case 'circle':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    radius: Math.min(element.width, element.height) / 2,
                    ...maskParams
                };
                break;
                
            case 'rectangle':
                maskedElement.maskParams = {
                    x: 0,
                    y: 0,
                    width: element.width,
                    height: element.height,
                    cornerRadius: 0,
                    ...maskParams
                };
                break;
                
            case 'triangle':
                maskedElement.maskParams = {
                    points: [
                        { x: element.width / 2, y: 0 },
                        { x: 0, y: element.height },
                        { x: element.width, y: element.height }
                    ],
                    ...maskParams
                };
                break;
                
            case 'ellipse':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    radiusX: element.width / 2,
                    radiusY: element.height / 2,
                    ...maskParams
                };
                break;
                
            case 'diamond':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    width: element.width,
                    height: element.height,
                    ...maskParams
                };
                break;
                
            case 'hexagon':
                // Create regular hexagon points
                const hexPoints = [];
                const hexRadius = Math.min(element.width, element.height) / 2;
                const hexCenterX = element.width / 2;
                const hexCenterY = element.height / 2;
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3) - (Math.PI / 6); // Start at top
                    hexPoints.push({
                        x: hexCenterX + hexRadius * Math.cos(angle),
                        y: hexCenterY + hexRadius * Math.sin(angle)
                    });
                }
                
                maskedElement.maskParams = {
                    points: hexPoints,
                    ...maskParams
                };
                break;
                
            case 'star':
                // Create five-pointed star
                const starPoints = [];
                const outerRadius = Math.min(element.width, element.height) / 2;
                const innerRadius = outerRadius / 2.5;
                const starCenterX = element.width / 2;
                const starCenterY = element.height / 2;
                
                for (let i = 0; i < 10; i++) {
                    const angle = (i * Math.PI / 5) - (Math.PI / 2); // Start at top
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    starPoints.push({
                        x: starCenterX + radius * Math.cos(angle),
                        y: starCenterY + radius * Math.sin(angle)
                    });
                }
                
                maskedElement.maskParams = {
                    points: starPoints,
                    ...maskParams
                };
                break;
                
            case 'arc':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    radius: Math.min(element.width, element.height) / 2,
                    startAngle: 0,
                    endAngle: 180, // Default to 180 degrees (half circle)
                    arcWidth: Math.min(element.width, element.height) / 4,
                    ...maskParams
                };
                break;
                
            case 'arch':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    topY: 0,
                    bottomY: element.height,
                    archWidth: element.width,
                    archRadius: element.width / 2,
                    ...maskParams
                };
                break;
        }
        
        return maskedElement;
    }

    /**
     * Helper method for drawing a masked element
     * This method shows how the mask should be applied when drawing
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} fragment - Fragment to draw with mask
     * @param {HTMLImageElement} img - Image element to draw
     */
    drawMaskedElement(ctx, fragment, img) {
        if (!ctx || !fragment || !img) {
            console.warn('Missing required parameters for drawMaskedElement:', { 
                hasContext: !!ctx, 
                hasFragment: !!fragment, 
                hasImage: !!img 
            });
            return;
        }
        
        try {
            ctx.save();
            
            // Apply opacity if specified
            if (fragment.opacity !== undefined) {
                ctx.globalAlpha = fragment.opacity;
            }
            
            // Apply blend mode if specified
            if (fragment.blendMode) {
                ctx.globalCompositeOperation = fragment.blendMode;
            }
            
            // Apply rotation if specified
            if (fragment.rotation) {
                const centerX = fragment.x + fragment.width / 2;
                const centerY = fragment.y + fragment.height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(fragment.rotation * Math.PI / 180);
                ctx.translate(-centerX, -centerY);
            }
            
            // Begin a new path for the mask
            ctx.beginPath();
            
            // Apply mask if specified
            if (fragment.maskType) {
                this.applyMaskPath(ctx, fragment);
            }
            
            // Draw the image
            const x = fragment.x || 0;
            const y = fragment.y || 0;
            const width = fragment.width || img.width || 100;
            const height = fragment.height || img.height || 100;
            
            if (fragment.clipX !== undefined && fragment.clipY !== undefined && 
                fragment.clipWidth !== undefined && fragment.clipHeight !== undefined) {
                // Draw with clipping coordinates
                ctx.drawImage(
                    img,
                    fragment.clipX, fragment.clipY,
                    fragment.clipWidth, fragment.clipHeight,
                    x, y,
                    width, height
                );
            } else {
                // Draw without clipping
                ctx.drawImage(img, x, y, width, height);
            }
            
            ctx.restore();
        } catch (error) {
            console.error('Error drawing masked element:', error);
            // Attempt to draw the image without masking as a fallback
            try {
                ctx.drawImage(
                    img,
                    fragment.x || 0,
                    fragment.y || 0,
                    fragment.width || img.width || 100,
                    fragment.height || img.height || 100
                );
            } catch (fallbackError) {
                console.error('Failed to draw image even without mask:', fallbackError);
            }
        }
    }

    /**
     * Apply the mask path to the context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} fragment - Fragment with mask properties
     */
    applyMaskPath(ctx, fragment) {
        if (!fragment.maskType) return;
        
        // Ensure we have valid dimensions
        const x = fragment.x || 0;
        const y = fragment.y || 0;
        const width = fragment.width || 100;
        const height = fragment.height || 100;
        
        ctx.beginPath();
        
        switch (fragment.maskType) {
            case 'circle':
                const circleRadius = Math.min(width, height) / 2;
                ctx.arc(
                    x + width / 2,
                    y + height / 2,
                    circleRadius,
                    0,
                    Math.PI * 2
                );
                break;
                
            case 'rectangle':
                ctx.rect(x, y, width, height);
                break;
                
            case 'triangle':
                ctx.moveTo(x + width / 2, y);
                ctx.lineTo(x, y + height);
                ctx.lineTo(x + width, y + height);
                ctx.closePath();
                break;
                
            case 'ellipse':
                ctx.ellipse(
                    x + width / 2,
                    y + height / 2,
                    width / 2,
                    height / 2,
                    0,
                    0,
                    Math.PI * 2
                );
                break;
                
            case 'diamond':
                ctx.moveTo(x + width / 2, y);
                ctx.lineTo(x + width, y + height / 2);
                ctx.lineTo(x + width / 2, y + height);
                ctx.lineTo(x, y + height / 2);
                ctx.closePath();
                break;
                
            case 'hexagon':
                const hexRadius = Math.min(width, height) / 2;
                const hexCenterX = x + width / 2;
                const hexCenterY = y + height / 2;
                
                ctx.moveTo(hexCenterX + hexRadius, hexCenterY);
                for (let i = 1; i <= 6; i++) {
                    const angle = (i * Math.PI / 3) - (Math.PI / 6);
                    ctx.lineTo(
                        hexCenterX + hexRadius * Math.cos(angle),
                        hexCenterY + hexRadius * Math.sin(angle)
                    );
                }
                break;
                
            case 'star':
                const outerRadius = Math.min(width, height) / 2;
                const innerRadius = outerRadius / 2.5;
                const starCenterX = x + width / 2;
                const starCenterY = y + height / 2;
                
                ctx.moveTo(starCenterX, starCenterY - outerRadius);
                for (let i = 1; i < 10; i++) {
                    const angle = (i * Math.PI / 5) - (Math.PI / 2);
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    ctx.lineTo(
                        starCenterX + radius * Math.cos(angle),
                        starCenterY + radius * Math.sin(angle)
                    );
                }
                ctx.closePath();
                break;
                
            case 'arc':
                const arcRadius = Math.min(width, height) / 2;
                ctx.arc(
                    x + width / 2,
                    y + height / 2,
                    arcRadius,
                    0,
                    Math.PI,
                    false
                );
                break;
                
            case 'arch':
                const archRadius = width / 2;
                ctx.moveTo(x, y + height);
                ctx.lineTo(x, y + archRadius);
                ctx.arc(
                    x + width / 2,
                    y + archRadius,
                    archRadius,
                    Math.PI,
                    0,
                    true
                );
                ctx.lineTo(x + width, y + height);
                ctx.closePath();
                break;
        }
        
        ctx.clip();
    }
}
