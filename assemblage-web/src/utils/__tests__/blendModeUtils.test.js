import { describe, it, expect } from 'vitest';
import { chooseBlend, calculateContrastChange, isContrastSufficient } from '../blendModeUtils';

describe('blendModeUtils', () => {
  describe('chooseBlend', () => {
    it('should return a valid blend mode choice', () => {
      const mockImageA = { width: 100, height: 100 };
      const mockImageB = { width: 100, height: 100 };
      
      const choice = chooseBlend(mockImageA, mockImageB);
      
      expect(['multiply', 'hard-light']).toContain(choice.mode);
      expect(choice.opacity).toBeGreaterThanOrEqual(0.4);
      expect(choice.opacity).toBeLessThanOrEqual(0.8);
    });

    it('should favor multiply mode over hard-light', () => {
      const mockImageA = { width: 100, height: 100 };
      const mockImageB = { width: 100, height: 100 };
      
      let multiplyCount = 0;
      let hardLightCount = 0;
      
      // Run multiple times to test probability
      for (let i = 0; i < 100; i++) {
        const choice = chooseBlend(mockImageA, mockImageB);
        if (choice.mode === 'multiply') {
          multiplyCount++;
        } else {
          hardLightCount++;
        }
      }
      
      // Multiply should be chosen approximately 70% of the time
      expect(multiplyCount).toBeGreaterThan(hardLightCount);
      expect(multiplyCount).toBeGreaterThan(50); // Should be around 70
    });

    it('should adjust opacity for hard-light mode', () => {
      const mockImageA = { width: 100, height: 100 };
      const mockImageB = { width: 100, height: 100 };
      
      const hardLightOpacities = [];
      const multiplyOpacities = [];
      
      // Collect opacity values for each mode
      for (let i = 0; i < 100; i++) {
        const choice = chooseBlend(mockImageA, mockImageB);
        if (choice.mode === 'hard-light') {
          hardLightOpacities.push(choice.opacity);
        } else {
          multiplyOpacities.push(choice.opacity);
        }
      }
      
      // Hard-light should tend to have slightly higher opacity
      if (hardLightOpacities.length > 0 && multiplyOpacities.length > 0) {
        const avgHardLight = hardLightOpacities.reduce((a, b) => a + b, 0) / hardLightOpacities.length;
        const avgMultiply = multiplyOpacities.reduce((a, b) => a + b, 0) / multiplyOpacities.length;
        
        // Hard-light average should be slightly higher due to the +0.1 adjustment
        expect(avgHardLight).toBeGreaterThan(avgMultiply);
      }
    });
  });

  describe('calculateContrastChange', () => {
    it('should calculate contrast change correctly', () => {
      expect(calculateContrastChange(0.5, 0.7)).toBeCloseTo(40);
      expect(calculateContrastChange(0.7, 0.5)).toBeCloseTo(28.57, 1);
      expect(calculateContrastChange(0.5, 0.5)).toBe(0);
    });

    it('should handle zero luminance', () => {
      expect(calculateContrastChange(0, 0.5)).toBe(100);
    });
  });

  describe('isContrastSufficient', () => {
    it('should check against default threshold of 30%', () => {
      expect(isContrastSufficient(35)).toBe(true);
      expect(isContrastSufficient(25)).toBe(false);
      expect(isContrastSufficient(30)).toBe(true);
    });

    it('should check against custom threshold', () => {
      expect(isContrastSufficient(25, 20)).toBe(true);
      expect(isContrastSufficient(25, 30)).toBe(false);
    });
  });
});
