/**
 * Crystal Layout for Assemblage
 * Combines both standard and isolated crystal effects
 */

import { SafeCrystalFormationGenerator } from '../../../legacy/js/collage/crystalFormationGenerator.js';

class CrystalLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.crystalGenerator = null;
    }

    render(ctx, images, { isolated = false } = {}) {
        // Set up canvas context
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Initialize generator if needed
        if (!this.crystalGenerator) {
            this.crystalGenerator = new SafeCrystalFormationGenerator(ctx, ctx.canvas);
        }

        // Generate crystal effect
        if (isolated) {
            // Use isolated crystal implementation
            const isolatedGenerator = new IsolatedCrystalGenerator(ctx, ctx.canvas);
            return isolatedGenerator.generateIsolatedCrystal(images, {
                complexity: 0.3 + Math.random() * 0.4,
                maxFacets: 6 + Math.floor(Math.random() * 19),
                blendOpacity: 0.7,
                addGlow: false,
                template: 'hexagonal',
                crystalSize: 0.6,
                crystalCount: 1,
                preventOverlap: true,
                facetBorders: true,
                enableVisualEffects: true
            });
        } else {
            // Use standard crystal implementation
            return this.crystalGenerator.generateCrystal(images, null, {
                complexity: 5,
                maxFacets: 25,
                blendOpacity: 0.7,
                addGlow: false
            });
        }
    }
}

// Re-export the legacy implementations for reference
export { SafeCrystalFormationGenerator } from '../../../legacy/js/collage/crystalFormationGenerator.js';
export { IsolatedCrystalGenerator } from '../../../legacy/js/collage/isolatedCrystalGenerator.js';

export default CrystalLayout; 