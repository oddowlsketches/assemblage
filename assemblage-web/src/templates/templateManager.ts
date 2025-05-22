import { randomVibrantColor } from '../utils/colors';
import { getRandomCrystalSettings } from '../effects/randomCrystal';
import scrambledMosaic from './scrambledMosaic';
import tilingTemplate from './tilingTemplate';
import crystalTemplate from './crystalEffectTemplate';
import slicedTemplate from './slicedTemplate';
import pairedForms from './pairedForms';
import architecturalTemplate from './architecturalTemplate';

type TemplateType = 'crystal' | 'scrambledMosaic' | 'tiling' | 'sliced' | 'pairedForms' | 'architectural';

// Template types and their weights for random selection
const TEMPLATE_WEIGHTS: Record<TemplateType, number> = {
  crystal: 0.2,
  scrambledMosaic: 0.2,
  tiling: 0.2,
  sliced: 0.15,
  pairedForms: 0.15,
  architectural: 0.1
};

// Random parameter generators for each template
const parameterGenerators = {
  crystal: () => ({
    ...getRandomCrystalSettings(),
    useMultiply: true, // Always use multiply blend
    bgColor: randomVibrantColor()
  }),
  
  scrambledMosaic: () => ({
    gridSize: 4 + Math.floor(Math.random() * 8), // 4-12
    revealPct: 60 + Math.floor(Math.random() * 30), // 60-90
    swapPct: Math.random() < 0.3 ? 20 + Math.floor(Math.random() * 30) : 0, // 30% chance of swap
    rotatePct: Math.random() < 0.3 ? 20 + Math.floor(Math.random() * 30) : 0, // 30% chance of rotation
    pattern: ['random', 'clustered', 'silhouette', 'portrait'][Math.floor(Math.random() * 4)],
    cellShape: ['square', 'rectHorizontal', 'rectVertical', 'circle'][Math.floor(Math.random() * 4)],
    operation: ['reveal', 'swap', 'rotate'][Math.floor(Math.random() * 3)],
    bgColor: randomVibrantColor(),
    useMultiply: true // Always use multiply blend
  }),
  
  tiling: () => ({
    patternType: ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille'][Math.floor(Math.random() * 6)],
    tileCount: 8 + Math.floor(Math.random() * 24), // 8-32 tiles
    useUniqueImages: true, // Always use unique images
    randomRotation: Math.random() > 0.5, // 50% chance of random rotation
    tileSpacing: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0, // 30% chance of spacing
    fillStyle: 'fullBleed', // Always use full bleed
    bgColor: randomVibrantColor(),
    useMultiply: true // Always use multiply blend
  }),

  sliced: () => ({
    sliceBehavior: ['single-image', 'alternating'][Math.floor(Math.random() * 2)],
    maxSlices: 10 + Math.floor(Math.random() * 30), // 10-40 slices
    sliceWidthVariation: 0.05 + Math.random() * 0.25, // 0.05-0.3
    bgColor: randomVibrantColor(),
    useMultiply: true // Always use multiply blend
  }),

  pairedForms: () => ({
    formCount: 2 + Math.floor(Math.random() * 2), // 2-3 forms
    formType: ['rectangular', 'semiCircle', 'triangle', 'hexagon', 'mixed'][Math.floor(Math.random() * 5)],
    complexity: 0.3 + Math.random() * 0.4, // 0.3-0.7
    alignmentType: ['edge', 'overlap', 'puzzle'][Math.floor(Math.random() * 3)],
    useMultiply: true, // Always use multiply blend
    bgColor: randomVibrantColor()
  }),

  architectural: () => ({
    style: ['classic', 'modern', 'gothic'][Math.floor(Math.random() * 3)],
    imageMode: Math.random() > 0.5 ? 'single' : 'unique',
    useMultiply: true,
    bgColor: randomVibrantColor()
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
    case 'architectural':
      return architecturalTemplate;
    default:
      return crystalTemplate;
  }
}

// Export all templates and their parameter generators
export const templates = {
  architectural: architecturalTemplate,
  crystal: crystalTemplate,
  scrambledMosaic: scrambledMosaic,
  tiling: tilingTemplate,
  sliced: slicedTemplate,
  pairedForms: pairedForms
} as const;

export const generators = parameterGenerators; 