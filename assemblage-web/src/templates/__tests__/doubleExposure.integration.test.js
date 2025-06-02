import { describe, it, expect } from 'vitest';
import templates from '../index.js';
import doubleExposure from '../doubleExposure.js';

describe('doubleExposure template registration', () => {
  it('should be included in the templates array', () => {
    const doubleExposureTemplate = templates.find(t => t.key === 'doubleExposure');
    expect(doubleExposureTemplate).toBeDefined();
    expect(doubleExposureTemplate.name).toBe('Double Exposure');
  });

  it('should have the correct structure', () => {
    expect(doubleExposure).toHaveProperty('key', 'doubleExposure');
    expect(doubleExposure).toHaveProperty('name', 'Double Exposure');
    expect(doubleExposure).toHaveProperty('render');
    expect(doubleExposure).toHaveProperty('params');
    expect(typeof doubleExposure.render).toBe('function');
  });

  it('should have proper params configuration', () => {
    expect(doubleExposure.params).toHaveProperty('bgColor');
    expect(doubleExposure.params.bgColor.type).toBe('color');
  });
});
