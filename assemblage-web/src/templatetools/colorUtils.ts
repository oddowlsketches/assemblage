// colorUtils.ts - Template-specific color utilities

/**
 * Returns a safe echo color based on image metadata and background color.
 * For color images (is_black_and_white === false), echo must be bgColor or white.
 * For B&W images (is_black_and_white === true), any color can be used.
 * 
 * @param bgColor - The background color
 * @param echoColor - The desired echo color
 * @param images - Array of images with metadata
 * @param preferWhite - If true and images are color, prefer white over bgColor
 * @returns Safe echo color to use
 */
export function echoSafeColor(
  bgColor: string, 
  echoColor: string, 
  images: Array<{ is_black_and_white?: boolean }>,
  preferWhite: boolean = false
): string {
  // Check if images are mostly color (not black and white)
  const hasColorImages = images.some(img => 
    img && img.is_black_and_white !== undefined && img.is_black_and_white === false
  );
  
  // If we have color images, echo must be bgColor or white
  if (hasColorImages) {
    // If preferWhite is true, use white
    if (preferWhite) {
      return '#FFFFFF';
    }
    
    // If echoColor is already bgColor or white, use it
    if (echoColor.toLowerCase() === bgColor.toLowerCase() || 
        echoColor.toLowerCase() === '#ffffff' ||
        echoColor.toLowerCase() === '#fff' ||
        echoColor.toLowerCase() === 'white') {
      return echoColor;
    }
    // Otherwise, default to bgColor
    return bgColor;
  }
  
  // For B&W images or when metadata is missing, allow any color
  return echoColor;
}

/**
 * Applies opacity to a hex color, returning rgba string
 * @param hexColor - Color in hex format
 * @param opacity - Opacity value (0-1, will be clamped to 0-0.15 for echo)
 * @returns RGBA color string
 */
export function applyEchoOpacity(hexColor: string, opacity: number): string {
  // Clamp opacity to allowed range for echo
  const clampedOpacity = Math.min(Math.max(opacity, 0), 0.15);
  
  // Parse hex color
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor.trim());
  if (!result) {
    // Try short hex format
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hexColor.trim());
    if (shortResult) {
      const r = parseInt(shortResult[1] + shortResult[1], 16);
      const g = parseInt(shortResult[2] + shortResult[2], 16);
      const b = parseInt(shortResult[3] + shortResult[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
    }
    // Fallback to transparent
    return `rgba(0, 0, 0, 0)`;
  }
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
}
