/* Shared parameter bag ---------------------------------------------------- */
export interface EffectParams {
  complexity: number;          // 0-1 for simple, 1-5 for advanced, etc.
  density?: number;            // optional, used by tiling-style effects
  blendOpacity?: number;       // 0-1 alpha applied when compositing
  seedPattern?: string;        // 'grid' | 'clusters' | …
  variation?: string;          // 'Classic' | 'Organic' | 'Focal' | …
  // 👉  Add new keys any time; the interface will grow with future effects.
}

/* Abstract base every effect must extend ---------------------------------- */
export abstract class EffectBase {
  protected ctx: CanvasRenderingContext2D;
  protected images: HTMLImageElement[];
  protected params: EffectParams;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: Partial<EffectParams> = {}
  ) {
    this.ctx = ctx;
    this.images = images;
    /** merge with sensible defaults so missing keys never blow up */
    this.params = {
      complexity: 1,
      density: 0.5,
      blendOpacity: 0.7,
      seedPattern: 'grid',
      variation: 'Classic',
      ...params,
    };
  }

  /** Every concrete effect must implement its own drawing logic */
  abstract draw(): void;
} 