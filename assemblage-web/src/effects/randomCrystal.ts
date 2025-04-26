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

export function getRandomCrystalSettings(): CrystalParams {
  const settings: CrystalParams = {
    ...defaultCrystalParams,
    imageMode: Math.random() < 0.5 ? 'single' : 'unique',
    complexity: Math.floor(Math.random() * 5) + 3,
    maxFacets: Math.floor(Math.random() * 8) + 8,
    blendOpacity: 0.6 + Math.random() * 0.3,
    variant: Math.random() < 0.5 ? 'standard' : 'isolated'
  };

  // DEBUG — remove after testing
  console.log('[CrystalSettings] imageMode chosen →', settings.imageMode);

  return settings;
} 