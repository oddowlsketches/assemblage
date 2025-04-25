/**
 * Canvas Resolution and Size Fix for Assemblage
 * 
 * This script fixes issues with canvas size and image resolution across
 * different device types by properly handling device pixel ratio.
 */

// Function to fix the resizeCanvas method in CollageGenerator
function fixResizeCanvas(collageGeneratorInstance) {
    // Store the original method for reference
    const originalResizeCanvas = collageGeneratorInstance.resizeCanvas;
    
    // Replace with improved version
    collageGeneratorInstance.resizeCanvas = function() {
        // Check if canvas is properly initialized
        if (!this.canvas) {
            console.error('Canvas is not initialized in CollageGenerator');
            return;
        }
        
        // Check if context is properly initialized
        if (!this.ctx) {
            console.error('Canvas context is not initialized in CollageGenerator');
            return;
        }
        
        // Get the device pixel ratio for better quality on high-DPI screens
        const devicePixelRatio = window.devicePixelRatio || 1;
        console.log('Applying canvas resize with devicePixelRatio:', devicePixelRatio);
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Set the display size (CSS pixels)
        this.canvas.style.width = viewportWidth + 'px';
        this.canvas.style.height = viewportHeight + 'px';
        
        // Set the actual canvas dimensions accounting for pixel ratio
        this.canvas.width = viewportWidth * devicePixelRatio;
        this.canvas.height = viewportHeight * devicePixelRatio;
        
        // Scale the context to match viewport but render at full resolution
        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        
        console.log('Canvas configured with:', {
            userAgent: navigator.userAgent,
            devicePixelRatio,
            viewportDimensions: `${viewportWidth}x${viewportHeight}`,
            canvasDimensions: `${this.canvas.width}x${this.canvas.height}`,
            cssSize: `${this.canvas.style.width}x${this.canvas.style.height}`,
        });
        
        // Update narrative manager's canvas dimensions if it exists
        if (this.narrativeManager) {
            this.narrativeManager.parameters.canvasWidth = viewportWidth;
            this.narrativeManager.parameters.canvasHeight = viewportHeight;
        }
    };
    
    // Immediately apply the resize to fix existing issues
    collageGeneratorInstance.resizeCanvas();
    
    return collageGeneratorInstance;
}

