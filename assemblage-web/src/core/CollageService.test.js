import { CollageService } from './CollageService';

describe('CollageService', () => {
  let canvas, service;

  beforeEach(() => {
    // Create a mock canvas and context
    canvas = document.createElement('canvas');
    canvas.getContext = jest.fn(() => ({
      getImageData: jest.fn(() => ({ data: [255, 255, 255, 255] })),
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    }));
    service = new CollageService(canvas);
    service.images = [{}]; // Mock images so it doesn't early return
  });

  it('should log the plan when generateCollageFromPlan is called', async () => {
    const plan = { masks: [{ type: 'diamond', params: { size: 40 } }] };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await service.generateCollageFromPlan(plan);
    expect(logSpy).toHaveBeenCalledWith('[CollageService] generateCollageFromPlan called with:', plan);
    logSpy.mockRestore();
  });
}); 