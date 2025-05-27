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
  '#E0E0E0', // Light Gray
  '#F0E68C', // Khaki
  '#DDA0DD', // Plum
  '#98FB98', // Pale Green
  '#FFE4E1', // Misty Rose
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
export function isImageMostlyBlackAndWhite(image, sampleSize = 100, threshold = 30) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    return true; // Default to B&W if image not available
  }

  // Create a small canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Use a small size for analysis to improve performance
  const analyzeSize = 50;
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
    
    // Sample pixels (every 4th pixel for performance)
    for (let i = 0; i < data.length; i += 16) { // 16 = 4 pixels * 4 channels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate saturation using HSL conversion
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      
      let saturation = 0;
      if (max !== 0) {
        saturation = (diff / max) * 100;
      }
      
      totalSaturation += saturation;
      pixelCount++;
    }
    
    const averageSaturation = totalSaturation / pixelCount;
    return averageSaturation < threshold;
    
  } catch (error) {
    console.warn('Error analyzing image color:', error);
    return true; // Default to B&W if analysis fails
  }
}

/**
 * Analyzes multiple images to determine if they are mostly black and white
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
  
  // Analyze a sample of images (max 5 for performance)
  const samplesToAnalyze = Math.min(5, validImages.length);
  const imagesToAnalyze = validImages.slice(0, samplesToAnalyze);
  
  let blackAndWhiteCount = 0;
  
  for (const image of imagesToAnalyze) {
    if (isImageMostlyBlackAndWhite(image)) {
      blackAndWhiteCount++;
    }
  }
  
  // Return true if majority are B&W
  return blackAndWhiteCount > (imagesToAnalyze.length / 2);
}

/**
 * Gets an appropriate color palette based on image analysis
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
    return isBlackAndWhite ? vibrantColors : subtleColors;
  }
  
  return vibrantColors; // Default fallback
}

/**
 * Gets a random color from the appropriate palette based on image analysis
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {'auto'|'vibrant'|'subtle'|'pastel'|'earthTone'} paletteType - Palette type
 * @returns {string} A random color from the appropriate palette
 */
export function getRandomColorFromPalette(images, paletteType = 'auto') {
  const palette = getColorPalette(images, paletteType);
  return palette[Math.floor(Math.random() * palette.length)];
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