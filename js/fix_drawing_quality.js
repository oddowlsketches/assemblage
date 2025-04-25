/**
 * Fix for Drawing Quality in Assemblage
 * 
 * This script improves image quality by enforcing integer pixel coordinates,
 * disabling unnecessary anti-aliasing, and optimizing the drawing process.
 */

(function() {
    // Track changes and debugging
    let fixes = {
        applied: false,
        generators: []
    };
    
    function logDebug(message, data = null) {
        const prefix = '[Quality Fix]';
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

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
                logDebug('Timeout waiting for app to initialize');
                resolve(null);
            }, 10000);
        });
    }

    // Fix drawing methods to use integer coordinates
    function fixDrawingMethods(generator) {
        logDebug('Applying drawing method fixes...');
        
        // Fix the draw tile method for pixel-perfect positioning
        if (generator.drawTile) {
            const originalDrawTile = generator.drawTile;
            
            generator.drawTile = function(tile, index, skippedTiles) {
                // Validate tile
                if (!tile || !tile.image || !tile.image.complete) {
                    if (skippedTiles) skippedTiles.invalid++;
                    return false;
                }
                
                try {
                    // Save original values
                    const originalX = tile.x;
                    const originalY = tile.y;
                    const originalWidth = tile.width;
                    const originalHeight = tile.height;
                    
                    // Use integer pixel values for tile positioning
                    tile.x = Math.floor(tile.x);
                    tile.y = Math.floor(tile.y);
                    tile.width = Math.floor(tile.width);
                    tile.height = Math.floor(tile.height);
                    
                    // Call original method with corrected values
                    const result = originalDrawTile.call(this, tile, index, skippedTiles);
                    
                    // Restore original values if needed for further processing
                    tile.x = originalX;
                    tile.y = originalY;
                    tile.width = originalWidth;
                    tile.height = originalHeight;
                    
                    return result;
                } catch (error) {
                    console.error('Error in enhanced drawTile:', error);
                    if (skippedTiles) skippedTiles.drawError++;
                    return false;
                }
            };
            
            fixes.generators.push('drawTile');
        }
        
        // Fix the draw fragment method for higher quality
        if (generator.drawFragment) {
            const originalDrawFragment = generator.drawFragment;
            
            generator.drawFragment = function(fragment, ctx) {
                // Skip if dimensions are invalid
                if (!fragment.width || !fragment.height || 
                    isNaN(fragment.width) || isNaN(fragment.height)) {
                    console.warn('Invalid fragment dimensions, skipping draw:', fragment);
                    return;
                }

                // Save the current context state
                ctx.save();

                // Use integer coordinates for fragment position
                const x = Math.floor(fragment.x);
                const y = Math.floor(fragment.y);
                const width = Math.floor(fragment.width);
                const height = Math.floor(fragment.height);
                
                // Move to fragment center for rotation (using integer coordinates)
                const centerX = Math.floor(x + width / 2);
                const centerY = Math.floor(y + height / 2);
                
                // Calculate fragment opacity (same as original)
                const opacity = Math.min(Math.max(fragment.depth || 0.7, 0.3), 1.0);
                ctx.globalAlpha = opacity;

                // Position and rotate
                ctx.translate(centerX, centerY);
                ctx.rotate((fragment.rotation * Math.PI) / 180);

                // Apply mask if specified (mask handling code remains the same)
                if (fragment.mask && fragment.mask.enabled) {
                    // Original mask code...
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
                    
                    // Draw the mask shape (same as original code)
                    // This large switch statement is kept intact from the original
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
                
                // Calculate image dimensions - use more conservative scaling
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
                // Reduced from 1.15 to 1.05 to reduce over-stretching
                const bufferFactor = 1.05;
                
                // Calculate final scale factor with minimal adjustments
                scaleFactor = scaleFactor * bufferFactor;
                
                // Limit scale factor to a reasonable range to prevent over-stretching
                scaleFactor = Math.min(Math.max(scaleFactor, 0.9), 1.4);
                
                // Calculate the dimensions of the scaled image (using integer values)
                const drawWidth = Math.floor(fragment.image.width * scaleFactor);
                const drawHeight = Math.floor(fragment.image.height * scaleFactor);
                
                // Calculate the offset to center the image (using integer values)
                const offsetX = Math.floor((drawWidth - width) / 2);
                const offsetY = Math.floor((drawHeight - height) / 2);

                // Draw the image perfectly centered within the fragment
                ctx.drawImage(
                    fragment.image,
                    -Math.floor(width / 2) - offsetX,
                    -Math.floor(height / 2) - offsetY,
                    drawWidth,
                    drawHeight
                );

                // Restore the context state
                ctx.restore();
            };
            
            fixes.generators.push('drawFragment');
        }
        
        // Fix canvas context settings for better image quality
        if (generator.ctx) {
            // Disable image smoothing for sharper edges on high contrast images
            generator.ctx.imageSmoothingEnabled = false;
            generator.ctx.webkitImageSmoothingEnabled = false;
            generator.ctx.mozImageSmoothingEnabled = false;
            generator.ctx.msImageSmoothingEnabled = false;
            
            fixes.generators.push('ctx settings');
        }
        
        logDebug('Applied drawing method fixes for:', fixes.generators.join(', '));
        fixes.applied = true;
        return true;
    }

    // Apply fixes when document is loaded
    window.addEventListener('DOMContentLoaded', async () => {
        logDebug('Waiting for app to initialize...');
        
        const generator = await waitForApp();
        if (!generator) {
            console.error('Failed to get collage generator');
            return;
        }
        
        // Apply fixes
        const drawingFixed = fixDrawingMethods(generator);
        
        if (drawingFixed) {
            logDebug('Successfully applied drawing quality fixes');
            
            // Trigger redraw if possible
            if (window.app && window.app.generateCollage) {
                logDebug('Triggering collage regeneration...');
                window.app.generateCollage();
            } else if (generator.redraw) {
                logDebug('Triggering redraw...');
                generator.redraw();
            }
        }
    });

    // Log that the fix has been loaded
    logDebug('Drawing quality fix script loaded');
})();
