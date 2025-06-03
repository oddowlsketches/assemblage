// packedShapesTemplate.js - A template that fills the canvas with masked shapes with color blocks.

import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageWithAspectRatio } from '../utils/imageDrawing.js';
import { vibrantColors, getRandomColorFromPalette, getColorPalette } from '../utils/colors';
import { getComplementaryColor } from '../utils/colorUtils';

// Helper function to lighten colors for better visibility
function lightenColor(color, amount) {
  if (!color || !color.startsWith('#')) return color;
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Lighten by blending with white
  const lightenedR = Math.round(r + (255 - r) * amount);
  const lightenedG = Math.round(g + (255 - g) * amount);
  const lightenedB = Math.round(b + (255 - b) * amount);
  
  return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
}

const MAX_IMAGES_TO_USE = 15; // Max images to pick from for elements

// Define a list of masks that actually exist in the registry
const suitableMasks = [
  'basic/circleMask', 'basic/ovalMask', 'basic/diamondMask', 'basic/hexagonMask',
  'basic/semiCircleMask', 'basic/triangleMask', 'basic/rectangleMask',
  'abstract/blobIrregular', 'abstract/polygonSoft', 
  'abstract/polygonSoftWide', 'abstract/polygonSoftTall', 
  'abstract/polygonSoftAsymmetric', 'abstract/polygonSoftCompact',
  'architectural/archClassical', 'architectural/archFlat', 'architectural/windowRect',
  'altar/nicheArch', 'altar/circleInset', 'altar/gableAltar',
  'narrative/panelSquare', 'narrative/panelRectWide', 'narrative/panelRectTall',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide'
];

