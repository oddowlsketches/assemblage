// narrativeGrid.js - A template that creates a Swiss-style grid layout using narrative panel masks

import { getMaskDescriptor } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageWithAspectRatio } from '../utils/imageDrawing.js';
import { getRandomColorFromPalette, areImagesMostlyBlackAndWhite } from '../utils/colors';
import { getComplementaryColor } from '../utils/colorUtils';
import { getAppropriateEchoColor } from '../utils/imageOverlapUtils';
import { getShapeCount } from './templateDefaults.js';

// Swiss grid compositions - each defines a focused layout with 3-8 elements
const swissCompositions = [
  // L-shape dominant with supporting elements - now with bleed and overlap
  {
    name: 'l-dominant',
    elements: [
      { mask: 'panelLShape', x: -0.05, y: -0.05, width: 0.75, height: 1.1 }, // Bleeds off edges
      { mask: 'panelRectTall', x: 0.68, y: -0.05, width: 0.37, height: 0.65 }, // Overlaps L-shape
      { mask: 'panelSquare', x: 0.72, y: 0.58, width: 0.33, height: 0.47 } // Bleeds off bottom
    ]
  },
  // Asymmetric grid with overlap
  {
    name: 'asymmetric',
    elements: [
      { mask: 'panelSquare', x: -0.05, y: -0.05, width: 0.65, height: 0.65 }, // Bleeds top-left
      { mask: 'panelRectTall', x: 0.55, y: -0.1, width: 0.5, height: 1.15 }, // Overlaps and bleeds
      { mask: 'panelRectWide', x: -0.05, y: 0.58, width: 0.7, height: 0.47 }, // Overlaps square
      { mask: 'panelSquare', x: 0.65, y: 0.65, width: 0.4, height: 0.4 } // Bleeds bottom-right
    ]
  },
  // Vertical columns with variation and overlap
  {
    name: 'vertical-columns',
    elements: [
      { mask: 'panelRectTall', x: -0.05, y: -0.05, width: 0.35, height: 1.1 }, // Bleeds left
      { mask: 'panelRectTall', x: 0.28, y: -0.05, width: 0.45, height: 0.75 }, // Overlaps first
      { mask: 'panelSquare', x: 0.32, y: 0.68, width: 0.4, height: 0.37 }, // Overlaps and bleeds
      { mask: 'panelRectTall', x: 0.68, y: -0.1, width: 0.37, height: 1.15 } // Bleeds right
    ]
  },
  // Modular grid with overlaps
  {
    name: 'modular-2x2',
    elements: [
      { mask: 'panelSquare', x: -0.05, y: -0.05, width: 0.55, height: 0.55 },
      { mask: 'panelRectWide', x: 0.45, y: -0.05, width: 0.6, height: 0.5 }, // Overlaps left
      { mask: 'panelRectWide', x: -0.05, y: 0.48, width: 0.6, height: 0.57 }, // Overlaps top
      { mask: 'panelSquare', x: 0.5, y: 0.45, width: 0.55, height: 0.6 }, // Overlaps and bleeds
      { mask: 'panelGutter', x: 0.25, y: 0.25, width: 0.5, height: 0.5 } // Central overlap element
    ]
  },
  // Focus composition with better coverage
  {
    name: 'focus',
    elements: [
      { mask: 'panelGutter', x: -0.05, y: -0.05, width: 0.75, height: 1.1 }, // Large focal element bleeds
      { mask: 'panelSquare', x: 0.65, y: -0.05, width: 0.4, height: 0.35 }, // Overlaps focal
      { mask: 'panelSquare', x: 0.68, y: 0.32, width: 0.37, height: 0.35 },
      { mask: 'panelRectWide', x: 0.65, y: 0.65, width: 0.4, height: 0.4 } // Bleeds bottom
    ]
  },
  // Dynamic overlapping panels
  {
    name: 'overlap',
    elements: [
      { mask: 'panelSquare', x: -0.1, y: -0.1, width: 0.65, height: 0.65 }, // Bleeds top-left
      { mask: 'panelOverlap', x: 0.25, y: 0.25, width: 0.7, height: 0.7 }, // Major overlap
      { mask: 'panelRectTall', x: 0.85, y: 0.2, width: 0.2, height: 0.85 }, // Bleeds right
      { mask: 'panelRectWide', x: 0.1, y: 0.85, width: 0.7, height: 0.2 } // Bleeds bottom
    ]
  },
  // Grid-based composition with better coverage
  {
    name: 'grid-dynamic',
    elements: [
      { mask: 'panelRectWide', x: -0.05, y: -0.05, width: 0.7, height: 0.35 },
      { mask: 'panelSquare', x: 0.62, y: -0.05, width: 0.43, height: 0.4 }, // Overlaps and bleeds
      { mask: 'panelRectTall', x: -0.05, y: 0.32, width: 0.35, height: 0.73 }, // Bleeds left
      { mask: 'panelGutter', x: 0.3, y: 0.35, width: 0.45, height: 0.7 }, // Overlaps
      { mask: 'panelSquare', x: 0.7, y: 0.38, width: 0.35, height: 0.35 },
      { mask: 'panelRectWide', x: 0.68, y: 0.7, width: 0.37, height: 0.35 } // Bleeds right-bottom
    ]
  },
  // Diagonal composition
  {
    name: 'diagonal',
    elements: [
      { mask: 'panelSquare', x: -0.1, y: -0.1, width: 0.5, height: 0.5 },
      { mask: 'panelSquare', x: 0.3, y: 0.2, width: 0.45, height: 0.45 }, // Overlaps
      { mask: 'panelSquare', x: 0.65, y: 0.55, width: 0.45, height: 0.5 }, // Bleeds
      { mask: 'panelRectWide', x: 0.2, y: 0.75, width: 0.6, height: 0.3 } // Overlaps diagonally
    ]
  }
];

