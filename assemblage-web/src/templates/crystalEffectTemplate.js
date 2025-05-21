// crystalEffectTemplate.js
// Template wrapper around the existing CrystalEffect class so it fits
// the new template-review system (Canvas, images, params)

import { CrystalEffect } from '../effects/CrystalEffect';

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

  // Scale drawing operations so CrystalEffect maths align with the logical pixel grid
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  
  // Center the effect on the canvas
  const canvasWidth = canvas.width / dpr;
  const canvasHeight = canvas.height / dpr;
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.scale(dpr, dpr);

  const variantVal = (params.variant || 'standard').toLowerCase() === 'isolated' ? 'Isolated' : 'Standard';
  const settings = {
    variant: variantVal,     // 'Standard' | 'Isolated' (match CrystalEffect)
    imageMode: params.imageMode || 'unique',   // 'single' | 'unique'
    complexity: Number(params.complexity) || 5,
    density: Number(params.density) || 5,
    seedPattern: params.seedPattern || 'random',
    template: params.template || 'hexagonal',
    blendOpacity: Number(params.blendOpacity) || 0.7,
    useMultiply: params.useMultiply || true,
    multiplyPct: Number(params.multiplyPct) || 100,
    // Add positioning parameters
    centerX: 0,  // Will be centered due to translate above
    centerY: 0,
    scale: Math.min(canvasWidth, canvasHeight) / Math.max(canvasWidth, canvasHeight)
  };

  const effect = new CrystalEffect(ctx, images, settings);
  effect.draw();
  ctx.restore();
}

const crystalTemplate = {
  key: 'crystal',
  name: 'Crystal',
  generate: renderCrystal,
  params: {
    variant: { type: 'select', options: ['standard', 'isolated'], default: 'standard' },
    imageMode: { type: 'select', options: ['single', 'unique'], default: 'unique' },
    complexity: { type: 'number', min: 1, max: 10, default: 5 },
    density: { type: 'number', min: 1, max: 10, default: 5 },
    seedPattern: { type: 'select', options: ['random', 'grid', 'radial', 'spiral'], default: 'random' },
    template: { type: 'select', options: ['hexagonal', 'square', 'triangular'], default: 'hexagonal' },
    blendOpacity: { type: 'number', min: 0, max: 1, step: 0.1, default: 0.7 },
    useMultiply: { type: 'boolean', default: true },
    multiplyPct: { type: 'number', min: 0, max: 100, default: 100 }
  }
};

export default crystalTemplate; 