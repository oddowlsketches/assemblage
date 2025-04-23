/**
 * Enhanced Mobile Resolution Fix for Assemblage
 * 
 * This script focuses on fixing mobile-specific image resolution issues
 * while maintaining the canvas sizing improvements from the previous fix.
 */

(function() {
    // Function to log with prefix for debugging
    function logDebug(message, data = null) {
        const prefix = '[Mobile Fix]';
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    // Wait for the app to initialize
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
    
    // Wait for all images to load
    function waitForImages(imageCollection) {
        if (!imageCollection || !Array.isArray(imageCollection)) {
            return Promise.resolve([]);
        }
        
        const loadPromises = imageCollection.map(imgData => {
            return new Promise((resolve) => {
                if (imgData instanceof HTMLImageElement) {
                    if (imgData.complete) {
                        resolve(imgData);
                    } else {
                        imgData.onload = () => resolve(imgData);
                        imgData.onerror = () => resolve(null);
                    }
                } else if (imgData.src || imgData.path || imgData.filename) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    
                    const src = imgData.src || imgData.path || 
                               (imgData.filename ? `/images/collages/${imgData.filename}` : null);
                    if (src) {
                        img.src = src;
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
        
        return Promise.all(loadPromises).then(loadedImages => 
            loadedImages.filter(img => img !== null)
        );
    }

    // Fix image rendering quality issues
    function enhanceImageRendering(canvas, ctx, isMobile) {
        if (!canvas || !ctx) return;
        
        // Apply crisp-edges rendering
        canvas.style.imageRendering = 'optimizeQuality';
        if (isMobile) {
            // Additional settings for mobile
            canvas.style.imageRendering = 'crisp-edges';
            canvas.style.webkitFontSmoothing = 'antialiased';
            canvas.style.mozOsxFontSmoothing = 'grayscale';
            
            // Attempt to disable any font/image smoothing
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
        }
        
        logDebug('Enhanced image rendering applied', { isMobile });
    }
    
    // Improved device detection
    function detectDevice() {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
        const isApple = /iPhone|iPad|iPod|Mac/i.test(ua);
        const isRetinaDisplay = window.devicePixelRatio > 1;
        
        return {
            isMobile,
            isTablet,
            isApple,
            isRetinaDisplay,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
    }
    
    // Enhanced canvas resize method for better mobile support
    function enhancedResizeCanvas(generator) {
        const origResize = generator.resizeCanvas;
        
        generator.resizeCanvas = function() {
            // Check if canvas is properly initialized
            if (!this.canvas || !this.ctx) {
                logDebug('Canvas or context not initialized');
                return;
            }
            
            // Get device info
            const device = detectDevice();
            logDebug('Device info:', device);
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate device pixel ratio with some adjustments for mobile
            let effectiveDPR = device.devicePixelRatio;
            
            // For mobile devices, we may need to adjust the effective DPR
            // to avoid overscaling which can cause performance issues
            if (device.isMobile && !device.isTablet) {
                // Limit DPR on mobile to avoid performance issues with extremely large canvases
                if (effectiveDPR > 2) {
                    effectiveDPR = 2; // Cap at 2x for most mobile devices
                    logDebug('Capped DPR for mobile device', effectiveDPR);
                }
            }
            
            // Set the display size (CSS pixels)
            this.canvas.style.width = viewportWidth + 'px';
            this.canvas.style.height = viewportHeight + 'px';
            
            // Set the actual canvas dimensions with effective DPR
            this.canvas.width = Math.floor(viewportWidth * effectiveDPR);
            this.canvas.height = Math.floor(viewportHeight * effectiveDPR);
            
            logDebug('Canvas dimensions set:', {
                cssWidth: this.canvas.style.width,
                cssHeight: this.canvas.style.height,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
                effectiveDPR: effectiveDPR
            });
            
            // Reset the context and apply scaling
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(effectiveDPR, effectiveDPR);
            
            // Apply enhanced image rendering
            enhanceImageRendering(this.canvas, this.ctx, device.isMobile);
            
            // Add more precise pixel ratio handling for better image quality
            const pixelRatio = effectiveDPR;
            if (pixelRatio !== 1) {
                this.ctx.imageSmoothingQuality = 'high';
            }
            
            // Update narrative manager's canvas dimensions if it exists
            if (this.narrativeManager) {
                this.narrativeManager.parameters.canvasWidth = viewportWidth;
                this.narrativeManager.parameters.canvasHeight = viewportHeight;
            }
            
            logDebug('Canvas resize complete');
        };
        
        // Run the resize immediately
        generator.resizeCanvas();
        
        return generator;
    }
    
    // Enhanced image drawing function for better quality
    function enhanceImageDrawing(generator) {
        const origDrawImage = generator.drawImage;
        
        generator.drawImage = function(image, x, y, width, height, crop = false, forceOpacity = null, showCroppedPortion = false) {
            if (!image || !image.complete || image.naturalWidth === 0) {
                return;
            }
    
            try {
                // Save the current context state
                this.ctx.save();
                
                // --- Enhanced Opacity Calculation ---
                let finalOpacity;
                if (forceOpacity !== null && forceOpacity >= 0 && forceOpacity <= 1) {
                    finalOpacity = forceOpacity;
                } else {
                    // Higher default opacity range for better visibility (0.4 - 0.7)
                    const baseOpacity = this.parameters.blendOpacity || 0.5; // Increased from 0.45
                    const opacityVariation = 0.15;
                    let randomOpacity = baseOpacity + (Math.random() * 2 * opacityVariation) - opacityVariation;
                    // Clamp opacity to an improved range
                    finalOpacity = Math.max(0.4, Math.min(0.7, randomOpacity)); 
                }
                this.ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));
                
                // --- Enhanced Contrast and Sharpness ---
                const contrastLevel = (this.parameters.contrast / 10) + 0.1; // Add a bit more contrast
                const brightness = 1.05; // Slight brightness boost for better visibility
                this.ctx.filter = `contrast(${1 + contrastLevel}) brightness(${brightness})`;
    
                // --- Enhanced Image Drawing ---
                if (crop) {
                    // For mosaic tiles with enhanced quality
                    const destRatio = width / height;
                    const srcRatio = image.width / image.height;
                    
                    let cropWidth, cropHeight, cropX, cropY;
                    
                    if (showCroppedPortion) {
                        // Random crop portion with enhanced quality calculations
                        const cropPercentage = 0.4 + Math.random() * 0.6; // Increased minimum visible portion
                        
                        if (srcRatio > destRatio) {
                            cropHeight = image.height * cropPercentage;
                            cropWidth = cropHeight * destRatio;
                            const maxCropX = image.width - cropWidth;
                            cropX = Math.random() * maxCropX;
                            cropY = (image.height - cropHeight) / 2;
                        } else {
                            cropWidth = image.width * cropPercentage;
                            cropHeight = cropWidth / destRatio;
                            cropX = (image.width - cropWidth) / 2;
                            const maxCropY = image.height - cropHeight;
                            cropY = Math.random() * maxCropY;
                        }
                    } else {
                        // Standard cropping with enhanced quality considerations
                        if (srcRatio > destRatio) {
                            cropHeight = image.height;
                            cropWidth = cropHeight * destRatio;
                            cropX = (image.width - cropWidth) / 2;
                            cropY = 0;
                        } else {
                            cropWidth = image.width;
                            cropHeight = cropWidth / destRatio;
                            cropX = 0;
                            cropY = (image.height - cropHeight) / 2;
                        }
                    }
                    
                    // Use subpixel positioning for smoother rendering on high-DPI displays
                    this.ctx.drawImage(
                        image,
                        Math.floor(cropX), Math.floor(cropY), 
                        Math.floor(cropWidth), Math.floor(cropHeight),
                        Math.floor(x), Math.floor(y), 
                        Math.floor(width), Math.floor(height)
                    );
                } else {
                    const dimensions = this.calculateImageDimensions(image, width, height);
                    if (dimensions) {
                        // Use subpixel positioning for smoother rendering on high-DPI displays
                        this.ctx.drawImage(
                            image,
                            Math.floor(dimensions.x + x),
                            Math.floor(dimensions.y + y),
                            Math.floor(dimensions.width),
                            Math.floor(dimensions.height)
                        );
                    }
                }
    
                // Restore the context state
                this.ctx.restore();
            } catch (error) {
                console.warn('Error drawing image:', error);
            }
        };
        
        return generator;
    }

    // Enhanced draw fragment for better quality and positioning
    function enhanceDrawFragment(generator) {
        const origDrawFragment = generator.drawFragment;
        
        generator.drawFragment = function(fragment, ctx) {
            // Skip if dimensions are invalid
            if (!fragment.width || !fragment.height || isNaN(fragment.width) || isNaN(fragment.height)) {
                console.warn('Invalid fragment dimensions, skipping draw:', fragment);
                return;
            }
    
            // Save the current context state
            ctx.save();
    
            // Enhanced opacity calculation for better visibility
            const opacityVariation = 0.05;
            const randomOpacity = (Math.random() * 2 - 1) * opacityVariation;
            const baseDepth = Math.max(0.6, fragment.depth || 0.6); // Ensure a minimum depth for better visibility
            const opacity = Math.min(Math.max(baseDepth + randomOpacity, 0.5), 1.0);
            
            // Higher chance of full opacity for better visibility
            const isLargeFragment = fragment.width * fragment.height > 
                                   (this.canvas.clientWidth * this.canvas.clientHeight * 0.15);
            const isCentralFragment = Math.abs(fragment.x - this.canvas.clientWidth/2) < this.canvas.clientWidth * 0.3 && 
                                     Math.abs(fragment.y - this.canvas.clientHeight/2) < this.canvas.clientHeight * 0.3;
            
            // 50% chance for large or central fragments, 30% for others (increased chances)
            const fullOpacityChance = isLargeFragment || isCentralFragment ? 0.5 : 0.3;
            ctx.globalAlpha = Math.random() < fullOpacityChance ? 1.0 : opacity;
    
            // Move to fragment center for rotation - using integer pixel values for sharper rendering
            const centerX = Math.floor(fragment.x + fragment.width / 2);
            const centerY = Math.floor(fragment.y + fragment.height / 2);
            ctx.translate(centerX, centerY);
            ctx.rotate((fragment.rotation * Math.PI) / 180);
    
            // Apply mask if specified (mask handling code remains the same)
            if (fragment.mask && fragment.mask.enabled) {
                // Create clipping path based on mask type
                ctx.beginPath();
                
                // Calculate dimensions for mask
                const maskScale = fragment.mask.scale || 1.0;
                const scaledWidth = fragment.width * maskScale;
                const scaledHeight = fragment.height * maskScale;
                
                // Apply mask rotation if specified
                if (fragment.mask.rotation) {
                    ctx.rotate((fragment.mask.rotation * Math.PI) / 180);
                }
                
                // Draw the mask shape (same as original code)
                // ...mask drawing code...
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
                        
                    // ... other mask shapes remain the same ...
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
    
            // Enhanced image rendering calculations
            const imageAspectRatio = fragment.image.width / fragment.image.height;
            const fragmentAspectRatio = fragment.width / fragment.height;
            
            // Improved scale factor calculation for better coverage
            let scaleFactor;
            if (imageAspectRatio > fragmentAspectRatio) {
                // Image is wider than fragment - scale based on height with better coverage
                scaleFactor = (fragment.height / fragment.image.height) * 1.2; // 20% extra coverage
            } else {
                // Image is taller than fragment - scale based on width with better coverage
                scaleFactor = (fragment.width / fragment.image.width) * 1.2; // 20% extra coverage
            }
            
            // Apply a minimal buffer to prevent edge clipping (increased buffer)
            const bufferFactor = 1.2; // Increased from 1.15 for better edge coverage
            
            // Calculate final scale factor with minimal adjustments
            scaleFactor = scaleFactor * bufferFactor;
            
            // Add random variation to scale factor (minimal change)
            const randomScaleVariation = 0.9 + Math.random() * 0.2; // Random value between 0.9 and 1.1
            scaleFactor *= randomScaleVariation;
            
            // Ensure scale factor stays within reasonable bounds (increased for better clarity)
            scaleFactor = Math.min(Math.max(scaleFactor, 1.0), 1.6);
            
            // Calculate the dimensions of the scaled image (use integer values for sharper edges)
            const drawWidth = Math.floor(fragment.image.width * scaleFactor);
            const drawHeight = Math.floor(fragment.image.height * scaleFactor);
            
            // Calculate the offset to center the image (use integer values for sharper edges)
            const offsetX = Math.floor((drawWidth - fragment.width) / 2);
            const offsetY = Math.floor((drawHeight - fragment.height) / 2);
    
            // Draw the image perfectly centered within the fragment (use integer values for sharper edges)
            ctx.drawImage(
                fragment.image,
                -Math.floor(fragment.width / 2) - offsetX,
                -Math.floor(fragment.height / 2) - offsetY,
                drawWidth,
                drawHeight
            );
    
            // Restore the context state
            ctx.restore();
        };
        
        return generator;
    }

    // Main function to apply enhancements
    async function applyMobileEnhancements() {
        logDebug('Waiting for app to initialize...');
        
        const generator = await waitForApp();
        if (!generator) {
            logDebug('Failed to get collage generator');
            return false;
        }
        
        logDebug('CollageGenerator found, applying enhancements');
        
        // Apply enhancements
        enhancedResizeCanvas(generator);
        enhanceImageDrawing(generator);
        enhanceDrawFragment(generator);
        
        // Force a resize to apply changes
        generator.resizeCanvas();
        
        logDebug('Mobile enhancements applied');
        
        // Detect if app has a redraw or generateCollage method
        if (window.app && typeof window.app.generateCollage === 'function') {
            logDebug('Triggering collage generation');
            window.app.generateCollage();
        } else if (generator && typeof generator.redraw === 'function') {
            logDebug('Triggering redraw');
            generator.redraw();
        }
        
        return true;
    }

    // Apply enhancements when the document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMobileEnhancements);
    } else {
        applyMobileEnhancements();
    }
    
    // Expose the enhancement functions globally (for debugging)
    window.enhanceMobile = {
        applyEnhancements: applyMobileEnhancements,
        detectDevice: detectDevice
    };
    
    logDebug('Enhanced mobile fix script loaded');
})();
