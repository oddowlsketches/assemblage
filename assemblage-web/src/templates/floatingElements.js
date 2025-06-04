import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils.js';
import { getComplementaryColor, getSafeFillColour } from '../utils/colorUtils.js';
import { randomVibrantColor, getRandomColorFromPalette } from '../utils/colors.js';
import { getAppropriateEchoColor } from '../utils/imageOverlapUtils.js';
import { getShapeCount } from './templateDefaults.js';
import { fillNegativeSpace } from '../lib/layout/fillNegativeSpace';

/**
 * Floating Elements Template
 * Creates compositions with elements suspended in space, inspired by desert horizons
 * and minimalist arrangements with strong negative space
 */

// Design constants
const GOLDEN_RATIO = 1.618;

// Define a list of suitable masks from the maskRegistry
const suitableMasks = [
  'basic/circleMask', 'basic/ovalMask', 'basic/diamondMask', 'basic/hexagonMask', 
  'basic/semiCircleMask', 'basic/triangleMask', 'basic/rectangleMask',
  'abstract/blobIrregular', 'abstract/polygonSoft',
  'abstract/polygonSoftWide', 'abstract/polygonSoftTall', 
  'abstract/polygonSoftAsymmetric', 'abstract/polygonSoftCompact',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide', // Representing simple strips
  'basic/donutMask', // Added donut mask
  'architectural/windowGrid' // Good for larger floating elements
  // Add more as deemed suitable, avoiding overly complex ones for floating elements
];

function getRandomMask(sizeHint, excludeMasks = []) {
  // For larger elements, include windowGrid in the selection
  if (sizeHint && sizeHint > 0.5) { // If element is more than 50% of canvas dimension
    const largeSuitableMasks = [
      'basic/circleMask', 'basic/diamondMask', 'basic/hexagonMask',
      'basic/rectangleMask',
      'abstract/polygonSoft', 'abstract/polygonSoftWide', 
      'abstract/polygonSoftAsymmetric',
      'architectural/windowGrid'
    ];
    // Filter out excluded masks and windowGrid if already used
    const availableLargeMasks = largeSuitableMasks.filter(mask => 
      !excludeMasks.includes(mask) && 
      (mask !== 'architectural/windowGrid' || !excludeMasks.some(m => m === 'architectural/windowGrid'))
    );
    // Add donutMask with lower probability (10% chance)
    if (Math.random() < 0.1 && !excludeMasks.includes('basic/donutMask')) {
      availableLargeMasks.push('basic/donutMask');
    }
    return availableLargeMasks[Math.floor(Math.random() * availableLargeMasks.length)];
  }
  
  // For smaller elements, avoid windowGrid and reduce donut frequency
  let smallMasks = suitableMasks.filter(mask => 
    mask !== 'architectural/windowGrid' && 
    mask !== 'basic/donutMask' &&
    !excludeMasks.includes(mask)
  );
  
  // Add donutMask with very low probability for small elements (5% chance)
  if (Math.random() < 0.05 && !excludeMasks.includes('basic/donutMask')) {
    smallMasks.push('basic/donutMask');
  }
  
  return smallMasks[Math.floor(Math.random() * smallMasks.length)];
}

// --- BEGIN Overlap Detection and Types ---
/**
 * @typedef {object} OverlapEchoParams
 * @property {boolean} active
 * @property {boolean} useComplementary
 */

/**
 * @typedef {object} BaseElementType // Elements in this template
 * @property {string} type - Mask name
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} rotation
 * @property {number} opacity
 * @property {number} layer - Conceptual layer index for sorting/overlap
 */

/**
 * @typedef {BaseElementType & { overlapEcho?: OverlapEchoParams }} ExtendedElement
 */

/**
 * @param {BaseElementType} rect1
 * @param {BaseElementType} rect2
 * @returns {number}
 */
function calculateOverlap(rect1, rect2) {
  const x_overlap = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
  const y_overlap = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
  const overlapArea = x_overlap * y_overlap;

  const area1 = rect1.width * rect1.height;
  const area2 = rect2.width * rect2.height;

  if (area1 === 0 || area2 === 0) return 0;
  return overlapArea / Math.min(area1, area2);
}
// --- END Overlap Detection and Types ---

