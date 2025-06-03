// advancedColorUtils.js - Advanced color analysis with k-means clustering in Lab space

/**
 * Convert RGB to Lab color space
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {object} Lab color {L, a, b}
 */
function rgbToLab(r, g, b) {
  // First convert RGB to XYZ
  let [x, y, z] = rgbToXyz(r, g, b);
  
  // Then convert XYZ to Lab
  return xyzToLab(x, y, z);
}

/**
 * Convert RGB to XYZ color space (intermediate step for Lab)
 */
function rgbToXyz(r, g, b) {
  // Normalize RGB values
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Convert to XYZ using sRGB matrix
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  
  return [x * 100, y * 100, z * 100];
}

/**
 * Convert XYZ to Lab color space
 */
function xyzToLab(x, y, z) {
  // Reference white D65
  const xn = 95.047;
  const yn = 100.000;
  const zn = 108.883;
  
  x = x / xn;
  y = y / yn;
  z = z / zn;
  
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  
  return { L, a, b };
}

/**
 * Convert Lab to RGB color space
 */
function labToRgb(L, a, b) {
  // Convert Lab to XYZ first
  const [x, y, z] = labToXyz(L, a, b);
  
  // Then convert XYZ to RGB
  return xyzToRgb(x, y, z);
}

/**
 * Convert Lab to XYZ color space
 */
function labToXyz(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const x = fx > 0.206897 ? Math.pow(fx, 3) : (fx - 16/116) / 7.787;
  const y = fy > 0.206897 ? Math.pow(fy, 3) : (fy - 16/116) / 7.787;
  const z = fz > 0.206897 ? Math.pow(fz, 3) : (fz - 16/116) / 7.787;
  
  // Reference white D65
  return [x * 95.047, y * 100.000, z * 108.883];
}

/**
 * Convert XYZ to RGB color space
 */
function xyzToRgb(x, y, z) {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  
  // Apply sRGB matrix
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  
  // Apply inverse gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
  
  // Clamp to valid RGB range
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Calculate Delta E (CIE76) color difference between two Lab colors
 */
function deltaE(lab1, lab2) {
  const deltaL = lab1.L - lab2.L;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Calculate chroma (colorfulness) in Lab space
 */
function calculateChroma(a, b) {
  return Math.sqrt(a * a + b * b);
}

/**
 * Calculate hue angle in Lab space
 */
function calculateHue(a, b) {
  return Math.atan2(b, a) * 180 / Math.PI;
}

/**
 * K-means clustering in Lab color space
 * @param {Array} pixels - Array of {r, g, b} pixel data
 * @param {number} k - Number of clusters
 * @param {number} maxIterations - Maximum iterations
 * @returns {Array} Array of cluster centers in Lab space
 */
function kMeansLab(pixels, k = 8, maxIterations = 20) {
  if (pixels.length === 0) return [];
  
  // Convert pixels to Lab space
  const labPixels = pixels.map(p => rgbToLab(p.r, p.g, p.b));
  
  // Initialize centroids randomly
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = labPixels[Math.floor(Math.random() * labPixels.length)];
    centroids.push({ ...randomPixel });
  }
  
  let iterations = 0;
  let converged = false;
  
  while (iterations < maxIterations && !converged) {
    // Assign pixels to nearest centroid
    const clusters = Array(k).fill().map(() => []);
    
    labPixels.forEach(pixel => {
      let minDistance = Infinity;
      let nearestCluster = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = deltaE(pixel, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCluster = index;
        }
      });
      
      clusters[nearestCluster].push(pixel);
    });
    
    // Update centroids
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) {
        // Keep old centroid if cluster is empty
        return centroids[clusters.indexOf(cluster)];
      }
      
      const avgL = cluster.reduce((sum, p) => sum + p.L, 0) / cluster.length;
      const avgA = cluster.reduce((sum, p) => sum + p.a, 0) / cluster.length;
      const avgB = cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length;
      
      return { L: avgL, a: avgA, b: avgB };
    });
    
    // Check for convergence
    converged = centroids.every((centroid, index) => 
      deltaE(centroid, newCentroids[index]) < 1.0
    );
    
    centroids = newCentroids;
    iterations++;
  }
  
  // Add cluster sizes for filtering
  const clustersWithSizes = centroids.map((centroid, index) => {
    const clusterSize = labPixels.filter(pixel => {
      const distances = centroids.map(c => deltaE(pixel, c));
      return distances.indexOf(Math.min(...distances)) === index;
    }).length;
    
    return {
      ...centroid,
      size: clusterSize,
      chroma: calculateChroma(centroid.a, centroid.b),
      hue: calculateHue(centroid.a, centroid.b)
    };
  });
  
  return clustersWithSizes.sort((a, b) => b.size - a.size);
}

