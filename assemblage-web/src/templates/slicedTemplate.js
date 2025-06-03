// slicedTemplate.js
// Re-implemented sliced effect using legacy SlicedCollageGenerator for
// parity with the production app.

import { SlicedCollageGenerator } from '../legacy/js/collage/slicedCollageGenerator.js';
import { randomVibrantColor, getRandomColorFromPalette } from '../utils/colors';

/**
 * Draw sliced collage
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images
 * @param {Object} params
 */
export async function renderSliced(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  const ctx = canvas.getContext('2d');

  // Build generator instance
  const gen = new SlicedCollageGenerator(ctx, canvas);

  // Determine background color using palette-aware selection
  const bgCol = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : getRandomColorFromPalette(images, 'auto');
  // Monkey-patch generator bg color chooser so legacy code uses ours
  gen.generateBackgroundColor = () => bgCol;

  // Prepare parameter bag expected by legacy code
  const sliceBehaviors = ['single-image', 'alternating'];
  const randomizedSliceBehavior = (params.sliceBehavior !== null && params.sliceBehavior !== undefined)
    ? params.sliceBehavior
    : sliceBehaviors[Math.floor(Math.random() * sliceBehaviors.length)];
    
  console.log(`[SlicedTemplate] Randomized sliceBehavior to: ${randomizedSliceBehavior}`);
  
  // Mobile cap: limit slices to 8 on mobile devices
  const isMobile = window.innerWidth < 600;
  const maxSlicesValue = Number(params.maxSlices) || 40;
  const actualMaxSlices = isMobile ? Math.min(8, maxSlicesValue) : maxSlicesValue;
  
  const legacyParams = {
    sliceBehavior: randomizedSliceBehavior,
    maxSlices: actualMaxSlices,
    sliceWidthVariation: Number(params.sliceWidthVariation) || 0.1,
  };

  // Set blend mode for images
  if (params.useMultiply !== false) {
    ctx.globalCompositeOperation = 'multiply';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  await gen.generateSliced(images, '', legacyParams);

  // Reset composite
  ctx.globalCompositeOperation = 'source-over';
  
  // Return processed parameters that were actually used
  const processedParams = {
    sliceBehavior: randomizedSliceBehavior,
    maxSlices: legacyParams.maxSlices,
    sliceWidthVariation: legacyParams.sliceWidthVariation,
    bgColor: bgCol,
    useMultiply: params.useMultiply !== false,
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[SlicedTemplate] Returning processed params:', processedParams);
  
  return { 
    canvas, 
    bgColor: bgCol,
    processedParams 
  };
}

const slicedTemplate = {
  key: 'sliced',
  name: 'Sliced',
  generate: renderSliced,
  params: {
    sliceBehavior: { 
      type: 'select', 
      options: ['single-image', 'alternating'], 
      default: null // null means randomize
    },
    maxSlices: { 
      type: 'number', 
      min: 5, 
      max: 50, 
      default: 30 
    },
    sliceWidthVariation: { 
      type: 'number', 
      min: 0, 
      max: 0.5, 
      default: 0.2 
    },
    bgColor: { 
      type: 'color', 
      default: '#ffffff' 
    },
    useMultiply: { 
      type: 'boolean', 
      default: true 
    }
  }
};

export default slicedTemplate; 