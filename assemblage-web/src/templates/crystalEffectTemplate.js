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

  // Detect if we're on mobile based on canvas/viewport width
  const isMobile = canvas.width < 768 || window.innerWidth < 768;

  // Debug: Log the raw params to see what's being passed
  console.log('[CrystalTemplate] Raw params received:', params);
  console.log('[CrystalTemplate] seedPattern value:', params.seedPattern, 'type:', typeof params.seedPattern);
  console.log('[CrystalTemplate] template value:', params.template, 'type:', typeof params.template);

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
  let variantVal = params.variant;
  if (variantVal === null || variantVal === undefined) { // If null/undefined, randomize
    // On mobile, always use Standard variant (Isolated is too small)
    if (isMobile) {
      variantVal = 'Standard';
      console.log(`[CrystalTemplate] Mobile detected - forcing Standard variant`);
    } else {
      variantVal = Math.random() < 0.5 ? 'Standard' : 'Isolated';
      console.log(`[CrystalTemplate] Randomized variant to: ${variantVal}`);
    }
  } else {
    // Even if explicitly set to Isolated, override on mobile
    if (isMobile && variantVal.toLowerCase() === 'isolated') {
      variantVal = 'Standard';
      console.log(`[CrystalTemplate] Mobile detected - overriding Isolated to Standard`);
    } else {
      variantVal = variantVal.toLowerCase() === 'isolated' ? 'Isolated' : 'Standard'; // Normalize
    }
  }
  
  let imageModeVal = params.imageMode;
  if (imageModeVal === null || imageModeVal === undefined) { // If null/undefined, randomize
    imageModeVal = Math.random() < 0.25 ? 'single' : 'unique'; // 25% chance for single image mode
    console.log(`[CrystalTemplate] Randomized imageMode to: ${imageModeVal}`);
  }

  // Randomize crystal style parameters for more variety
  const seedPatterns = ['random', 'grid', 'radial', 'spiral'];
  const crystalTemplates = ['hexagonal', 'irregular', 'angular', 'elongated'];
  
  // Always randomize when null/undefined, otherwise use specified value
  const randomizedSeedPattern = (params.seedPattern !== null && params.seedPattern !== undefined) 
    ? params.seedPattern 
    : seedPatterns[Math.floor(Math.random() * seedPatterns.length)];
  const randomizedTemplate = (params.template !== null && params.template !== undefined)
    ? params.template 
    : crystalTemplates[Math.floor(Math.random() * crystalTemplates.length)];
  const randomizedComplexity = (params.complexity !== null && params.complexity !== undefined)
    ? params.complexity
    : (3 + Math.floor(Math.random() * 5)); // 3-7
  const randomizedDensity = (params.density !== null && params.density !== undefined)
    ? params.density
    : (3 + Math.floor(Math.random() * 5)); // 3-7
  
  console.log(`[CrystalTemplate] Crystal settings - Variant: ${variantVal}, Template: ${randomizedTemplate}, Pattern: ${randomizedSeedPattern}, Complexity: ${randomizedComplexity}, Density: ${randomizedDensity}`);
  console.log(`[CrystalTemplate] Randomization check - seedPattern undefined: ${params.seedPattern === undefined}, template undefined: ${params.template === undefined}`);

  const settings = {
    variant: variantVal,
    imageMode: imageModeVal,
    complexity: randomizedComplexity,
    density: randomizedDensity,
    seedPattern: randomizedSeedPattern,
    template: randomizedTemplate,
    blendOpacity: Number(params.blendOpacity) || 0.9,
    useMultiply: params.useMultiply !== false, // Default to true if not specified
    multiplyPct: Number(params.multiplyPct) || 100,
    // Pass canvas dimensions directly to the effect if it needs them for centering/scaling
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    dpr: window.devicePixelRatio || 1
  };

  const effect = new CrystalEffect(ctx, images, settings);
  effect.draw(); 
  
  // Return canvas, bgColor, and the processed parameters that were actually used
  const processedParams = {
    variant: variantVal,
    imageMode: imageModeVal,
    complexity: randomizedComplexity,
    density: randomizedDensity,
    seedPattern: randomizedSeedPattern,
    template: randomizedTemplate,
    blendOpacity: settings.blendOpacity,
    useMultiply: settings.useMultiply,
    multiplyPct: settings.multiplyPct,
    bgColor: bgColorToUse,
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[CrystalTemplate] Returning processed params:', processedParams);
  
  return { 
    canvas, 
    bgColor: bgColorToUse, 
    processedParams 
  };
}

const crystalTemplate = {
  key: 'crystal',
  name: 'Crystal',
  render: renderCrystal,
  params: {
    variant: { type: 'select', options: ['standard', 'isolated'], default: null }, // null means randomize
    imageMode: { type: 'select', options: ['single', 'unique'], default: null }, // null means randomize
    complexity: { type: 'number', min: 1, max: 10, default: null }, // null means randomize
    density: { type: 'number', min: 1, max: 10, default: null }, // null means randomize
    seedPattern: { type: 'select', options: ['random', 'grid', 'radial', 'spiral'], default: null }, // null means randomize
    template: { type: 'select', options: ['hexagonal', 'irregular', 'angular', 'elongated'], default: null }, // null means randomize
    blendOpacity: { type: 'number', min: 0, max: 1, step: 0.1, default: 0.9 },
    useMultiply: { type: 'boolean', default: true },
    multiplyPct: { type: 'number', min: 0, max: 100, default: 100 },
    bgColor: { type: 'color', default: '#FFFFFF' } // UI default, code will handle fallback
  }
};

export default crystalTemplate; 