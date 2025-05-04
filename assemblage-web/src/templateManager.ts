import { Template, MaskPlacement, templates } from './templates';
import { MosaicGenerator } from './core/mosaicGenerator';

export interface TemplateOverride {
  index: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface TemplateResponse {
  templateKey: string;
  overrides?: TemplateOverride[];
  bgColor?: string;
}

export class TemplateManager {
  static getTemplate(key: string): Template | undefined {
    return templates.find(t => t.key === key);
  }

  static applyOverrides(template: Template, overrides: TemplateOverride[] = []): MaskPlacement[] {
    const placements = [...template.placements];
    
    for (const override of overrides) {
      if (override.index >= 0 && override.index < placements.length) {
        const placement = placements[override.index];
        placements[override.index] = {
          ...placement,
          ...(override.x !== undefined && { x: override.x }),
          ...(override.y !== undefined && { y: override.y }),
          ...(override.width !== undefined && { width: override.width }),
          ...(override.height !== undefined && { height: override.height }),
          ...(override.rotation !== undefined && { rotation: override.rotation }),
        };
      }
    }
    
    return placements;
  }

  static getAvailableTemplateKeys(): string[] {
    return templates.map(t => t.key);
  }

  static async generateTemplate(
    template: Template,
    sourceImage: HTMLImageElement,
    canvas: HTMLCanvasElement,
    seed: number = Math.random() * 1000000
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.fillStyle = template.defaultBG || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (template.key === 'scrambledMosaic') {
      const generator = new MosaicGenerator(template, seed);
      generator.generateMosaic(ctx, sourceImage);
      return;
    }

    // ... existing code for other templates ...
  }
} 