const HORIZON_ZONES = {
  SKY: { start: 0, end: 0.4 },
  HORIZON: { start: 0.4, end: 0.6 },
  GROUND: { start: 0.6, end: 1 }
};

/**
 * Generate a floating elements composition
 */
export function generateFloatingElements(canvas, images, params) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const bgColorToUse = params.bgColor || getRandomColorFromPalette(images, 'auto');
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let styleToUse = params.style;
  const availableStyles = ['horizon', 'ascending', 'scattered'];
  if (!styleToUse || !availableStyles.includes(styleToUse) || styleToUse === 'random') {
      styleToUse = availableStyles[Math.floor(Math.random() * availableStyles.length)];
  }
  console.log(`[FloatingElements] Using style: ${styleToUse}`);

  const elementCount = getShapeCount('floatingElements', params.requestedShapes);
  let elements = createFloatingComposition(
    canvas.width,
    canvas.height,
    elementCount,
    styleToUse 
  );
  
  // Apply fillMode if set to 'pad'
  if (params.fillMode === 'pad') {
    console.log('[FloatingElements] Applying fillMode="pad" to fill negative space');
    const fillResult = fillNegativeSpace({
      canvas,
      elements: elements.map(el => ({
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        maskName: el.type,
        rotation: el.rotation,
        opacity: el.opacity
      })),
      targetBlankRatio: 0.03,
      maxIterations: 10,
      minBlankAreaSize: 1000
    });
    
    // Update elements with filled elements, preserving original properties
    const filledMap = new Map();
    fillResult.filledElements.forEach((filled, idx) => {
      if (idx < elements.length) {
        // Original element - update position/size if changed
        filledMap.set(idx, filled);
      } else {
        // New cloned element
        const sourceIdx = Math.floor(Math.random() * elements.length);
        const sourceElement = elements[sourceIdx];
        elements.push({
          ...sourceElement,
          x: filled.x,
          y: filled.y,
          width: filled.width,
          height: filled.height,
          rotation: filled.rotation || sourceElement.rotation,
          opacity: filled.opacity || sourceElement.opacity,
          isCloned: true
        });
      }
    });
    
    // Update original elements if their positions/sizes changed
    filledMap.forEach((filled, idx) => {
      elements[idx].x = filled.x;
      elements[idx].y = filled.y;
      elements[idx].width = filled.width;
      elements[idx].height = filled.height;
    });
    
    console.log(`[FloatingElements] Fill complete: ${fillResult.iterations} iterations, final blank ratio: ${(fillResult.finalBlankRatio * 100).toFixed(1)}%`);
  }
  
  drawFloatingElements(ctx, elements, images, params);
  
  // Return processed parameters that were actually used
  const processedParams = {
    style: styleToUse,
    elementCount: elements.length,
    bgColor: bgColorToUse,
    useMultiply: params.useMultiply !== false,
    useColorBlockEcho: params.useColorBlockEcho === true,
    echoOpacity: params.echoOpacity || 0.85,
    fillMode: params.fillMode || 'none',
    elements: elements.map((el, idx) => ({
      index: idx,
      type: el.type,
      x: Math.round(el.x * 100) / 100,
      y: Math.round(el.y * 100) / 100,
      width: Math.round(el.width * 100) / 100,
      height: Math.round(el.height * 100) / 100,
      rotation: Math.round((el.rotation || 0) * 100) / 100,
      opacity: Math.round((el.opacity || 1) * 100) / 100,
      layer: el.layer,
      isCloned: el.isCloned || false
    })),
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[FloatingElements] Returning processed params:', processedParams);
  
  return { 
    canvas, 
    bgColor: bgColorToUse,
    processedParams 
  };
}

/**
 * Create a composition of floating elements
 */
