/**
 * Tiling Generator for Assemblage
 * Handles tiling-specific collage generation with improved image validation
 */

export class TilingGenerator {
    constructor(canvas, parameters) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parameters = parameters;
        this.ABSOLUTE_MAX_REPEATS = 3; // Maximum number of times an image can be repeated
        this.imageUsageCount = new Map(); // Track how many times each image is used
    }

    // Helper function to shuffle arrays (used in multiple effects)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper function to preserve aspect ratio when drawing tiles
    preserveAspectRatio(image, x, y, targetWidth, targetHeight) {
        if (!image) return false;
        
        const imgWidth = image.width || image.naturalWidth || 300;
        const imgHeight = image.height || image.naturalHeight || 300;
        const imgRatio = imgWidth / imgHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgRatio > targetRatio) {
            // Image is wider - match width and center vertically
            drawWidth = targetWidth;
            drawHeight = drawWidth / imgRatio;
            drawX = x;
            drawY = y + (targetHeight - drawHeight) / 2;
        } else {
            // Image is taller - match height and center horizontally
            drawHeight = targetHeight;
            drawWidth = drawHeight * imgRatio;
            drawX = x + (targetWidth - drawWidth) / 2;
            drawY = y;
        }
        
        // Draw with proper dimensions
        try {
            this.ctx.drawImage(
                image,
                0, 0, imgWidth, imgHeight, // Source
                drawX, drawY, drawWidth, drawHeight // Destination
            );
            return true;
        } catch (err) {
            console.warn('Error drawing image:', err);
            return false;
        }
    }

    // Enhanced tile drawing with aspect ratio preservation
    drawTileWithAspectRatio(image, x, y, width, height) {
        if (!image) return;
        
        // Save current context state
        this.ctx.save();
        
        // Calculate aspect ratio (use reasonable defaults if properties not available)
        const imgWidth = image.width || image.naturalWidth || 300;
        const imgHeight = image.height || image.naturalHeight || 300;
        const imgAspectRatio = imgWidth / imgHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        // Always preserve original aspect ratio
        if (imgAspectRatio > 1) {
            // Landscape image - match width
            drawWidth = width;
            drawHeight = width / imgAspectRatio;
            drawX = x;
            drawY = y + (height - drawHeight) / 2;
        } else {
            // Portrait image - match height
            drawHeight = height;
            drawWidth = drawHeight * imgAspectRatio;
            drawX = x + (width - drawWidth) / 2;
            drawY = y;
        }
        
        // Draw with proper dimensions
        try {
            this.ctx.drawImage(
                image,
                0, 0, imgWidth, imgHeight, // Source (full image)
                drawX, drawY, drawWidth, drawHeight // Destination
            );
        } catch (err) {
            console.warn('Error drawing tile:', err);
        }
        
        // Restore context
        this.ctx.restore();
    }

    async generateTile(images, x, y, size, preferredImageIndex = null) {
        if (!images || images.length === 0) return null;
        
        // Determine if image repetition is allowed based on parameters
        const allowImageRepetition = this.parameters.allowImageRepetition !== null 
            ? this.parameters.allowImageRepetition 
            : false; // Default to no repetition
            
        let imageIndex;
        
        if (preferredImageIndex !== null) {
            // Use the preferred image if provided
            imageIndex = preferredImageIndex;
        } else if (allowImageRepetition) {
            // Choose the least used image that hasn't hit the repetition limit
            const availableImages = Array.from({length: images.length}, (_, i) => i)
                .filter(idx => (this.imageUsageCount.get(idx) || 0) < this.ABSOLUTE_MAX_REPEATS);
            
            if (availableImages.length === 0) {
                // All images have hit the max usage limit, reset counts
                this.imageUsageCount.clear();
                imageIndex = Math.floor(Math.random() * images.length);
            } else {
                // Sort by usage count (least used first)
                availableImages.sort((a, b) => 
                    (this.imageUsageCount.get(a) || 0) - (this.imageUsageCount.get(b) || 0)
                );
                
                // Prefer least used images (80% chance) or random from available (20% chance)
                if (Math.random() < 0.8) {
                    // Get all images with the minimum usage count
                    const minUsage = this.imageUsageCount.get(availableImages[0]) || 0;
                    const leastUsedImages = availableImages.filter(idx => 
                        (this.imageUsageCount.get(idx) || 0) === minUsage
                    );
                    imageIndex = leastUsedImages[Math.floor(Math.random() * leastUsedImages.length)];
                } else {
                    // Choose randomly from all available images
                    imageIndex = availableImages[Math.floor(Math.random() * availableImages.length)];
                }
            }
        } else {
            // No repetition - use each image only once
            const unusedImages = Array.from({length: images.length}, (_, i) => i)
                .filter(idx => !(this.imageUsageCount.get(idx) || 0));
                
            if (unusedImages.length === 0) {
                // No more unused images, can't create more tiles
                return null;
            }
            
            imageIndex = unusedImages[Math.floor(Math.random() * unusedImages.length)];
        }
        
        // Update usage count
        const currentCount = this.imageUsageCount.get(imageIndex) || 0;
        this.imageUsageCount.set(imageIndex, currentCount + 1);
        
        const selectedImage = images[imageIndex];
        
        // IMPROVED IMAGE VALIDATION
        // Just check that the image exists - don't do strict validation that might fail
        if (!selectedImage) {
            console.warn(`Missing image at index ${imageIndex}`);
            return null;
        }
        
        // Calculate aspect-preserving dimensions
        // Use available properties or defaults if not available
        const imgWidth = selectedImage.width || selectedImage.naturalWidth || 300;
        const imgHeight = selectedImage.height || selectedImage.naturalHeight || 300;
        const imgRatio = imgWidth / imgHeight;
        
        let finalWidth, finalHeight;
        
        if (imgRatio > 1) {
            // Landscape image
            finalWidth = size;
            finalHeight = size / imgRatio;
        } else {
            // Portrait image
            finalHeight = size;
            finalWidth = size * imgRatio;
        }
        
        // Keep tiles within canvas bounds - allow partial overflow for full bleed
        const boundedX = Math.min(x, this.canvas.width);
        const boundedY = Math.min(y, this.canvas.height);
        
        return {
            image: selectedImage,
            x: boundedX,
            y: boundedY,
            width: finalWidth,
            height: finalHeight,
            rotation: 0,
            forceOpacity: null,
            imageIndex: imageIndex // Track which image was used
        };
    }
