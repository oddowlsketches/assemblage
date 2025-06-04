/**
 * Scales a mask to cover at least 90% of the target cell area
 * while maintaining aspect ratio
 */
export interface ScaleToCoverParams {
  maskWidth: number;
  maskHeight: number;
  canvasW: number;
  canvasH: number;
  maxZoom?: number;
}

export interface ScaleToCoverResult {
  w: number;
  h: number;
}

export function scaleToCover({
  maskWidth,
  maskHeight,
  canvasW,
  canvasH,
  maxZoom = 2.0
}: ScaleToCoverParams): ScaleToCoverResult {
  // Validate inputs
  if (maskWidth <= 0 || maskHeight <= 0 || canvasW <= 0 || canvasH <= 0) {
    throw new Error('All dimensions must be positive numbers');
  }

  // Calculate aspect ratios
  const maskAspect = maskWidth / maskHeight;
  const canvasAspect = canvasW / canvasH;

  // Calculate scale to cover 90% of the target area
  const targetCoverage = 0.9;
  let scale: number;

  if (maskAspect > canvasAspect) {
    // Mask is wider relative to its height
    scale = (canvasH * targetCoverage) / maskHeight;
  } else {
    // Mask is taller relative to its width
    scale = (canvasW * targetCoverage) / maskWidth;
  }

  // Apply max zoom constraint
  scale = Math.min(scale, maxZoom);

  // Calculate final dimensions
  const w = maskWidth * scale;
  const h = maskHeight * scale;

  return { w, h };
}