function createFloatingComposition(width, height, elementCount, style) {
  const elements = [];
  
  switch (style) {
    case 'horizon':
      // Elements arranged along horizon line
      return createHorizonComposition(width, height, elementCount);
    
    case 'ascending':
      // Elements rising from bottom to top
      return createAscendingComposition(width, height, elementCount);
    
    case 'scattered':
      // Elements scattered but following invisible guides
      return createScatteredComposition(width, height, elementCount);
    
    case 'strata':
      // Horizontal bands at different levels
      console.warn('[FloatingElements] Strata style selected but is deprecated. Falling back to horizon.');
      return createHorizonComposition(width, height, elementCount);
    
    default:
      return createHorizonComposition(width, height, elementCount);
  }
}

/**
 * Create horizon-based composition
 */
function createHorizonComposition(width, height, elementCount) {
  const elements = [];
  const usedMasks = []; // Track used masks
  const numElements = elementCount;
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.5)); // Up to 50% major, at least 1
  
  // Increase MIN_ELEMENT_SIDE and general sizes for Horizon style
  const MIN_ELEMENT_SIDE = Math.max(180, Math.min(width, height) * 0.45); // Min side 45% of canvas min, or 180px

  for (let i = 0; i < numElements; i++) {
    const isMajor = i < majorElementCount;
    let size;
    if (isMajor) {
      size = Math.min(width, height) * (0.80 + Math.random() * 0.35); // Major: 80-115%
    } else {
      // Minor elements also need to be substantial if only 2-4 elements total
      size = Math.min(width, height) * (0.60 + Math.random() * 0.30); // Minor: 60-90%
    }
    size = Math.max(MIN_ELEMENT_SIDE, size);
    if (isMajor && numElements > 1 && majorElementCount < numElements && elements.length > 0 && elements[0].width) { 
        // Ensure major is actually larger than the first minor if it exists.
        size = Math.max(size, elements[0].width * 1.1); // At least 10% bigger than first minor if ranges made it smaller
    }    
    size = Math.min(size, Math.min(width,height) * 0.95); // Cap size to 95%

    const segmentWidth = width / (numElements + 1); 
    const xAnchor = segmentWidth * (i + 1);
    const xJitter = segmentWidth * 0.2 * (Math.random() - 0.5); // Less X jitter
    let x = xAnchor + xJitter - size / 2;
    
    const horizonY = height * (0.4 + Math.random() * 0.2); // Horizon line 40-60% height
    const yJitter = height * 0.1 * (Math.random() - 0.5);
    let y = horizonY + yJitter - size / 2;

    const maxOffCanvas = 0.20; // Allow up to 20% off canvas now they are bigger
    x = Math.max(-size * maxOffCanvas, Math.min(width - size * (1 - maxOffCanvas), x));
    y = Math.max(-size * maxOffCanvas, Math.min(height - size * (1 - maxOffCanvas), y));
    
    const sizeRatio = size / Math.min(width, height); // Calculate size relative to canvas
    
    // Get random mask, excluding already used ones
    const selectedMask = getRandomMask(sizeRatio, usedMasks);
    usedMasks.push(selectedMask); // Track this mask as used
    
    elements.push({
      type: selectedMask,
      x: x, y: y, width: size, height: size, 
      rotation: (Math.random() - 0.5) * (isMajor ? 8 : 12), // Slightly increased allowed rotation
      opacity: 0.88 + Math.random() * 0.12, 
      blendMode: Math.random() < 0.7 ? 'multiply' : 'source-over', 
      layer: i 
    });
  }
  
  const sortedElements = elements.sort((a, b) => a.layer - b.layer);
  let extendedElements = sortedElements;
  const OVERLAP_THRESHOLD = 0.05; 
  for (let i = 0; i < extendedElements.length; i++) {
    for (let j = i + 1; j < extendedElements.length; j++) {
      const elementA = extendedElements[i]; const elementB = extendedElements[j];
      const overlapPercentage = calculateOverlap(elementA, elementB);
      if (overlapPercentage > OVERLAP_THRESHOLD) {
        let topElement = elementB; if (elementA.layer > elementB.layer) { topElement = elementA; }
        if (!topElement.overlapEcho || !topElement.overlapEcho.active) {
          topElement.overlapEcho = { active: true, useComplementary: Math.random() < 0.5 };
        }
      }
    }
  }
  return extendedElements;
}

