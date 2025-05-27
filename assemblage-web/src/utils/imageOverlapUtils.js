// imageOverlapUtils.js
// Utilities for handling image overlap and automatic color echo

/**
 * Get appropriate echo color based on image type and background color
 * For colorful images: use background color or lightened version (never complementary)
 * For B&W images: can use complementary colors for contrast
 * @param {string} bgColor - Background color in hex format
 * @param {HTMLImageElement} image - The image to check (optional)
 * @param {Function} getComplementaryColorFn - Function to get complementary color (pass from calling template)
 * @param {boolean} forceBackgroundColor - Force use of background color regardless of image type
 * @returns {string} Appropriate echo color
 */
export function getAppropriateEchoColor(bgColor, image = null, getComplementaryColorFn = null, forceBackgroundColor = false) {
  // Always use background-based color for colorful images to avoid muddy multiply results
  const isBlackAndWhite = image && image.is_black_and_white === true;
  
  if (forceBackgroundColor || !isBlackAndWhite) {
    // For colorful images or when forced: use background color or slightly lightened version
    // This prevents muddy results from dark complementary colors with multiply blend
    console.log(`[EchoColor] Using lightened background for ${isBlackAndWhite ? 'B&W' : 'colorful'} image: ${bgColor} -> ${lightenColor(bgColor, 0.1)}`);
    return lightenColor(bgColor, 0.1); // Lighten by 10% for subtle variation
  } else {
    // For B&W images: can use complementary for good contrast
    if (getComplementaryColorFn) {
      const complementary = getComplementaryColorFn(bgColor);
      console.log(`[EchoColor] Using complementary for B&W image: ${bgColor} -> ${complementary}`);
      return complementary;
    } else {
      // Fallback if no complementary function provided
      console.log(`[EchoColor] No complementary function, using lightened background: ${bgColor} -> ${lightenColor(bgColor, 0.15)}`);
      return lightenColor(bgColor, 0.15);
    }
  }
}

/**
 * Lighten a hex color by a given amount
 * @param {string} color - Hex color (e.g., '#FF0000')
 * @param {number} amount - Amount to lighten (0-1, where 0.1 = 10% lighter)
 * @returns {string} Lightened hex color
 */
function lightenColor(color, amount) {
  if (!color || !color.startsWith('#')) return color;
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Lighten by blending with white
  const lightenedR = Math.round(r + (255 - r) * amount);
  const lightenedG = Math.round(g + (255 - g) * amount);
  const lightenedB = Math.round(b + (255 - b) * amount);
  
  return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
}

/**
 * Determine if an image should get automatic color echo based on overlap and color content
 * @param {HTMLImageElement} image - The image to check
 * @param {number} overlapPercentage - How much this image overlaps with others (0-1)
 * @param {number} threshold - Overlap threshold to trigger echo (default 0.1 = 10%)
 * @returns {boolean} True if image should get color echo
 */
export function shouldApplyAutoColorEcho(image, overlapPercentage, threshold = 0.1) {
  // Only apply if overlap exceeds threshold
  if (overlapPercentage < threshold) {
    return false;
  }
  
  // Check if image is color (not black and white)
  // If image has is_black_and_white metadata, use that
  if (image.is_black_and_white !== undefined && image.is_black_and_white !== null) {
    return !image.is_black_and_white; // Apply echo if NOT black and white
  }
  
  // Fallback: assume color images need echo when overlapping
  console.log(`[AutoColorEcho] No B&W metadata for image, assuming color - applying echo for overlap: ${Math.round(overlapPercentage * 100)}%`);
  return true;
}

/**
 * Calculate overlap percentage between two rectangular elements
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {number} Overlap as percentage of smaller element (0-1)
 */
export function calculateOverlapPercentage(rect1, rect2) {
  const x_overlap = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
  const y_overlap = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
  const overlapArea = x_overlap * y_overlap;

  const area1 = rect1.width * rect1.height;
  const area2 = rect2.width * rect2.height;

  if (area1 === 0 || area2 === 0) return 0;
  
  // Return overlap as percentage of the smaller element
  return overlapArea / Math.min(area1, area2);
}

/**
 * Analyze elements for overlaps and mark which ones need automatic color echo
 * @param {Array} elements - Array of element objects with x, y, width, height, image properties
 * @param {number} threshold - Overlap threshold (default 0.1 = 10%)
 * @returns {Array} Elements with autoColorEcho property added where needed
 */
export function analyzeElementsForAutoEcho(elements, threshold = 0.1) {
  const result = elements.map(el => ({...el})); // Clone elements
  
  for (let i = 0; i < result.length; i++) {
    let maxOverlap = 0;
    
    // Check this element against all others
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      
      const overlap = calculateOverlapPercentage(result[i], result[j]);
      maxOverlap = Math.max(maxOverlap, overlap);
    }
    
    // Determine if this element should get auto echo
    if (result[i].image && shouldApplyAutoColorEcho(result[i].image, maxOverlap, threshold)) {
      result[i].autoColorEcho = true;
      console.log(`[AutoColorEcho] Element ${i} marked for auto echo - overlap: ${Math.round(maxOverlap * 100)}%, is_black_and_white: ${result[i].image.is_black_and_white}`);
    }
  }
  
  return result;
}
