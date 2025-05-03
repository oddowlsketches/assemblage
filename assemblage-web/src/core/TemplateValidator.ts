import { getMaskDescriptor } from '../masks/maskRegistry';
import type { Template, MaskPlacement } from '../templates';

/**
 * Validates that all masks referenced in a template exist in the maskRegistry
 * @param template The template to validate
 * @returns An object with validation results
 */
export function validateTemplate(template: Template): { 
  valid: boolean;
  missingMasks: string[];
  errorMessages: string[];
} {
  const result = {
    valid: true,
    missingMasks: [] as string[],
    errorMessages: [] as string[]
  };

  if (!template) {
    result.valid = false;
    result.errorMessages.push('Template is undefined or null');
    return result;
  }

  if (!template.placements || !Array.isArray(template.placements)) {
    result.valid = false;
    result.errorMessages.push('Template has no placements array');
    return result;
  }

  // Check each placement's mask
  template.placements.forEach((placement: MaskPlacement, index: number) => {
    if (!placement.maskName) {
      result.valid = false;
      result.errorMessages.push(`Placement at index ${index} has no maskName`);
      return;
    }

    const descriptor = getMaskDescriptor(placement.maskName);
    if (!descriptor || descriptor.kind !== 'svg') {
      result.valid = false;
      result.errorMessages.push(
        `Placement at index ${index} has invalid or missing mask: "${placement.maskName}"`
      );
      result.missingMasks.push(placement.maskName);
      return;
    }
  });

  return result;
}

/**
 * Validates all templates in an array
 * @param templates Array of templates to validate
 * @returns Validation results for each template
 */
export function validateTemplates(templates: Template[]): { 
  allValid: boolean;
  results: { [key: string]: { valid: boolean; missingMasks: string[]; errorMessages: string[] } }
} {
  const results: { [key: string]: { valid: boolean; missingMasks: string[]; errorMessages: string[] } } = {};
  let allValid = true;

  templates.forEach(template => {
    const validation = validateTemplate(template);
    results[template.name] = validation;
    if (!validation.valid) {
      allValid = false;
    }
  });

  return { allValid, results };
}

/**
 * Gets a list of all available masks in the registry
 * @returns An object with all mask families and their masks
 */
export function getAvailableMasks(): string[] {
  // This will need to be updated to return a list of all available mask names
  // You might want to add a new function to the mask registry to get all available mask names
  return [];
}
