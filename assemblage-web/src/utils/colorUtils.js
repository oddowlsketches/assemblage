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
 * Calculates the complementary color for a given hex color.
 * Ensures the result is never too dark for readability when images are multiplied on it.
 * Enhanced to provide better contrast and prevent overly dark complementary colors.
 * @param {string} hexColor - The base color in hex format (e.g., "#RRGGBB" or "#RGB").
 * @returns {string} The complementary color in hex format, or a default if input is invalid.
 */
export function getComplementaryColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    console.warn(`[getComplementaryColor] Invalid hexColor input: ${hexColor}. Defaulting.`);
    return '#666666'; // Default to readable gray if input is invalid
  }

  // Enhanced complementary color calculation
  // Instead of simple inversion, use a smarter approach for better readability
  
  // Calculate base luminance
  const baseLuminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  let r, g, b;
  
  if (baseLuminance > 0.5) {
    // For light backgrounds, create a darker complementary color
    // But ensure it's not too dark for readability
    r = Math.max(40, 255 - rgb.r); // Minimum 40 to prevent pure black
    g = Math.max(40, 255 - rgb.g);
    b = Math.max(40, 255 - rgb.b);
  } else {
    // For dark backgrounds, create a lighter complementary color
    // Ensure it's bright enough for good contrast
    r = Math.min(215, 255 - rgb.r); // Maximum 215 to prevent pure white on light backgrounds
    g = Math.min(215, 255 - rgb.g);
    b = Math.min(215, 255 - rgb.b);
  }
  
  // Final luminance check - ensure result has good readability
  const complementaryLuminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If still too dark (< 0.4) or contrast is insufficient, use a safer approach
  if (complementaryLuminance < 0.4 || Math.abs(baseLuminance - complementaryLuminance) < 0.3) {
    if (baseLuminance > 0.5) {
      // Light background - use dark but readable color
      const targetLuminance = 0.25;
      const scale = targetLuminance / Math.max(0.01, complementaryLuminance);
      r = Math.min(255, Math.max(30, Math.round(r * scale)));
      g = Math.min(255, Math.max(30, Math.round(g * scale)));
      b = Math.min(255, Math.max(30, Math.round(b * scale)));
    } else {
      // Dark background - use light but not harsh color
      const targetLuminance = 0.75;
      const scale = targetLuminance / Math.max(0.01, complementaryLuminance);
      r = Math.min(220, Math.max(100, Math.round(r * scale)));
      g = Math.min(220, Math.max(100, Math.round(g * scale)));
      b = Math.min(220, Math.max(100, Math.round(b * scale)));
    }
    
    console.log(`[getComplementaryColor] Adjusted complementary color for better readability: ${rgbToHex(r, g, b)} (base luminance: ${baseLuminance.toFixed(2)})`);
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