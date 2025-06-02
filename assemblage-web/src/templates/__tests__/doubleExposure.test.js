import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDoubleExposure } from '../doubleExposure';

// Mock the colors module
vi.mock('../../utils/colors.js', () => ({
  getRandomColorFromPalette: vi.fn(() => '#FF6B6B'),
  areImagesMostlyBlackAndWhite: vi.fn((images) => {
    // Check if all images have is_black_and_white === true
    return images.every(img => img.is_black_and_white === true);
  })
}));

describe('doubleExposure', () => {
  let mockCanvas;
  let mockContext;
  let mockImages;

  beforeEach(() => {
    // Mock canvas context
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: '',
      globalAlpha: 1
    };

    // Mock canvas
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockContext)
    };

    // Mock images
    mockImages = [
      {
        width: 400,
        height: 300,
        complete: true,
        naturalWidth: 400,
        naturalHeight: 300,
        is_black_and_white: true
      },
      {
        width: 600,
        height: 400,
        complete: true,
        naturalWidth: 600,
        naturalHeight: 400,
        is_black_and_white: true
      },
      {
        width: 500,
        height: 500,
        complete: true,
        naturalWidth: 500,
        naturalHeight: 500,
        is_black_and_white: false
      }
    ];
  });

  it('should render with 2 or 3 images randomly', () => {
    const layerCounts = new Set();
    
    // Run multiple times to test randomization
    for (let i = 0; i < 20; i++) {
      const result = generateDoubleExposure(mockCanvas, mockImages, {});
      
      if (result && result.processedParams) {
        layerCounts.add(result.processedParams.layerCount);
      }
    }
    
    // Should have both 2 and 3 layer counts
    expect(layerCounts.has(2)).toBe(true);
    expect(layerCounts.has(3)).toBe(true);
    expect(layerCounts.size).toBe(2);
  });

  it('should use at most 3 layers', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateDoubleExposure(mockCanvas, mockImages, {});
      
      expect(result.processedParams.layerCount).toBeLessThanOrEqual(3);
      expect(result.processedParams.layerCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('should use only multiply or hard-light blend modes', () => {
    const result = generateDoubleExposure(mockCanvas, mockImages, {});
    
    result.processedParams.blendChoices.forEach((choice, index) => {
      if (index === 0) {
        // First layer should always be normal
        expect(choice.mode).toBe('normal');
        expect(choice.opacity).toBe(1.0);
      } else {
        // Other layers should use multiply or hard-light
        expect(['multiply', 'hard-light']).toContain(choice.mode);
        expect(choice.opacity).toBeGreaterThanOrEqual(0.4);
        expect(choice.opacity).toBeLessThanOrEqual(0.8);
      }
    });
  });

  it('should use all multiply blend mode for B&W images 90% of the time', () => {
    // Create all B&W images
    const bwImages = mockImages.map(img => ({ ...img, is_black_and_white: true }));
    
    let allMultiplyCount = 0;
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      const result = generateDoubleExposure(mockCanvas, bwImages, {});
      
      if (result.processedParams.useAllMultiply) {
        allMultiplyCount++;
        // Verify all non-first layers use multiply
        result.processedParams.blendChoices.forEach((choice, index) => {
          if (index > 0) {
            expect(choice.mode).toBe('multiply');
          }
        });
      }
    }
    
    // Should use all multiply roughly 90% of the time
    expect(allMultiplyCount).toBeGreaterThan(iterations * 0.75);
    expect(allMultiplyCount).toBeLessThan(iterations * 0.95);
  });

  it('should support multiple layout styles', () => {
    const layoutStyles = new Set();
    
    // Run multiple times to collect different layout styles
    for (let i = 0; i < 30; i++) {
      const result = generateDoubleExposure(mockCanvas, mockImages, {});
      layoutStyles.add(result.processedParams.layoutStyle);
    }
    
    // Should have multiple layout styles
    expect(layoutStyles.size).toBeGreaterThan(2);
    expect(['center', 'left', 'right', 'fullBleed', 'border'].some(style => layoutStyles.has(style))).toBe(true);
  });

  it('should apply border size for border layout', () => {
    // Run until we get a border layout
    let result;
    for (let i = 0; i < 50; i++) {
      result = generateDoubleExposure(mockCanvas, mockImages, {});
      if (result.processedParams.layoutStyle === 'border') {
        break;
      }
    }
    
    if (result.processedParams.layoutStyle === 'border') {
      expect(result.processedParams.borderSize).toBe(mockCanvas.width * 0.05);
      // Check that positioning respects borders
      result.processedParams.positioningData.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(result.processedParams.borderSize);
        expect(pos.y).toBeGreaterThanOrEqual(result.processedParams.borderSize);
      });
    }
  });

  it('should select different images for each layer', () => {
    const result = generateDoubleExposure(mockCanvas, mockImages, {});
    
    // Check that all selected indices are unique
    const uniqueIndices = new Set(result.processedParams.imageIndices);
    expect(uniqueIndices.size).toBe(result.processedParams.layerCount);
  });

  it('should draw images without masking', () => {
    const result = generateDoubleExposure(mockCanvas, mockImages, {});
    
    // Check that drawImage was called for each layer
    expect(mockContext.drawImage).toHaveBeenCalledTimes(result.processedParams.layerCount);
    
    // Verify no clipping masks were used
    expect(mockContext.clip).not.toHaveBeenCalled();
    expect(mockContext.beginPath).not.toHaveBeenCalled();
  });

  it('should apply background color', () => {
    const customBgColor = '#FF0000';
    const result = generateDoubleExposure(mockCanvas, mockImages, { bgColor: customBgColor });
    
    expect(result.bgColor).toBe(customBgColor);
    expect(result.processedParams.bgColor).toBe(customBgColor);
  });

  it('should return comprehensive processed parameters', () => {
    const result = generateDoubleExposure(mockCanvas, mockImages, { userPrompt: 'test prompt' });
    
    expect(result.processedParams).toHaveProperty('bgColor');
    expect(result.processedParams).toHaveProperty('layerCount');
    expect(result.processedParams).toHaveProperty('imageIndices');
    expect(result.processedParams).toHaveProperty('blendChoices');
    expect(result.processedParams).toHaveProperty('layoutStyle');
    expect(result.processedParams).toHaveProperty('useAllMultiply');
    expect(result.processedParams).toHaveProperty('borderSize');
    expect(result.processedParams).toHaveProperty('positioningData');
    expect(result.processedParams.userPrompt).toBe('test prompt');
    
    // Verify blend choices match layer count
    expect(result.processedParams.blendChoices.length).toBe(result.processedParams.layerCount);
    expect(result.processedParams.positioningData.length).toBe(result.processedParams.layerCount);
  });

  it('should handle empty image array gracefully', () => {
    const result = generateDoubleExposure(mockCanvas, [], {});
    
    // Should return early without errors
    expect(result).toBeUndefined();
  });

  it('should handle incomplete images gracefully', () => {
    const incompleteImages = [
      { ...mockImages[0], complete: false },
      mockImages[1],
      mockImages[2]
    ];
    
    // Should not throw error
    expect(() => {
      generateDoubleExposure(mockCanvas, incompleteImages, {});
    }).not.toThrow();
  });
});