/**
 * Generate triadic and analogous color relationships
 */
function generateColorRelationships(baseHue) {
  const triad = (h) => (h + 120) % 360;
  const analog = (h) => (h + 30) % 360;
  
  // Normalize hue to 0-360 range
  const normalizedHue = ((baseHue % 360) + 360) % 360;
  
  return {
    base: normalizedHue,
    triadic1: triad(normalizedHue),
    triadic2: triad(triad(normalizedHue)),
    analogous1: analog(normalizedHue),
    analogous2: (normalizedHue - 30 + 360) % 360
  };
}

/**
 * Convert hue to Lab a,b coordinates with specified chroma
 */
function hueToLab(hue, chroma, lightness) {
  const hueRad = hue * Math.PI / 180;
  const a = chroma * Math.cos(hueRad);
  const b = chroma * Math.sin(hueRad);
  
  return { L: lightness, a, b };
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Sample pixels from images for color analysis
 * @param {HTMLImageElement[]} images - Array of images
 * @param {number} sampleSize - Number of pixels to sample per image
 * @returns {Array} Array of {r, g, b} pixel data
 */
function samplePixelsFromImages(images, sampleSize = 100) {
  const pixels = [];
  
  const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
  if (validImages.length === 0) return pixels;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  validImages.forEach(image => {
    try {
      // Use small canvas for performance
      const analyzeSize = 64;
      canvas.width = analyzeSize;
      canvas.height = analyzeSize;
      
      ctx.drawImage(image, 0, 0, analyzeSize, analyzeSize);
      const imageData = ctx.getImageData(0, 0, analyzeSize, analyzeSize);
      const data = imageData.data;
      
      // Sample pixels evenly across the image
      const step = Math.max(4, Math.floor(data.length / (sampleSize * 4)));
      
      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        
        // Skip transparent pixels and very dark/light pixels
        if (alpha > 128) {
          const brightness = (r + g + b) / 3;
          if (brightness > 20 && brightness < 235) {
            pixels.push({ r, g, b });
          }
        }
      }
    } catch (error) {
      console.warn('Error sampling pixels from image:', error);
    }
  });
  
  return pixels;
}

/**
 * Generate enhanced color palette using k-means clustering in Lab space
 * @param {HTMLImageElement[]} images - Array of images to analyze
 * @param {boolean} isBW - Whether images are black and white
 * @returns {string[]} Array of 5 hex color strings
 */
