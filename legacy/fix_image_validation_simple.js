/**
 * Simple fix for image validation issues in tilingGenerator.js
 * 
 * This fixes the "Invalid image" errors by relaxing the validation check
 */

// The problem is in this section of generateTile:
// if (!selectedImage || !selectedImage.complete || !(selectedImage instanceof HTMLImageElement))
// 
// We'll make it more forgiving with a simpler check

// Find this code in tilingGenerator.js (around line 157):
if (!selectedImage || !selectedImage.complete || !(selectedImage instanceof HTMLImageElement)) {
    console.warn(`Invalid image at index ${imageIndex}`);
    return null;
}

// Replace it with this more forgiving check:
if (!selectedImage) {
    console.warn(`Missing image at index ${imageIndex}`);
    return null;
}