/**
 * Create ascending composition
 */
function createAscendingComposition(width, height, elementCount) {
  const elements = [];
  const usedMasks = []; // Track used masks
  const numElements = elementCount;
  const columns = Math.max(1, Math.floor(numElements / 2.5)); // Fewer columns for larger elements
  const columnWidth = width / columns;
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.35)); // ~35% major
  const MIN_ELEMENT_SIDE = Math.max(180, Math.min(width, height) * 0.40); // Increased min size

  for (let i = 0; i < numElements; i++) {
    const isMajor = i < majorElementCount; 
    const column = i % columns;
    const row = Math.floor(i / columns);
    
    let x = columnWidth * column + columnWidth / 2; 
    const baseY = height * (isMajor ? 0.70 : 0.85); // Start lower
    const riseFactor = (height * 0.80) / Math.max(1, Math.ceil(numElements / columns)); // Total rise over available rows
    let y = baseY - (row * riseFactor * (isMajor ? 0.8 : 1.0) ); // Major elements rise a bit less per row to stay larger longer
    
    let size;
    let baseSize;
    if (isMajor) {
      // Scaled up base size calculation
      baseSize = Math.min(columnWidth * 1.2, height * 0.675); // Target approx 1.5x previous: 0.8*1.5=1.2, 0.45*1.5=0.675
      size = baseSize * (0.70 + Math.random() * 0.30); // Original multiplier range, applied to new larger base
    } else {
      // Scaled up base size calculation
      baseSize = Math.min(columnWidth * 1.05, height * 0.45); // Target approx 1.5x previous: 0.7*1.5=1.05, 0.3*1.5=0.45
      size = baseSize * (0.60 + Math.random() * 0.40); // Original multiplier range, applied to new larger base
    }
    size = Math.max(MIN_ELEMENT_SIDE, size);
    // Apply a general 1.5x scaling factor and then cap
    size *= 1.5;
    size = Math.min(size, columnWidth * 1.35, height * 0.9); // Cap size (original caps * 1.5, roughly)

    x = x - size / 2 + (Math.random() - 0.5) * columnWidth * 0.1; // Minimal X jitter
    y = y - size / 2; // Adjust Y based on size

    const maxOffCanvas = 0.1;
    x = Math.max(-size * maxOffCanvas, Math.min(width - size * (1 - maxOffCanvas), x));
    // Ensure elements ascend from bottom, allow top to bleed
    y = Math.max(-size * 0.3, Math.min(height - size * (1 - maxOffCanvas), y)); 
    if (y + size > height * 1.1) { // Prevent excessive bottom bleed
        y = height * 1.1 - size;
    }

    const sizeRatio = size / Math.min(width, height);
    
    // Get random mask, excluding already used ones
    const selectedMask = getRandomMask(sizeRatio, usedMasks);
    usedMasks.push(selectedMask); // Track this mask as used
    
    elements.push({
      type: selectedMask,
      x: x, y: y, width: size, height: size, 
      rotation: (Math.random() - 0.5) * (isMajor ? 4 : 8), // Very minimal rotation
      opacity: Math.max(0.85, 0.95 - row * 0.05), // Fade slightly with row, much higher base
      layer: numElements - i, 
      blendMode: Math.random() < 0.65 ? 'multiply' : 'source-over'
    });
  }
  // Apply overlap echo logic (copied from createHorizonComposition, can be refactored)
  const sortedElements = elements.sort((a,b) => a.layer - b.layer);
  let extendedElements = sortedElements;
  const OVERLAP_THRESHOLD = 0.05; 
  for (let i = 0; i < extendedElements.length; i++) {
    for (let j = i + 1; j < extendedElements.length; j++) {
      const elementA = extendedElements[i]; const elementB = extendedElements[j];
      const overlapPercentage = calculateOverlap(elementA, elementB);
      if (overlapPercentage > OVERLAP_THRESHOLD) {
        let topElement = elementB; if (elementA.layer > elementB.layer) { topElement = elementA; }
        if (!topElement.overlapEcho || !topElement.overlapEcho.active) {
          topElement.overlapEcho = { active: true, useComplementary: Math.random() < 0.5 };
        }
      }
    }
  }
  return extendedElements;
}

