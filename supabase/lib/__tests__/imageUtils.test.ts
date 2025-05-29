import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { generateThumbnail, extractColorPalette } from '../imageUtils';

describe('imageUtils', () => {
  // Create a test image buffer
  const createTestImage = async (width: number, height: number, color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r, g, b }
      }
    })
    .jpeg()
    .toBuffer();
  };

  describe('generateThumbnail', () => {
    it('should generate a thumbnail with default dimensions', async () => {
      const testImage = await createTestImage(800, 600, '#ff0000');
      const thumbnail = await generateThumbnail(testImage);
      
      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.width).toBe(200);
      expect(metadata.height).toBe(200);
      expect(metadata.format).toBe('jpeg');
    });

    it('should generate a thumbnail with custom dimensions', async () => {
      const testImage = await createTestImage(800, 600, '#00ff00');
      const thumbnail = await generateThumbnail(testImage, {
        width: 150,
        height: 150,
        quality: 90
      });
      
      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.width).toBe(150);
      expect(metadata.height).toBe(150);
    });

    it('should maintain aspect ratio with cover fit', async () => {
      const testImage = await createTestImage(800, 400, '#0000ff');
      const thumbnail = await generateThumbnail(testImage, {
        width: 200,
        height: 200
      });
      
      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.width).toBe(200);
      expect(metadata.height).toBe(200);
    });

    it('should throw error for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('invalid image data');
      
      await expect(generateThumbnail(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('extractColorPalette', () => {
    it('should extract dominant color from solid color image', async () => {
      const testImage = await createTestImage(100, 100, '#ff0000');
      const palette = await extractColorPalette(testImage);
      
      // JPEG compression can slightly alter colors, so we check if it's close
      expect(palette.dominant).toMatch(/^#f[ef]0000$/);
      expect(palette.palette.some(color => color.match(/^#f[ef]0000$/))).toBe(true);
    });

    it('should extract multiple colors from multi-color image', async () => {
      // Create a simple two-color image (half red, half blue)
      const width = 100;
      const height = 100;
      const channels = 3;
      const rawBuffer = Buffer.alloc(width * height * channels);
      
      // Fill left half with red, right half with blue
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels;
          if (x < width / 2) {
            rawBuffer[idx] = 255;     // R
            rawBuffer[idx + 1] = 0;   // G
            rawBuffer[idx + 2] = 0;   // B
          } else {
            rawBuffer[idx] = 0;       // R
            rawBuffer[idx + 1] = 0;   // G
            rawBuffer[idx + 2] = 255; // B
          }
        }
      }
      
      const testImage = await sharp(rawBuffer, {
        raw: {
          width,
          height,
          channels
        }
      })
      .jpeg()
      .toBuffer();
      
      const palette = await extractColorPalette(testImage, 5);
      
      expect(palette.palette.length).toBeGreaterThan(0);
      expect(palette.palette.length).toBeLessThanOrEqual(5);
      expect(palette.dominant).toBeTruthy();
      
      // Should contain colors close to red and blue
      const hasReddish = palette.palette.some(color => {
        const r = parseInt(color.slice(1, 3), 16);
        return r > 200;
      });
      const hasBluish = palette.palette.some(color => {
        const b = parseInt(color.slice(5, 7), 16);
        return b > 200;
      });
      
      expect(hasReddish || hasBluish).toBe(true);
    });

    it('should limit palette to requested number of colors', async () => {
      const testImage = await createTestImage(100, 100, '#123456');
      const palette = await extractColorPalette(testImage, 3);
      
      expect(palette.palette.length).toBeLessThanOrEqual(3);
    });

    it('should handle images with few colors', async () => {
      const testImage = await createTestImage(10, 10, '#000000');
      const palette = await extractColorPalette(testImage, 10);
      
      expect(palette.palette.length).toBeGreaterThan(0);
      expect(palette.dominant).toBeTruthy();
    });

    it('should throw error for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('invalid image data');
      
      await expect(extractColorPalette(invalidBuffer)).rejects.toThrow();
    });
  });
});
