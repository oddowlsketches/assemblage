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
  'abstract/blobIrregular', 'abstract/polygonSoft', 'abstract/cloudLike', 'abstract/archBlob',
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
  
  // Fill with a single background color
  const bgColorToUse = params.bgColor || randomVibrantColor(); // Use random vibrant if no specific color
  ctx.fillStyle = bgColorToUse;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create composition plan
  const elements = createFloatingComposition(
    canvas.width,
    canvas.height,
    params.elementCount || 4,
    params.style || 'horizon'
  );
  
  // Draw elements
  drawFloatingElements(ctx, elements, images, params);
  
  return { canvas, bgColor: bgColorToUse }; // Return canvas and bgColor used (use bgColorToUse)
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
      return createStrataComposition(width, height, elementCount);
    
    default:
      return createHorizonComposition(width, height, elementCount);
  }
}

/**
 * Create horizon-based composition
 */
function createHorizonComposition(width, height, elementCount) {
  const elements = [];
  const majorElementCount = Math.max(1, Math.floor(elementCount * 0.3)); // ~30% are major elements
  
  for (let i = 0; i < elementCount; i++) {
    const isMajor = i < majorElementCount; // First few elements can be larger
    let size;
    if (isMajor) {
      // Major elements: 40-80% of canvas min dim, more likely to be larger
      size = Math.min(width, height) * (0.4 + Math.pow(Math.random(), 2) * 0.4);
    } else {
      // Minor elements: 20-50% of canvas min dim
      size = Math.min(width, height) * (0.2 + Math.random() * 0.3);
    }

    // Allow elements to be positioned to bleed off canvas
    // X: can range from -size/2 (left bleed) up to width - size/2 (right bleed)
    // More central tendency but allows for full bleed with larger sizes
    const x = (width * (0.1 + Math.random() * 0.8)) - size / 2 + (Math.random() - 0.5) * width * 0.4;
    
    // Y: similar logic, allowing bleed top/bottom, centered around a horizon line
    const horizonY = height * (0.4 + Math.random() * 0.2); // Horizon line fluctuates
    const y = horizonY - size / 2 + (Math.random() - 0.5) * height * 0.3;
    
    elements.push({
      type: getRandomMask(),
      x: x,
      y: y,
      width: size,
      height: size, // Keep square for now, can be element.width * (0.7 + Math.random()*0.6) for variety
      rotation: (Math.random() - 0.5) * (isMajor ? 15 : 30),
      opacity: 0.65 + Math.random() * 0.35, // Range 0.65 - 1.0
      blendMode: Math.random() < 0.6 ? 'multiply' : 'source-over',
      layer: i // Simple layering, could be randomized
    });
  }
  
  // Sort before overlap detection to ensure layer property is stable for top/bottom determination
  const sortedElements = elements.sort((a, b) => a.layer - b.layer);

  // --- BEGIN Overlap Detection Logic ---
  let extendedElements = sortedElements; // Already sorted, now treat as ExtendedElement
  const OVERLAP_THRESHOLD = 0.3; 

  for (let i = 0; i < extendedElements.length; i++) {
    for (let j = i + 1; j < extendedElements.length; j++) {
      const elementA = extendedElements[i];
      const elementB = extendedElements[j];

      const overlapPercentage = calculateOverlap(elementA, elementB);

      if (overlapPercentage > OVERLAP_THRESHOLD) {
        // elementA.layer and elementB.layer determine drawing order (lower is earlier/further back)
        // Since array is pre-sorted by layer, elementB (later index) is generally on top of elementA if layers are different or same.
        let topElement = elementB; 
        let bottomElement = elementA;
        // Double check layering if explicit layer props differ significantly, though sort should handle it.
        if (elementA.layer > elementB.layer) { // A is explicitly on top
            topElement = elementA;
            bottomElement = elementB;
        }

        console.log(`[FloatingElements Overlap] Significant overlap (${(overlapPercentage * 100).toFixed(1)}%) between element at original index for ${elementA.type} (layer ${elementA.layer}) and ${elementB.type} (layer ${elementB.layer}). Top: ${topElement.type}`);

        if (!topElement.overlapEcho || !topElement.overlapEcho.active) {
          topElement.overlapEcho = {
            active: true,
            useComplementary: Math.random() < 0.5, 
          };
        }
      }
    }
  }
  // --- END Overlap Detection Logic ---
  
  return extendedElements; // Return elements that might have overlapEcho properties
}

/**
 * Create ascending composition
 */
