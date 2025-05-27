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
  const legacyParams = {
    sliceBehavior: params.sliceBehavior || 'single-image',  // 'single-image' | 'alternating'
    maxSlices: Number(params.maxSlices) || 40,
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
  return { canvas, bgColor: bgCol }; // Return canvas and the bgColor used
}

const slicedTemplate = {
  key: 'sliced',
  name: 'Sliced',
  generate: renderSliced,
  params: {
    sliceBehavior: { 
      type: 'select', 
      options: ['single-image', 'alternating'], 
      default: 'single-image' 
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