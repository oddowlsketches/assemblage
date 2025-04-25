/**
 * Tiling Layout for Assemblage
 * Creates a tiled pattern from the input images
 */

import { TilingGenerator } from '@legacy/collage/tilingGenerator.js';

export default class TilingLayout {
  constructor() {
    this.generator = null;
  }

  async render(ctx, images, canvas, opts = {}) {
    // Fill background
    ctx.fillStyle = opts.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    if (!this.generator) {
      this.generator = new TilingGenerator(canvas, opts);
    }

    await this.generator.generateTiles(images);
    
    ctx.restore();
  }
} 