import { generatePalette } from './advancedColorUtils.js';

// colors.js – shared color helpers

export const vibrantColors = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#D4A5A5', // Dusty Rose
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#E67E22', // Orange
  '#2ECC71', // Green
  '#F1C40F', // Yellow
  '#E74C3C', // Red
  '#1ABC9C', // Teal
];

export const subtleColors = [
  '#F5F5DC', // Beige
  '#E6E6FA', // Lavender
  '#F0F8FF', // Alice Blue
  '#F5FFFA', // Mint Cream
  '#FFF8DC', // Cornsilk
  '#F8F8FF', // Ghost White
  '#FFFACD', // Lemon Chiffon
  '#F0F0F0', // Light Gray (was E0E0E0)
  '#F0E68C', // Khaki
  '#DDA0DD', // Plum
  '#98FB98', // Pale Green
  '#FFE4E1', // Misty Rose
  '#E0FFFF', // Light Cyan
  '#FFEFD5', // Papaya Whip
  '#FFF0F5', // Lavender Blush
  '#F0FFF0', // Honeydew
];

export const pastelColors = [
  '#FFB3BA', // Light Pink
  '#FFDFBA', // Light Peach
  '#FFFFBA', // Light Yellow
  '#BAFFC9', // Light Green
  '#BAE1FF', // Light Blue
  '#E1BAFF', // Light Purple
  '#FFE1BA', // Light Orange
  '#BABEFF', // Light Periwinkle
  '#C9BAFF', // Light Lavender
  '#BAFFBA', // Light Mint
  '#FFE4B5', // Moccasin
  '#F0E8E8', // Light Rose
];

export const earthToneColors = [
  '#D2B48C', // Tan
  '#DEB887', // Burlywood
  '#F4A460', // Sandy Brown
  '#DAA520', // Goldenrod
  '#CD853F', // Peru
  '#BC8F8F', // Rosy Brown
  '#A0522D', // Sienna
  '#8FBC8F', // Dark Sea Green
  '#9ACD32', // Yellow Green
  '#F5DEB3', // Wheat
  '#E6E6FA', // Lavender (light)
  '#DCDCDC', // Gainsboro
];

/**
 * Gets a random vibrant color - enhanced with palette-aware selection
 * @param {HTMLImageElement[]} images - Array of images (optional)
 * @param {'auto'|'vibrant'|'subtle'|'pastel'|'earthTone'} paletteType - Palette type
 * @returns {string} A random color
 */
export function randomVibrantColor(images = null, paletteType = 'vibrant') {
  if (images && images.length > 0) {
    return getRandomColorFromPalette(images, paletteType);
  }
  return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
}

export function randomSubtleColor() {
  return subtleColors[Math.floor(Math.random() * subtleColors.length)];
}

export function randomPastelColor() {
  return pastelColors[Math.floor(Math.random() * pastelColors.length)];
}

export function randomEarthToneColor() {
  return earthToneColors[Math.floor(Math.random() * earthToneColors.length)];
}

/**
 * Analyzes if an image is mostly black and white
 * @param {HTMLImageElement} image - The image to analyze
 * @param {number} sampleSize - Number of pixels to sample (default: 100)
 * @param {number} threshold - Saturation threshold for B&W detection (default: 30)
 * @returns {boolean} True if image is mostly black and white
 */
export function isImageMostlyBlackAndWhite(image, sampleSize = 100, threshold = 25) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    return true; // Default to B&W if image not available
  }

  // Create a small canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Use a small size for analysis to improve performance
  const analyzeSize = 32; // Smaller for better performance
  canvas.width = analyzeSize;
  canvas.height = analyzeSize;
  
  try {
    // Draw the image scaled down
    ctx.drawImage(image, 0, 0, analyzeSize, analyzeSize);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, analyzeSize, analyzeSize);
    const data = imageData.data;
    
    let totalSaturation = 0;
    let pixelCount = 0;
    let colorfulPixels = 0;
    
    // Sample pixels (every 8th pixel for performance)
    for (let i = 0; i < data.length; i += 32) { // 32 = 8 pixels * 4 channels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip very dark or very light pixels as they're often not indicative
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 235) {
        continue;
      }
      
      // Calculate saturation using HSV conversion (more accurate than HSL for this purpose)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      
      let saturation = 0;
      if (max !== 0) {
        saturation = (diff / max) * 100;
      }
      
      totalSaturation += saturation;
      pixelCount++;
      
      // Count pixels with significant color
      if (saturation > threshold) {
        colorfulPixels++;
      }
    }
    
    if (pixelCount === 0) {
      return true; // If no valid pixels found, assume B&W
    }
    
    const averageSaturation = totalSaturation / pixelCount;
    const colorfulRatio = colorfulPixels / pixelCount;
    
    // Image is B&W if average saturation is low AND few pixels are colorful
    return averageSaturation < threshold && colorfulRatio < 0.15;
    
  } catch (error) {
    console.warn('Error analyzing image color:', error);
    return true; // Default to B&W if analysis fails
  }
}

/**
 * Analyzes multiple images to determine if they are mostly black and white
 * Uses metadata field 'is_black_and_white' if available, falls back to image analysis
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @returns {boolean} True if majority of images are black and white
 */
