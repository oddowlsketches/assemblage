// Utility functions for ensuring readable text contrast

export function getLuminance(color) {
  // Convert color to RGB
  let r, g, b;
  
  if (color.startsWith('#')) {
    // Hex color
    const hex = color.replace('#', '');
    r = parseInt(hex.substr(0, 2), 16) / 255;
    g = parseInt(hex.substr(2, 2), 16) / 255;
    b = parseInt(hex.substr(4, 2), 16) / 255;
  } else if (color.startsWith('rgb')) {
    // RGB color
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      r = parseInt(match[1]) / 255;
      g = parseInt(match[2]) / 255;
      b = parseInt(match[3]) / 255;
    }
  } else {
    // Default to black for unknown formats
    return 0;
  }
  
  // Convert to linear RGB
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor) {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');
  
  // WCAG AA standard requires a contrast ratio of at least 4.5:1 for normal text
  const minContrast = 4.5;
  
  // If neither pure black nor white provides sufficient contrast,
  // we'll use a darkened/lightened version
  if (whiteContrast >= minContrast && whiteContrast > blackContrast) {
    return '#FFFFFF';
  } else if (blackContrast >= minContrast) {
    return '#000000';
  } else {
    // If neither works well, use the better one and add a subtle shadow
    return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  }
}

export function ensureReadableContrast(backgroundColor, textColor) {
  const contrast = getContrastRatio(backgroundColor, textColor);
  
  // If contrast is sufficient, return the original color
  if (contrast >= 4.5) {
    return textColor;
  }
  
  // Otherwise, return a readable alternative
  return getReadableTextColor(backgroundColor);
}
