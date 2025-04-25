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
    ctx.save();
    
    // Fill background
    ctx.fillStyle = opts.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set multiply blend mode
    ctx.globalCompositeOperation = 'multiply';

    if (!this.generator) {
      this.generator = new TilingGenerator(canvas, opts);
    }

    await this.generator.generateTiles(images);
    
    // Restore context state at the end
    ctx.restore();
  }
} 