/**
 * Create scattered but guided composition
 */
function createScatteredComposition(width, height, elementCount) {
  const elements = [];
  const usedMasks = []; // Track used masks
  const numElements = elementCount;
  const guides = [];
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.4)); // ~40% major
  const MIN_ELEMENT_SIDE = Math.max(180, Math.min(width, height) * 0.40); // Increased min size

  // Phyllotaxis distribution for guide points
  for (let i = 0; i < numElements; i++) {
    const angle = i * (Math.PI * 2 / numElements) * (GOLDEN_RATIO -1) * 2.1; // Slightly adjust constant for spread
    // Ensure radius allows elements to reach edges or overlap center more easily
    const radius = Math.sqrt((i + 0.5) / (numElements)) * Math.min(width, height) * 0.48; 
    guides.push({
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius
    });
  }
  
  guides.forEach((guide, i) => {
    const isMajor = i < majorElementCount;
    let size;
    if (isMajor) {
      size = Math.min(width, height) * (0.75 + Math.random() * 0.375); // Major: 75-112.5%
    } else {
      size = Math.min(width, height) * (0.45 + Math.random() * 0.30); // Minor: 45-75%
    }
    size = Math.max(MIN_ELEMENT_SIDE, size);
    size = Math.min(size, Math.min(width, height) * 0.90); // Cap size to 90% (increased from 0.85)
    
    // Reduced offset from guide point to make them cluster more around guides
    const offsetX = (Math.random() - 0.5) * size * 0.15; 
    const offsetY = (Math.random() - 0.5) * size * 0.15;
    let x = guide.x - size / 2 + offsetX;
    let y = guide.y - size / 2 + offsetY;

    const maxOffCanvas = 0.20; // Allow some bleed
    x = Math.max(-size * maxOffCanvas, Math.min(width - size * (1 - maxOffCanvas), x));
    y = Math.max(-size * maxOffCanvas, Math.min(height - size * (1 - maxOffCanvas), y));
    
    const sizeRatio = size / Math.min(width, height);
    
    // Get random mask, excluding already used ones
    const selectedMask = getRandomMask(sizeRatio, usedMasks);
    usedMasks.push(selectedMask); // Track this mask as used
    
    elements.push({
      type: selectedMask,
      x: x, y: y, width: size, height: size,
      rotation: (Math.random() - 0.5) * 10, // Slightly more rotation allowed than ascending, max +/- 5 degrees
      opacity: 0.85 + Math.random() * 0.15,
      layer: i,
      blendMode: Math.random() < 0.65 ? 'multiply' : 'source-over'
    });
  });
  
  // Apply overlap echo logic (as in other functions)
  const sortedElements = elements.sort((a,b) => a.layer - b.layer);
  let extendedElements = sortedElements;
  const OVERLAP_THRESHOLD = 0.05; 
  for (let i = 0; i < extendedElements.length; i++) {
    for (let j = i + 1; j < extendedElements.length; j++) {
      const elementA = extendedElements[i]; const elementB = extendedElements[j];
      const overlapPercentage = calculateOverlap(elementA, elementB);
      if (overlapPercentage > OVERLAP_THRESHOLD) {
        let topElement = elementB; if (elementA.layer > elementB.layer) { topElement = elementA; }
        if (!topElement.overlapEcho || !topElement.overlapEcho.active) {
          topElement.overlapEcho = { active: true, useComplementary: Math.random() < 0.5 };
        }
      }
    }
  }
  return extendedElements;
}

/**
 * Draw floating elements
 */
