import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils.js';

/**
 * Architectural Compositions Template
 * Creates structured compositions using architectural elements
 * with improved alignment and color blocking
 */

// Design constants
const GRID_UNIT = 8;
const GOLDEN_RATIO = 1.618;

/**
 * Generate architectural composition
 */
export function generateArchitecturalComposition(canvas, images, params) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background
  ctx.fillStyle = params.bgColor || '#F0EDE5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create architectural plan
  const plan = createArchitecturalPlan(
    canvas.width,
    canvas.height,
    params.style || 'facade',
    params.complexity || 0.5
  );
  
  // Apply color blocking
  if (params.useColorBlocking) {
    applyArchitecturalColorBlocking(plan, params.colorPalette);
  }
  
  // Draw composition
  drawArchitecturalPlan(ctx, plan, images, params);
  
  return canvas;
}

/**
 * Create architectural plan with proper alignment
 */
function createArchitecturalPlan(width, height, style, complexity) {
  switch (style) {
    case 'facade':
      return createFacadePlan(width, height, complexity);
    case 'portal':
      return createPortalPlan(width, height, complexity);
    case 'rhythmic':
      return createRhythmicPlan(width, height, complexity);
    case 'shrine':
      return createShrinePlan(width, height, complexity);
    default:
      return createFacadePlan(width, height, complexity);
  }
}

/**
 * Create facade composition - building-like structure
 */
function createFacadePlan(width, height, complexity) {
  const elements = [];
  
  // Define zones
  const zones = {
    pediment: { y: 0, height: height * 0.15 },
    upper: { y: height * 0.15, height: height * 0.35 },
    middle: { y: height * 0.5, height: height * 0.35 },
    base: { y: height * 0.85, height: height * 0.15 }
  };
  
  // Pediment/Cornice
  if (complexity > 0.3) {
    elements.push({
      type: 'architectural/houseGable',
      x: width * 0.1,
      y: zones.pediment.y,
      width: width * 0.8,
      height: zones.pediment.height,
      layer: 1,
      isStructural: true
    });
  }
  
  // Columns
  const columnCount = Math.floor(2 + complexity * 3);
  const columnWidth = width * 0.08;
  const columnSpacing = (width - columnWidth * columnCount) / (columnCount + 1);
  
  for (let i = 0; i < columnCount; i++) {
    const x = columnSpacing + i * (columnWidth + columnSpacing);
    elements.push({
      type: 'architectural/columnSingle',
      x: snapToGrid(x),
      y: zones.upper.y,
      width: columnWidth,
      height: zones.upper.height + zones.middle.height,
      layer: 2,
      isStructural: true
    });
  }
  
  // Windows between columns
  for (let i = 0; i < columnCount - 1; i++) {
    const x = columnSpacing + columnWidth + i * (columnWidth + columnSpacing);
    const windowWidth = columnSpacing * 0.8;
    
    // Upper windows
    elements.push({
      type: 'architectural/windowRect',
      x: snapToGrid(x + (columnSpacing - windowWidth) / 2),
      y: zones.upper.y + zones.upper.height * 0.2,
      width: windowWidth,
      height: zones.upper.height * 0.6,
      layer: 3
    });
    
    // Lower windows/doors
    if (i === Math.floor((columnCount - 2) / 2)) {
      // Central door
      elements.push({
        type: 'altar/nicheArch',
        x: snapToGrid(x),
        y: zones.middle.y,
        width: columnSpacing,
        height: zones.middle.height,
        layer: 3,
        isEntrance: true
      });
    } else {
      // Regular windows
      elements.push({
        type: 'architectural/windowRect',
        x: snapToGrid(x + (columnSpacing - windowWidth) / 2),
        y: zones.middle.y + zones.middle.height * 0.1,
        width: windowWidth,
        height: zones.middle.height * 0.8,
        layer: 3
      });
    }
  }
  
  return elements;
}

/**
 * Create portal composition - frames within frames
 */
