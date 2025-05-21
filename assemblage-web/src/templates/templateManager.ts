import { getRandomBackgroundColor } from '../enhanced-templates';
import { getRandomCrystalSettings } from '../effects/randomCrystal';
import scrambledMosaic from './scrambledMosaic';
import tilingTemplate from './tilingTemplate';
import crystalTemplate from './crystalEffectTemplate';
import slicedTemplate from './slicedTemplate';
import pairedForms from './pairedForms';

type TemplateType = 'crystal' | 'scrambledMosaic' | 'tiling' | 'sliced' | 'pairedForms';

// Template types and their weights for random selection
const TEMPLATE_WEIGHTS: Record<TemplateType, number> = {
  crystal: 0.2,
  scrambledMosaic: 0.2,
  tiling: 0.2,
  sliced: 0.2,
  pairedForms: 0.2
};

// Random parameter generators for each template
const parameterGenerators = {
  crystal: () => ({
    ...getRandomCrystalSettings(),
    useMultiply: Math.random() > 0.3, // 70% chance of using multiply blend
    bgColor: getRandomBackgroundColor()
  }),
  
  scrambledMosaic: () => ({
    gridSize: 4 + Math.floor(Math.random() * 8), // 4-12
    revealPct: 60 + Math.floor(Math.random() * 30), // 60-90
    swapPct: Math.random() < 0.3 ? 20 + Math.floor(Math.random() * 30) : 0, // 30% chance of swap
    rotatePct: Math.random() < 0.3 ? 20 + Math.floor(Math.random() * 30) : 0, // 30% chance of rotation
    pattern: ['random', 'clustered', 'silhouette', 'portrait'][Math.floor(Math.random() * 4)],
    cellShape: ['square', 'rectHorizontal', 'rectVertical', 'circle', 'stripe'][Math.floor(Math.random() * 5)],
    operation: ['reveal', 'swap', 'rotate'][Math.floor(Math.random() * 3)],
    bgColor: getRandomBackgroundColor(),
    useMultiply: Math.random() > 0.3 // 70% chance of using multiply blend
  }),
  
  tiling: () => ({
    patternType: ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille', 'penrose'][Math.floor(Math.random() * 7)],
    tileCount: 8 + Math.floor(Math.random() * 24), // 8-32 tiles
    useUniqueImages: Math.random() > 0.3, // 70% chance of unique images
    randomRotation: Math.random() > 0.5, // 50% chance of random rotation
    tileSpacing: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0, // 30% chance of spacing
    fillStyle: Math.random() > 0.3 ? 'fullBleed' : 'centeredForm',
    bgColor: getRandomBackgroundColor(),
    useMultiply: Math.random() > 0.3 // 70% chance of using multiply blend
  }),

  sliced: () => ({
    sliceBehavior: ['random', 'single-image', 'alternating'][Math.floor(Math.random() * 3)],
    maxSlices: 10 + Math.floor(Math.random() * 30), // 10-40 slices
    sliceWidthVariation: 0.05 + Math.random() * 0.25, // 0.05-0.3
    bgColor: getRandomBackgroundColor(),
    useMultiply: Math.random() > 0.3 // 70% chance of using multiply blend
  }),

  pairedForms: () => ({
    formCount: 2 + Math.floor(Math.random() * 3), // 2-4 forms
    formType: ['rectangular', 'semiCircle', 'triangle', 'hexagon', 'mixed'][Math.floor(Math.random() * 5)],
    complexity: 0.3 + Math.random() * 0.4, // 0.3-0.7
    alignmentType: ['edge', 'overlap', 'puzzle'][Math.floor(Math.random() * 3)],
    useMultiply: Math.random() > 0.3, // 70% chance of using multiply blend
    bgColor: getRandomBackgroundColor()
  })
} as const;

// Get a random template based on weights
export function getRandomTemplate() {
  const rand = Math.random();
  let cumulativeWeight = 0;
  
  for (const [template, weight] of Object.entries(TEMPLATE_WEIGHTS)) {
    cumulativeWeight += weight;
    if (rand <= cumulativeWeight) {
      return {
        type: template as TemplateType,
        template: getTemplateByType(template as TemplateType),
        params: parameterGenerators[template as TemplateType]()
      };
    }
  }
  
  // Fallback to crystal if something goes wrong
  return {
    type: 'crystal' as const,
    template: crystalTemplate,
    params: parameterGenerators.crystal()
  };
}

// Get template object by type
function getTemplateByType(type: TemplateType) {
  switch (type) {
    case 'crystal':
      return crystalTemplate;
    case 'scrambledMosaic':
      return scrambledMosaic;
    case 'tiling':
      return tilingTemplate;
    case 'sliced':
      return slicedTemplate;
    case 'pairedForms':
      return pairedForms;
    default:
      return crystalTemplate;
  }
}

// Export all templates and their parameter generators
export const templates = {
  crystal: crystalTemplate,
  scrambledMosaic: scrambledMosaic,
  tiling: tilingTemplate,
  sliced: slicedTemplate,
  pairedForms: pairedForms
} as const;

export const generators = parameterGenerators; 