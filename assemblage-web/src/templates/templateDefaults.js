// Template default shape counts to favor fewer, larger shapes
export const TEMPLATE_DEFAULTS = {
  photoStrip: 3,
  floatingElements: 5,
  moodBoardTemplate: 9,
  scrambledMosaic: 12,
  pairedForms: 6,
  tilingTemplate: 16,
  crystalEffect: 8,
  dynamicArchitecturalTemplate: 10,
  layeredGeometric: 7,
  mixedMediaTemplate: 8,
  slicedTemplate: 6,
  packedShapesTemplate: 15,
  narrativeGrid: 9,
  doubleExposure: 2
};

// Helper to get shape count with fallback
export function getShapeCount(templateKey, requestedShapes) {
  const defaultCount = TEMPLATE_DEFAULTS[templateKey] || 10;
  return requestedShapes !== undefined && requestedShapes !== null 
    ? Math.min(requestedShapes, defaultCount)
    : defaultCount;
}
