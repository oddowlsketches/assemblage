export interface CrystalParams {
  imageMode: 'single' | 'unique';
  complexity: number;
  maxFacets: number;
  blendOpacity: number;
  variant: 'standard' | 'isolated';
}

export const defaultCrystalParams: CrystalParams = {
  imageMode: 'unique',
  complexity: 5,
  maxFacets: 12,
  blendOpacity: 0.8,
  variant: 'standard'
};

// Central place to define ALL random ranges going forward
export interface CrystalSettings {
  variant: 'Standard' | 'Isolated';
  imageMode: 'single' | 'unique';
  complexity: number;      // affects facets
  density: number;         // affects seed points
  seedPattern: 'random' | 'grid' | 'spiral' | 'radial';
  template: 'hexagonal' | 'irregular' | 'angular' | 'elongated';
  blendOpacity: number;    // keep existing default (0.7)
  /** any others we add later */
}

export function getRandomCrystalSettings(): CrystalSettings {
  const patterns = ['random', 'grid', 'spiral', 'radial'] as const;
  const templates = ['hexagonal', 'irregular', 'angular', 'elongated'] as const;

  return {
    variant: Math.random() < 0.5 ? 'Standard' : 'Isolated',
    imageMode: Math.random() < 0.5 ? 'single' : 'unique',
    complexity: 3 + Math.floor(Math.random() * 5),          // 3-7
    density:    3 + Math.floor(Math.random() * 5),          // 3-7
    seedPattern: patterns[Math.floor(Math.random() * patterns.length)],
    template:    templates[Math.floor(Math.random() * templates.length)],
    blendOpacity: 0.4 + Math.random() * 0.4,                // 0.4-0.8
  };
} 