import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollageService } from './CollageService';

describe('CollageService', () => {
  let canvas, service;

  beforeEach(() => {
    // Create a mock canvas and context
    canvas = document.createElement('canvas');
    const mockContext = {
      getImageData: vi.fn(() => ({ data: [255, 255, 255, 255] })),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      globalCompositeOperation: 'source-over',
      fillStyle: '#000000',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    };
    canvas.getContext = vi.fn(() => mockContext);
    service = new CollageService(canvas);
    service.images = [{}]; // Mock images so it doesn't early return
  });

  it('should log the plan when generateCollageFromPlan is called', async () => {
    const plan = { masks: [{ type: 'diamond', params: { size: 40 } }] };
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await service.generateCollageFromPlan(plan);
    expect(logSpy).toHaveBeenCalledWith('[CollageService] generateCollageFromPlan called with:', plan);
    logSpy.mockRestore();
  });
}); 