// Function to fix the drawTile method in CollageGenerator
function fixDrawTile(collageGeneratorInstance) {
    // Store the original method for reference
    const originalDrawTile = collageGeneratorInstance.drawTile;
    
    // Replace with improved version
    collageGeneratorInstance.drawTile = function(tile, index, skippedTiles) {
        const img = tile.image;
        if (!img || !img.complete) {
            if (skippedTiles) skippedTiles.invalid++;
            console.log(`Tile ${index}: Invalid image - exists: ${!!img}, complete: ${img ? img.complete : 'N/A'}`);
            return false;
        }
        
        // Skip tiles that would be completely outside the canvas
        // Note: Using logical (CSS) pixel coordinates here, not device pixels
        if (tile.x >= this.canvas.clientWidth || tile.y >= this.canvas.clientHeight || 
            tile.x + tile.width <= 0 || tile.y + tile.height <= 0) {
            if (skippedTiles) skippedTiles.offCanvas++;
            console.warn(`Tile ${index}: Off canvas at (${tile.x}, ${tile.y}) with size ${tile.width}x${tile.height}`);
            return false;
        }
        
        try {
            this.ctx.save();
            
            // Set opacity with a minimum value to ensure visibility
            this.ctx.globalAlpha = Math.max(0.6, tile.forceOpacity || 0.8);
            
            // Add slight contrast boost for better visibility
            this.ctx.filter = `contrast(1.1) brightness(1.05)`;
            
            // Move to tile center for rotation - using CSS pixel coordinates
            const centerX = tile.x + tile.width / 2;
            const centerY = tile.y + tile.height / 2;
            
            // Log first few tiles for debugging
            if (index < 5) {
                console.log(`Tile ${index} debug:`, {
                    position: { x: tile.x, y: tile.y },
                    center: { x: centerX, y: centerY },
                    size: { width: tile.width, height: tile.height },
                    opacity: tile.forceOpacity,
                    rotation: tile.rotation
                });
            }
            
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(tile.rotation * Math.PI / 180);
            
            // Draw the tile with aspect ratio preservation
            const imgRatio = img.width / img.height;
            let drawWidth = tile.width;
            let drawHeight = tile.height;
            
            if (imgRatio > 1) {
                drawHeight = drawWidth / imgRatio;
            } else {
                drawWidth = drawHeight * imgRatio;
            }
            
            // Extra validation for dimensions
            if (isNaN(drawWidth) || isNaN(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
                console.log(`Tile ${index}: Invalid dimensions - width: ${drawWidth}, height: ${drawHeight}`);
                this.ctx.restore();
                return false;
            }
            
            this.ctx.drawImage(
                img,
                -drawWidth / 2, -drawHeight / 2,
                drawWidth, drawHeight
            );
            
            this.ctx.restore();
            return true;
        } catch (error) {
            if (skippedTiles) skippedTiles.drawError++;
            console.warn(`Tile ${index}: Error drawing:`, error);
            return false;
        }
    };
    
    return collageGeneratorInstance;
}

// Fix the drawFragment method
function fixDrawFragment(collageGeneratorInstance) {
    // Store the original method
    const originalDrawFragment = collageGeneratorInstance.drawFragment;
    
    // Replace with improved version
    collageGeneratorInstance.drawFragment = function(fragment, ctx) {
        // Validate fragment dimensions
        if (!fragment.width || !fragment.height || isNaN(fragment.width) || isNaN(fragment.height)) {
            console.warn('Invalid fragment dimensions, skipping draw:', fragment);
            return;
        }

        // Use logical (CSS) pixel coordinates to work with the scaled canvas
        const x = fragment.x;
        const y = fragment.y;
        const width = fragment.width;
        const height = fragment.height;
        
        // Save the current context state
        ctx.save();

        // Set opacity based on depth with added variance
        const opacityVariation = 0.05; // Reduced from 0.1 to create more full opacity fragments
        const randomOpacity = (Math.random() * 2 - 1) * opacityVariation;
        const opacity = Math.min(Math.max(fragment.depth + randomOpacity, 0.5), 1.0);
        
        // Increase chance of full opacity based on fragment size and position
        const isLargeFragment = width * height > (this.canvas.clientWidth * this.canvas.clientHeight * 0.15);
        const isCentralFragment = Math.abs(x - this.canvas.clientWidth/2) < this.canvas.clientWidth * 0.3 && 
                                 Math.abs(y - this.canvas.clientHeight/2) < this.canvas.clientHeight * 0.3;
        
        // 40% chance of full opacity for large fragments, 30% for central fragments, 20% for others
        const fullOpacityChance = isLargeFragment ? 0.4 : (isCentralFragment ? 0.3 : 0.2);
        if (Math.random() < fullOpacityChance) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = opacity;
        }

        // Move to fragment center for rotation
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((fragment.rotation * Math.PI) / 180);

        // Apply mask if specified
        if (fragment.mask && fragment.mask.enabled) {
            // Create clipping path based on mask type
            ctx.beginPath();
            
            // Calculate dimensions for mask
            const maskScale = fragment.mask.scale || 1.0;
            const scaledWidth = width * maskScale;
            const scaledHeight = height * maskScale;
            
            // Apply mask rotation if specified
            if (fragment.mask.rotation) {
                ctx.rotate((fragment.mask.rotation * Math.PI) / 180);
            }
            
            // Draw mask path based on type (same as original)
            // [Mask drawing code preserved from original]
            switch (fragment.mask.type) {
                case 'circle':
                    ctx.arc(0, 0, Math.min(scaledWidth, scaledHeight) / 2, 0, Math.PI * 2);
                    break;
                    
                case 'triangle':
                    ctx.moveTo(0, -scaledHeight / 2);
                    ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
                    ctx.lineTo(-scaledWidth / 2, scaledHeight / 2);
                    ctx.closePath();
                    break;
                    
                case 'rectangle':
                    ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                    break;
                    
                case 'ellipse':
                    ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
                    break;
                    
                case 'diamond':
                    ctx.moveTo(0, -scaledHeight / 2);
                    ctx.lineTo(scaledWidth / 2, 0);
                    ctx.lineTo(0, scaledHeight / 2);
                    ctx.lineTo(-scaledWidth / 2, 0);
                    ctx.closePath();
                    break;
                    
                case 'hexagon':
                    const hexRadius = Math.min(scaledWidth, scaledHeight) / 2;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        const x = hexRadius * Math.cos(angle);
                        const y = hexRadius * Math.sin(angle);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
                    
                case 'star':
                    const outerRadius = Math.min(scaledWidth, scaledHeight) / 2;
                    const innerRadius = outerRadius * 0.4;
                    for (let i = 0; i < 10; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i * Math.PI) / 5;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
                    
                case 'arc':
                    const arcRadius = Math.min(scaledWidth, scaledHeight) / 2;
                    ctx.beginPath();
                    // Draw the outer arc
                    ctx.arc(0, 0, arcRadius, 0, Math.PI, false);
                    // Draw the inner arc in reverse to create the arc shape
                    ctx.arc(0, 0, arcRadius * 0.7, Math.PI, 0, true);
                    ctx.closePath();
                    break;
                    
                case 'arch':
                    ctx.beginPath();
                    
                    // Calculate arch dimensions
                    const archWidth = scaledWidth;
                    const archHeight = scaledHeight;
                    const archRadius = archWidth / 2;
                    
                    // Draw the arch path
                    ctx.moveTo(-archWidth / 2, archHeight / 2);
                    ctx.lineTo(-archWidth / 2, -archHeight / 2 + archRadius);
                    ctx.arc(0, -archHeight / 2 + archRadius, archRadius, Math.PI, 0, false);
                    ctx.lineTo(archWidth / 2, archHeight / 2);
                    ctx.closePath();
                    break;
            }
            
            // Apply the clipping path
            ctx.clip();
        }

        // Calculate image dimensions to ensure it completely fills the mask
        const imageAspectRatio = fragment.image.width / fragment.image.height;
        const fragmentAspectRatio = width / height;
        
        // Calculate the base scaling factor needed to cover the fragment
        let scaleFactor;
        
        if (imageAspectRatio > fragmentAspectRatio) {
            // Image is wider than fragment - scale based on height
            scaleFactor = height / fragment.image.height;
        } else {
            // Image is taller than fragment - scale based on width
            scaleFactor = width / fragment.image.width;
        }
        
        // Apply a minimal buffer to prevent edge clipping
        const bufferFactor = 1.15; // Increased from 1.05 to allow more edge bleeding
        
        // Get mask scale if applicable
        const maskScale = fragment.mask && fragment.mask.enabled ? (fragment.mask.scale || 1.0) : 1.0;
        
        // Calculate final scale factor with minimal adjustments
        scaleFactor = scaleFactor * bufferFactor;
        
        // Add random variation to scale factor (minimal change)
        const randomScaleVariation = 0.85 + Math.random() * 0.3; // Random value between 0.85 and 1.15
        scaleFactor *= randomScaleVariation;
        
        // Ensure scale factor stays within reasonable bounds
        scaleFactor = Math.min(Math.max(scaleFactor, 0.9), 1.5);
        
        // Calculate the dimensions of the scaled image
        const drawWidth = fragment.image.width * scaleFactor;
        const drawHeight = fragment.image.height * scaleFactor;
        
        // Calculate the offset to center the image
        const offsetX = (drawWidth - fragment.width) / 2;
        const offsetY = (drawHeight - fragment.height) / 2;

        // Draw the image perfectly centered within the fragment
        ctx.drawImage(
            fragment.image,
            -width / 2 - offsetX,
            -height / 2 - offsetY,
            drawWidth,
            drawHeight
        );

        // Restore the context state
        ctx.restore();
    };
    
    return collageGeneratorInstance;
}

// Function to fix the app.js initialization
function fixAppInit() {
    // Check if app instance exists
    if (!window.app || !window.app.collageGenerator) {
        console.error('App or collageGenerator not initialized');
        return false;
    }
    
    console.log('Applying canvas and resolution fixes to app...');
    
    // Fix the CollageGenerator methods
    fixResizeCanvas(window.app.collageGenerator);
    fixDrawTile(window.app.collageGenerator);
    fixDrawFragment(window.app.collageGenerator);
    
    // Force a resize and redraw
    window.app.collageGenerator.resizeCanvas();
    window.app.generateCollage();
    
    console.log('Canvas and resolution fixes applied successfully');
    return true;
}

// Apply fixes when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if app is already loaded
    if (window.app && window.app.collageGenerator) {
        fixAppInit();
    } else {
        // Wait for app to initialize
        const checkInterval = setInterval(() => {
            if (window.app && window.app.collageGenerator) {
                clearInterval(checkInterval);
                fixAppInit();
            }
        }, 100);
        
        // Set a timeout to stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('Timeout waiting for app to initialize');
        }, 10000);
    }
});

// Export fix functions for individual use
export {
    fixResizeCanvas,
    fixDrawTile,
    fixDrawFragment,
    fixAppInit
};
