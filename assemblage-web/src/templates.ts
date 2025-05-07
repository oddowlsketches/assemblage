// templates.ts
// Contains template definitions for the Assemblage application

export interface MaskPlacement {
  maskName: string;     // Reference to mask in registry (can include family prefix)
  x: number;            // relative 0–1 across canvas
  y: number;            // relative 0–1
  width: number;        // relative 0–1 of canvas width
  height: number;       // relative 0–1 of canvas height
  rotation?: number;    // degrees
  xRange?: [number, number]; // optional range for x randomization
  yRange?: [number, number]; // optional range for y randomization
  sizeVariance?: number;     // e.g. 0.2 means ±20%
  minOverlap?: number;       // fraction of area overlap, e.g. 0.1
  maxOverlap?: number;
  rotationRange?: [number, number]; // optional range for rotation randomization
}

export interface TemplateParameter {
  type: 'number' | 'select' | 'color' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default: number | string | boolean;
  label: string;
  description?: string;
}

export interface Template {
  key: string;          // unique identifier, e.g. "scrambledMosaic"
  name: string;         // human-friendly display name
  description: string;  // detailed description of what this template does
  category: 'abstract' | 'architectural' | 'narrative' | 'altar' | 'combined';
  params: Record<string, TemplateParameter>; // parameter definitions
  placements?: MaskPlacement[]; // optional mask placements for placement-based templates
  defaultBG?: string;   // optional default background color
  previewImageUrl?: string; // optional URL to a preview image
}

// Main templates collection
export const templates: Template[] = [
  // Scrambled Mosaic Template
  {
    key: 'scrambledMosaic',
    name: 'Scrambled Mosaic',
    description: 'A grid-based arrangement with randomized cell operations. Create collages from a regular grid with various operations and patterns.',
    category: 'abstract',
    params: {
      gridSize: { 
        type: 'number', 
        min: 4, 
        max: 16, 
        step: 1,
        default: 8, 
        label: 'Grid Size',
        description: 'Number of cells in each dimension'
      },
      revealPct: { 
        type: 'number', 
        min: 40, 
        max: 90,
        step: 5,
        default: 75, 
        label: 'Reveal Percentage',
        description: 'Percentage of cells to show'
      },
      pattern: { 
        type: 'select', 
        options: ['random', 'clustered', 'silhouette', 'portrait'], 
        default: 'random', 
        label: 'Pattern Type',
        description: 'How cells are organized in the grid'
      },
      cellShape: { 
        type: 'select', 
        options: ['square', 'rectHorizontal', 'rectVertical', 'circle', 'stripe'], 
        default: 'square', 
        label: 'Cell Shape',
        description: 'Shape of each visible cell'
      },
      operation: { 
        type: 'select', 
        options: ['reveal', 'swap', 'rotate'], 
        default: 'reveal', 
        label: 'Cell Operation',
        description: 'What to do with each affected cell'
      },
      bgColor: {
        type: 'color',
        default: '#FFFFFF',
        label: 'Background Color',
        description: 'Canvas background color'
      },
      useMultiply: {
        type: 'boolean',
        default: true,
        label: 'Multiply Blend',
        description: 'Apply multiply blend mode to cells'
      }
    }
  },
  
  // Paired Forms Template
  {
    key: 'pairedForms',
    name: 'Paired Forms',
    description: 'A composition of multiple shapes that touch along edges to create new meaning through juxtaposition.',
    category: 'abstract',
    params: {
      formCount: { 
        type: 'select', 
        options: ['2 (Diptych)', '3 (Triptych)', '4', '5'],
        default: '2 (Diptych)', 
        label: 'Form Count',
        description: 'Number of forms in the composition'
      },
      formType: { 
        type: 'select', 
        options: ['rectangular', 'semiCircle', 'triangle', 'mixed'], 
        default: 'mixed', 
        label: 'Form Type',
        description: 'Style of forms in the composition'
      },
      complexity: { 
        type: 'number', 
        min: 0, 
        max: 1,
        step: 0.1,
        default: 0.5, 
        label: 'Complexity',
        description: 'Complexity of the composition (0-1)'
      },
      alignmentType: { 
        type: 'select', 
        options: ['edge', 'overlap', 'puzzle'], 
        default: 'edge', 
        label: 'Alignment Type',
        description: 'How forms align with each other'
      },
      rotation: { 
        type: 'number', 
        min: 0, 
        max: 0.5,
        step: 0.05,
        default: 0, 
        label: 'Rotation',
        description: 'Amount of rotation applied to forms (0-0.5)'
      },
      bgColor: {
        type: 'color',
        default: '#FFFFFF',
        label: 'Background Color',
        description: 'Canvas background color'
      },
      useMultiply: {
        type: 'boolean',
        default: true,
        label: 'Multiply Blend',
        description: 'Apply multiply blend mode to forms'
      }
    }
  }
];

// Helper to get a template by key
export function getTemplate(key: string): Template | undefined {
  return templates.find(t => t.key === key);
}