/**
 * Get a composition based on canvas dimensions and mobile status
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {string} compositionType - Type of composition or 'random'
 * @returns {Object} Selected composition
 */
function getComposition(canvasWidth, canvasHeight, compositionType) {
  const isMobile = canvasWidth < 768;
  
  // For mobile, use simpler compositions (removed horizontal-bands)
  const mobileCompositions = ['vertical-columns', 'modular-2x2', 'overlap', 'focus'];
  const availableCompositions = isMobile 
    ? swissCompositions.filter(c => mobileCompositions.includes(c.name))
    : swissCompositions;
  
  if (compositionType === 'random' || !compositionType) {
    return availableCompositions[Math.floor(Math.random() * availableCompositions.length)];
  }
  
  const selected = availableCompositions.find(c => c.name === compositionType);
  return selected || availableCompositions[0];
}

/**
 * Add variation to element positions and sizes while maintaining composition structure
 * @param {Object} element - Base element definition
 * @param {number} variationAmount - Amount of variation (0-1)
 * @returns {Object} Modified element with variation
 */
function addElementVariation(element, variationAmount = 0.15) {
  // Position variation (up to ±15% of canvas dimensions)
  const xVariation = (Math.random() - 0.5) * variationAmount * 0.3;
  const yVariation = (Math.random() - 0.5) * variationAmount * 0.3;
  
  // Size variation (up to ±20% of original size)
  const widthVariation = 1 + (Math.random() - 0.5) * variationAmount * 0.4;
  const heightVariation = 1 + (Math.random() - 0.5) * variationAmount * 0.4;
  
  return {
    ...element,
    x: element.x + xVariation,
    y: element.y + yVariation,
    width: element.width * widthVariation,
    height: element.height * heightVariation
  };
}

/**
 * Randomly swap mask types within similar categories
 * @param {string} maskName - Original mask name
 * @returns {string} Possibly different mask name
 */
function varyMaskType(maskName) {
  const maskVariations = {
    'panelSquare': ['panelSquare', 'panelGutter', 'panelOverlap'],
    'panelRectTall': ['panelRectTall', 'panelLShape'],
    'panelRectWide': ['panelRectWide', 'panelGutter'],
    'panelGutter': ['panelGutter', 'panelSquare', 'panelOverlap'],
    'panelLShape': ['panelLShape', 'panelRectTall'],
    'panelOverlap': ['panelOverlap', 'panelSquare', 'panelGutter']
  };
  
  // 30% chance to vary the mask
  if (Math.random() < 0.3 && maskVariations[maskName]) {
    const variations = maskVariations[maskName];
    return variations[Math.floor(Math.random() * variations.length)];
  }
  
  return maskName;
}