function createAscendingComposition(width, height, elementCount) {
  const elements = [];
  const columns = Math.max(1, Math.floor(elementCount / 3)); // More dynamic columns
  const columnWidth = width / columns;
  const majorElementCount = Math.max(1, Math.floor(elementCount * 0.2)); // Approx 20% major
  
  for (let i = 0; i < elementCount; i++) {
    const isMajor = i < majorElementCount; // First few can be major
    const column = i % columns;
    const row = Math.floor(i / columns);
    const x = columnWidth * column + columnWidth / 2;
    
    const baseY = height * (isMajor ? 0.6 : 0.8); // Major elements can start higher
    const riseAmount = row * height * (isMajor ? 0.1 : 0.15);
    const y = baseY - riseAmount;
    
    let size;
    if (isMajor) {
      size = Math.min(width, height) * (0.35 + Math.random() * 0.35); // 35-70%
    } else {
      size = Math.min(width, height) * (0.1 + Math.random() * 0.1); // 10-20%
    }
    
    elements.push({
      type: getRandomMask(),
      x: x - size / 2 + (Math.random() - 0.5) * columnWidth * 0.2,
      y: y - size / 2,
      width: size,
      height: size, 
      rotation: (Math.random() - 0.5) * 30 + (row * (isMajor ? 5 : 10)),
      opacity: Math.max(0.5, 1 - row * 0.15),
      layer: elementCount - i
    });
  }
  
  return elements.sort((a,b) => a.layer - b.layer);
}

/**
 * Create scattered but guided composition
 */
function createScatteredComposition(width, height, elementCount) {
  const elements = [];
  const guides = [];
  const phi = GOLDEN_RATIO;
  const majorElementCount = Math.max(1, Math.floor(elementCount * 0.2));
  
  for (let i = 0; i < elementCount; i++) {
    const angle = i * 2.39996; 
    const radius = Math.sqrt(i / elementCount) * Math.min(width, height) * 0.4; // Spread more
    guides.push({
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius
    });
  }
  
  guides.forEach((guide, i) => {
    const isMajor = i < majorElementCount;
    let size;
    if (isMajor) {
      size = Math.min(width, height) * (0.4 + Math.random() * 0.3); // 40-70%
    } else {
      size = Math.min(width, height) * (0.1 + Math.random() * 0.15); // 10-25%
    }
    const offset = (Math.random() * 20 - 10) * (isMajor ? 0.5 : 1); // Major elements less offset
    
    elements.push({
      type: getRandomMask(),
      x: guide.x - size / 2 + offset,
      y: guide.y - size / 2 + offset,
      width: size,
      height: size,
      rotation: (Math.random() * 360),
      opacity: 0.6 + Math.random() * 0.4,
      layer: i
    });
  });
  
  return elements.sort((a,b) => a.layer - b.layer);
}

/**
 * Create horizontal strata composition
 */
function createStrataComposition(width, height, elementCount) {
  const elements = [];
  // Max 3-5 strata, each with 1-4 elements
  const strataCount = Math.min(5, Math.max(3, Math.ceil(elementCount / 3))); 
  let elementsPlaced = 0;
  
  for (let i = 0; i < strataCount && elementsPlaced < elementCount; i++) {
    // Vary Y position more, allow some overlap potential
    const y = height * (0.15 + i * ((0.8 - 0.15) / strataCount) + (Math.random()-0.5) * 0.1); 
    const elementsInStrata = Math.min(Math.ceil(Math.random() * 3) + 1, elementCount - elementsPlaced); // 1-4 elements per strata
    
    for (let j = 0; j < elementsInStrata && elementsPlaced < elementCount; j++) {
      const x = width * (0.1 + Math.random() * 0.8); // More random X
      const aspectRatio = 2 + Math.random() * 4; // Aspect ratio 2:1 to 6:1
      const stripeHeight = height * (0.04 + Math.random() * 0.06); // 4-10% height
      const stripeWidth = Math.min(width * 0.9, stripeHeight * aspectRatio); // Cap width
      
      elements.push({
        type: Math.random() < 0.7 ? 'basic/rectangleMask' : getRandomMask(), // Mostly rectangles, some other shapes
        x: x - stripeWidth / 2,
        y: y - stripeHeight / 2,
        width: stripeWidth,
        height: stripeHeight,
        rotation: (Math.random() - 0.5) * 10, // Slight rotation
        opacity: 0.7 + Math.random() * 0.3,
        layer: i + Math.random() * 0.5 // Add jitter to layer for sorting
      });
      elementsPlaced++;
    }
  }
  
  return elements.sort((a, b) => a.layer - b.layer);
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
    style: { type: 'select', options: ['horizon', 'ascending', 'scattered', 'strata'], default: 'horizon' },
    bgColor: { type: 'color' },
    useMultiply: { type: 'boolean', default: true },
    useColorBlockEcho: { type: 'boolean', default: true },
    echoOpacity: { type: 'number', min: 0, max: 1, default: 0.75 }
  }
};

export default floatingElements;
