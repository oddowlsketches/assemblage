// packedShapesTemplate.js - A template that fills the canvas with masked shapes with color blocks.

import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageWithAspectRatio } from '../utils/imageDrawing.js';
import { vibrantColors, randomVibrantColor } from '../utils/colors';
import { getComplementaryColor } from '../utils/colorUtils';

const MAX_IMAGES_TO_USE = 15; // Max images to pick from for elements

// Define a list of masks that actually exist in the registry
const suitableMasks = [
  'basic/circleMask', 'basic/ovalMask', 'basic/diamondMask', 'basic/hexagonMask',
  'basic/semiCircleMask', 'basic/triangleMask', 'basic/rectangleMask',
  'abstract/blobIrregular', 'abstract/polygonSoft', 'abstract/cloudLike',
  'architectural/archClassical', 'architectural/archFlat', 'architectural/windowRect',
  'altar/nicheArch', 'altar/circleInset', 'altar/gableAltar',
  'narrative/panelSquare', 'narrative/panelRectWide', 'narrative/panelRectTall',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide'
];

function getRandomMask() {
  return suitableMasks[Math.floor(Math.random() * suitableMasks.length)];
}

/**
 * Calculate overlap percentage between two rectangles
 */
function calculateOverlap(rect1, rect2) {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
  
  if (x1 >= x2 || y1 >= y2) return 0; // No overlap
  
  const overlapArea = (x2 - x1) * (y2 - y1);
  const rect1Area = rect1.width * rect1.height;
  return overlapArea / rect1Area;
}

/**
 * Check if a new element would have acceptable overlap with existing elements
 */
function hasAcceptableOverlap(newElement, existingElements, maxOverlapPercent = 0.5) {
  for (const existing of existingElements) {
    const overlap = calculateOverlap(newElement, existing);
    if (overlap > maxOverlapPercent) {
      return false;
    }
  }
  return true;
}

/**
 * Creates the element configurations for the packed collage.
 */
function createPackedElements(canvasWidth, canvasHeight, elementCount) {
  const elements = [];
  const minDim = Math.min(canvasWidth, canvasHeight);

  for (let i = 0; i < elementCount; i++) {
    let sizeCategory;
    const rand = Math.random();
    if (rand < 0.15) sizeCategory = 'large';      // 15% large
    else if (rand < 0.45) sizeCategory = 'medium'; // 30% medium
    else sizeCategory = 'small';                 // 55% small

    let width, height;
    switch (sizeCategory) {
      case 'large':
        width = minDim * (0.6 + Math.random() * 0.35); // 60-95% of min dimension
        break;
      case 'medium':
        width = minDim * (0.4 + Math.random() * 0.3); // 40-70%
        break;
      case 'small':
      default:
        width = minDim * (0.25 + Math.random() * 0.25); // 25-50%
        break;
    }
    // Make shapes not always square
    height = width * (0.75 + Math.random() * 0.5); // height is 75% to 125% of width

    // Position elements to better fill canvas, with overlap checking
    let x, y, attempts = 0;
    const maxAttempts = 20;
    
    do {
      x = Math.random() * (canvasWidth + width * 0.2) - width * 0.1;
      y = Math.random() * (canvasHeight + height * 0.2) - height * 0.1;
      attempts++;
    } while (attempts < maxAttempts && !hasAcceptableOverlap({x, y, width, height}, elements, 0.5));

    // Edge alignment: 25% chance to align with existing elements (reduced from 30% to avoid forced overlaps)
    if (elements.length > 0 && Math.random() < 0.25) {
      const alignTarget = elements[Math.floor(Math.random() * elements.length)];
      const alignType = Math.random();
      let newX = x, newY = y;
      
      if (alignType < 0.5) {
        // Align left or right edge
        if (Math.random() < 0.5) {
          newX = alignTarget.x; // Align left edges
        } else {
          newX = alignTarget.x + alignTarget.width - width; // Align right edges
        }
      } else {
        // Align top or bottom edge
        if (Math.random() < 0.5) {
          newY = alignTarget.y; // Align top edges
        } else {
          newY = alignTarget.y + alignTarget.height - height; // Align bottom edges
        }
      }
      
      // Only use aligned position if it doesn't create too much overlap
      if (hasAcceptableOverlap({x: newX, y: newY, width, height}, elements, 0.5)) {
        x = newX;
        y = newY;
      }
    }

    // Decide if this element should use a mask or just be unmasked
    const useMask = Math.random() > 0.3; // 70% chance to use a mask
    
    // Most elements have no rotation, only 15% get rotated
    let rotation = 0;
    if (Math.random() < 0.15) {
      rotation = (Math.random() - 0.5) * 30; // -15 to +15 degrees for the few that rotate
    }
    
    // Layer assignment: larger elements get lower layer numbers (bottom)
    let layer;
    if (sizeCategory === 'large') {
      layer = Math.floor(Math.random() * (elementCount * 0.3)); // Bottom 30% of layers
    } else if (sizeCategory === 'medium') {
      layer = Math.floor(elementCount * 0.2) + Math.floor(Math.random() * (elementCount * 0.5)); // Middle 50%
    } else {
      layer = Math.floor(elementCount * 0.6) + Math.floor(Math.random() * (elementCount * 0.4)); // Top 40%
    }
    
    elements.push({
      maskName: useMask ? getRandomMask() : null,
      x,
      y,
      width,
      height,
      rotation,
      opacity: 0.85 + Math.random() * 0.15, // 0.85 to 1.0 opacity
      layer,
      sizeCategory, // Store for later use
    });
  }
  
  // Sort elements by layer for proper rendering order
  elements.sort((a, b) => a.layer - b.layer);
  return elements;
}