/**
 * Create elements with absolute positions from relative composition
 * @param {Object} composition - Composition definition
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} gutter - Gutter size in pixels
 * @param {Object} params - Additional parameters
 * @returns {Array} Array of positioned elements
 */
function createElements(composition, canvasWidth, canvasHeight, gutter, params = {}) {
  // Apply overall variation amount based on params or default
  const variationAmount = params.variationAmount || 0.15;
  
  // Occasionally skip an element for more dynamic compositions (10% chance)
  const filteredElements = composition.elements.filter(() => Math.random() > 0.1);
  
  // Occasionally add an extra small element (20% chance)
  if (Math.random() < 0.2 && filteredElements.length < 8) {
    filteredElements.push({
      mask: Math.random() < 0.5 ? 'panelSquare' : 'panelGutter',
      x: Math.random() * 0.7,
      y: Math.random() * 0.7,
      width: 0.2 + Math.random() * 0.2,
      height: 0.2 + Math.random() * 0.2
    });
  }
  
  return filteredElements.map((element, index) => {
    // Apply variation to element
    const variedElement = addElementVariation(element, variationAmount);
    
    // Vary the mask type
    const variedMask = varyMaskType(element.mask);
    // For overlapping elements, assign transparency based on z-order
    // Later elements (higher index) get slight transparency for layering effect
    const baseOpacity = 1.0;
    const overlapOpacity = 0.9 + Math.random() * 0.1; // 0.9-1.0 range
    
      // Check if this element overlaps with previous elements
    let hasOverlap = false;
    for (let i = 0; i < index; i++) {
      const prev = filteredElements[i];
      // Simple overlap check with varied positions
      if (variedElement.x < prev.x + prev.width && 
          variedElement.x + variedElement.width > prev.x &&
          variedElement.y < prev.y + prev.height && 
          variedElement.y + variedElement.height > prev.y) {
        hasOverlap = true;
        break;
      }
    }
    
    // Apply gutter only for non-bleeding edges
    const x = variedElement.x * canvasWidth + (variedElement.x > 0 ? gutter / 2 : 0);
    const y = variedElement.y * canvasHeight + (variedElement.y > 0 ? gutter / 2 : 0);
    const width = variedElement.width * canvasWidth - (variedElement.x > 0 ? gutter / 2 : 0) - (variedElement.x + variedElement.width < 1 ? 0 : gutter / 2);
    const height = variedElement.height * canvasHeight - (variedElement.y > 0 ? gutter / 2 : 0) - (variedElement.y + variedElement.height < 1 ? 0 : gutter / 2);
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      maskName: `narrative/${variedMask}`,
      opacity: hasOverlap ? overlapOpacity : baseOpacity,
      index
    };
  });
}

/**
 * Narrative Grid Template - Creates a Swiss-style grid layout using narrative panel masks
 */
