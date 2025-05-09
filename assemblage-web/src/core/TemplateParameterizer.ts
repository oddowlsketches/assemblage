import type { Template, MaskPlacement } from '../templates';

/**
 * Parameter range definitions for maskPlacements
 */
export interface ParameterRange {
  min: number;
  max: number;
  step?: number;
}

/**
 * Parameter ranges for a placement
 */
export interface PlacementRanges {
  x?: ParameterRange;
  y?: ParameterRange;
  width?: ParameterRange;
  height?: ParameterRange;
  rotation?: ParameterRange;
}

/**
 * Parameter definition for a templatized placement
 */
export interface ParameterizedPlacement extends MaskPlacement {
  // Optional parameter ranges
  parameterRanges?: PlacementRanges;
}

/**
 * Extended template with parameter ranges
 */
export interface ParameterizedTemplate extends Template {
  placements: ParameterizedPlacement[];
  // Global variance levels (0-1)
  globalVariance?: {
    position?: number; // Variance for x,y positions
    size?: number;     // Variance for width,height
    rotation?: number; // Variance for rotation
  };
}

/**
 * Helper to get a random value within a range
 */
function getRandomInRange(range: ParameterRange): number {
  if (range.step) {
    // Discrete steps
    const steps = Math.floor((range.max - range.min) / range.step) + 1;
    const step = Math.floor(Math.random() * steps);
    return range.min + (step * range.step);
  } else {
    // Continuous range
    return range.min + Math.random() * (range.max - range.min);
  }
}

/**
 * Adds varying levels of randomness to a value based on a variance level
 * @param value The original value
 * @param variance A value between 0-1 indicating how much to vary
 * @param min Minimum allowed value (optional)
 * @param max Maximum allowed value (optional)
 * @returns The value with variance applied
 */
function applyVariance(value: number, variance: number, min?: number, max?: number): number {
  // Maximum percentage to vary (at variance = 1.0)
  const MAX_PERCENT = 0.25; 
  
  // Calculate actual variance percentage
  const actualPercent = variance * MAX_PERCENT;
  
  // Apply variance
  const offset = (Math.random() * 2 - 1) * actualPercent * value;
  let result = value + offset;
  
  // Clamp to min/max if provided
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  
  return result;
}

/**
 * Creates a new randomized template based on parameter ranges
 * @param template The template with parameter ranges
 * @returns A new template with randomized values
 */
export function randomizeTemplate(template: ParameterizedTemplate): Template {
  // Create a new template object
  const randomized: Template = {
    key: template.key,
    name: template.name,
    defaultBG: template.defaultBG,
    placements: []
  };
  
  // Global variance levels
  const globalVariance = template.globalVariance || {
    position: 0.2,
    size: 0.1,
    rotation: 0.3
  };
  
  // Randomize each placement
  template.placements.forEach(placement => {
    const newPlacement: MaskPlacement = { ...placement };
    
    // Skip randomization if no parameter ranges and no global variance
    if (!placement.parameterRanges && !globalVariance) {
      randomized.placements.push(newPlacement);
      return;
    }
    
    // Apply explicit parameter ranges if they exist
    if (placement.parameterRanges) {
      // Randomize x position if range exists
      if (placement.parameterRanges.x) {
        newPlacement.x = getRandomInRange(placement.parameterRanges.x);
      }
      
      // Randomize y position if range exists
      if (placement.parameterRanges.y) {
        newPlacement.y = getRandomInRange(placement.parameterRanges.y);
      }
      
      // Randomize width if range exists
      if (placement.parameterRanges.width) {
        newPlacement.width = getRandomInRange(placement.parameterRanges.width);
      }
      
      // Randomize height if range exists
      if (placement.parameterRanges.height) {
        newPlacement.height = getRandomInRange(placement.parameterRanges.height);
      }
      
      // Randomize rotation if range exists
      if (placement.parameterRanges.rotation) {
        newPlacement.rotation = getRandomInRange(placement.parameterRanges.rotation);
      }
    }
    
    // Apply global variance for values without explicit ranges
    if (globalVariance) {
      // Apply position variance if no explicit x range
      if (!placement.parameterRanges?.x && globalVariance.position) {
        newPlacement.x = applyVariance(newPlacement.x, globalVariance.position, 0, 1);
      }
      
      // Apply position variance if no explicit y range
      if (!placement.parameterRanges?.y && globalVariance.position) {
        newPlacement.y = applyVariance(newPlacement.y, globalVariance.position, 0, 1);
      }
      
      // Apply size variance if no explicit width range
      if (!placement.parameterRanges?.width && globalVariance.size) {
        newPlacement.width = applyVariance(newPlacement.width, globalVariance.size, 0.05, 1);
      }
      
      // Apply size variance if no explicit height range
      if (!placement.parameterRanges?.height && globalVariance.size) {
        newPlacement.height = applyVariance(newPlacement.height, globalVariance.size, 0.05, 1);
      }
      
      // Apply rotation variance if no explicit rotation range and rotation exists
      if (!placement.parameterRanges?.rotation && globalVariance.rotation && newPlacement.rotation !== undefined) {
        newPlacement.rotation = applyVariance(newPlacement.rotation, globalVariance.rotation);
      }
    }
    
    // Add to randomized placements
    randomized.placements.push(newPlacement);
  });
  
  return randomized;
}

