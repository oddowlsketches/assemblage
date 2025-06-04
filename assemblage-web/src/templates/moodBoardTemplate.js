// moodBoardTemplate.js - Dense fashion moodboard-style collage template

import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageWithAspectRatio } from '../utils/imageDrawing.js';
import { vibrantColors, getRandomColorFromPalette, getColorPalette, areImagesMostlyBlackAndWhite } from '../utils/colors';
import { getComplementaryColor, getColorfulComplementaryColor } from '../utils/colorUtils';
import { getAppropriateEchoColor, analyzeElementsForAutoEcho } from '../utils/imageOverlapUtils';
import { generatePalette } from '../utils/advancedColorUtils.js';
import { getShapeCount } from './templateDefaults.js';

// Helper to create subtle color variations
function createColorVariation(baseColor, variation = 0.1) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return baseColor;
  
  const factor = 0.9 + Math.random() * 0.2; // Subtle variation
  
  const r = Math.round(Math.min(255, Math.max(0, rgb.r * factor)));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g * factor)));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b * factor)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Masks suitable for moodboard elements
const moodboardMasks = [
  'basic/rectangleMask', 'basic/rectangleMask', 'basic/rectangleMask', // More rectangles for moodboard feel
  'basic/rectangleMask', 'basic/rectangleMask',
  'narrative/panelRectWide', 'narrative/panelRectTall', 'narrative/panelSquare',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide',
  'basic/circleMask', 'basic/ovalMask', 
  'abstract/polygonSoftWide', 'abstract/polygonSoftTall',
  'architectural/windowRect'
];

function getRandomMoodboardMask() {
  return moodboardMasks[Math.floor(Math.random() * moodboardMasks.length)];
}

/**
 * Create dense moodboard-style element layout
 * Focus on near-full coverage with slight overlaps and angles
 */
function createMoodboardElements(canvasWidth, canvasHeight, elementCount) {
  const elements = [];
  const gridCols = Math.ceil(Math.sqrt(elementCount * 1.1)); // Reduced from 1.3 to pack tighter
  const gridRows = Math.ceil(elementCount / gridCols);
  
  // Base cell size - intentionally larger for overlap and edge bleed
  const cellWidth = canvasWidth / (gridCols - 0.8); // Changed from -0.5 to -0.8 for more overlap
  const cellHeight = canvasHeight / (gridRows - 0.8);
  
  // Create a shuffled grid position array
  const positions = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      positions.push({ row: r, col: c });
    }
  }
  // Shuffle positions for more organic placement
  positions.sort(() => Math.random() - 0.5);
  
  // Place elements
  for (let i = 0; i < elementCount && i < positions.length; i++) {
    const { row, col } = positions[i];
    
    // Size variation - fashion moodboards often have mixed sizes
    // Adjusted for fewer elements: slightly larger sizes on average for good coverage
    let sizeMultiplier;
    const sizeRoll = Math.random();
    if (sizeRoll < 0.25) {
      sizeMultiplier = 2.2 + Math.random() * 0.8; // 25% extra large (2.2-3.0x) - increased for fewer elements
    } else if (sizeRoll < 0.50) {
      sizeMultiplier = 1.6 + Math.random() * 0.6; // 25% large (1.6-2.2x) - increased for better coverage
    } else if (sizeRoll < 0.80) {
      sizeMultiplier = 1.2 + Math.random() * 0.4; // 30% medium (1.2-1.6x) - increased baseline
    } else {
      sizeMultiplier = 0.8 + Math.random() * 0.4; // 20% smaller (0.8-1.2x) - slightly larger minimum
    }
    
    const width = cellWidth * sizeMultiplier;
    const height = cellHeight * sizeMultiplier;
    
    // Base position with intentional overlap and edge bleed
    let x = col * cellWidth * 0.75 - (width - cellWidth) / 2; // Reduced from 0.85 to 0.75 for tighter packing
    let y = row * cellHeight * 0.75 - (height - cellHeight) / 2;
    
    // Add slight random offset for organic feel
    x += (Math.random() - 0.5) * cellWidth * 0.2; // Increased from 0.15 to 0.2
    y += (Math.random() - 0.5) * cellHeight * 0.2;
    
    // Allow elements to bleed off edges more
    // Push some elements further toward/past edges
    if (col === 0) x -= cellWidth * 0.1; // Left edge bleed
    if (col === gridCols - 1) x += cellWidth * 0.1; // Right edge bleed
    if (row === 0) y -= cellHeight * 0.1; // Top edge bleed
    if (row === gridRows - 1) y += cellHeight * 0.1; // Bottom edge bleed
    
    // Slight rotation for dynamic feel (±4° as specified)
    const rotation = (Math.random() - 0.5) * 8; // -4 to +4 degrees
    
    // Layer assignment - mix layers for depth
    const layer = Math.floor(Math.random() * elementCount);
    
    // Opacity - mostly opaque for moodboard feel
    const opacity = 0.85 + Math.random() * 0.15; // 0.85-1.0
    
    // Mask selection - favor rectangles for moodboard aesthetic
    const maskName = Math.random() < 0.7 ? 'basic/rectangleMask' : getRandomMoodboardMask();
    
    elements.push({
      maskName,
      x,
      y,
      width,
      height,
      rotation,
      opacity,
      layer,
      gridPosition: { row, col }
    });
  }
  
  // Sort by layer for proper rendering
  elements.sort((a, b) => a.layer - b.layer);
  
  return elements;
}

