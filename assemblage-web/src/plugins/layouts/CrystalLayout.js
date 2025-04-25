/**
 * Crystal Layout for Assemblage
 * Combines both standard and isolated crystal effects
 */

import { CrystalFormationGenerator } from '@legacy/collage/crystalFormationGenerator.js';
import { IsolatedCrystalGenerator } from '@legacy/collage/isolatedCrystalGenerator.js';
import { CrystalGenerator } from '@legacy/collage/crystalGenerator.js';

class CrystalLayout {
    constructor(opts = {}) {
        this.opts = opts;
        this.crystalGenerator = null;
    }

    render(ctx, images, { isolated = false } = {}) {
        if (!ctx || !ctx.canvas) {
            console.error('Invalid canvas context provided to CrystalLayout');
            return;
        }

        const prev = ctx.globalCompositeOperation;
        try {
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
        } catch (error) {
            console.error('Error generating crystal effect:', error);
            throw error;
        } finally {
            ctx.globalCompositeOperation = prev;
        }
    }
}

export default CrystalLayout; 