/**
 * Converts a standard template to a parameterized template with default ranges
 * @param template The template to parameterize
 * @returns A new template with parameter ranges
 */
export function parameterizeTemplate(template: Template): ParameterizedTemplate {
  // Create a new parameterized template
  const parameterized: ParameterizedTemplate = {
    ...template,
    placements: [],
    globalVariance: {
      position: 0.2,
      size: 0.1,
      rotation: 0.3
    }
  };
  
  // Convert each placement to a parameterized placement
  template.placements.forEach(placement => {
    const parameterizedPlacement: ParameterizedPlacement = {
      ...placement,
      parameterRanges: {
        // Default x range: ±20% of current position
        x: {
          min: Math.max(0, placement.x - placement.x * 0.2),
          max: Math.min(1, placement.x + placement.x * 0.2)
        },
        // Default y range: ±20% of current position
        y: {
          min: Math.max(0, placement.y - placement.y * 0.2),
          max: Math.min(1, placement.y + placement.y * 0.2)
        },
        // Default width range: ±10% of current width
        width: {
          min: Math.max(0.05, placement.width - placement.width * 0.1),
          max: Math.min(1, placement.width + placement.width * 0.1)
        },
        // Default height range: ±10% of current height
        height: {
          min: Math.max(0.05, placement.height - placement.height * 0.1),
          max: Math.min(1, placement.height + placement.height * 0.1)
        }
      }
    };
    
    // Add rotation range if rotation exists
    if (placement.rotation !== undefined) {
      parameterizedPlacement.parameterRanges.rotation = {
        min: placement.rotation - 15,
        max: placement.rotation + 15
      };
    }
    
    // Add to parameterized placements
    parameterized.placements.push(parameterizedPlacement);
  });
  
  return parameterized;
}

/**
 * Learns from feedback to adjust parameter ranges
 * @param template The parameterized template
 * @param feedback Array of feedback objects with isPositive flag
 * @returns Adjusted parameterized template
 */