function createPortalPlan(width, height, complexity) {
  const elements = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create nested portals
  const portalCount = Math.floor(2 + complexity * 3);
  const baseSize = Math.min(width, height) * 0.8;
  
  for (let i = 0; i < portalCount; i++) {
    const scale = 1 - (i / portalCount) * 0.6;
    const portalWidth = baseSize * scale;
    const portalHeight = baseSize * scale * 1.2; // Taller than wide
    
    // Alternate between arch types
    const portalTypes = [
      'architectural/archClassical',
      'altar/nicheArch',
      'architectural/archFlat'
    ];
    
    elements.push({
      type: portalTypes[i % portalTypes.length],
      x: snapToGrid(centerX - portalWidth / 2),
      y: snapToGrid(centerY - portalHeight / 2),
      width: portalWidth,
      height: portalHeight,
      layer: portalCount - i, // Larger portals in back
      isPortal: true,
      depth: i
    });
  }
  
  // Add complementary elements
  if (complexity > 0.5) {
    // Side columns
    const columnWidth = width * 0.05;
    elements.push({
      type: 'architectural/columnPair',
      x: snapToGrid(centerX - baseSize / 2 - columnWidth),
      y: centerY - baseSize * 0.6,
      width: columnWidth * 2.5,
      height: baseSize * 1.2,
      layer: 0
    });
  }
  
  return elements;
}

/**
 * Create rhythmic composition - repeating elements
 */
function createRhythmicPlan(width, height, complexity) {
  const elements = [];
  
  // Create rhythm pattern
  const moduleCount = Math.floor(3 + complexity * 4);
  const moduleWidth = width / moduleCount;
  const rhythmPattern = createRhythmPattern(complexity);
  
  for (let i = 0; i < moduleCount; i++) {
    const x = i * moduleWidth;
    const pattern = rhythmPattern[i % rhythmPattern.length];
    
    switch (pattern) {
      case 'A': // Arch
        elements.push({
          type: 'architectural/archClassical',
          x: snapToGrid(x + moduleWidth * 0.1),
          y: height * 0.2,
          width: moduleWidth * 0.8,
          height: height * 0.6,
          layer: 1
        });
        break;
        
      case 'B': // Window
        elements.push({
          type: 'architectural/windowRect',
          x: snapToGrid(x + moduleWidth * 0.2),
          y: height * 0.3,
          width: moduleWidth * 0.6,
          height: height * 0.4,
          layer: 2
        });
        break;
        
      case 'C': // Column
        elements.push({
          type: 'architectural/columnSingle',
          x: snapToGrid(x + moduleWidth * 0.3),
          y: height * 0.1,
          width: moduleWidth * 0.4,
          height: height * 0.8,
          layer: 1
        });
        break;
        
      case 'S': // Space
        // Intentional empty space
        break;
    }
  }
  
  return elements;
}

/**
 * Create shrine composition - sacred geometry
 */
function createShrinePlan(width, height, complexity) {
  const elements = [];
  const centerX = width / 2;
  
  // Base platform
  elements.push({
    type: 'basic/rectangleMask',
    x: width * 0.2,
    y: height * 0.8,
    width: width * 0.6,
    height: height * 0.2,
    layer: 0,
    isBase: true,
    colorBlock: '#D4C5B9'
  });
  
  // Main shrine structure
  const shrineWidth = width * 0.4;
  const shrineHeight = height * 0.5;
  
  elements.push({
    type: 'altar/nicheArch',
    x: snapToGrid(centerX - shrineWidth / 2),
    y: height * 0.3,
    width: shrineWidth,
    height: shrineHeight,
    layer: 1,
    isShrine: true
  });
  
  // Inner sacred element
  if (complexity > 0.3) {
    const innerSize = shrineWidth * 0.5;
    elements.push({
      type: 'altar/circleInset',
      x: snapToGrid(centerX - innerSize / 2),
      y: height * 0.4,
      width: innerSize,
      height: innerSize,
      layer: 2,
      isSacred: true
    });
  }
  
  // Flanking elements
  if (complexity > 0.6) {
    const sideWidth = width * 0.15;
    const sideHeight = height * 0.3;
    
    // Left
    elements.push({
      type: 'architectural/windowGrid',
      x: snapToGrid(centerX - shrineWidth / 2 - sideWidth - width * 0.05),
      y: height * 0.4,
      width: sideWidth,
      height: sideHeight,
      layer: 1
    });
    
    // Right
    elements.push({
      type: 'architectural/windowGrid',
      x: snapToGrid(centerX + shrineWidth / 2 + width * 0.05),
      y: height * 0.4,
      width: sideWidth,
      height: sideHeight,
      layer: 1
    });
  }
  
  // Top element
  elements.push({
    type: 'altar/gableAltar',
    x: snapToGrid(centerX - shrineWidth * 0.6),
    y: height * 0.1,
    width: shrineWidth * 1.2,
    height: height * 0.2,
    layer: 0
  });
  
  return elements;
}

