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
 * @param {string} hexColor - The base color in hex format (e.g., "#RRGGBB" or "#RGB").
 * @returns {string} The complementary color in hex format, or a default if input is invalid.
 */
export function getComplementaryColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    console.warn(`[getComplementaryColor] Invalid hexColor input: ${hexColor}. Defaulting.`);
    return '#808080'; // Default to a neutral gray if input is invalid
  }

  // To find the complementary color, invert each component
  const r = 255 - rgb.r;
  const g = 255 - rgb.g;
  const b = 255 - rgb.b;

  return rgbToHex(r, g, b);
}

// Keep randomVibrantColor if it exists here, or it should be imported if used by other utils here.
// For now, assuming it's correctly in utils/colors.js and imported where needed. 