import { describe, it, expect } from 'vitest';
import { scaleToCover } from '../scaleToCover';

describe('scaleToCover', () => {
  it('should scale a square mask to cover 90% of a square canvas', () => {
    const result = scaleToCover({
      maskWidth: 100,
      maskHeight: 100,
      canvasW: 200,
      canvasH: 200
    });
    
    expect(result.w).toBe(180);
    expect(result.h).toBe(180);
  });

  it('should maintain aspect ratio when scaling', () => {
    const result = scaleToCover({
      maskWidth: 100,
      maskHeight: 50,
      canvasW: 300,
      canvasH: 300
    });
    
    const aspectRatio = result.w / result.h;
    expect(aspectRatio).toBeCloseTo(2);
  });

  it('should respect maxZoom constraint', () => {
    const result = scaleToCover({
      maskWidth: 10,
      maskHeight: 10,
      canvasW: 1000,
      canvasH: 1000,
      maxZoom: 2.0
    });
    
    expect(result.w).toBe(20);
    expect(result.h).toBe(20);
  });

  it('should handle wide mask on tall canvas', () => {
    const result = scaleToCover({
      maskWidth: 200,
      maskHeight: 100,
      canvasW: 150,
      canvasH: 300
    });
    
    // Should scale based on width to cover 90%
    expect(result.w).toBe(135);
    expect(result.h).toBe(67.5);
  });

  it('should handle tall mask on wide canvas', () => {
    const result = scaleToCover({
      maskWidth: 100,
      maskHeight: 200,
      canvasW: 300,
      canvasH: 150
    });
    
    // Should scale based on height to cover 90%
    expect(result.w).toBe(67.5);
    expect(result.h).toBe(135);
  });

  it('should throw error for invalid dimensions', () => {
    expect(() => scaleToCover({
      maskWidth: 0,
      maskHeight: 100,
      canvasW: 200,
      canvasH: 200
    })).toThrow('All dimensions must be positive numbers');

    expect(() => scaleToCover({
      maskWidth: 100,
      maskHeight: -50,
      canvasW: 200,
      canvasH: 200
    })).toThrow('All dimensions must be positive numbers');
  });

  it('should use default maxZoom of 2.0 when not specified', () => {
    const result = scaleToCover({
      maskWidth: 1,
      maskHeight: 1,
      canvasW: 10,
      canvasH: 10
    });
    
    // Without maxZoom constraint, it would scale to 9
    // With default maxZoom of 2.0, it scales to 2
    expect(result.w).toBe(2);
    expect(result.h).toBe(2);
  });
});