function renderNarrativeGrid(canvas, images, params = {}) {
  if (!canvas || !images || images.length === 0) {
    console.warn('[NarrativeGrid] Canvas or images not provided');
    return { canvas, bgColor: '#888888' };
  }

  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Determine background color
  const bgColor = params.bgColor || getRandomColorFromPalette(images, 'auto');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Check if images are B&W
  const isBlackAndWhite = areImagesMostlyBlackAndWhite(images);
  
  // Get composition type
  const compositionType = params.compositionType || 'random';
  const composition = getComposition(canvasWidth, canvasHeight, compositionType);
  
  // Get gutter size (default to 8px)
  const gutter = params.gutter || 8;
  
  // Create elements based on composition with variation parameters
  const elements = createElements(composition, canvasWidth, canvasHeight, gutter, {
    variationAmount: params.variationAmount || 0.15
  });
  
  // Determine color echo settings
  const useColorEcho = params.useColorEcho !== false && Math.random() < 0.4; // 40% chance
  
  // Shuffle images for better distribution
  const shuffledImages = [...images].sort(() => Math.random() - 0.5);
  
  // Draw each element
  elements.forEach((element, index) => {
    const img = shuffledImages[index % shuffledImages.length];
    
    if (!img || !img.complete) {
      console.warn(`[NarrativeGrid] Image ${index} not ready`);
      return;
    }
    
    ctx.save();
    
    try {
      // Get the mask
      const [family, name] = element.maskName.split('/');
      const maskDescriptor = getMaskDescriptor(family, name);
      
      if (!maskDescriptor || maskDescriptor.kind !== 'svg') {
        console.warn(`[NarrativeGrid] Could not get mask: ${element.maskName}`);
        ctx.restore();
        return;
      }
      
      const svgString = maskDescriptor.getSvg();
      const maskPath = svgToPath2D(svgString);
      
      if (!maskPath) {
        console.warn(`[NarrativeGrid] Could not create path for mask: ${element.maskName}`);
        ctx.restore();
        return;
      }
      
      // Translate to element position
      ctx.translate(element.x, element.y);
      
      // Scale mask to fit element dimensions
      const scaleX = element.width / 100;
      const scaleY = element.height / 100;
      ctx.scale(scaleX, scaleY);
      
      // Apply clipping mask
      ctx.clip(maskPath);
      
      // Apply color echo if enabled for this element
      const applyEchoToThisElement = useColorEcho && (isBlackAndWhite || Math.random() < 0.3);
      if (applyEchoToThisElement) {
        const echoColor = getAppropriateEchoColor(bgColor, img, getComplementaryColor);
        ctx.fillStyle = echoColor;
        ctx.fillRect(0, 0, 100, 100);
      }
      
      // Set blend mode and opacity based on image type
      if (isBlackAndWhite || img.is_black_and_white === true) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = element.opacity || 1.0; // Apply element-specific opacity
      } else if (applyEchoToThisElement) {
        // For color images with echo, use multiply with transparency
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.85 * (element.opacity || 1.0); // Combine echo transparency with element opacity
      } else {
        // Color images without echo - use normal blend mode
        ctx.globalCompositeOperation = 'normal';
        ctx.globalAlpha = element.opacity || 1.0;
      }
      
      // Draw image with proper aspect ratio handling
      const imageAspectRatio = img.width / img.height;
      const maskAspectRatio = element.width / element.height;
      
      // Calculate how to fit the image
      let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
      let destX = 0, destY = 0, destWidth = 100, destHeight = 100;
      
      if (imageAspectRatio > maskAspectRatio) {
        // Image is wider than mask - crop sides
        const targetWidth = img.height * maskAspectRatio;
        srcX = (img.width - targetWidth) / 2;
        srcWidth = targetWidth;
      } else {
        // Image is taller than mask - crop top/bottom
        const targetHeight = img.width / maskAspectRatio;
        srcY = (img.height - targetHeight) / 2;
        srcHeight = targetHeight;
      }
      
      ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight);
      
    } catch (error) {
      console.error(`[NarrativeGrid] Error drawing element ${index}:`, error);
    } finally {
      ctx.restore();
    }
  });

  // Return processed parameters
  const processedParams = {
    compositionType: composition.name,
    composition: composition,
    gutter: gutter,
    useColorEcho: useColorEcho,
    isBlackAndWhite: isBlackAndWhite,
    bgColor: bgColor,
    elementCount: elements.length,
    elements: elements.map(el => ({
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      maskName: el.maskName,
      opacity: el.opacity
    })),
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[NarrativeGrid] Processed params:', processedParams);
  
  return {
    canvas,
    bgColor,
    processedParams
  };
}

// Template configuration
const narrativeGrid = {
  key: 'narrativeGrid',
  name: 'Narrative Grid',
  render: renderNarrativeGrid,
  params: {
    compositionType: {
      type: 'select',
      options: ['random', 'l-dominant', 'asymmetric', 'vertical-columns', 
                'modular-2x2', 'focus', 'overlap', 'grid-dynamic', 'diagonal'],
      default: 'random'
    },
    gutter: {
      type: 'number',
      min: 0,
      max: 20,
      default: 8,
      step: 2
    },
    useColorEcho: {
      type: 'boolean',
      default: true
    },
    variationAmount: {
      type: 'number',
      min: 0,
      max: 0.3,
      default: 0.15,
      step: 0.05,
      description: 'Amount of variation in element positions and sizes'
    },
    bgColor: { type: 'color' }
  }
};

export default narrativeGrid;
