/**
 * Image validation fix for Tiling Generator
 * 
 * This solution modifies the image validation portion of the generateTile method
 * to work with the actual image objects in your collection.
 */

// The problem is in the image validation section of generateTile:
// The current version is checking for .complete and instanceof HTMLImageElement
// However, your image objects might not have exactly these properties
// or they may need more time to load

// Here's the fixed version to replace in tilingGenerator.js:

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
    
    // IMPROVED VALIDATION: More relaxed image validation
    // This handles both direct HTMLImageElement objects and objects with src/width/height
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