import { safeComplement } from './advancedColorUtils.js';

// Helper function to parse hex color and get RGB components
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result && hex.length === 4) { // Try short hex #RGB
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex.trim());
    if (shortResult) {
        return {
            r: parseInt(shortResult[1] + shortResult[1], 16),
            g: parseInt(shortResult[2] + shortResult[2], 16),
            b: parseInt(shortResult[3] + shortResult[3], 16)
        };
    }
  }
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
 * Get safe complementary color that ensures 4.5:1 contrast ratio
 * Uses the new safeComplement function for WCAG compliance
 * @param {string} hexColor - The base color in hex format
 * @returns {string} Safe complementary color in hex format
 */
export function getComplementaryColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    console.warn(`[getComplementaryColor] Invalid hexColor input: ${hexColor}. Defaulting.`);
    return '#666666';
  }
  
  // Use the new safeComplement function for WCAG-compliant contrast
  return safeComplement(rgb);
}

/**
 * Get colorful complementary color for visual/artistic use (templates)
 * This maintains the original complementary color behavior for visual appeal
 * @param {string} hexColor - The base color in hex format
 * @returns {string} Colorful complementary color in hex format
 */
export function getColorfulComplementaryColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    console.warn(`[getColorfulComplementaryColor] Invalid hexColor input: ${hexColor}. Defaulting.`);
    return '#666666';
  }

  // Original complementary logic for visual appeal
  const baseLuminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  let r, g, b;
  
  if (baseLuminance > 0.5) {
    // For light backgrounds, create a darker complementary color
    r = Math.max(60, 255 - rgb.r); // Minimum 60 for visibility
    g = Math.max(60, 255 - rgb.g);
    b = Math.max(60, 255 - rgb.b);
  } else {
    // For dark backgrounds, create a lighter complementary color
    r = Math.min(195, 255 - rgb.r); // Maximum 195 to avoid harsh whites
    g = Math.min(195, 255 - rgb.g);
    b = Math.min(195, 255 - rgb.b);
  }
  
  return rgbToHex(r, g, b);
}

/**
 * Get safe fill color for templates based on image type.
 * For color photos (is_bw = false), mask fill must be either canvas background or white.
 * @param {boolean} isBW - Whether the image is black and white
 * @param {string} bgColor - The canvas background color
 * @param {number} opacity - Optional opacity value (0-1)
 * @returns {object} Object with fillColor and opacity
 */
export function getSafeFillColour(isBW, bgColor, opacity = 0.1) {
  // For color photos, use either background color or white
  const fillColor = isBW ? bgColor : (Math.random() > 0.5 ? bgColor : '#FFFFFF');
  
  // Ensure opacity is within allowed range (0 to 0.2)
  const safeOpacity = Math.min(0.2, Math.max(0, opacity));
  
  return {
    fillColor,
    opacity: safeOpacity
  };
}

// Keep randomVibrantColor if it exists here, or it should be imported if used by other utils here.
// For now, assuming it's correctly in utils/colors.js and imported where needed. 