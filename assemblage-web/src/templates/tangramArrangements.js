/**
 * Tangram arrangements for direct canvas rendering
 * Each arrangement uses the 7 tangram pieces in a recognizable shape
 */

export const tangramArrangements = [
  {
    key: 'classicSquare',
    name: 'Classic Square',
    description: 'Traditional tangram square arrangement',
    placements: [
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0, 
        y: 0, 
        width: 0.5, 
        height: 0.5, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.5, 
        y: 0.5, 
        width: 0.5, 
        height: 0.5, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.5, 
        y: 0, 
        width: 0.5, 
        height: 0.5, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0, 
        y: 0.75, 
        width: 0.25, 
        height: 0.25, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.25, 
        y: 0.5, 
        width: 0.25, 
        height: 0.25, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.25, 
        y: 0.25, 
        width: 0.25, 
        height: 0.25, 
        rotation: 0 
      },
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.25, 
        y: 0, 
        width: 0.25, 
        height: 0.25, 
        rotation: 0 
      }
    ]
  },
  {
    key: 'bird',
    name: 'Bird',
    description: 'Simple bird shape',
    placements: [
      // Left wing (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0.2, 
        y: 0.3, 
        width: 0.3, 
        height: 0.3, 
        rotation: 135 
      },
      // Right wing (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.8, 
        y: 0.3, 
        width: 0.3, 
        height: 0.3, 
        rotation: -135 
      },
      // Tail (medium triangle)
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.5, 
        y: 0.65, 
        width: 0.25, 
        height: 0.25, 
        rotation: 180 
      },
      // Body (square)
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.45, 
        y: 0.4, 
        width: 0.15, 
        height: 0.15, 
        rotation: 45 
      },
      // Head (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0.45, 
        y: 0.25, 
        width: 0.15, 
        height: 0.15, 
        rotation: 180 
      },
      // Beak (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.45, 
        y: 0.15, 
        width: 0.1, 
        height: 0.1, 
        rotation: 0 
      },
      // Neck (parallelogram)
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.45, 
        y: 0.3, 
        width: 0.15, 
        height: 0.1, 
        rotation: 90 
      }
    ]
  },
  {
    key: 'house',
    name: 'House',
    description: 'Simple house shape',
    placements: [
      // Left roof (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0.25, 
        y: 0.1, 
        width: 0.5, 
        height: 0.3, 
        rotation: 0 
      },
      // Right roof (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.75, 
        y: 0.1, 
        width: 0.5, 
        height: 0.3, 
        rotation: -90 
      },
      // Left wall (medium triangle)
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.05, 
        y: 0.5, 
        width: 0.4, 
        height: 0.4, 
        rotation: 90 
      },
      // Door (square)
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.5, 
        y: 0.7, 
        width: 0.2, 
        height: 0.2, 
        rotation: 0 
      },
      // Bottom right (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0.7, 
        y: 0.7, 
        width: 0.2, 
        height: 0.2, 
        rotation: 0 
      },
      // Right wall (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.7, 
        y: 0.5, 
        width: 0.2, 
        height: 0.2, 
        rotation: -90 
      },
      // Middle (parallelogram)
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.3, 
        y: 0.5, 
        width: 0.4, 
        height: 0.2, 
        rotation: 0 
      }
    ]
  },
  {
    key: 'cat',
    name: 'Cat',
    description: 'Sitting cat shape',
    placements: [
      // Head (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0.35, 
        y: 0.2, 
        width: 0.25, 
        height: 0.25, 
        rotation: -135 
      },
      // Body (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.5, 
        y: 0.5, 
        width: 0.35, 
        height: 0.35, 
        rotation: 0 
      },
      // Ear (medium triangle)
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.55, 
        y: 0.25, 
        width: 0.2, 
        height: 0.2, 
        rotation: -45 
      },
      // Eye (square)
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.35, 
        y: 0.3, 
        width: 0.1, 
        height: 0.1, 
        rotation: 45 
      },
      // Front leg (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0.4, 
        y: 0.7, 
        width: 0.15, 
        height: 0.15, 
        rotation: -90 
      },
      // Back leg (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.7, 
        y: 0.75, 
        width: 0.15, 
        height: 0.15, 
        rotation: 90 
      },
      // Tail (parallelogram)
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.75, 
        y: 0.45, 
        width: 0.15, 
        height: 0.15, 
        rotation: 90 
      }
    ]
  },
  {
    key: 'runner',
    name: 'Runner',
    description: 'Running figure',
    placements: [
      // Torso (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0.4, 
        y: 0.25, 
        width: 0.3, 
        height: 0.3, 
        rotation: 45 
      },
      // Legs (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.25, 
        y: 0.65, 
        width: 0.3, 
        height: 0.3, 
        rotation: 180 
      },
      // Arm (medium triangle)
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.65, 
        y: 0.3, 
        width: 0.25, 
        height: 0.25, 
        rotation: -90 
      },
      // Head (square)
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.25, 
        y: 0.25, 
        width: 0.15, 
        height: 0.15, 
        rotation: 0 
      },
      // Foot (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0.65, 
        y: 0.65, 
        width: 0.15, 
        height: 0.15, 
        rotation: -45 
      },
      // Hand (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.15, 
        y: 0.55, 
        width: 0.15, 
        height: 0.15, 
        rotation: 90 
      },
      // Hip (parallelogram)
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.45, 
        y: 0.45, 
        width: 0.2, 
        height: 0.15, 
        rotation: -45 
      }
    ]
  },
  {
    key: 'sailboat',
    name: 'Sailboat',
    description: 'Simple sailboat on water',
    placements: [
      // Main sail (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle', 
        x: 0.35, 
        y: 0.2, 
        width: 0.3, 
        height: 0.3, 
        rotation: 90 
      },
      // Hull left (large triangle)
      { 
        maskName: 'basic/tangramLargeTriangle2', 
        x: 0.2, 
        y: 0.6, 
        width: 0.3, 
        height: 0.3, 
        rotation: 180 
      },
      // Hull right (medium triangle)
      { 
        maskName: 'basic/tangramMediumTriangle', 
        x: 0.5, 
        y: 0.6, 
        width: 0.3, 
        height: 0.3, 
        rotation: 180 
      },
      // Cabin (square)
      { 
        maskName: 'basic/tangramSquare', 
        x: 0.25, 
        y: 0.5, 
        width: 0.15, 
        height: 0.15, 
        rotation: 45 
      },
      // Small sail (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle1', 
        x: 0.6, 
        y: 0.35, 
        width: 0.15, 
        height: 0.15, 
        rotation: 0 
      },
      // Flag (small triangle)
      { 
        maskName: 'basic/tangramSmallTriangle2', 
        x: 0.6, 
        y: 0.15, 
        width: 0.1, 
        height: 0.1, 
        rotation: 0 
      },
      // Water (parallelogram)
      { 
        maskName: 'basic/tangramParallelogram', 
        x: 0.35, 
        y: 0.8, 
        width: 0.3, 
        height: 0.15, 
        rotation: 0 
      }
    ]
  }
];

export default tangramArrangements;
