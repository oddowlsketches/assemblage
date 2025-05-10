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

  // Scale drawing operations so CrystalEffect maths (which divides by DPR)
  // align with the logical pixel grid. We apply the inverse of that division
  // by up-scaling the context temporarily.
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
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
    multiplyPct: Number(params.multiplyPct) || 100
  };

  const effect = new CrystalEffect(ctx, images, settings);
  effect.draw();
  ctx.restore();
}

const crystalTemplate = {
  key: 'crystalEffect',
  name: 'Crystal Effect',
  generate: renderCrystal,
  params: {
    variant: { type: 'select', options: ['standard', 'isolated'], default: 'standard' },
    imageMode: { type: 'select', options: ['single', 'unique'], default: 'unique' },
    complexity: { type: 'number', min: 1, max: 10, default: 5 },
    density: { type: 'number', min: 1, max: 10, default: 5 },
    seedPattern: { type: 'select', options: ['random', 'grid', 'spiral', 'radial'], default: 'random' },
    template: { type: 'select', options: ['hexagonal', 'irregular', 'angular', 'elongated'], default: 'hexagonal' },
    blendOpacity: { type: 'number', min: 0.1, max: 1, step: 0.1, default: 0.7 },
    useMultiply: { type: 'boolean', default: true },
    multiplyPct: { type: 'number', min: 0, max: 100, default: 100 }
  }
};

export default crystalTemplate; 