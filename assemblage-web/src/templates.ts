export interface MaskPlacement {
  maskName: string;
  x: number;     // relative 0–1 across canvas
  y: number;     // relative 0–1
  width: number; // relative 0–1 of canvas width
  height: number;// relative 0–1 of canvas height
  rotation?: number; // degrees
  xRange?: [number, number]; // optional range for x randomization
  yRange?: [number, number]; // optional range for y randomization
  sizeVariance?: number; // e.g. 0.2 means ±20%
  minOverlap?: number; // fraction of area overlap, e.g. 0.1
  maxOverlap?: number;
  rotationRange?: [number, number]; // optional range for rotation randomization
}

export interface Template {
  key: string;          // e.g. "archesRow", "windowsGrid", "houseFacade", "slicedLegacy"
  name: string;         // human-friendly
  placements: MaskPlacement[];
  defaultBG?: string;   // optional default background color
  gridSizeRange?: [number, number];
  revealPctRange?: [number, number];
  patternTypeOptions?: string[];
  shapeOptions?: string[];
  operationOptions?: string[];
  blendMode?: string;
  bgColors?: string[];
}

export const templates: Template[] = [
  {
    key: "archesRow",
    name: "Row of Three Arches",
    placements: [
      { maskName: "arch", x: 0.10, y: 0.50, width: 0.25, height: 0.40 },
      { maskName: "arch", x: 0.50, y: 0.50, width: 0.25, height: 0.40 },
      { maskName: "arch", x: 0.90, y: 0.50, width: 0.25, height: 0.40 }
    ],
    defaultBG: "#eeeeee"
  },
  {
    key: "windowsGrid",
    name: "Grid of Windows",
    placements: [
      { maskName: "window", x: 0.25, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.50, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.25, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.50, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.50, width: 0.20, height: 0.20 }
    ],
    defaultBG: "#ffffff"
  },
  {
    key: "slicedLegacy",
    name: "Sliced Legacy",
    placements: [
      { maskName: "window", x: 0.10, y: 0.10, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.30, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.50, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.70, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.90, width: 0.80, height: 0.10, rotation: 0 }
    ],
    defaultBG: "#ffffff"
  },
  {
    key: "altarComposition",
    name: "Altar Composition",
    placements: [
      { maskName: "arch", x: 0.50, y: 0.50, width: 0.40, height: 0.40 },
      { maskName: "arch", x: 0.50, y: 0.30, width: 0.30, height: 0.30 },
      { maskName: "arc", x: 0.50, y: 0.20, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.25, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.50, width: 0.20, height: 0.20 }
    ],
    defaultBG: "#f5f5f5"
  },
  {
    key: 'scrambledMosaic',
    name: 'Scrambled Mosaic',
    defaultBG: '#FFFFFF',
    gridSizeRange: [4, 16],
    revealPctRange: [0.4, 0.9],
    patternTypeOptions: ['random', 'clustered', 'silhouette', 'portrait'],
    shapeOptions: ['square', 'rectHorizontal', 'rectVertical', 'circle', 'stripe'],
    operationOptions: ['reveal', 'swap', 'rotate'],
    blendMode: 'multiply',
    bgColors: ['#f5f5f5', '#e8e8e8', '#f0f0f0', '#f8f8f8'],
    placements: [
      { 
        maskName: 'architectural/windowRect', 
        x: 0.167, y: 0.125, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.333, y: 0.125, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/diamondMask', 
        x: 0.500, y: 0.125, width: 0.167, height: 0.25, rotation: 15,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.667, y: 0.125, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/circleMask', 
        x: 0.833, y: 0.125, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.167, y: 0.375, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/hexagonMask', 
        x: 0.333, y: 0.375, width: 0.167, height: 0.25, rotation: 30,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.500, y: 0.375, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/triangleMask', 
        x: 0.667, y: 0.375, width: 0.167, height: 0.25, rotation: -15,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/circleMask', 
        x: 0.167, y: 0.625, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.333, y: 0.625, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/diamondMask', 
        x: 0.500, y: 0.625, width: 0.167, height: 0.25, rotation: 20,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.833, y: 0.625, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.167, y: 0.875, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/hexagonMask', 
        x: 0.500, y: 0.875, width: 0.167, height: 0.25, rotation: 40,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'basic/triangleMask', 
        x: 0.667, y: 0.875, width: 0.167, height: 0.25, rotation: 10,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      },
      { 
        maskName: 'architectural/windowRect', 
        x: 0.833, y: 0.875, width: 0.167, height: 0.25, rotation: 0,
        xRange: [0.05, 0.95], yRange: [0.05, 0.95], sizeVariance: 0.2, rotationRange: [-15, 25]
      }
    ]
  }
]; 