function drawFloatingElements(ctx, elements, images, params) {
  const bgColor = params.bgColor || getRandomColorFromPalette(images, 'auto'); // Use palette-aware color selection
  
  elements.forEach((elementItem, index) => {
    const element = elementItem; // Implicitly ExtendedElement
    const { type, x, y, width, height, rotation } = element;
    // Use a more robust image selection, ensure enough images or cycle
    const image = images.length > 0 ? images[index % images.length] : null;

    if (!image && import.meta.env.MODE !== 'development') { // In prod, image is required unless it's an echo-only case later
        console.warn(`No image for element ${index}, and not in dev mode. Skipping.`);
        return;
    }
    if (image && !image.complete && import.meta.env.MODE === 'development' && image.isBroken) {
        console.warn(`Skipping image for element ${index} due to dev mode broken state.`);
        return;
    }
    if (image && !image.complete && import.meta.env.MODE !== 'development') {
        console.warn(`Skipping image for element ${index} due to incomplete load state.`);
        return;
    }
    
    ctx.save();
    
    const [family, maskType] = type.split('/');
    const maskFnGetter = maskRegistry[family]?.[maskType];
    
    let path; // Changed from maskPath for clarity
    if (maskFnGetter) {
      try {
        const maskDescriptor = maskFnGetter();
        if (maskDescriptor && typeof maskDescriptor.getSvg === 'function') {
          path = svgToPath2D(maskDescriptor.getSvg({})); 
        } else if (typeof maskDescriptor === 'string') { 
          path = svgToPath2D(maskDescriptor);
        }
      } catch (e) { console.error(`Error processing mask ${type}:`, e);}
    }

    if (!path) {
      console.warn(`Mask not found or failed for ${type}, using fallback rectangle.`);
      path = new Path2D();
      path.rect(0, 0, 100, 100);
    }
        
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-width / 2, -height / 2);
    ctx.scale(width / 100, height / 100);
    ctx.clip(path); // Clip is set for this element

    // --- Start Drawing Logic for Echo and Image ---
    let imageDrawn = false;
    let finalOpacity = element.opacity !== undefined ? element.opacity : 1.0;
    // Check if image is color (not B&W) and no echo is being applied
    const isColorImage = image && image.is_black_and_white === false;
    const hasEcho = element.overlapEcho?.active || params.useColorBlockEcho;
    let actualBlendMode = element.blendMode || (params.useMultiply ? 'multiply' : 'source-over');
    
    // Use normal blend mode for color images without echo
    if (isColorImage && !hasEcho) {
      actualBlendMode = 'normal';
    }

    // Overlap Echo Logic (takes precedence)
    if (element.overlapEcho?.active) {
      finalOpacity = 1.0; // Image part is 100% opaque
      actualBlendMode = 'multiply'; // Image is multiplied over echo
      const echoColor = element.overlapEcho.useComplementary
        ? getAppropriateEchoColor(bgColor, image, getComplementaryColor) 
        : getAppropriateEchoColor(bgColor, image, getComplementaryColor, true); // Force background color
      
      // Use safe fill color utility
      const isBW = image && image.is_black_and_white !== false;
      const safeColors = getSafeFillColour(isBW, echoColor, 0.2);

      console.log(`[FloatingElements] Applying OVERLAP Echo: ${element.type}, color: ${safeColors.fillColor}, isBW: ${isBW}`);
      // FIXED: Draw echo block by filling a rectangle in the clipped area
      ctx.fillStyle = safeColors.fillColor;
      ctx.globalAlpha = safeColors.opacity * 4.25; // Scale up opacity since max is 0.2
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(0, 0, 100, 100); // Fill the entire 100x100 clipped area
      // Image will be drawn next, over this echo
    } 
    // Standard Color Block Echo (if no overlap echo and params.useColorBlockEcho)
    // This assumes echo is BASE, image on TOP (multiply)
    else if (params.useColorBlockEcho && image && image.complete) {
      const echoColor = getAppropriateEchoColor(bgColor, image, getComplementaryColor);
      const requestedOpacity = params.echoOpacity !== undefined ? params.echoOpacity : 0.85;
      
      // Use safe fill color utility
      const isBW = image && image.is_black_and_white !== false;
      const safeColors = getSafeFillColour(isBW, echoColor, requestedOpacity);
      
      console.log(`[FloatingElements] Applying Standard Echo (Base): ${element.type}, color: ${safeColors.fillColor}, isBW: ${isBW}`);
      ctx.fillStyle = safeColors.fillColor;
      ctx.globalAlpha = safeColors.opacity;
      ctx.globalCompositeOperation = 'source-over';
      // FIXED: Fill a rectangle in the clipped area to match the mask shape exactly
      ctx.fillRect(0, 0, 100, 100); // Fill the entire 100x100 clipped area

      actualBlendMode = 'multiply'; // Image will be multiplied on top
    }

    // Draw Image
    if (image && image.complete) {
      ctx.globalAlpha = finalOpacity;
      ctx.globalCompositeOperation = actualBlendMode;
      
      // Draw image to fill the 0-100 clip space (which was scaled from original element w/h)
      const imgNatWidth = image.naturalWidth;
      const imgNatHeight = image.naturalHeight;
      const imgRatio = imgNatWidth / imgNatHeight;
      const targetClipWidth = 100; 
      const targetClipHeight = 100;
      const targetRatio = targetClipWidth / targetClipHeight;
      let sWidth = imgNatWidth, sHeight = imgNatHeight, sx = 0, sy = 0;

      if (imgRatio > targetRatio) { // Image is wider than target, crop sides
        sWidth = imgNatHeight * targetRatio;
        sx = (imgNatWidth - sWidth) / 2;
      } else { // Image is taller than target, crop top/bottom
        sHeight = imgNatWidth / targetRatio;
        sy = (imgNatHeight - sHeight) / 2;
      }
      ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, targetClipWidth, targetClipHeight);
      imageDrawn = true;
    } else if (!imageDrawn && (element.overlapEcho?.active || params.useColorBlockEcho)) {
      // If an echo was drawn and image failed, the echo remains. This is good.
      console.log(`[FloatingElements] Image for ${element.type} not drawn, but echo was present.`);
    } else if (!imageDrawn) {
      // No image, no echo - fill with a very transparent placeholder if desired
      // ctx.fillStyle = bgColor;
      // ctx.globalAlpha = 0.1 * finalOpacity;
      // ctx.fill();
      console.warn(`[FloatingElements] Image for ${element.type} not drawn and no echo. Area is blank.`);
    }
    // --- End Drawing Logic ---

    ctx.restore(); 
  });
}

