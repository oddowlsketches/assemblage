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
];

export function randomVibrantColor() {
  return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
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