import { describe, it, expect } from 'vitest';
import { getContrastText, hexToRgb, getContrastRatio } from '../contrastText';

describe('contrastText utilities', () => {
  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('converts 3-digit hex to RGB', () => {
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles hex without #', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#GGGGGG')).toBeNull();
    });
  });

  describe('getContrastRatio', () => {
    it('calculates correct contrast ratios', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      const gray = { r: 128, g: 128, b: 128 };
      
      // White on black should be 21:1
      expect(Math.round(getContrastRatio(white, black))).toBe(21);
      
      // White on gray should be ~3.95:1
      expect(getContrastRatio(white, gray)).toBeCloseTo(3.95, 1);
      
      // Same color should be 1:1
      expect(getContrastRatio(white, white)).toBe(1);
    });
  });

  describe('getContrastText', () => {
    it('returns dark text for light backgrounds', () => {
      // Light backgrounds should get dark text
      expect(getContrastText('#FFFFFF')).toBe('#222222');
      expect(getContrastText('#F5F5F5')).toBe('#222222');
      expect(getContrastText('#FFE4E1')).toBe('#222222'); // Light pink
    });

    it('returns light text for dark backgrounds', () => {
      // Dark backgrounds should get light text
      expect(getContrastText('#000000')).toBe('#FFFFFF');
      expect(getContrastText('#222222')).toBe('#FFFFFF');
      expect(getContrastText('#2C3E50')).toBe('#FFFFFF'); // Dark blue-gray
    });

    it('ensures WCAG AA compliance (4.5:1 minimum)', () => {
      // Test various background colors
      const testColors = [
        '#E74C3C', // Red
        '#3498DB', // Blue
        '#2ECC71', // Green
        '#F39C12', // Orange
        '#9B59B6', // Purple
        '#1ABC9C', // Turquoise
        '#34495E', // Dark gray
        '#ECF0F1', // Light gray
      ];

      testColors.forEach(bgColor => {
        const textColor = getContrastText(bgColor);
        const bg = hexToRgb(bgColor)!;
        const text = hexToRgb(textColor)!;
        const ratio = getContrastRatio(bg, text);
        
        // Must meet WCAG AA standard
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('handles edge cases gracefully', () => {
      // Invalid color should return fallback
      expect(getContrastText('invalid')).toBe('#222222');
      
      // Medium gray backgrounds
      expect(['#FFFFFF', '#222222']).toContain(getContrastText('#808080'));
      expect(['#FFFFFF', '#222222']).toContain(getContrastText('#999999'));
    });
  });
});
