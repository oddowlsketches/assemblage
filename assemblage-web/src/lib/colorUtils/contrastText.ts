/**
 * Color contrast utilities for ensuring WCAG AA compliance
 */

// Convert hex color to RGB values
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance per WCAG guidelines
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Get complementary color
function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#E74C3C'; // Fallback to default complementary
  
  // Convert to HSL for better color manipulation
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
  
  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  // Rotate hue by 180 degrees for complementary
  h = (h + 0.5) % 1;
  
  // Convert back to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let [r, g, b] = [0, 0, 0];
    
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };
  
  const complementaryRgb = hslToRgb(h, s, l);
  return `#${[complementaryRgb.r, complementaryRgb.g, complementaryRgb.b]
    .map(val => val.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Get the best text color for a given background color
 * Ensures WCAG AA compliance (4.5:1 contrast ratio)
 * 
 * @param bgColor - Background color in hex format
 * @returns Best text color (complementary, white, or #222)
 */
export function getContrastText(bgColor: string): string {
  const bg = hexToRgb(bgColor);
  if (!bg) return '#222'; // Fallback to dark text
  
  const white = { r: 255, g: 255, b: 255 };
  const darkGray = { r: 34, g: 34, b: 34 }; // #222
  
  // Get contrast ratios
  const whiteContrast = getContrastRatio(bg, white);
  const darkContrast = getContrastRatio(bg, darkGray);
  
  // Try complementary color
  const complementaryHex = getComplementaryColor(bgColor);
  const complementary = hexToRgb(complementaryHex);
  const complementaryContrast = complementary ? getContrastRatio(bg, complementary) : 0;
  
  // WCAG AA requires 4.5:1 contrast ratio for normal text
  const minContrast = 4.5;
  
  // Choose the best option that meets WCAG AA
  const options = [
    { color: complementaryHex, contrast: complementaryContrast },
    { color: '#FFFFFF', contrast: whiteContrast },
    { color: '#222222', contrast: darkContrast }
  ].filter(opt => opt.contrast >= minContrast)
   .sort((a, b) => b.contrast - a.contrast);
  
  // If complementary meets the threshold and is in top 2, prefer it for visual interest
  if (complementaryContrast >= minContrast && options.findIndex(opt => opt.color === complementaryHex) < 2) {
    return complementaryHex;
  }
  
  // Otherwise return the highest contrast option
  return options[0]?.color || (darkContrast > whiteContrast ? '#222222' : '#FFFFFF');
}

// Export helper functions for testing
export { hexToRgb, getLuminance, getContrastRatio, getComplementaryColor };