export function learnFromFeedback(
  template: ParameterizedTemplate, 
  feedback: Array<{ templateKey: string, isPositive: boolean, template: Template }>
): ParameterizedTemplate {
  // Filter feedback to only include this template
  const relevantFeedback = feedback.filter(f => f.templateKey === template.key);
  
  if (relevantFeedback.length === 0) {
    // No relevant feedback, return original template
    return template;
  }
  
  // Split feedback into positive and negative
  const positiveFeedback = relevantFeedback.filter(f => f.isPositive);
  
  // If no positive feedback, we can't learn much
  if (positiveFeedback.length === 0) {
    return template;
  }
  
  // Create a new parameterized template
  const learnedTemplate: ParameterizedTemplate = {
    ...template,
    placements: []
  };
  
  // Process each placement
  template.placements.forEach((placement, index) => {
    // Create a new parameterized placement
    const learnedPlacement: ParameterizedPlacement = {
      ...placement,
      parameterRanges: { ...placement.parameterRanges }
    };
    
    // If there's no parameter ranges, create them
    if (!learnedPlacement.parameterRanges) {
      learnedPlacement.parameterRanges = {};
    }
    
    // For each parameter (x, y, width, height, rotation)
    // collect values from positive feedback
    const positiveValues = {
      x: positiveFeedback.map(f => f.template.placements[index]?.x).filter(Boolean),
      y: positiveFeedback.map(f => f.template.placements[index]?.y).filter(Boolean),
      width: positiveFeedback.map(f => f.template.placements[index]?.width).filter(Boolean),
      height: positiveFeedback.map(f => f.template.placements[index]?.height).filter(Boolean),
      rotation: positiveFeedback.map(f => f.template.placements[index]?.rotation).filter(Boolean)
    };
    
    // For each parameter
    // learn from positive values to adjust ranges
    
    // X position
    if (positiveValues.x.length > 0) {
      const minX = Math.min(...positiveValues.x);
      const maxX = Math.max(...positiveValues.x);
      
      // If there's a significant difference, use as range
      if (maxX - minX > 0.05) {
        learnedPlacement.parameterRanges.x = {
          min: Math.max(0, minX - 0.05),
          max: Math.min(1, maxX + 0.05)
        };
      } else {
        // Otherwise, create a range around the average
        const avgX = positiveValues.x.reduce((sum, x) => sum + x, 0) / positiveValues.x.length;
        learnedPlacement.parameterRanges.x = {
          min: Math.max(0, avgX - 0.1),
          max: Math.min(1, avgX + 0.1)
        };
      }
    }
    
    // Y position
    if (positiveValues.y.length > 0) {
      const minY = Math.min(...positiveValues.y);
      const maxY = Math.max(...positiveValues.y);
      
      // If there's a significant difference, use as range
      if (maxY - minY > 0.05) {
        learnedPlacement.parameterRanges.y = {
          min: Math.max(0, minY - 0.05),
          max: Math.min(1, maxY + 0.05)
        };
      } else {
        // Otherwise, create a range around the average
        const avgY = positiveValues.y.reduce((sum, y) => sum + y, 0) / positiveValues.y.length;
        learnedPlacement.parameterRanges.y = {
          min: Math.max(0, avgY - 0.1),
          max: Math.min(1, avgY + 0.1)
        };
      }
    }
    
    // Width
    if (positiveValues.width.length > 0) {
      const minW = Math.min(...positiveValues.width);
      const maxW = Math.max(...positiveValues.width);
      
      // If there's a significant difference, use as range
      if (maxW - minW > 0.05) {
        learnedPlacement.parameterRanges.width = {
          min: Math.max(0.05, minW - 0.02),
          max: Math.min(1, maxW + 0.02)
        };
      } else {
        // Otherwise, create a range around the average
        const avgW = positiveValues.width.reduce((sum, w) => sum + w, 0) / positiveValues.width.length;
        learnedPlacement.parameterRanges.width = {
          min: Math.max(0.05, avgW - 0.05),
          max: Math.min(1, avgW + 0.05)
        };
      }
    }
    
    // Height
    if (positiveValues.height.length > 0) {
      const minH = Math.min(...positiveValues.height);
      const maxH = Math.max(...positiveValues.height);
      
      // If there's a significant difference, use as range
      if (maxH - minH > 0.05) {
        learnedPlacement.parameterRanges.height = {
          min: Math.max(0.05, minH - 0.02),
          max: Math.min(1, maxH + 0.02)
        };
      } else {
        // Otherwise, create a range around the average
        const avgH = positiveValues.height.reduce((sum, h) => sum + h, 0) / positiveValues.height.length;
        learnedPlacement.parameterRanges.height = {
          min: Math.max(0.05, avgH - 0.05),
          max: Math.min(1, avgH + 0.05)
        };
      }
    }
    
    // Rotation
    if (positiveValues.rotation && positiveValues.rotation.length > 0) {
      const minR = Math.min(...positiveValues.rotation);
      const maxR = Math.max(...positiveValues.rotation);
      
      // If there's a significant difference, use as range
      if (maxR - minR > 10) {
        learnedPlacement.parameterRanges.rotation = {
          min: minR - 5,
          max: maxR + 5
        };
      } else {
        // Otherwise, create a range around the average
        const avgR = positiveValues.rotation.reduce((sum, r) => sum + r, 0) / positiveValues.rotation.length;
        learnedPlacement.parameterRanges.rotation = {
          min: avgR - 10,
          max: avgR + 10
        };
      }
    }
    
    // Add learned placement to template
    learnedTemplate.placements.push(learnedPlacement);
  });
  
  return learnedTemplate;
}