export function areImagesMostlyBlackAndWhite(images) {
  if (!images || images.length === 0) {
    return true; // Default to B&W
  }
  
  const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
  if (validImages.length === 0) {
    return true;
  }
  
  // Check if images have the is_black_and_white metadata field
  const imagesWithMetadata = validImages.filter(img => img.is_black_and_white !== undefined && img.is_black_and_white !== null);
  
  if (imagesWithMetadata.length > 0) {
    // Use metadata when available (is_black_and_white: true means B&W, false means color)
    const blackAndWhiteCount = imagesWithMetadata.filter(img => img.is_black_and_white === true).length;
    const result = blackAndWhiteCount > (imagesWithMetadata.length / 2);
    console.log(`[Color Analysis] Using metadata - ${blackAndWhiteCount}/${imagesWithMetadata.length} images are B&W: ${result}`);
    return result;
  }
  
  // Fallback to image analysis if no metadata available
  console.log(`[Color Analysis] No metadata found, falling back to image analysis`);
  const samplesToAnalyze = Math.min(5, validImages.length);
  const imagesToAnalyze = validImages.slice(0, samplesToAnalyze);
  
  let blackAndWhiteCount = 0;
  
  for (const image of imagesToAnalyze) {
    if (isImageMostlyBlackAndWhite(image)) {
      blackAndWhiteCount++;
    }
  }
  
  // Return true if majority are B&W
  const result = blackAndWhiteCount > (imagesToAnalyze.length / 2);
  console.log(`[Color Analysis] Image analysis - ${blackAndWhiteCount}/${imagesToAnalyze.length} images are B&W: ${result}`);
  return result;
}

/**
 * Gets an appropriate color palette based on image analysis
 * Uses advanced k-means clustering in Lab space for color images
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {'auto'|'vibrant'|'subtle'|'pastel'|'earthTone'} paletteType - Palette type (auto uses image analysis)
 * @returns {string[]} Array of colors from the appropriate palette
 */
export function getColorPalette(images, paletteType = 'auto') {
  if (paletteType === 'vibrant') return vibrantColors;
  if (paletteType === 'subtle') return subtleColors;
  if (paletteType === 'pastel') return pastelColors;
  if (paletteType === 'earthTone') return earthToneColors;
  
  // Auto mode: analyze images to determine palette
  if (paletteType === 'auto') {
    const isBlackAndWhite = areImagesMostlyBlackAndWhite(images);
    
    // Use new generatePalette function
    return generatePalette(images, isBlackAndWhite);
  }
  
  return vibrantColors; // Default fallback
}

/**
 * Gets a random color from the appropriate palette based on image analysis
 * For color images, returns a lighter, less saturated color suitable for backgrounds
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {'auto'|'vibrant'|'subtle'|'pastel'|'earthTone'} paletteType - Palette type
 * @returns {string} A random color from the appropriate palette
 */
export function getRandomColorFromPalette(images, paletteType = 'auto') {
  const isBlackAndWhite = areImagesMostlyBlackAndWhite(images);
  
  // For color images, we need to be more careful about background selection
  if (!isBlackAndWhite && paletteType === 'auto') {
    // Use subtle colors for color images to avoid muddy multiply effects
    const palette = subtleColors;
    const selectedColor = palette[Math.floor(Math.random() * palette.length)];
    console.log(`[Color Palette] Color images detected - using subtle palette, selected: ${selectedColor}`);
    return selectedColor;
  }
  
  // For B&W images or explicit palette selection, use original logic
  const palette = getColorPalette(images, paletteType);
  const selectedColor = palette[Math.floor(Math.random() * palette.length)];
  
  // Debug logging to help track palette selection
  if (paletteType === 'auto' && images && images.length > 0) {
    console.log(`[Color Palette] Analyzed ${images.length} images - B&W: ${isBlackAndWhite}, Selected: ${selectedColor} from palette`);
  }
  
  return selectedColor;
}

// Helper function to parse hex color and get RGB components
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to convert RGB to hex color
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Helper function to calculate saturation from RGB values
function getSaturation(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const diff = max - min;
  
  if (max === 0 || diff === 0) {
    return 0;
  }
  
  return diff / max;
}

/**
 * Calculates the complimentary color for a given hex color.
 * @param {string} hexColor - The base color in hex format (e.g., "#RRGGBB").
 * @returns {string} The complimentary color in hex format.
 */
export function getComplimentaryColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return '#000000'; // Default to black if input is invalid
  }

  // To find the complimentary color, invert each component
  const r = 255 - rgb.r;
  const g = 255 - rgb.g;
  const b = 255 - rgb.b;

  return rgbToHex(r, g, b);
}

/**
 * Gets a smart background color for templates, optimized to avoid muddiness with multiply blend mode
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {'auto'|'vibrant'|'subtle'|'pastel'|'earthTone'} paletteType - Palette type
 * @returns {string} A background color optimized for the image content
 */
export function getSmartBackgroundColor(images, paletteType = 'auto') {
  const isBlackAndWhite = areImagesMostlyBlackAndWhite(images);
  
  if (!isBlackAndWhite && paletteType === 'auto') {
    // For color images, pick from subtle colors or generate a very light tint
    const baseColors = subtleColors.concat(pastelColors);
    const selectedColor = baseColors[Math.floor(Math.random() * baseColors.length)];
    
    // Further lighten the color to ensure it doesn't overpower images
    const rgb = hexToRgb(selectedColor);
    if (rgb) {
      // Ensure minimum brightness
      const brightness = (rgb.r + rgb.g + rgb.b) / 3;
      if (brightness < 200) {
        // Lighten dark colors
        const factor = 200 / brightness;
        const r = Math.min(255, Math.round(rgb.r * factor));
        const g = Math.min(255, Math.round(rgb.g * factor));
        const b = Math.min(255, Math.round(rgb.b * factor));
        return rgbToHex(r, g, b);
      }
    }
    
    return selectedColor;
  }
  
  // For B&W images, use vibrant colors as before
  return getRandomColorFromPalette(images, paletteType);
} 