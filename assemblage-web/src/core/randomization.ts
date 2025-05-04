import type { MaskPlacement } from '../templates';

// Seeded random number generator
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public rangeInt(min: number, max: number): number {
    return Math.floor(this.between(min, max));
  }

  public choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  public sample<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }
}

// Apply randomization to a mask placement
export function randomizePlacement(placement: MaskPlacement, seed: number = Date.now()): MaskPlacement {
  const random = new SeededRandom(seed);
  
  // Start with the base placement
  const result = { ...placement };

  // Apply x randomization if xRange is present
  if (placement.xRange) {
    result.x = random.between(placement.xRange[0], placement.xRange[1]);
  }

  // Apply y randomization if yRange is present
  if (placement.yRange) {
    result.y = random.between(placement.yRange[0], placement.yRange[1]);
  }

  // Apply size variance if present
  if (placement.sizeVariance) {
    const scale = 1 + (random.between(-1, 1) * placement.sizeVariance);
    result.width *= scale;
    result.height *= scale;
  }

  // Apply rotation randomization if rotationRange is present
  if (placement.rotationRange) {
    result.rotation = random.between(placement.rotationRange[0], placement.rotationRange[1]);
  }

  return result;
}

// Helper to check if two rectangles overlap
export function rectanglesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

// Helper to calculate overlap area between two rectangles
export function calculateOverlapArea(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): number {
  const xOverlap = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
  const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
  return xOverlap * yOverlap;
} 