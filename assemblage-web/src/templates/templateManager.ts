import { randomVibrantColor } from '../utils/colors';
import { getRandomCrystalSettings } from '../effects/randomCrystal';
import scrambledMosaic from './scrambledMosaic';
import tilingTemplate from './tilingTemplate';
import crystalTemplate from './crystalEffectTemplate';
import slicedTemplate from './slicedTemplate';
import pairedForms from './pairedForms';
import dynamicArchitecturalTemplate from './dynamicArchitecturalTemplate';
import floatingElements from './floatingElements';
import layeredGeometric from './layeredGeometric';
// import architecturalComposition from './architecturalComposition'; // Removed old template
import packedShapesTemplate from './packedShapesTemplate';
import photoStrip from './photoStrip';
import narrativeGrid from './narrativeGrid';

type TemplateType = 'crystal' | 'scrambledMosaic' | 'tiling' | 'sliced' | 'pairedForms' | 'dynamicArchitectural' | 'floatingElements' | 'layeredGeometric' | 'packedShapes' | 'photoStrip' | 'narrativeGrid';

// Template types and their weights for random selection
const TEMPLATE_WEIGHTS: Record<TemplateType, number> = {
  crystal: 0.09,
  scrambledMosaic: 0.12,
  tiling: 0.12,
  sliced: 0.08,
  pairedForms: 0.15, // Increased for testing
  dynamicArchitectural: 0.16,
  floatingElements: 0.08,
  layeredGeometric: 0.08,
  // architecturalComposition: 0.0, // Removed old architectural template
  packedShapes: 0.08,
  photoStrip: 0.04, // Increased for testing
  narrativeGrid: 0.06 // Weight of 6 as requested
};

// Random parameter generators for each template
const parameterGenerators = {
  crystal: () => ({
    ...getRandomCrystalSettings(),
    useMultiply: true, // Always use multiply blend
    bgColor: randomVibrantColor()
  }),
  
  scrambledMosaic: () => ({
    gridSize: 4 + Math.floor(Math.random() * 9), // 4-12
    operation: ['reveal', 'swap', 'rotate', 'none'][Math.floor(Math.random() * 4)],
    revealPct: 10 + Math.floor(Math.random() * 81), // 10-90%
    swapPct: Math.random() < 0.4 ? 20 + Math.floor(Math.random() * 61) : 0, // 40% chance of 20-80% swap
    rotatePct: Math.random() < 0.4 ? 20 + Math.floor(Math.random() * 61) : 0, // 40% chance of 20-80% rotation
    bgColor: randomVibrantColor(),
    useMultiply: true // Always use multiply blend
  }),
  
  tiling: () => ({
    patternType: ['squares', 'triangles', 'hexagons', 'modular', 'voronoi', 'rhombille'][Math.floor(Math.random() * 6)],
    tileCount: 8 + Math.floor(Math.random() * 24), // 8-32 tiles
    useUniqueImages: Math.random() > 0.3, // 70% chance of unique images, 30% chance of single image
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

  dynamicArchitectural: () => {
    const selectedStyle = Math.random() < 0.5 ? 'nestedArches' : 'archSeries'; // 50/50 split
    console.log('[TemplateManager] dynamicArchitectural generating style:', selectedStyle); // Log for debugging
    return {
      style: selectedStyle,
      imageMode: 'unique', // Always use unique images for better visual quality
      useComplementaryShapes: Math.random() > 0.4, 
      useMultiply: true,
      bgColor: randomVibrantColor()
    };
  },
  
  floatingElements: () => ({
    elementCount: 3 + Math.floor(Math.random() * 7), // 3-10 elements
    style: ['horizon', 'ascending', 'scattered', 'strata'][Math.floor(Math.random() * 4)],
    bgColor: randomVibrantColor(),
    groundColor: randomVibrantColor(),
    useMultiply: true
  }),
  
  layeredGeometric: () => ({
    layerCount: 3 + Math.floor(Math.random() * 5), // 3-7 layers
    style: ['dynamic', 'cascade', 'radial', 'fibonacci'][Math.floor(Math.random() * 4)],
    useColorBlocking: Math.random() > 0.7, // 30% chance
    useBlendModes: Math.random() > 0.3, // 70% chance
    showOutlines: false,
    bgColor: randomVibrantColor(),
    useMultiply: true
  }),
  
  packedShapes: () => ({
    elementCount: 8 + Math.floor(Math.random() * 8), // 8-15 elements
    bgColor: randomVibrantColor(),
    // Add any other specific random params for packedShapes if needed later
  }),
  
  photoStrip: () => ({
    bgColor: randomVibrantColor()
  }),
  
  narrativeGrid: () => ({
    compositionType: 'random', // Let the template choose
    gutter: Math.random() < 0.3 ? 0 : 4 + Math.floor(Math.random() * 9), // 30% chance of no gutter, otherwise 4-12
    useColorEcho: Math.random() > 0.3, // 70% chance of color echo
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
    case 'dynamicArchitectural':
      return dynamicArchitecturalTemplate;
    case 'floatingElements':
      return floatingElements;
    case 'layeredGeometric':
      return layeredGeometric;
    case 'packedShapes':
      return packedShapesTemplate;
    case 'photoStrip':
      return photoStrip;
    case 'narrativeGrid':
      return narrativeGrid;
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
  pairedForms: pairedForms,
  dynamicArchitectural: dynamicArchitecturalTemplate,
  floatingElements: floatingElements,
  layeredGeometric: layeredGeometric,
  // architecturalComposition: architecturalComposition, // Removed old template
  packedShapes: packedShapesTemplate,
  photoStrip: photoStrip,
  narrativeGrid: narrativeGrid
} as const;

export const generators = parameterGenerators; 