/**
 * Create rhythm pattern based on complexity
 */
function createRhythmPattern(complexity) {
  if (complexity < 0.3) {
    return ['A', 'S', 'A', 'S']; // Simple alternation
  } else if (complexity < 0.6) {
    return ['A', 'B', 'C', 'B']; // ABCB pattern
  } else {
    return ['A', 'B', 'C', 'B', 'A', 'S']; // Complex pattern
  }
}

/**
 * Apply color blocking to architectural elements
 */
function applyArchitecturalColorBlocking(elements, palette) {
  const defaultPalette = [
    '#2C3E50', // Dark blue-gray
    '#E74C3C', // Red
    '#F39C12', // Orange
    '#27AE60', // Green
    '#3498DB'  // Blue
  ];
  
  const colors = palette || defaultPalette;
  
  // Color structural elements
  elements.forEach(element => {
    if (element.isStructural || element.isBase) {
      element.colorBlock = colors[0];
    } else if (element.isEntrance || element.isShrine) {
      element.colorBlock = colors[1];
    } else if (Math.random() < 0.3) {
      // Random color blocking for some elements
      element.colorBlock = colors[Math.floor(Math.random() * colors.length)];
    }
  });
}

/**
 * Draw architectural plan
 */
function drawArchitecturalPlan(ctx, elements, images, params) {
  // Sort by layer
  elements.sort((a, b) => a.layer - b.layer);
  
  elements.forEach((element, index) => {
    ctx.save();
    
    // Get mask
    const [family, maskName] = element.type.split('/');
    const maskFn = maskRegistry[family]?.[maskName];
    
    if (!maskFn) {
      ctx.restore();
      return;
    }
    
    const maskObj = maskFn({});
    const svg = maskObj.getSvg ? maskObj.getSvg() : maskObj;
    const maskPath = svgToPath2D(svg);
    
    if (!maskPath) {
      ctx.restore();
      return;
    }
    
    // Transform
    ctx.translate(element.x, element.y);
    ctx.scale(element.width / 100, element.height / 100);
    ctx.clip(maskPath);
    
    // Draw content
    if (element.colorBlock) {
      // Solid color
      ctx.fillStyle = element.colorBlock;
      ctx.fillRect(0, 0, 100, 100);
    } else {
      // Image
      const img = images[index % images.length];
      if (img && img.complete) {
        if (params.useMultiply !== false) {
          ctx.globalCompositeOperation = 'multiply';
        }
        
        // Draw image with proper scaling
        const imgRatio = img.width / img.height;
        const maskRatio = element.width / element.height;
        
        let drawWidth = 100;
        let drawHeight = 100;
        let drawX = 0;
        let drawY = 0;
        
        if (imgRatio > maskRatio) {
          drawWidth = 100 * imgRatio / maskRatio;
          drawX = -(drawWidth - 100) / 2;
        } else {
          drawHeight = 100 * maskRatio / imgRatio;
          drawY = -(drawHeight - 100) / 2;
        }
        
        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawWidth, drawHeight);
      }
    }
    
    // Add outline if requested
    if (params.showOutlines) {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke(maskPath);
    }
    
    ctx.restore();
  });
}

/**
 * Snap position to grid
 */
function snapToGrid(value) {
  return Math.round(value / GRID_UNIT) * GRID_UNIT;
}

// Export template
const architecturalComposition = {
  key: 'architecturalComposition',
  name: 'Architectural Composition',
  generate: generateArchitecturalComposition,
  params: {
    style: { type: 'select', options: ['facade', 'portal', 'rhythmic', 'shrine'], default: 'facade' },
    complexity: { type: 'number', min: 0, max: 1, default: 0.5 },
    useColorBlocking: { type: 'boolean', default: false },
    showOutlines: { type: 'boolean', default: false },
    bgColor: { type: 'color', default: '#F0EDE5' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default architecturalComposition;