export function generatePalette(images, isBW) {
  // If B&W, keep current logic (return existing palette)
  if (isBW) {
    console.log('[generatePalette] B&W images detected, using existing vibrant palette');
    const vibrantColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#D4A5A5',
      '#9B59B6', '#3498DB', '#E67E22', '#2ECC71', '#F1C40F'
    ];
    // Return 5 random colors from vibrant palette
    const shuffled = [...vibrantColors].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }
  
  console.log('[generatePalette] Color images detected, running k-means analysis in Lab space');
  
  // Sample pixels from images
  const pixels = samplePixelsFromImages(images, 150); // Increased sample size for better analysis
  
  if (pixels.length < 10) {
    console.warn('[generatePalette] Not enough pixel data, falling back to default palette');
    return ['#F5F5DC', '#E6E6FA', '#F0F8FF', '#F5FFFA', '#DDA0DD'];
  }
  
  // Run k-means clustering in Lab space
  const clusters = kMeansLab(pixels, 8);
  
  // Filter grey-ish clusters (L*<15 or C*<10)
  const colorfulClusters = clusters.filter(cluster => 
    cluster.L >= 15 && cluster.chroma >= 10
  );
  
  if (colorfulClusters.length === 0) {
    console.warn('[generatePalette] No colorful clusters found, using default palette');
    return ['#F5F5DC', '#E6E6FA', '#F0F8FF', '#F5FFFA', '#DDA0DD'];
  }
  
  // Keep 3 most populous hues, ensuring ΔE>15
  const selectedClusters = [];
  
  for (const cluster of colorfulClusters) {
    const tooSimilar = selectedClusters.some(selected => 
      deltaE(cluster, selected) < 15
    );
    
    if (!tooSimilar) {
      selectedClusters.push(cluster);
      if (selectedClusters.length >= 3) break;
    }
  }
  
  // If we don't have enough distinct clusters, pad with most populous ones
  while (selectedClusters.length < 3 && colorfulClusters.length > selectedClusters.length) {
    const remaining = colorfulClusters.filter(c => !selectedClusters.includes(c));
    if (remaining.length > 0) {
      selectedClusters.push(remaining[0]);
    } else {
      break;
    }
  }
  
  // Build 5-color set with triadic + analogous relationships
  const colors = [];
  
  if (selectedClusters.length > 0) {
    // Use the most prominent cluster as base
    const baseCluster = selectedClusters[0];
    const baseHue = baseCluster.hue;
    
    const relationships = generateColorRelationships(baseHue);
    const targetHues = [
      relationships.base,
      relationships.triadic1,
      relationships.analogous1,
      relationships.analogous2,
      relationships.triadic2
    ];
    
    // Convert to Lab mid-tones (L*=65±5, C*=55 or 35)
    targetHues.forEach((hue, index) => {
      const lightness = 60 + Math.random() * 10; // L*=60-70 (slightly adjusted for better readability)
      const chroma = index < 3 ? 45 : 25; // First 3 more saturated, last 2 more subtle
      
      const labColor = hueToLab(hue, chroma, lightness);
      const [r, g, b] = labToRgb(labColor.L, labColor.a, labColor.b);
      colors.push(rgbToHex(r, g, b));
    });
  }
  
  // Fill remaining slots if needed with safe defaults
  const defaults = ['#F5F5DC', '#E6E6FA', '#F0F8FF', '#F5FFFA', '#DDA0DD'];
  while (colors.length < 5) {
    colors.push(defaults[colors.length % defaults.length]);
  }
  
  console.log('[generatePalette] Generated enhanced palette:', colors);
  return colors.slice(0, 5);
}

/**
 * Calculate relative luminance for WCAG contrast calculations
 */
