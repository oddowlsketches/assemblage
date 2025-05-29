import sharp from 'sharp';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export interface ColorPalette {
  dominant: string;
  palette: string[];
}

/**
 * Generate a thumbnail from an image buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  options: ThumbnailOptions = {}
): Promise<Buffer> {
  const { width = 200, height = 200, quality = 80 } = options;

  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      })
      .jpeg({ quality, force: true })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Extract color palette from an image buffer
 */
export async function extractColorPalette(
  imageBuffer: Buffer,
  numColors: number = 5
): Promise<ColorPalette> {
  try {
    // Resize image for faster processing
    const resized = await sharp(imageBuffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const pixels: Map<string, number> = new Map();

    // Count pixel occurrences
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      pixels.set(hex, (pixels.get(hex) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(pixels.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors)
      .map(([color]) => color);

    // Simple k-means clustering for better palette
    const palette = clusterColors(sortedColors, Math.min(numColors, sortedColors.length));

    return {
      dominant: palette[0] || '#000000',
      palette
    };
  } catch (error) {
    console.error('Error extracting color palette:', error);
    throw new Error(`Failed to extract color palette: ${error.message}`);
  }
}

/**
 * Simple k-means clustering for color grouping
 */
function clusterColors(colors: string[], k: number): string[] {
  if (colors.length <= k) return colors;

  // Convert hex to RGB
  const rgbColors = colors.map(hex => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }));

  // Initialize centroids randomly
  const centroids = rgbColors.slice(0, k);
  const assignments = new Array(rgbColors.length).fill(0);

  // Run k-means iterations
  for (let iter = 0; iter < 10; iter++) {
    // Assign colors to nearest centroid
    for (let i = 0; i < rgbColors.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      
      for (let j = 0; j < k; j++) {
        const dist = Math.sqrt(
          Math.pow(rgbColors[i].r - centroids[j].r, 2) +
          Math.pow(rgbColors[i].g - centroids[j].g, 2) +
          Math.pow(rgbColors[i].b - centroids[j].b, 2)
        );
        
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }
      
      assignments[i] = bestCluster;
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterColors = rgbColors.filter((_, i) => assignments[i] === j);
      if (clusterColors.length > 0) {
        centroids[j] = {
          r: Math.round(clusterColors.reduce((sum, c) => sum + c.r, 0) / clusterColors.length),
          g: Math.round(clusterColors.reduce((sum, c) => sum + c.g, 0) / clusterColors.length),
          b: Math.round(clusterColors.reduce((sum, c) => sum + c.b, 0) / clusterColors.length)
        };
      }
    }
  }

  // Convert centroids back to hex
  return centroids.map(c => 
    `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
  );
}
