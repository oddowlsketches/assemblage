// src/masks/maskDisabled.ts
/**
 * List of disabled mask keys that won't appear in the CMS or collage generation
 * Add mask keys here to hide them: "family/maskKey"
 */

export const disabledMasks = new Set([
  // Add masks you want to hide here, format: "family/maskKey"
  // Example: "sliced/slice4xMixed",
  // Example: "architectural/windowGrid",
]);

export function isMaskDisabled(family: string, key: string): boolean {
  return disabledMasks.has(`${family}/${key}`);
}

export function toggleMaskDisabled(family: string, key: string): void {
  const maskId = `${family}/${key}`;
  if (disabledMasks.has(maskId)) {
    disabledMasks.delete(maskId);
  } else {
    disabledMasks.add(maskId);
  }
}