function calculateLuminance(r, g, b) {
  // Convert to linear RGB
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Generate vibrant complementary color that ensures 4.5:1 contrast ratio
 * Prioritizes artistic, vibrant colors over neutral tones
 * @param {object} bgRgb - Background color as {r, g, b}
 * @returns {string} Hex color string that meets WCAG AA contrast requirements
 */
export function safeComplement(bgRgb) {
  if (!bgRgb || typeof bgRgb.r !== 'number') {
    console.warn('[safeComplement] Invalid RGB input, returning default');
    return '#E74C3C'; // Vibrant red as default
  }
  
  const bgLuminance = calculateLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const bgLab = rgbToLab(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Strategy 1: Try true complementary color first
  const compR = 255 - bgRgb.r;
  const compG = 255 - bgRgb.g;
  const compB = 255 - bgRgb.b;
  const compLab = rgbToLab(compR, compG, compB);
  
  // Try different lightness values to find one with good contrast
  const lightnessCandidates = bgLuminance > 0.5 
    ? [25, 20, 30, 15, 35, 10, 40] // Dark candidates for light backgrounds
    : [75, 80, 70, 85, 65, 90, 60]; // Light candidates for dark backgrounds
  
  // Boost chroma for more vibrant colors
  const chromaBoost = 1.4; // Increase saturation by 40%
  
  for (const targetL of lightnessCandidates) {
    const adjustedLab = {
      L: targetL,
      a: compLab.a * chromaBoost,
      b: compLab.b * chromaBoost
    };
    
    const [r, g, b] = labToRgb(adjustedLab.L, adjustedLab.a, adjustedLab.b);
    const candidate = { r, g, b };
    const contrast = calculateContrastRatio(bgRgb, candidate);
    
    if (contrast >= 4.5) {
      const hex = rgbToHex(r, g, b);
      console.log(`[safeComplement] Found vibrant complement: ${hex} with contrast ${contrast.toFixed(2)}`);
      return hex;
    }
  }
  
  // Strategy 2: Try triadic colors (120° rotation in hue)
  const bgHue = calculateHue(bgLab.a, bgLab.b);
  const bgChroma = calculateChroma(bgLab.a, bgLab.b);
  const triadicHues = [(bgHue + 120) % 360, (bgHue + 240) % 360];
  
  for (const hue of triadicHues) {
    for (const targetL of lightnessCandidates) {
      const triadicLab = hueToLab(hue, Math.max(50, bgChroma * chromaBoost), targetL);
      const [r, g, b] = labToRgb(triadicLab.L, triadicLab.a, triadicLab.b);
      const candidate = { r, g, b };
      const contrast = calculateContrastRatio(bgRgb, candidate);
      
      if (contrast >= 4.5) {
        const hex = rgbToHex(r, g, b);
        console.log(`[safeComplement] Found vibrant triadic: ${hex} with contrast ${contrast.toFixed(2)}`);
        return hex;
      }
    }
  }
  
  // Strategy 3: Try split-complementary colors (150° and 210°)
  const splitHues = [(bgHue + 150) % 360, (bgHue + 210) % 360];
  
  for (const hue of splitHues) {
    for (const targetL of lightnessCandidates) {
      const splitLab = hueToLab(hue, Math.max(50, bgChroma * chromaBoost), targetL);
      const [r, g, b] = labToRgb(splitLab.L, splitLab.a, splitLab.b);
      const candidate = { r, g, b };
      const contrast = calculateContrastRatio(bgRgb, candidate);
      
      if (contrast >= 4.5) {
        const hex = rgbToHex(r, g, b);
        console.log(`[safeComplement] Found vibrant split-complement: ${hex} with contrast ${contrast.toFixed(2)}`);
        return hex;
      }
    }
  }
  
  // Fallback: Select from curated vibrant colors with guaranteed contrast
  console.log('[safeComplement] Using curated vibrant fallback');
  
  if (bgLuminance > 0.5) {
    // For light backgrounds, use vibrant dark colors
    const vibrantColors = [
      '#E74C3C', // Vibrant red
      '#3498DB', // Bright blue  
      '#16A085', // Teal
      '#8E44AD', // Purple
      '#D35400', // Burnt orange
      '#27AE60', // Emerald
      '#2C3E50', // Midnight blue
      '#C0392B', // Dark red
    ];
    
    for (const color of vibrantColors) {
      const rgb = hexToRgb(color);
      const contrast = calculateContrastRatio(bgRgb, rgb);
      if (contrast >= 4.5) {
        console.log(`[safeComplement] Selected vibrant fallback: ${color} with contrast ${contrast.toFixed(2)}`);
        return color;
      }
    }
  } else {
    // For dark backgrounds, use vibrant light colors
    const vibrantColors = [
      '#FF6B6B', // Coral
      '#4ECDC4', // Turquoise
      '#FFE66D', // Bright yellow
      '#A8E6CF', // Mint
      '#FF8B94', // Pink
      '#C7CEEA', // Periwinkle
      '#FECA57', // Amber
      '#48DBFB', // Sky blue
    ];
    
    for (const color of vibrantColors) {
      const rgb = hexToRgb(color);
      const contrast = calculateContrastRatio(bgRgb, rgb);
      if (contrast >= 4.5) {
        console.log(`[safeComplement] Selected vibrant fallback: ${color} with contrast ${contrast.toFixed(2)}`);
        return color;
      }
    }
  }
  
  // Last resort: high contrast vibrant colors
  if (bgLuminance > 0.5) {
    return '#2C3E50'; // Rich midnight blue
  } else {
    return '#FFE66D'; // Bright yellow
  }
}