function getRandomMask() {
  // Create a weighted array - most masks appear once, donutMask appears less frequently
  const weightedMasks = [...suitableMasks];
  
  // Add donut mask with only 5% probability
  if (Math.random() < 0.05) {
    weightedMasks.push('basic/donutMask');
  }
  
  return weightedMasks[Math.floor(Math.random() * weightedMasks.length)];
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
 * Apply Swiss grid principles to element positioning
 */
function applySwissGrid(elements, canvasWidth, canvasHeight) {
  const gridUnit = Math.min(canvasWidth, canvasHeight) / 12; // 12-column grid
  const margin = gridUnit * 0.5; // Half grid unit margin
  
  // Create a copy of elements to avoid mutation issues
  const gridElements = [...elements];
  
  // Sort elements by size (largest first) for better composition
  gridElements.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  gridElements.forEach((element, index) => {
    // Apply grid snapping with some controlled randomness
    if (Math.random() < 0.7) { // 70% chance to snap to grid
      // Snap position to grid
      element.x = Math.round(element.x / gridUnit) * gridUnit;
      element.y = Math.round(element.y / gridUnit) * gridUnit;
      
      // Optionally snap size to grid units (30% chance)
      if (Math.random() < 0.3) {
        element.width = Math.round(element.width / gridUnit) * gridUnit;
        element.height = Math.round(element.height / gridUnit) * gridUnit;
      }
      
      // Ensure minimum margin from edges
      element.x = Math.max(margin, Math.min(canvasWidth - element.width - margin, element.x));
      element.y = Math.max(margin, Math.min(canvasHeight - element.height - margin, element.y));
    }
    
    // Apply diagonal alignment for dynamic compositions (20% chance)
    if (Math.random() < 0.2 && index > 0) {
      const prevElement = gridElements[index - 1];
      if (Math.random() < 0.5) {
        // Align on 45-degree diagonal
        element.x = prevElement.x + prevElement.width + gridUnit;
        element.y = prevElement.y + prevElement.height + gridUnit;
      } else {
        // Align on negative diagonal
        element.x = prevElement.x + prevElement.width + gridUnit;
        element.y = prevElement.y - element.height - gridUnit;
      }
      
      // Keep within bounds
      element.x = Math.max(0, Math.min(canvasWidth - element.width, element.x));
      element.y = Math.max(0, Math.min(canvasHeight - element.height, element.y));
    }
  });
  
  return gridElements;
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
function createPackedElements(canvasWidth, canvasHeight, elementCount, numSolidColorElements = 0) {
  const elements = [];
  const minDim = Math.min(canvasWidth, canvasHeight);

  for (let i = 0; i < elementCount; i++) {
    let sizeCategory;
    const rand = Math.random();
    if (rand < 0.15) sizeCategory = 'large';      // 15% large
    else if (rand < 0.45) sizeCategory = 'medium'; // 30% medium
    else sizeCategory = 'small';                 // 55% small
    
    // Determine if this should be a solid color element
    const isSolidColor = i < numSolidColorElements;

    // Decide if this element should use a mask or just be unmasked first
    const useMask = Math.random() > 0.3; // 70% chance to use a mask
    const maskName = useMask ? getRandomMask() : null;
    
    let width, height;
    if (useMask && maskName) {
      // FIXED: If using a mask, determine size based on the mask's ideal proportions
      const [family, type] = maskName.split('/');
      
      // Get the ideal aspect ratio for this mask type (width/height)
      let idealAspectRatio = 1.0; // Default to square
      
      if (family === 'architectural') {
        if (type.includes('arch')) {
          idealAspectRatio = 0.8; // 4:5 ratio for arches (width = height * 0.8)
        } else if (type.includes('window')) {
          idealAspectRatio = 0.8; // 4:5 ratio for windows
        } else if (type.includes('column')) {
          idealAspectRatio = 0.3; // Very tall for columns
        }
      } else if (family === 'altar') {
        if (type.includes('arch') || type.includes('niche')) {
          idealAspectRatio = 0.8; // 4:5 ratio for altar arches
        }
      } else if (family === 'basic') {
        if (type === 'rectangleMask') {
          idealAspectRatio = 0.7 + Math.random() * 0.6; // Vary rectangles from 0.7 to 1.3
        } else if (type === 'ovalMask') {
          idealAspectRatio = 0.8; // Slightly taller ovals
        }
        // circles, diamonds, etc. stay at 1.0
      } else if (family === 'narrative') {
        if (type.includes('Wide')) {
          idealAspectRatio = 1.6; // Wide panels
        } else if (type.includes('Tall')) {
          idealAspectRatio = 0.6; // Tall panels
        }
      } else if (family === 'sliced') {
        if (type.includes('Horizontal')) {
          idealAspectRatio = 3.0; // Very wide slices
        } else if (type.includes('Vertical')) {
          idealAspectRatio = 0.33; // Very tall slices
        }
      }
      
      // Calculate size based on category and ideal aspect ratio
      let baseSize;
      switch (sizeCategory) {
        case 'large':
          baseSize = minDim * (0.6 + Math.random() * 0.35); // 60-95% of min dimension
          break;
        case 'medium':
          baseSize = minDim * (0.4 + Math.random() * 0.3); // 40-70%
          break;
        case 'small':
        default:
          baseSize = minDim * (0.25 + Math.random() * 0.25); // 25-50%
          break;
      }
      
      // FIXED: Always calculate based on height as the primary dimension, then scale width
      // This ensures arches maintain their tall, narrow proportions
      height = baseSize;
      width = height * idealAspectRatio;
      
      console.log(`[PackedShapes] Sized ${maskName}: height=${height.toFixed(1)}, width=${width.toFixed(1)}, ratio=${(width/height).toFixed(2)} (target: ${idealAspectRatio.toFixed(2)})`);
    } else {
      // For unmasked elements, use random aspect ratios
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
      // For unmasked elements, allow random aspect ratios
      height = width * (0.75 + Math.random() * 0.5); // height is 75% to 125% of width
    }

    // Position elements to better fill canvas, with overlap checking
    let x, y, attempts = 0;
    const maxAttempts = 20;
    
    do {
      x = Math.random() * (canvasWidth + width * 0.2) - width * 0.1;
      y = Math.random() * (canvasHeight + height * 0.2) - height * 0.1;
      attempts++;
    } while (attempts < maxAttempts && !hasAcceptableOverlap({x, y, width, height}, elements, 0.3)); // Reduced from 0.5 to 0.3

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
    
    // Calculate overlap for transparency variation
    let hasSignificantOverlap = false;
    for (const existing of elements) {
      const overlap = calculateOverlap({x, y, width, height}, existing);
      if (overlap > 0.1) { // More than 10% overlap
        hasSignificantOverlap = true;
        break;
      }
    }
    
    // Apply transparency variation (0.8-1.0) with more transparency for overlapping elements
    // For solid color elements, allow even lower opacity
    let baseOpacity;
    
    if (isSolidColor) {
      // Solid color elements can have lower opacity for ethereal effect
      baseOpacity = hasSignificantOverlap ? 0.5 : 0.6;
    } else {
      baseOpacity = hasSignificantOverlap ? 0.8 : 0.9;
    }
    
    const opacity = baseOpacity + Math.random() * (1.0 - baseOpacity);
    
    elements.push({
      maskName: maskName,
      x,
      y,
      width,
      height,
      rotation,
      opacity,
      layer,
      sizeCategory, // Store for later use
      isSolidColor, // Store solid color flag
    });
  }
  
  // Sort elements by layer for proper rendering order
  elements.sort((a, b) => a.layer - b.layer);
  
  // Apply Swiss grid principles with some probability
  if (Math.random() < 0.6) { // 60% chance to apply Swiss grid
    return applySwissGrid(elements, canvasWidth, canvasHeight);
  }
  
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

  // Determine the color palette based on image analysis
  const palette = getColorPalette(images, params.paletteType || 'auto');
  const initialBgColor = params.bgColor || palette[Math.floor(Math.random() * palette.length)];
  
  ctx.fillStyle = initialBgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  console.log(`[PackedShapes] Using palette: ${params.paletteType || 'auto'}, BG: ${initialBgColor}`);

  const elementCount = params.elementCount || (12 + Math.floor(Math.random() * 11)); // Random 12-22 elements (reduced from 15-30)
  
  // Determine which elements should use solid color fill (up to 30%)
  const maxSolidColorElements = Math.floor(elementCount * 0.3);
  const numSolidColorElements = Math.floor(Math.random() * (maxSolidColorElements + 1));
  
  const elements = createPackedElements(canvasWidth, canvasHeight, elementCount, numSolidColorElements);

  // Store the element configuration for reproducibility
  const elementConfigs = elements.map(el => ({
    maskName: el.maskName,
    x: Math.round(el.x * 100) / 100, // Round to 2 decimal places to reduce size
    y: Math.round(el.y * 100) / 100,
    width: Math.round(el.width * 100) / 100,
    height: Math.round(el.height * 100) / 100,
    rotation: Math.round(el.rotation * 100) / 100,
    opacity: Math.round(el.opacity * 100) / 100,
    layer: el.layer,
    sizeCategory: el.sizeCategory
  }));

  // Check if images are color (not B&W)
  const hasColorImages = images.some(img => img && img.is_black_and_white === false);
  
  const complementaryColor = getComplementaryColor(initialBgColor);
  
  // Helper function to create subtle variations of a color
  function createSubtleVariation(baseColor, variation = 0.15) {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return baseColor;
    
    // Create a slightly lighter or darker version
    const factor = Math.random() < 0.5 ? (1 + variation) : (1 - variation);
    
    const r = Math.round(Math.min(255, Math.max(0, rgb.r * factor)));
    const g = Math.round(Math.min(255, Math.max(0, rgb.g * factor)));
    const b = Math.round(Math.min(255, Math.max(0, rgb.b * factor)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Helper function to create a subtle complementary color
  function createSubtleComplementary(baseColor) {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return baseColor;
    
    // Get complementary
    const compR = 255 - rgb.r;
    const compG = 255 - rgb.g;
    const compB = 255 - rgb.b;
    
    // Mix with base color to make it subtle (70% base, 30% complementary)
    const mixedR = Math.round(rgb.r * 0.7 + compR * 0.3);
    const mixedG = Math.round(rgb.g * 0.7 + compG * 0.3);
    const mixedB = Math.round(rgb.b * 0.7 + compB * 0.3);
    
    return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
  }
  
  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  // FIXED: Create appropriate color palette based on image type
  let accentColorPalette;
  if (hasColorImages) {
    // For color images: use subtle variations of background color
    // Never use pure white - create tinted variations instead
    accentColorPalette = [
      initialBgColor,
      createSubtleVariation(initialBgColor, 0.15),
      createSubtleVariation(initialBgColor, 0.20),
      lightenColor(initialBgColor, 0.15), // Slightly lighter tint
      createSubtleComplementary(initialBgColor), // Subtle complementary
      lightenColor(createSubtleComplementary(initialBgColor), 0.1), // Light subtle complementary
    ].filter(color => color !== '#FFFFFF' && color !== '#ffffff'); // Extra safety to remove any white
  } else {
    // For B&W images: can use complementary and other colors
    const lightenedComplementaryColor = lightenColor(complementaryColor, 0.3);
    accentColorPalette = [
      lightenedComplementaryColor,
      ...palette.slice(0, 3) // Take first 3 colors from the selected palette
    ].filter(Boolean);
  }
  
  if (accentColorPalette.length === 0) accentColorPalette.push('#CCCCCC'); // Absolute fallback
  
  // Color mode logic adjusted for image type
  const colorMode = Math.random();
  let useVariedColors = true;
  let singleColor = null;
  
  if (hasColorImages) {
    // For color images: use subtle variations instead of pure white
    if (colorMode < 0.5) {
      // Varied subtle colors
      useVariedColors = true;
    } else if (colorMode < 0.75) {
      // All light tinted version of background
      useVariedColors = false;
      singleColor = lightenColor(initialBgColor, 0.2); // 20% lighter tint
    } else {
      // All subtle variation of background color
      useVariedColors = false;
      singleColor = createSubtleVariation(initialBgColor, 0.15);
    }
  } else {
    // For B&W images: original logic with complementary colors allowed
    if (colorMode < 0.5) {
      // Varied colors (default)
      useVariedColors = true;
    } else if (colorMode < 0.75) {
      // All complementary color - but use lightened version
      useVariedColors = false;
      singleColor = lightenColor(complementaryColor, 0.3);
    } else {
      // All background color - but lighten it slightly for visibility
      useVariedColors = false;
      singleColor = lightenColor(initialBgColor, 0.15);
    }
  }
  
  // Store color mode info for reproducibility
  const colorModeType = colorMode < 0.5 ? 'varied' : (colorMode < 0.75 ? 'complementary' : 'background');
  const finalSingleColor = singleColor;
  
  // Create a shuffled array of images for better distribution
  const availableImages = images.filter(img => img.complete && img.naturalWidth > 0);
  const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5);
  
  console.log(`[PackedShapes] Using solid color fill for ${numSolidColorElements} of ${elementCount} elements`);
  
  elements.forEach((element, index) => {
    // Check if this element should use solid color only
    const useSolidColorOnly = element.isSolidColor;
    
    // Use different image for each element, cycling through shuffled array
    let imageToDraw;
    
    if (!useSolidColorOnly && shuffledImages.length > 0) {
      // Use modulo to cycle through images, ensuring each gets used before repeating
      const imageIndex = index % shuffledImages.length;
      imageToDraw = shuffledImages[imageIndex];
    }
    
    const colorBlockColor = useVariedColors 
      ? accentColorPalette[index % accentColorPalette.length]
      : singleColor;

    ctx.save();
    try {
      // Apply overall element opacity for layering effect (higher layers are slightly transparent)
      // This creates depth by making overlapping elements semi-transparent
      ctx.globalAlpha = element.opacity;
      
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
        // CRITICAL FIX: Use UNIFORM scaling to prevent image distortion
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

        // 1. Draw the color block
        ctx.fillStyle = colorBlockColor;
        ctx.fill(maskPath);

        // 2. Draw the image with multiply blend mode, clipped by the same mask
        if (!useSolidColorOnly && imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
          ctx.globalCompositeOperation = 'multiply';
          
          // For color images, use slight transparency to prevent muddiness
          if (hasColorImages) {
            ctx.globalAlpha = element.opacity * 0.85;
          }
          // Note: for B&W images, opacity is already set to element.opacity at the save point
          
          ctx.clip(maskPath); // Apply clipping AFTER color block fill
          
          // Draw image in the 0-100 space (uniformly scaled context)
          const imageAspectRatio = imageToDraw.naturalWidth / imageToDraw.naturalHeight;
          drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, 100, 100, {
            aspectRatio: imageAspectRatio,
            clipPath: null, // Mask is already applied to context
            cover: true, // Ensure image covers the area
            opacity: 1.0 // Don't double-apply opacity
          });
        }
      } else {
        // Unmasked element - draw color block, then image with multiply
        // 1. Draw the color block
        ctx.fillStyle = colorBlockColor;
        ctx.fillRect(0, 0, element.width, element.height);

        // 2. Draw the image with multiply blend mode
        if (!useSolidColorOnly && imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
          ctx.globalCompositeOperation = 'multiply';
          
          // For color images, apply additional transparency to prevent muddiness
          // Note: element.opacity is already applied at the beginning of ctx.save()
          if (hasColorImages) {
            ctx.globalAlpha = element.opacity * 0.85;
          }
          // For B&W images, keep the already-applied element.opacity
          
          const imageAspectRatio = imageToDraw.naturalWidth / imageToDraw.naturalHeight;
          drawImageWithAspectRatio(ctx, imageToDraw, 0, 0, element.width, element.height, {
            aspectRatio: imageAspectRatio,
            clipPath: null,
            cover: true,
            opacity: 1.0 // Don't double-apply opacity
          });
        }
      }
    } catch (error) {
      console.error(`[PackedShapesTemplate] Error drawing element ${index}:`, error, element);
    } finally {
      ctx.restore();
    }
  });

  // Return processed parameters that were actually used
  const processedParams = {
    userPrompt: params.userPrompt || '',
    paletteType: params.paletteType || 'auto',
    elementCount: elementCount,
    bgColor: initialBgColor,
    colorModeType: colorModeType,
    singleColor: finalSingleColor,
    complementaryColor: hasColorImages ? null : lightenColor(complementaryColor, 0.3),
    palette: palette,
    elements: elementConfigs, // Full element layout data
    solidColorIndices: elements.map((el, idx) => el.isSolidColor ? idx : -1).filter(idx => idx >= 0), // Which elements use solid color
    imageDistribution: shuffledImages.map((img, idx) => ({
      index: idx,
      src: img.src || `image_${idx}`
    })).slice(0, elementCount) // Only include as many as we used
  };
  
  console.log('[PackedShapesTemplate] Returning processed params:', processedParams);

  return { 
    canvas, 
    bgColor: initialBgColor,
    processedParams 
  };
}

// Template configuration
const packedShapesTemplate = {
  key: 'packedShapes',
  name: 'Packed Shapes',
  render: renderPackedShapes,
  generate: renderPackedShapes, // Alias for compatibility
  params: {
    elementCount: { type: 'number', min: 5, max: 25, default: 15, step: 1 }, // Reduced max from 35 to 25
    bgColor: { type: 'color' },
    paletteType: { 
      type: 'select', 
      options: ['auto', 'vibrant', 'subtle', 'pastel', 'earthTone'], 
      default: 'auto',
      description: 'Color palette - auto detects B&W vs color images'
    }
  }
};

export default packedShapesTemplate; 