/**
 * Helper function to generate a tile for the tiling collage effect
 * This is extracted from the April 10 backup
 */

export async function generateTile(images, x, y, size) {
    if (!images || images.length === 0) return null;
    
    // Select image from the array
    const imageIndex = Math.floor(Math.random() * images.length);
    const selectedImage = images[imageIndex];
    
    // Validate image
    if (!selectedImage || !selectedImage.complete || !(selectedImage instanceof HTMLImageElement)) {
        console.warn(`Invalid image at index ${imageIndex}`);
        return null;
    }
    
    // Keep tiles within canvas bounds - allow partial overflow for full bleed
    const boundedX = Math.min(x, this.canvas.width);
    const boundedY = Math.min(y, this.canvas.height);
    
    return {
        image: selectedImage,
        x: boundedX,
        y: boundedY,
        width: size,
        height: size,
        rotation: 0,
        forceOpacity: null,
        imageIndex: imageIndex // Track which image was used
    };
}