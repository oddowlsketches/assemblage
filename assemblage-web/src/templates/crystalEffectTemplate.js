// crystalEffectTemplate.js
// Template wrapper around the existing CrystalEffect class so it fits
// the new template-review system (Canvas, images, params)

import { CrystalEffect } from '../effects/CrystalEffect.ts';
import { randomVibrantColor } from '../utils/colors.js'; // Import randomVibrantColor

/**
 * Render Crystal collage using CrystalEffect
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images
 * @param {Object} params UI-supplied parameters
 */
export function renderCrystal(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill background FIRST, before any transformations
  const bgColorToUse = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') ? params.bgColor : randomVibrantColor();
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // The CrystalEffect itself handles DPR scaling and positioning internally.
  // We just pass the raw context and canvas dimensions.

  let variantVal = params.variant || 'standard';
  if (variantVal.toLowerCase() === 'standard') { // If default or explicitly standard, randomize
    variantVal = Math.random() < 0.5 ? 'Standard' : 'Isolated';
    console.log(`[CrystalTemplate] Randomized variant to: ${variantVal}`);
  } else {
    variantVal = variantVal.toLowerCase() === 'isolated' ? 'Isolated' : 'Standard'; // Normalize if other value
  }
  
  const settings = {
    variant: variantVal,
    imageMode: params.imageMode || 'unique',
    complexity: Number(params.complexity) || 5,
    density: Number(params.density) || 5,
    seedPattern: params.seedPattern || 'random',
    template: params.template || 'hexagonal',
    blendOpacity: Number(params.blendOpacity) || 0.7,
    useMultiply: params.useMultiply !== false, // Default to true if not specified
    multiplyPct: Number(params.multiplyPct) || 100,
    // Pass canvas dimensions directly to the effect if it needs them for centering/scaling
    // These might not be used if CrystalEffect has its own way of getting dimensions.
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    dpr: window.devicePixelRatio || 1
  };

  const effect = new CrystalEffect(ctx, images, settings);
  effect.draw(); 
  // No ctx.restore() needed if we didn't ctx.save() in this function for transformations
  return { canvas, bgColor: bgColorToUse }; // Return canvas and the bgColor used
}

const crystalTemplate = {
  key: 'crystal',
  name: 'Crystal',
  render: renderCrystal,
  params: {
    variant: { type: 'select', options: ['standard', 'isolated'], default: 'standard' },
    imageMode: { type: 'select', options: ['single', 'unique'], default: 'unique' },
    complexity: { type: 'number', min: 1, max: 10, default: 5 },
    density: { type: 'number', min: 1, max: 10, default: 5 },
    seedPattern: { type: 'select', options: ['random', 'grid', 'radial', 'spiral'], default: 'random' },
    template: { type: 'select', options: ['hexagonal', 'square', 'triangular'], default: 'hexagonal' },
    blendOpacity: { type: 'number', min: 0, max: 1, step: 0.1, default: 0.7 },
    useMultiply: { type: 'boolean', default: true },
    multiplyPct: { type: 'number', min: 0, max: 100, default: 100 },
    bgColor: { type: 'color', default: '#FFFFFF' } // UI default, code will handle fallback
  }
};

export default crystalTemplate; 