/**
 * Create a strip/rectangle mask
 */
function createStripMask(width, height) {
  const path = new Path2D();
  path.rect(0, 0, 100, 100);
  return path;
}

/**
 * Create a circle mask
 */
function createCircleMask(size) {
  const path = new Path2D();
  path.arc(50, 50, 50, 0, Math.PI * 2);
  return path;
}

/**
 * Create a triangle mask
 */
function createTriangleMask(width, height) {
  const path = new Path2D();
  path.moveTo(50, 0);
  path.lineTo(100, 100);
  path.lineTo(0, 100);
  path.closePath();
  return path;
}

/**
 * Draw image with cover fit
 */
function drawImageCover(ctx, img, x, y, width, height) {
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;
  
  let sourceWidth, sourceHeight, sourceX, sourceY;
  
  if (imgRatio > boxRatio) {
    sourceHeight = img.height;
    sourceWidth = img.height * boxRatio;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    sourceWidth = img.width;
    sourceHeight = img.width / boxRatio;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }
  
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

// Export template
const floatingElements = {
  key: 'floatingElements',
  name: 'Floating Elements',
  generate: generateFloatingElements,
  params: {
    elementCount: { type: 'number', min: 2, max: 12, default: 5 },
    style: { type: 'select', options: ['horizon', 'ascending', 'scattered', 'random'], default: 'random' },
    bgColor: { type: 'color' },
    useMultiply: { type: 'boolean', default: true },
    useColorBlockEcho: { type: 'boolean', default: true },
    echoOpacity: { type: 'number', min: 0, max: 1, default: 0.85 },
    fillMode: {
      type: 'select',
      options: ['none', 'pad'],
      default: 'none',
      description: 'Fill negative space by scaling & cloning existing shapes'
    }
  }
};

export default floatingElements;
