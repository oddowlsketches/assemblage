import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateScrambledMosaic } from '../scrambledMosaic';

describe('scrambledMosaic', () => {
  let mockCanvas;
  let mockContext;
  let mockImage;

  beforeEach(() => {
    // Mock canvas context
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      strokeRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalCompositeOperation: ''
    };

    // Mock canvas
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockContext)
    };

    // Mock image
    mockImage = {
      width: 400,
      height: 400,
      complete: true,
      naturalWidth: 400,
      naturalHeight: 400,
      is_black_and_white: true // B&W image for testing
    };
  });

  it('should randomize gridSize between 6-12 when not provided', () => {
    const gridSizes = new Set();
    
    // Run multiple times to test randomization
    for (let i = 0; i < 50; i++) {
      const result = generateScrambledMosaic(mockCanvas, [mockImage], {});
      
      if (result && result.processedParams) {
        gridSizes.add(result.processedParams.gridSize);
      }
    }
    
    // Check that we got multiple different grid sizes
    expect(gridSizes.size).toBeGreaterThan(1);
    
    // Check that all grid sizes are within the expected range
    gridSizes.forEach(size => {
      expect(size).toBeGreaterThanOrEqual(6);
      expect(size).toBeLessThanOrEqual(12);
    });
  });

  it('should respect explicitly provided gridSize', () => {
    const result = generateScrambledMosaic(mockCanvas, [mockImage], { gridSize: 10 });
    
    expect(result.processedParams.gridSize).toBe(10);
  });

  it('should apply variant chance to leave cells untouched', () => {
    let variantAppliedCount = 0;
    
    // Run multiple times to test probability
    for (let i = 0; i < 100; i++) {
      const result = generateScrambledMosaic(mockCanvas, [mockImage], {});
      
      if (result && result.processedParams && result.processedParams.variantApplied) {
        variantAppliedCount++;
      }
    }
    
    // Should apply variant roughly 30% of the time (with some tolerance)
    expect(variantAppliedCount).toBeGreaterThan(15);
    expect(variantAppliedCount).toBeLessThan(45);
  });

  it('should correctly mark untouched cells when variant is applied', () => {
    // Run until we get a variant application
    let result;
    for (let i = 0; i < 100; i++) {
      result = generateScrambledMosaic(mockCanvas, [mockImage], {});
      if (result && result.processedParams && result.processedParams.variantApplied) {
        break;
      }
    }
    
    expect(result.processedParams.variantApplied).toBe(true);
    expect(['rings', 'horizontal', 'vertical']).toContain(result.processedParams.variantType);
    expect(result.processedParams.untouchedCellCount).toBeGreaterThan(0);
    
    // Check that some cells are marked as untouched
    const untouchedCells = result.processedParams.cellOperations.filter(cell => cell.isUntouched);
    expect(untouchedCells.length).toBe(result.processedParams.untouchedCellCount);
  });
});