/**
 * Render the moodboard template with cut-paper echo layers
 * Each photo tile gets a backing color (echo layer) behind it, similar to packedShapes:
 * - 95% of tiles get echo layers
 * - 5% skip echo for variety  
 * - Color images: echo uses bgColor or white
 * - B&W images: echo can use complementary color or bgColor
 * - Uses uniform scaling to preserve image aspect ratios and prevent distortion
 */
function renderMoodBoard(canvas, images, params = {}) {
  if (!canvas || !images || images.length === 0) {
    console.warn('[MoodBoardTemplate] Canvas or images not provided');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { canvas, bgColor: '#F5F5F5' };
  }

  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Check if images are color or B&W first
  const hasColorImages = images.some(img => img && img.is_black_and_white === false);
  const isBW = areImagesMostlyBlackAndWhite(images);
  
  // Use new generatePalette function for enhanced color analysis
  const palette = generatePalette(images, isBW);
  const bgColor = params.bgColor || palette[Math.floor(Math.random() * palette.length)];
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  console.log(`[MoodBoard] Using enhanced palette generation, B&W: ${isBW}, BG: ${bgColor}`);

  // Element count - get from templateDefaults
  const elementCount = getShapeCount('moodBoardTemplate', params.requestedShapes);
  
  // Create element layout
  const elements = createMoodboardElements(canvasWidth, canvasHeight, elementCount);

  // Analyze for auto echo based on overlaps
  const elementsWithAutoEcho = analyzeElementsForAutoEcho(elements, 0.15); // 15% overlap threshold

  // Filter valid images
  const availableImages = images.filter(img => img.complete && img.naturalWidth > 0);
  if (availableImages.length === 0) {
    console.warn('[MoodBoardTemplate] No valid images available');
    return { canvas, bgColor };
  }

  // Shuffle images for variety
  const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5);
  
  // Get appropriate echo color
  const echoColor = getAppropriateEchoColor(bgColor, shuffledImages[0], getComplementaryColor);
  
  // Determine echo strategy - reduced echo blocks for less empty space
  const useEchoBlocks = params.useColorBlockEcho !== false ? (params.useColorBlockEcho || Math.random() < 0.2) : false; // Reduced from 0.3
  const echoSubsetRatio = 0.1; // Reduced from 0.2 (20%) to 0.1 (10%) for less empty space
  
  console.log(`[MoodBoard] Echo strategy: ${useEchoBlocks ? 'enabled' : 'disabled'}, color: ${echoColor}`);

  // Store element configurations for reproducibility
  const elementConfigs = [];

  // Render elements
  // Helper function to choose echo color based on image type
  function chooseEchoColor(imageIsBW) {
  if (hasColorImages && !imageIsBW) {
  // For color images: use bgColor or white
  return bgColor;
  } else {
  // For B&W images: can use colorful complementary color or bgColor
  return Math.random() < 0.6 ? getColorfulComplementaryColor(bgColor) : bgColor;
  }
  }

  // Helper function to choose color block for B&W images (original behavior)
  function chooseColorBlock(imageIsBW) {
  if (imageIsBW) {
  // For B&W images: use background color OR colorful complementary color for multiply effect
  return Math.random() < 0.5 ? bgColor : getColorfulComplementaryColor(bgColor);
  } else {
  // For color images: use bgColor only
  return bgColor;
  }
  }

  elementsWithAutoEcho.forEach((element, index) => {
  // Select image - cycle through shuffled array
  const imageIndex = index % shuffledImages.length;
  const imageToDraw = shuffledImages[imageIndex];
  
  // Check if this image is B&W
  const imageIsBW = imageToDraw && imageToDraw.is_black_and_white === true;
  
  // Determine if this element should be an echo block (no image, just color)
  const isEchoBlock = useEchoBlocks && Math.random() < echoSubsetRatio;
  
  // 95% of tiles get echo layer, 5% skip for variety
    const skipEcho = Math.random() < 0.05;
  
  // Store configuration
  const elementConfig = {
  maskName: element.maskName,
  x: Math.round(element.x * 100) / 100,
  y: Math.round(element.y * 100) / 100,
  width: Math.round(element.width * 100) / 100,
  height: Math.round(element.height * 100) / 100,
  rotation: Math.round(element.rotation * 100) / 100,
      opacity: Math.round(element.opacity * 100) / 100,
  layer: element.layer,
  imageIndex: isEchoBlock ? -1 : imageIndex,
  isEchoBlock: isEchoBlock,
  skipEcho: skipEcho,
  imageIsBW: imageIsBW
  };
  elementConfigs.push(elementConfig);

  ctx.save();
  try {
  // Apply element opacity
  ctx.globalAlpha = element.opacity;
  
  // Apply rotation
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate(element.rotation * Math.PI / 180);
      ctx.translate(-element.width / 2, -element.height / 2);

  // Get mask if specified
  let maskPath = null;
  if (element.maskName) {
  const [family, name] = element.maskName.split('/');
  const maskDescriptor = getMaskDescriptor(family, name);
  if (maskDescriptor && maskDescriptor.kind === 'svg') {
  const svgString = maskDescriptor.getSvg();
  maskPath = svgToPath2D(svgString);
  }
      }
  
  if (element.maskName && maskPath) {
  // Use UNIFORM scaling to prevent mask distortion, similar to packedShapes
  const scaleX = element.width / 100;
  const scaleY = element.height / 100;
  const uniformScale = Math.min(scaleX, scaleY); // Use smaller scale to prevent stretching
        
        // Calculate the actual rendered size with uniform scaling
        const renderedWidth = 100 * uniformScale;
        const renderedHeight = 100 * uniformScale;
        
        // Center the uniformly scaled mask within the element area
        const offsetX = (element.width - renderedWidth) / 2;
        const offsetY = (element.height - renderedHeight) / 2;
        
        // Apply the centering offset
        ctx.translate(offsetX, offsetY);
        
        // Apply uniform scaling - this prevents any distortion
        ctx.scale(uniformScale, uniformScale);

  if (isEchoBlock) {
  // Draw just the echo color block
  ctx.fillStyle = chooseEchoColor(true); // Default to safe color for echo blocks
  ctx.fill(maskPath);
  } else {
  // 1. Draw color block first (for B&W images, this provides the multiply base)
  if (!skipEcho) {
  const colorBlockColor = imageIsBW ? chooseColorBlock(imageIsBW) : chooseEchoColor(imageIsBW);
  ctx.fillStyle = colorBlockColor;
    ctx.fill(maskPath);
          }

  // 2. Draw image with appropriate blend mode
  if (imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
  // Use normal blend mode for color images without echo
  const isColorImage = imageToDraw && imageToDraw.is_black_and_white === false;
  ctx.globalCompositeOperation = (isColorImage && skipEcho) ? 'normal' : 'multiply';
  ctx.clip(maskPath);
  
  const imageAspectRatio = imageToDraw.naturalWidth / imageToDraw.naturalHeight;
  drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, 100, 100, {
  aspectRatio: imageAspectRatio,
  clipPath: null,
  cover: true,
    opacity: 1.0
    });
    }
        }
  } else {
  // No mask - rectangular element
  if (isEchoBlock) {
  ctx.fillStyle = chooseEchoColor(true); // Default to safe color for echo blocks
  ctx.fillRect(0, 0, element.width, element.height);
  } else {
    // 1. Draw echo layer first (95% of tiles)
      if (!skipEcho) {
          ctx.fillStyle = chooseEchoColor(imageIsBW);
        ctx.fillRect(0, 0, element.width, element.height);
        }

        // 2. Draw image with appropriate blend mode
          if (imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
            // Use normal blend mode for color images without echo
            const isColorImage = imageToDraw && imageToDraw.is_black_and_white === false;
            ctx.globalCompositeOperation = (isColorImage && skipEcho) ? 'normal' : 'multiply';
            
            const imageAspectRatio = imageToDraw.naturalWidth / imageToDraw.naturalHeight;
            drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, element.width, element.height, {
              aspectRatio: imageAspectRatio,
              clipPath: null,
              cover: true,
              opacity: 1.0
            });
          }
        }
      }
    } catch (error) {
      console.error(`[MoodBoardTemplate] Error drawing element ${index}:`, error);
    } finally {
      ctx.restore();
    }
  });

  // Return processed parameters
  const processedParams = {
    userPrompt: params.userPrompt || '',
    paletteType: params.paletteType || 'auto',
    elementCount: elementCount,
    bgColor: bgColor,
    echoColor: echoColor,
    useColorBlockEcho: useEchoBlocks,
    echoSubsetRatio: echoSubsetRatio,
    palette: palette,
    hasColorImages: hasColorImages,
    complementaryColor: getComplementaryColor(bgColor), // Safe version for UI
    colorfulComplementaryColor: getColorfulComplementaryColor(bgColor), // Colorful version for templates
    isBW: isBW,
    echoSkipPercentage: 0.05, // 5% of tiles skip echo layer
    elements: elementConfigs,
    imageDistribution: shuffledImages.map((img, idx) => ({
      index: idx,
      src: img.src || `image_${idx}`
    })).slice(0, elementCount)
  };
  
  console.log('[MoodBoardTemplate] Returning processed params:', processedParams);

  return { 
    canvas, 
    bgColor,
    processedParams 
  };
}

// Template configuration
const moodBoardTemplate = {
  key: 'moodBoard',
  name: 'Mood Board',
  render: renderMoodBoard,
  generate: renderMoodBoard, // Alias for compatibility
  params: {
    elementCount: { 
      type: 'number', 
      min: 10, 
      max: 25, 
      default: 20, 
      step: 1,
      description: 'Number of elements in the moodboard'
    },
    bgColor: { 
      type: 'color',
      description: 'Background color'
    },
    paletteType: { 
      type: 'select', 
      options: ['auto', 'vibrant', 'subtle', 'pastel', 'earthTone'], 
      default: 'auto',
      description: 'Color palette style'
    },
    useColorBlockEcho: {
      type: 'boolean',
      default: true,
      description: 'Use color blocks to fill gaps'
    }
  }
};

export default moodBoardTemplate;
