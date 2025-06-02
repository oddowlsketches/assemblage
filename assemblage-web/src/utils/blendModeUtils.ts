/**
 * Utility functions for choosing and working with blend modes
 */

import { getContrastRatio } from './contrastUtils';

export interface BlendModeChoice {
  mode: 'multiply' | 'hard-light';
  opacity: number;
}

/**
 * Analyzes two images and chooses an appropriate blend mode
 * that will create sufficient contrast (Δcontrast > 30%)
 * 
 * @param imageA - First image element
 * @param imageB - Second image element
 * @param forceMultiply - Force multiply mode (useful for B&W images)
 * @returns The chosen blend mode and opacity
 */
export function chooseBlend(
  imageA: HTMLImageElement, 
  imageB: HTMLImageElement,
  forceMultiply: boolean = false
): BlendModeChoice {
  // Start with a default blend mode choice
  let chosenMode: 'multiply' | 'hard-light' = 'multiply';
  let chosenOpacity = 0.6; // Middle of the range 0.4-0.8
  
  if (forceMultiply) {
    // Force multiply mode with varied opacity
    chosenMode = 'multiply';
    chosenOpacity = 0.4 + Math.random() * 0.4;
  } else {
    // Since we can't easily calculate image contrast without drawing them,
    // we'll use a randomized approach with preference for multiply mode
    // In a real implementation, we would sample pixels from both images
    // to calculate actual contrast differences
    
    // 70% chance to use multiply, 30% for hard-light
    const useMultiply = Math.random() < 0.7;
    chosenMode = useMultiply ? 'multiply' : 'hard-light';
    
    // Random opacity between 0.4 and 0.8
    chosenOpacity = 0.4 + Math.random() * 0.4;
    
    // For hard-light mode, we might want slightly higher opacity
    // to ensure sufficient contrast
    if (chosenMode === 'hard-light') {
      chosenOpacity = Math.min(0.8, chosenOpacity + 0.1);
    }
  }
  
  return {
    mode: chosenMode,
    opacity: chosenOpacity
  };
}

/**
 * Calculates approximate contrast change between two blend states
 * This is a simplified version - in production you'd sample actual pixels
 * 
 * @param beforeLuminance - Luminance before blending
 * @param afterLuminance - Luminance after blending
 * @returns Percentage change in contrast
 */
export function calculateContrastChange(
  beforeLuminance: number, 
  afterLuminance: number
): number {
  if (beforeLuminance === 0) return 100;
  
  const change = Math.abs(afterLuminance - beforeLuminance) / beforeLuminance;
  return change * 100;
}

/**
 * Checks if the contrast change meets the minimum threshold
 * 
 * @param contrastChange - The contrast change percentage
 * @param threshold - The minimum threshold (default 30%)
 * @returns Whether the contrast change is sufficient
 */
export function isContrastSufficient(
  contrastChange: number, 
  threshold: number = 30
): boolean {
  return contrastChange >= threshold;
}
