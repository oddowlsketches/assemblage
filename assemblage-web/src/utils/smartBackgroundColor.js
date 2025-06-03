import { generatePalette } from './advancedColorUtils.js';

/**
 * Generate an appropriate background color for color images that won't cause muddiness
 * when used with multiply blend mode
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {boolean} isBW - Whether images are black and white
 * @returns {string} Hex color suitable for background
 */
export function getSmartBackgroundColor(images, isBW) {
  // For B&W images, use the existing vibrant palette approach
  if (isBW) {
    const vibrantColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#D4A5A5',
      '#9B59B6', '#3498DB', '#E67E22', '#2ECC71', '#F1C40F'
    ];
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }
  
  // For color images, generate a muted, light background
  // that won't overpower the images when multiplied
  const palette = generatePalette(images, false);
  
  // Pick a color from the palette
  const baseColor = palette[Math.floor(Math.random() * Math.min(3, palette.length))];
  
  // Convert to a lighter, less saturated version
  const rgb = hexToRgb(baseColor);
  if (!rgb) return '#F5F5F5'; // Fallback to light gray
  
  // Increase lightness significantly (blend with white)
  const lightnessFactor = 0.7; // 70% white, 30% original color
  const r = Math.round(255 * lightnessFactor + rgb.r * (1 - lightnessFactor));
  const g = Math.round(255 * lightnessFactor + rgb.g * (1 - lightnessFactor));
  const b = Math.round(255 * lightnessFactor + rgb.b * (1 - lightnessFactor));
  
  return rgbToHex(r, g, b);
}

/**
 * Get optimal blend settings for images based on their content and background
 * @param {boolean} hasColorImages - Whether the image set contains color images
 * @param {string} bgColor - The background color being used
 * @returns {object} Blend settings { mode, opacity }
 */
export function getOptimalBlendSettings(hasColorImages, bgColor) {
  if (!hasColorImages) {
    // B&W images can handle full multiply
    return { mode: 'multiply', opacity: 1.0 };
  }
  
  // For color images, check background brightness
  const rgb = hexToRgb(bgColor);
  if (!rgb) return { mode: 'multiply', opacity: 0.85 };
  
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;
  
  if (brightness > 200) {
    // Very light background - can use stronger multiply
    return { mode: 'multiply', opacity: 0.9 };
  } else if (brightness > 150) {
    // Light background - moderate multiply
    return { mode: 'multiply', opacity: 0.85 };
  } else if (brightness > 100) {
    // Medium background - lighter multiply or overlay
    return { mode: 'multiply', opacity: 0.75 };
  } else {
    // Dark background - avoid multiply, use overlay or normal
    return { mode: 'overlay', opacity: 0.9 };
  }
}

/**
 * Adjust a color to be suitable as a background for color images
 * Makes it lighter and less saturated to avoid muddiness
 * @param {string} color - Original color in hex format
 * @param {number} lightnessBoost - How much to lighten (0-1, default 0.5)
 * @returns {string} Adjusted color in hex format
 */
export function makeSuitableBackground(color, lightnessBoost = 0.5) {
  const rgb = hexToRgb(color);
  if (!rgb) return '#F5F5F5';
  
  // Convert to HSL for better control
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  
  if (d === 0) {
    // Grayscale - just lighten
    const lightness = Math.min(0.95, l + lightnessBoost);
    const val = Math.round(lightness * 255);
    return rgbToHex(val, val, val);
  }
  
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  // Adjust lightness and saturation
  const newL = Math.min(0.95, l + lightnessBoost);
  const newS = s * 0.3; // Reduce saturation to 30% of original
  
  // Convert back to RGB
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
  const p = 2 * newL - q;
  
  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  return rgbToHex(newR, newG, newB);
}

// Helper functions
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
