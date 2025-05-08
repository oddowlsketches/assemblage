/**
 * Standardized tangram pieces with consistent SVG definitions
 * All pieces have the same viewBox (0 0 100 100) for consistency
 */

export const tangramPieces = {
  // Large triangle - 1/4 of the square
  largeTri1: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="0,0 100,0 0,100" fill="white"/>
    </svg>
  `,
  
  // Large triangle - 1/4 of the square
  largeTri2: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="100,0 100,100 0,100" fill="white"/>
    </svg>
  `,
  
  // Medium triangle - 1/8 of the square
  mediumTri: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="0,0 100,0 100,100" fill="white"/>
    </svg>
  `,
  
  // Small triangle - 1/16 of the square
  smallTri1: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="0,0 100,0 0,100" fill="white"/>
    </svg>
  `,
  
  // Small triangle - 1/16 of the square
  smallTri2: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="100,0 100,100 0,100" fill="white"/>
    </svg>
  `,
  
  // Square - 1/8 of the square
  square: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" fill="white"/>
    </svg>
  `,
  
  // Parallelogram - 1/8 of the square
  parallelogram: () => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="0,100 50,0 100,0 50,100" fill="white"/>
    </svg>
  `
};

// Function to register all tangram pieces in the maskRegistry
export function registerTangramPieces(registry) {
  if (!registry.basic) {
    registry.basic = {};
  }
  
  // Register each tangram piece
  registry.basic.tangramLargeTriangle = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.largeTri1,
    description: "Tangram large triangle (1/4 square)", 
    tags: ["tangram", "triangle", "large"]
  });
  
  registry.basic.tangramLargeTriangle2 = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.largeTri2,
    description: "Tangram large triangle (1/4 square)", 
    tags: ["tangram", "triangle", "large"]
  });
  
  registry.basic.tangramMediumTriangle = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.mediumTri,
    description: "Tangram medium triangle (1/8 square)", 
    tags: ["tangram", "triangle", "medium"]
  });
  
  registry.basic.tangramSmallTriangle1 = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.smallTri1,
    description: "Tangram small triangle (1/16 square)", 
    tags: ["tangram", "triangle", "small"]
  });
  
  registry.basic.tangramSmallTriangle2 = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.smallTri2,
    description: "Tangram small triangle (1/16 square)", 
    tags: ["tangram", "triangle", "small"]
  });
  
  registry.basic.tangramSquare = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.square,
    description: "Tangram square (1/8 square)", 
    tags: ["tangram", "square"]
  });
  
  registry.basic.tangramParallelogram = () => ({ 
    kind: 'svg', 
    getSvg: tangramPieces.parallelogram,
    description: "Tangram parallelogram (1/8 square)", 
    tags: ["tangram", "parallelogram"]
  });
}

export default tangramPieces;
