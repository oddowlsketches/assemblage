// crystalEffectTemplate.js
// Template wrapper around the existing CrystalEffect class so it fits
// the new template-review system (Canvas, images, params)

import { CrystalEffect } from '../effects/CrystalEffect.ts';
import { getRandomColorFromPalette } from '../utils/colors.js'; // Import palette-aware color selection

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
  // Use palette-aware color selection based on image analysis
  const bgColorToUse = (params.bgColor && params.bgColor.toLowerCase() !== '#ffffff') 
    ? params.bgColor 
    : getRandomColorFromPalette(images, 'auto'); // 'auto' analyzes images and picks vibrant for B&W, subtle for color
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // The CrystalEffect itself handles DPR scaling and positioning internally.
  // We just pass the raw context and canvas dimensions.

  // Enhanced randomization for crystal variations
  let variantVal = params.variant || 'standard';
  if (variantVal.toLowerCase() === 'standard') { // If default or explicitly standard, randomize
    variantVal = Math.random() < 0.5 ? 'Standard' : 'Isolated';
    console.log(`[CrystalTemplate] Randomized variant to: ${variantVal}`);
  } else {
    variantVal = variantVal.toLowerCase() === 'isolated' ? 'Isolated' : 'Standard'; // Normalize if other value
  }
  
  let imageModeVal = params.imageMode || 'unique';
  if (imageModeVal.toLowerCase() === 'unique') { // If default or explicitly unique, randomize
    imageModeVal = Math.random() < 0.25 ? 'single' : 'unique'; // 25% chance for single image mode
    console.log(`[CrystalTemplate] Randomized imageMode to: ${imageModeVal}`);
  }

  // Randomize crystal style parameters for more variety
  const seedPatterns = ['random', 'grid', 'radial', 'spiral'];
  const crystalTemplates = ['hexagonal', 'irregular', 'angular', 'elongated'];
  
  const randomizedSeedPattern = params.seedPattern || seedPatterns[Math.floor(Math.random() * seedPatterns.length)];
  const randomizedTemplate = params.template || crystalTemplates[Math.floor(Math.random() * crystalTemplates.length)];
  const randomizedComplexity = params.complexity || (3 + Math.floor(Math.random() * 5)); // 3-7
  const randomizedDensity = params.density || (3 + Math.floor(Math.random() * 5)); // 3-7
  
  console.log(`[CrystalTemplate] Crystal settings - Variant: ${variantVal}, Template: ${randomizedTemplate}, Pattern: ${randomizedSeedPattern}, Complexity: ${randomizedComplexity}, Density: ${randomizedDensity}`);

  const settings = {
    variant: variantVal,
    imageMode: imageModeVal,
    complexity: randomizedComplexity,
    density: randomizedDensity,
    seedPattern: randomizedSeedPattern,
    template: randomizedTemplate,
    blendOpacity: Number(params.blendOpacity) || 0.7,
    useMultiply: params.useMultiply !== false, // Default to true if not specified
    multiplyPct: Number(params.multiplyPct) || 100,
    // Pass canvas dimensions directly to the effect if it needs them for centering/scaling
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
    template: { type: 'select', options: ['hexagonal', 'irregular', 'angular', 'elongated'], default: 'hexagonal' },
    blendOpacity: { type: 'number', min: 0, max: 1, step: 0.1, default: 0.7 },
    useMultiply: { type: 'boolean', default: true },
    multiplyPct: { type: 'number', min: 0, max: 100, default: 100 },
    bgColor: { type: 'color', default: '#FFFFFF' } // UI default, code will handle fallback
  }
};

export default crystalTemplate; 