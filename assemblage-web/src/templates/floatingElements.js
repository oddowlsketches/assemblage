import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils.js';
import { getComplementaryColor } from '../utils/colorUtils.js';
import { randomVibrantColor } from '../utils/colors.js';

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
  'abstract/blobIrregular', 'abstract/polygonSoft', 'abstract/cloudLike',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide', // Representing simple strips
  // Add more as deemed suitable, avoiding overly complex ones for floating elements
];

function getRandomMask() {
  return suitableMasks[Math.floor(Math.random() * suitableMasks.length)];
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
  
  const bgColorToUse = params.bgColor || randomVibrantColor();
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let styleToUse = params.style;
  const availableStyles = ['horizon', 'ascending', 'scattered'];
  if (!styleToUse || !availableStyles.includes(styleToUse) || styleToUse === 'random') {
      styleToUse = availableStyles[Math.floor(Math.random() * availableStyles.length)];
  }
  console.log(`[FloatingElements] Using style: ${styleToUse}`);

  const elements = createFloatingComposition(
    canvas.width,
    canvas.height,
    params.elementCount || 5, // Default element count if not specified
    styleToUse 
  );
  
  drawFloatingElements(ctx, elements, images, params);
  
  return { canvas, bgColor: bgColorToUse };
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
  const numElements = Math.max(2, Math.min(elementCount, 4)); // Reduced further to 2-4 for more impact
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.5)); // Up to 50% major, at least 1
  
  // Increase MIN_ELEMENT_SIDE and general sizes for Horizon style
  const MIN_ELEMENT_SIDE = Math.max(120, Math.min(width, height) * 0.30); // Min side 30% of canvas min, or 120px

  for (let i = 0; i < numElements; i++) {
    const isMajor = i < majorElementCount;
    let size;
    if (isMajor) {
      size = Math.min(width, height) * (0.55 + Math.random() * 0.25); // Major: 55-80%
    } else {
      // Minor elements also need to be substantial if only 2-4 elements total
      size = Math.min(width, height) * (0.40 + Math.random() * 0.20); // Minor: 40-60%
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
    
    elements.push({
      type: getRandomMask(),
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
  const numElements = Math.max(3, Math.min(elementCount, 7)); // 3-7 elements
  const columns = Math.max(1, Math.floor(numElements / 2.5)); // Fewer columns for larger elements: 1-2 for 3-5 els, 2-3 for 6-7 els
  const columnWidth = width / columns;
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.35)); // ~35% major
  const MIN_ELEMENT_SIDE = Math.max(90, Math.min(width, height) * 0.22); // Min side 22% or 90px

  for (let i = 0; i < numElements; i++) {
    const isMajor = i < majorElementCount; 
    const column = i % columns;
    const row = Math.floor(i / columns);
    
    let x = columnWidth * column + columnWidth / 2; 
    const baseY = height * (isMajor ? 0.70 : 0.85); // Start lower
    const riseFactor = (height * 0.80) / Math.max(1, Math.ceil(numElements / columns)); // Total rise over available rows
    let y = baseY - (row * riseFactor * (isMajor ? 0.8 : 1.0) ); // Major elements rise a bit less per row to stay larger longer
    
    let size;
    if (isMajor) {
      size = Math.min(columnWidth * 0.8, height * 0.45) * (0.70 + Math.random() * 0.30); // 70-100% of up to 80% col width or 45% height
    } else {
      size = Math.min(columnWidth * 0.7, height * 0.30) * (0.60 + Math.random() * 0.40); // 60-100% of up to 70% col width or 30% height
    }
    size = Math.max(MIN_ELEMENT_SIDE, size);
    size = Math.min(size, columnWidth * 0.9, height * 0.6); // Cap size

    x = x - size / 2 + (Math.random() - 0.5) * columnWidth * 0.1; // Minimal X jitter
    y = y - size / 2; // Adjust Y based on size

    const maxOffCanvas = 0.1;
    x = Math.max(-size * maxOffCanvas, Math.min(width - size * (1 - maxOffCanvas), x));
    // Ensure elements ascend from bottom, allow top to bleed
    y = Math.max(-size * 0.3, Math.min(height - size * (1 - maxOffCanvas), y)); 
    if (y + size > height * 1.1) { // Prevent excessive bottom bleed
        y = height * 1.1 - size;
    }

    elements.push({
      type: getRandomMask(),
      x: x, y: y, width: size, height: size, 
      rotation: (Math.random() - 0.5) * (isMajor ? 4 : 8), // Very minimal rotation
      opacity: Math.max(0.7, 0.9 - row * 0.1), // Fade slightly with row, higher base
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
  const numElements = Math.max(3, Math.min(elementCount, 7)); // 3-7 elements for scattered
  const guides = [];
  const majorElementCount = Math.max(1, Math.floor(numElements * 0.4)); // ~40% major
  const MIN_ELEMENT_SIDE = Math.max(90, Math.min(width, height) * 0.22); // Min side 22% or 90px

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
      size = Math.min(width, height) * (0.50 + Math.random() * 0.25); // Major: 50-75%
    } else {
      size = Math.min(width, height) * (0.30 + Math.random() * 0.20); // Minor: 30-50%
    }
    size = Math.max(MIN_ELEMENT_SIDE, size);
    size = Math.min(size, Math.min(width, height) * 0.85); // Cap size
    
    // Reduced offset from guide point to make them cluster more around guides
    const offsetX = (Math.random() - 0.5) * size * 0.15; 
    const offsetY = (Math.random() - 0.5) * size * 0.15;
    let x = guide.x - size / 2 + offsetX;
    let y = guide.y - size / 2 + offsetY;

    const maxOffCanvas = 0.20; // Allow some bleed
    x = Math.max(-size * maxOffCanvas, Math.min(width - size * (1 - maxOffCanvas), x));
    y = Math.max(-size * maxOffCanvas, Math.min(height - size * (1 - maxOffCanvas), y));
    
    elements.push({
      type: getRandomMask(),
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
  const bgColor = params.bgColor || randomVibrantColor(); // Use bgColor from params for echo logic too
  
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
    let actualBlendMode = element.blendMode || (params.useMultiply ? 'multiply' : 'source-over');

    // Overlap Echo Logic (takes precedence)
    if (element.overlapEcho?.active) {
      finalOpacity = 1.0; // Image part is 100% opaque
      actualBlendMode = 'multiply'; // Image is multiplied over echo
      const echoColor = element.overlapEcho.useComplementary
        ? getComplementaryColor(bgColor) 
        : bgColor;
      const echoOpacity = 0.85; // Strong fixed opacity for overlap echo block

      console.log(`[FloatingElements] Applying OVERLAP Echo: ${element.type}, color: ${echoColor}`);
      // Draw echo block (fills the clipped path)
      ctx.fillStyle = echoColor;
      ctx.globalAlpha = echoOpacity;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fill(); // fill() uses the current clip path
      // Image will be drawn next, over this echo
    } 
    // Standard Color Block Echo (if no overlap echo and params.useColorBlockEcho)
    // This assumes echo is BASE, image on TOP (multiply)
    else if (params.useColorBlockEcho && image && image.complete) {
      const echoColor = getComplementaryColor(bgColor);
      const echoOpacity = params.echoOpacity !== undefined ? params.echoOpacity : 0.75;
      
      console.log(`[FloatingElements] Applying Standard Echo (Base): ${element.type}, color: ${echoColor}`);
      ctx.fillStyle = echoColor;
      ctx.globalAlpha = echoOpacity * finalOpacity; // Modulate by original element opacity
      ctx.globalCompositeOperation = 'source-over';
      if (path) ctx.fill(path); // New way: explicitly fill the path object
      else ctx.fillRect(0, 0, 100, 100); // Fallback if path is somehow undefined here

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
    elementCount: { type: 'number', min: 3, max: 12, default: 5 },
    style: { type: 'select', options: ['horizon', 'ascending', 'scattered', 'random'], default: 'random' },
    bgColor: { type: 'color' },
    useMultiply: { type: 'boolean', default: true },
    useColorBlockEcho: { type: 'boolean', default: true },
    echoOpacity: { type: 'number', min: 0, max: 1, default: 0.75 }
  }
};

export default floatingElements;
