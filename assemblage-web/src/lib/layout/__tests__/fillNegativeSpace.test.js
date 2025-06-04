import { fillNegativeSpace } from '../fillNegativeSpace';

// Mock canvas for testing
class MockCanvas {
  constructor(width = 800, height = 800) {
    this.width = width;
    this.height = height;
  }

  getContext() {
    const imageData = {
      data: new Uint8ClampedArray(this.width * this.height * 4).fill(0),
      width: this.width,
      height: this.height
    };

    return {
      fillStyle: '',
      fillRect: jest.fn(),
      getImageData: jest.fn(() => imageData),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn()
    };
  }
}

// Mock global document
global.document = {
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      return new MockCanvas();
    }
  }
};

describe('fillNegativeSpace', () => {
  it('should complete within 80ms for a single 800x800 canvas', () => {
    const canvas = new MockCanvas(800, 800);
    
    // Create test elements that cover about 60% of the canvas
    const elements = [
      { x: 50, y: 50, width: 200, height: 200, maskName: 'basic/circleMask' },
      { x: 300, y: 100, width: 180, height: 180, maskName: 'basic/rectangleMask' },
      { x: 100, y: 350, width: 150, height: 150, maskName: 'basic/triangleMask' },
      { x: 400, y: 400, width: 220, height: 220, maskName: 'basic/hexagonMask' },
      { x: 500, y: 50, width: 160, height: 160, maskName: 'basic/ovalMask' }
    ];

    const start = performance.now();
    
    const result = fillNegativeSpace({
      canvas,
      elements,
      targetBlankRatio: 0.03,
      maxIterations: 10,
      minBlankAreaSize: 1000
    });
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Performance test completed in ${duration.toFixed(2)}ms`);
    console.log(`Original elements: ${elements.length}, Filled elements: ${result.filledElements.length}`);
    console.log(`Iterations: ${result.iterations}, Final blank ratio: ${(result.finalBlankRatio * 100).toFixed(1)}%`);
    
    // Assert performance requirement
    expect(duration).toBeLessThan(80);
    
    // Assert functionality
    expect(result.filledElements.length).toBeGreaterThanOrEqual(elements.length);
    expect(result.finalBlankRatio).toBeLessThanOrEqual(0.03 + 0.01); // Allow small tolerance
    expect(result.iterations).toBeLessThanOrEqual(10);
  });

  it('should handle edge cases', () => {
    const canvas = new MockCanvas(800, 800);
    
    // Test with empty elements
    const emptyResult = fillNegativeSpace({
      canvas,
      elements: [],
      targetBlankRatio: 0.03
    });
    
    expect(emptyResult.filledElements).toHaveLength(0);
    expect(emptyResult.finalBlankRatio).toBe(1.0);
    
    // Test with full coverage (no blank space)
    const fullElements = [
      { x: 0, y: 0, width: 800, height: 800, maskName: 'basic/rectangleMask' }
    ];
    
    const fullResult = fillNegativeSpace({
      canvas,
      elements: fullElements,
      targetBlankRatio: 0.03
    });
    
    expect(fullResult.filledElements).toHaveLength(1);
    expect(fullResult.iterations).toBe(0);
  });

  it('should preserve original element properties when cloning', () => {
    const canvas = new MockCanvas(800, 800);
    
    const elements = [
      { 
        x: 100, 
        y: 100, 
        width: 200, 
        height: 200, 
        maskName: 'basic/circleMask',
        rotation: 45,
        opacity: 0.8,
        customProp: 'test'
      }
    ];
    
    const result = fillNegativeSpace({
      canvas,
      elements,
      targetBlankRatio: 0.03,
      maxIterations: 5
    });
    
    // Check that cloned elements have similar properties
    const clonedElements = result.filledElements.filter(el => el.isCloned);
    clonedElements.forEach(cloned => {
      expect(cloned.maskName).toBe('basic/circleMask');
      expect(cloned.customProp).toBe('test');
      expect(cloned.opacity).toBeCloseTo(0.8, 1);
      expect(cloned.rotation).toBeDefined();
    });
  });
});