/**
 * Packed Shapes Template - Fills the canvas with masked shapes, each with a color block underneath.
 */
function renderPackedShapes(canvas, images, params = {}) {
  if (!canvas || !images || images.length === 0) {
    console.warn('[PackedShapesTemplate] Canvas or initial images not provided');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#888888'; // Default fallback BG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { canvas, bgColor: '#888888' };
  }

  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const initialBgColor = params.bgColor || randomVibrantColor();
  ctx.fillStyle = initialBgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const elementCount = params.elementCount || 25; // Back to 25 elements for better coverage
  const elements = createPackedElements(canvasWidth, canvasHeight, elementCount);

  const complementaryColor = getComplementaryColor(initialBgColor);
  // Fallback for accentColorPalette since generateAccentColors is not imported
  const accentColorPalette = (
    typeof generateAccentColors !== 'undefined' && typeof generateAccentColors === 'function' 
    ? generateAccentColors(initialBgColor, complementaryColor) 
    : [complementaryColor, vibrantColors[0], vibrantColors[1], vibrantColors[2] || getComplementaryColor(complementaryColor)]
  ).filter(Boolean); // Ensure no undefined colors if vibrantColors is short
  if (accentColorPalette.length === 0) accentColorPalette.push('#CCCCCC'); // Absolute fallback
  
  // Color mode: 50% varied colors, 25% all complementary, 25% all background color
  const colorMode = Math.random();
  let useVariedColors = true;
  let singleColor = null;
  
  if (colorMode < 0.5) {
    // Varied colors (default)
    useVariedColors = true;
  } else if (colorMode < 0.75) {
    // All complementary color
    useVariedColors = false;
    singleColor = complementaryColor;
  } else {
    // All background color
    useVariedColors = false;
    singleColor = initialBgColor;
  }
  
  elements.forEach((element, index) => {
    const imageToDraw = images[index % images.length]; // Cycle through images
    const colorBlockColor = useVariedColors 
      ? accentColorPalette[index % accentColorPalette.length]
      : singleColor;

    ctx.save();
    try {
      // Center transform for rotation
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      ctx.rotate(element.rotation * Math.PI / 180);
      // Translate back to top-left of the element for drawing
      ctx.translate(-element.width / 2, -element.height / 2);

      let maskPath = null;
      if (element.maskName) {
        // Parse the mask name to get family and name
        const [family, name] = element.maskName.split('/');
        const maskDescriptor = getMaskDescriptor(family, name);
        if (maskDescriptor && maskDescriptor.kind === 'svg') {
          const svgString = maskDescriptor.getSvg(); // No parameters needed
          maskPath = svgToPath2D(svgString);
        } else {
          console.warn(`[PackedShapesTemplate] Could not get SVG for mask: ${element.maskName}. Using rectangle.`);
          maskPath = new Path2D();
          maskPath.rect(0, 0, 100, 100);
        }
      }
      
      if (element.maskName && maskPath) {
        // Scale context to element dimensions for the 100x100 mask
        ctx.scale(element.width / 100, element.height / 100);

        // 1. Draw the color block
        ctx.fillStyle = colorBlockColor;
        ctx.fill(maskPath);

        // 2. Draw the image with multiply blend mode, clipped by the same mask
        if (imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.clip(maskPath); // Apply clipping AFTER color block fill
          
          // Draw image in the 0-100 space (scaled context)
          drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, 100, 100, {
            aspectRatio: imageToDraw.naturalWidth / imageToDraw.naturalHeight,
            clipPath: null, // Mask is already applied to context
            cover: true, // Ensure image covers the area
            opacity: element.opacity || 1.0
          });
        }
      } else {
        // Unmasked element - draw color block, then image with multiply
        // 1. Draw the color block
        ctx.fillStyle = colorBlockColor;
        ctx.fillRect(0, 0, element.width, element.height);

        // 2. Draw the image with multiply blend mode
        if (imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
          ctx.globalCompositeOperation = 'multiply';
          drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, element.width, element.height, {
            aspectRatio: imageToDraw.naturalWidth / imageToDraw.naturalHeight,
            clipPath: null,
            cover: true,
            opacity: element.opacity || 1.0
          });
        }
      }
    } catch (error) {
      console.error(`[PackedShapesTemplate] Error drawing element ${index}:`, error, element);
    } finally {
      ctx.restore();
    }
  });

  return { canvas, bgColor: initialBgColor };
}

// Template configuration
const packedShapesTemplate = {
  key: 'packedShapes',
  name: 'Packed Shapes',
  render: renderPackedShapes,
  generate: renderPackedShapes, // Alias for compatibility
  params: {
    elementCount: { type: 'number', min: 20, max: 40, default: 25, step: 1 },
    bgColor: { type: 'color' },
    // Potentially add other params like imageRatio if we want some to be pure color blocks later
  }
};

export default packedShapesTemplate; 