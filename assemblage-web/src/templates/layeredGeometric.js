import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils.js';
import { getComplementaryColor } from '../utils/colorUtils.js';
import { randomVibrantColor, getRandomColorFromPalette } from '../utils/colors.js';

/**
 * Layered Geometric Template
 * Creates overlapping geometric shapes with transparency effects
 * Inspired by constructivist and abstract geometric compositions
 */

// Design constants
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21];
const ANGLE_HARMONY = [0, 30, 45, 60, 90, 120, 135, 150];

// Define a list of suitable masks from the maskRegistry for geometric compositions
const suitableGeometricMasks = [
  'basic/rectangleMask', 'basic/circleMask', 'basic/ovalMask', 'basic/diamondMask', 
  'basic/hexagonMask', 'basic/semiCircleMask', 'basic/triangleMask',
  'architectural/archClassical', 'architectural/columnSingle', 'architectural/windowRect', 'architectural/archFlat',
  'altar/nicheArch', 'altar/gableAltar',
  'sliced/sliceHorizontalWide', 'sliced/sliceVerticalWide', 'sliced/sliceAngled',
  // Add more geometric or simple abstract masks as needed
];

function getRandomGeometricMask() {
  return suitableGeometricMasks[Math.floor(Math.random() * suitableGeometricMasks.length)];
}

// --- BEGIN Overlap Detection and Types ---
// JSDoc equivalent for OverlapEchoParams
/**
 * @typedef {object} OverlapEchoParams
 * @property {boolean} active
 * @property {boolean} useComplementary
 */

// JSDoc equivalent for BaseLayerType
/**
 * @typedef {object} BaseLayerType
 * @property {string} type - Mask name
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} rotation
 * @property {number} opacity
 * @property {string} blendMode
 * @property {number} layer - Conceptual layer index, lower is further back
 */

// JSDoc equivalent for ExtendedLayer
/**
 * @typedef {BaseLayerType & { overlapEcho?: OverlapEchoParams }} ExtendedLayer
 */

/**
 * @param {BaseLayerType} rect1
 * @param {BaseLayerType} rect2
 * @returns {number}
 */
function calculateOverlap(rect1, rect2) {
  const x_overlap = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
  const y_overlap = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
  const overlapArea = x_overlap * y_overlap;

  const area1 = rect1.width * rect1.height;
  const area2 = rect2.width * rect2.height;

  if (area1 === 0 || area2 === 0) return 0;
  return overlapArea / Math.min(area1, area2); // Percentage of smaller area
}
// --- END Overlap Detection and Types ---

/**
 * Generate a layered geometric composition
 */
export function generateLayeredGeometric(canvas, images, params) {
  if (!canvas || images.length === 0) return;
  
  if (params.useColorBlockEcho === undefined || params.useColorBlockEcho === false) { 
    params.useColorBlockEcho = Math.random() < 0.5; 
  }
  // If echo is enabled, also decide on the variation randomly
  if (params.useColorBlockEcho && params.useColorBlockEchoVariation === undefined) {
    params.useColorBlockEchoVariation = Math.random() < 0.5; // 50% chance for the variation
  }

  let effectiveLayerCount = params.layerCount || 5;
  if (params.useColorBlockEcho && effectiveLayerCount > 3) {
    effectiveLayerCount = Math.max(2, effectiveLayerCount - (Math.random() < 0.7 ? 2 : 1)); // Reduce by 1 or 2
  }
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background using palette-aware selection
  const bgColor = params.bgColor || getRandomColorFromPalette(images, 'auto');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create composition
  const layers = createLayeredComposition(
    canvas.width,
    canvas.height,
    effectiveLayerCount,
    params.style || 'dynamic'
  );
  
  // Apply color blocking if enabled
  if (params.useColorBlocking) {
    applyColorBlocking(ctx, layers, canvas.width, canvas.height);
  }
  
  // Draw layers
  drawLayers(ctx, layers, images, params);
  
  return { canvas, bgColor }; // Return canvas and bgColor used
}

/**
 * Create a layered composition
 */
function createLayeredComposition(width, height, layerCount, style) {
  switch (style) {
    case 'cascade':
      return createCascadeComposition(width, height, layerCount);
    case 'radial':
      return createRadialComposition(width, height, layerCount);
    case 'fibonacci':
      return createFibonacciComposition(width, height, layerCount);
    case 'dynamic':
    default:
      return createDynamicComposition(width, height, layerCount);
  }
}

/**
 * Create dynamic overlapping composition
 */
function createDynamicComposition(width, height, layerCount) {
  const layers = []; // Start with BaseLayerType (implicitly)
  const centerX = width / 2;
  const centerY = height / 2;
  
  const anchors = [
    { x: width / 3, y: height / 3 },
    { x: width * 2 / 3, y: height / 3 },
    { x: width / 3, y: height * 2 / 3 },
    { x: width * 2 / 3, y: height * 2 / 3 },
    { x: centerX, y: centerY }
  ];
  
  for (let i = 0; i < layerCount; i++) {
    const anchor = anchors[i % anchors.length];
    const offsetX = (Math.random() - 0.5) * width * 0.2;
    const offsetY = (Math.random() - 0.5) * height * 0.2;
    
    const sizeFactor = 0.3 + (1 - (i / layerCount)) * 0.4; // Corrected: (1 - i/layerCount)
    let size;
    const minCanvasDim = Math.min(width, height);
    const MIN_SIZE_THRESHOLD = minCanvasDim * 0.10; // Minimum 10% of smaller canvas dimension

    if (i === 0) { 
      size = minCanvasDim * (0.65 + Math.random() * 0.25); // 65-90%
    } else {
      let calculatedSize = minCanvasDim * (0.25 + Math.random() * (Math.max(0.1, sizeFactor - 0.1))); 
      size = Math.max(MIN_SIZE_THRESHOLD, calculatedSize);
    }
    
    const shapeType = getRandomGeometricMask();
    const rotation = ANGLE_HARMONY[Math.floor(Math.random() * ANGLE_HARMONY.length)];
    
    layers.push({
      type: shapeType,
      x: anchor.x + offsetX - size / 2,
      y: anchor.y + offsetY - size / 2,
      width: size,
      height: size, 
      rotation: rotation,
      // Opacity: ensure front layers can be more opaque
      opacity: 0.5 + (i / (layerCount -1 || 1)) * 0.5, // Scales 0.5 to 1.0 for front
      blendMode: 'multiply', // Default to multiply, drawLayers will adjust if needed
      layer: i,
      anchor: anchor
    });
  }
  ensureCoverageAndOpacity(layers, width, height, layerCount);
  
  // --- BEGIN Overlap Detection Logic for createDynamicComposition ---
  let extendedLayers = layers; // No explicit cast needed now, relying on structure
  const OVERLAP_THRESHOLD = 0.3; // 30% overlap

  for (let i = 0; i < extendedLayers.length; i++) {
    for (let j = i + 1; j < extendedLayers.length; j++) {
      const elementA = extendedLayers[i];
      const elementB = extendedLayers[j];

      const overlapPercentage = calculateOverlap(elementA, elementB);

      if (overlapPercentage > OVERLAP_THRESHOLD) {
        // elementA.layer and elementB.layer determine drawing order (lower is earlier/further back)
        // If elementA.layer < elementB.layer, B is on top of A.
        // If elementA.layer > elementB.layer, A is on top of B.
        // If layers are the same, the one later in the array (higher index) is considered on top for drawing.
        let topElement, bottomElement;
        if (elementA.layer < elementB.layer) {
          topElement = elementB;
          bottomElement = elementA;
        } else if (elementB.layer < elementA.layer) {
          topElement = elementA;
          bottomElement = elementB;
        } else {
          // Same conceptual layer, element with higher index j is drawn later, thus on top
          topElement = j > i ? elementB : elementA;
          bottomElement = topElement === elementA ? elementB : elementA;
        }
        
        console.log(`[LayeredGeometric Overlap] Significant overlap (${(overlapPercentage * 100).toFixed(1)}%) between element at index ${i} (layer ${elementA.layer}) and index ${j} (layer ${elementB.layer}). Top: index ${topElement === elementA ? i : j}`);

        if (!topElement.overlapEcho || !topElement.overlapEcho.active) {
          topElement.overlapEcho = {
            active: true,
            useComplementary: Math.random() < 0.5, // 50% chance
          };
        }
      }
    }
  }
  // --- END Overlap Detection Logic ---
  return extendedLayers; // Return the array that might have overlapEcho properties
}

/**
 * Create cascade composition - shapes flowing diagonally
 */
function createCascadeComposition(width, height, layerCount) {
  const layers = [];
  const diagonal = Math.sqrt(width * width + height * height);
  
  for (let i = 0; i < layerCount; i++) {
    const progress = i / (layerCount - 1 || 1); 
    const x = width * progress * (0.2 + Math.random() * 0.6) + (width*0.1); // Add more spread
    const y = height * progress * (0.2 + Math.random() * 0.6) + (height*0.1);
    
    const baseSize = Math.min(width, height) * (0.55 + Math.random() * 0.25); // 55-80% for first
    let size = baseSize * (1 - progress * 0.5); // Less drastic size reduction
    size = Math.max(size, Math.min(width, height) * 0.2); // Ensure min size of 20%
            
    const shapeType = getRandomGeometricMask();
    
    layers.push({
      type: shapeType,
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      rotation: progress * 90 + (Math.random() - 0.5) * 20,
      opacity: 0.6 + progress * 0.4, // Scales 0.6 to 1.0 for front
      blendMode: 'multiply', // Default to multiply
      layer: i
    });
  }
  ensureCoverageAndOpacity(layers, width, height, layerCount);
  return layers;
}

/**
 * Create radial composition - shapes radiating from center
 */
function createRadialComposition(width, height, layerCount) {
  const layers = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.5; // Increased maxRadius slightly
  
  for (let i = 0; i < layerCount -1; i++) { // Save one for a larger central element
    const angle = (i / (layerCount-1 || 1)) * Math.PI * 2;
    const radius = maxRadius * (0.3 + Math.random() * 0.7);
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const size = Math.min(width, height) * (0.25 + Math.random() * 0.25); // 25-50%
    
    layers.push({
      type: getRandomGeometricMask(),
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      rotation: angle * 180 / Math.PI + (Math.random() -0.5) * 30,
      opacity: 0.5 + Math.random() * 0.4, // Keep some variation
      blendMode: 'multiply', // Default to multiply
      layer: i
    });
  }
  
  const centralSize = Math.min(width, height) * (0.5 + Math.random() * 0.3); // 50-80%
  layers.push({
    type: getRandomGeometricMask(), 
    x: centerX - centralSize / 2 - (Math.random() -0.5) * width * 0.1, // slight offset
    y: centerY - centralSize / 2 - (Math.random() -0.5) * height * 0.1,
    width: centralSize,
    height: centralSize,
    rotation: (Math.random() - 0.5) * 20,
    opacity: 0.7 + Math.random() * 0.3, // Central can be quite opaque
    blendMode: 'multiply', // Default to multiply
    layer: layerCount -1 // Ensure it's among the top layers conceptually
  });
  ensureCoverageAndOpacity(layers, width, height, layerCount);
  return layers;
}

/**
 * Create Fibonacci-based composition
 */
function createFibonacciComposition(width, height, layerCount) {
  const layers = [];
  const numFibToUse = Math.min(Math.max(layerCount, 4), FIBONACCI.length); // Use at least 4 fib numbers
  const relevantFibonacci = FIBONACCI.slice(0, numFibToUse);
  const totalFib = relevantFibonacci.reduce((a, b) => a + b, 0);
  const baseScaleFactor = 0.9; 
  const baseSizeUnit = Math.min(width, height) * baseScaleFactor / totalFib;

  const availableAnchors = [
    { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, 
    { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 },
    { x: 0.15, y: 0.5}, {x: 0.85, y: 0.5}, {x:0.5, y:0.15}, {x:0.5, y:0.85} // Add more anchors
  ];
  
  for (let i = 0; i < Math.min(layerCount, numFibToUse); i++) {
    const fibValue = relevantFibonacci[numFibToUse - 1 - i]; // Start with largest Fib for base
    const size = fibValue * baseSizeUnit * (0.8 + Math.random() * 0.4); // Add slight variation
    
    const anchorIndex = Math.floor(Math.random() * availableAnchors.length);
    const anchor = availableAnchors[anchorIndex];
    // Make largest elements more central, allow bleed for them
    const x = width * anchor.x + (Math.random() - 0.5) * width * (i === 0 ? 0.1 : 0.2) - size / 2;
    const y = height * anchor.y + (Math.random() - 0.5) * height * (i === 0 ? 0.1 : 0.2) - size / 2;
    
    layers.push({
      type: getRandomGeometricMask(),
      x: x,
      y: y,
      width: size,
      height: size,
      rotation: (Math.random() - 0.5) * 45 + i * 15,
      opacity: 0.6 + Math.random() * 0.4, // Good range of opacities
      blendMode: 'multiply', // Default to multiply
      layer: i
    });
  }
  ensureCoverageAndOpacity(layers, width, height, layerCount);
  return layers;
}

// New helper function
function ensureCoverageAndOpacity(layers, canvasWidth, canvasHeight, layerCount) {
  if (!layers || layers.length === 0) return;

  // Ensure at least one element is 100% opaque
  // Pick a prominent one (e.g., largest or one of the first few generated)
  let hasFullOpacityElement = layers.some(l => l.opacity >= 0.99);
  if (!hasFullOpacityElement) {
    const targetIndex = Math.floor(Math.random() * Math.min(layers.length, 3)); // One of first 3
    if (layers[targetIndex]) {
      layers[targetIndex].opacity = 1.0;
    }
  }

  // Check for canvas fill - very simplified check based on sum of areas
  let totalArea = 0;
  layers.forEach(l => { totalArea += l.width * l.height; });
  const canvasArea = canvasWidth * canvasHeight;

  if (totalArea < canvasArea * 0.70 && layers.length < (layerCount + 2)) { // Don't add too many extra
    // Add 1-2 large background/bleed elements if coverage is too low
    const numToAdd = Math.random() < 0.6 ? 1 : 2;
    for (let k = 0; k < numToAdd; k++) {
      const bleedSize = Math.min(canvasWidth, canvasHeight) * (0.7 + Math.random() * 0.5); // 70% to 120%
      const bleedX = (Math.random() - 0.25) * canvasWidth * 0.5; // Allow bleeding left/right
      const bleedY = (Math.random() - 0.25) * canvasHeight * 0.5; // Allow bleeding top/bottom
      layers.unshift({ // Add to the back
        type: 'basic/rectangleMask', // Simple shapes for fill
        x: bleedX,
        y: bleedY,
        width: bleedSize,
        height: bleedSize * (0.7 + Math.random() * 0.6), // Allow non-square
        rotation: (Math.random() - 0.5) * 15,
        opacity: 0.3 + Math.random() * 0.3, // Subtler background elements
        blendMode: Math.random() < 0.5 ? 'multiply' : 'overlay',
        layer: -1 - k // Ensure they are at the very back
      });
    }
    layers.sort((a, b) => a.layer - b.layer); // Re-sort if elements were added
  }
}

/**
 * Apply color blocking to certain layers
 */
function applyColorBlocking(ctx, layers, canvasWidth, canvasHeight) {
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEA'
  ];
  
  // Select random layers for color blocking
  const colorBlockCount = Math.floor(layers.length * 0.3);
  const colorBlockIndices = new Set();
  
  while (colorBlockIndices.size < colorBlockCount) {
    colorBlockIndices.add(Math.floor(Math.random() * layers.length));
  }
  
  colorBlockIndices.forEach(index => {
    layers[index].colorBlock = colorPalette[index % colorPalette.length];
    layers[index].useImage = false;
  });
}

/**
 * Draw layered composition
 */
function drawLayers(ctx, layers, images, params) {
  const mainBgColor = params.bgColor || '#F5F5F5';

  // Sort layers by their 'layer' property to ensure correct drawing order (lower first)
  // Then, within the same conceptual layer, maintain original order (which usually means higher index is on top)
  const sortedLayers = [...layers].sort((a, b) => {
    if (a.layer !== b.layer) {
      return a.layer - b.layer;
    }
    // If layers are the same, we assume the original order in the layers array was somewhat intentional
    // or that the overlap detection correctly identified the top element already.
    // For drawing, the original index within the `layers` array can be a tie-breaker if needed, but `overlapEcho` is primary.
    return layers.indexOf(a) - layers.indexOf(b); 
  });

  sortedLayers.forEach((layerItem) => {
    const layer = layerItem; // No explicit cast needed now
    const { type, x, y, width, height, rotation, opacity, blendMode } = layer;
    const image = images[Math.floor(Math.random() * images.length)];

    let path;
    const [family, maskType] = type.split('/');
    const maskFnGetter = maskRegistry[family]?.[maskType];
    if (maskFnGetter) {
      try {
        const maskDescriptor = maskFnGetter();
        if (maskDescriptor && typeof maskDescriptor.getSvg === 'function') {
          path = svgToPath2D(maskDescriptor.getSvg({}));
        }
      } catch (e) { console.error(`Error getting mask for standard draw ${type}:`, e); }
    }
    if (!path) {
      console.warn(`Could not create path for mask: ${type}. Skipping layer.`);
      return;
    }

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2); // Translate to center for rotation
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-width / 2, -height / 2);     // Translate back
    ctx.scale(width / 100, height / 100);        // Scale to fit mask (assuming 0-100 viewBox)
    ctx.clip(path);

    const currentTransform = ctx.getTransform(); // Save transform for echo and image
    ctx.resetTransform(); // Reset for drawing with saved transform

    let imageDrawn = false;
    let actualBlendMode = blendMode;
    let finalOpacity = opacity;

    // --- BEGIN Overlap Echo Logic for drawLayers ---
    if (layer.overlapEcho?.active) {
      finalOpacity = 1.0; // Force opacity to 100% for elements with active overlap echo
      const echoColor = layer.overlapEcho.useComplementary 
        ? getComplementaryColor(mainBgColor) 
        : mainBgColor;
      const echoOpacity = 0.85; // Dedicated strong opacity for overlap echo
      
      console.log('[LayeredGeometric drawLayers] Applying OVERLAP Echo:', { maskType: type, echoColor, echoOpacity });

      ctx.save();
      ctx.setTransform(currentTransform);
      ctx.fillStyle = echoColor;
      ctx.globalAlpha = echoOpacity; // Use the dedicated overlap echo opacity
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.fill(); // fill() uses the current clip path
      ctx.restore();
      actualBlendMode = 'multiply'; // Force multiply if echo is drawn
    }
    // --- END Overlap Echo Logic ---
    // --- BEGIN Standard Color Block Echo (if no overlap echo and params.useColorBlockEcho) ---
    else if (params.useColorBlockEcho && image && image.complete) {
      const echoIsBase = params.useColorBlockEchoVariation; // Variation 1: echo is base, image on top
      const echoIsOverlay = !params.useColorBlockEchoVariation; // Variation 2: image is base, echo on top (less common for this effect)

      const echoColor = getComplementaryColor(mainBgColor); // Or derive from image?
      const echoOpacity = params.echoOpacity !== undefined ? params.echoOpacity : (echoIsBase ? 0.75 : 0.5);

      if (echoIsBase) {
        console.log('[LayeredGeometric drawLayers] Applying Standard Echo (Base):', { maskType: type, echoColor, echoOpacity });
        ctx.save();
        ctx.setTransform(currentTransform);
        ctx.fillStyle = echoColor;
        ctx.globalAlpha = echoOpacity * finalOpacity;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fill(); 
        ctx.restore();
        actualBlendMode = 'multiply'; // Image will be multiplied on top
      }
    }
    // --- END Standard Color Block Echo ---

    if (image && image.complete) {
      ctx.save();
      ctx.setTransform(currentTransform);
      ctx.globalAlpha = finalOpacity;
      ctx.globalCompositeOperation = params.useBlendModes ? actualBlendMode : 'source-over';
      
      // Draw image to fill the 0-100 clip space (which was scaled from original layer width/height)
      const imgWidth = image.naturalWidth;
      const imgHeight = image.naturalHeight;
      const imgRatio = imgWidth / imgHeight;
      const targetWidth = 100; 
      const targetHeight = 100;
      const targetRatio = targetWidth / targetHeight;
      let sWidth = imgWidth, sHeight = imgHeight, sx = 0, sy = 0;
      if (imgRatio > targetRatio) {
        sWidth = imgHeight * targetRatio;
        sx = (imgWidth - sWidth) / 2;
      } else {
        sHeight = imgWidth / targetRatio;
        sy = (imgHeight - sHeight) / 2;
      }
      ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
      imageDrawn = true;
      ctx.restore();
    }

    // Fallback if no image was drawn (e.g. image not complete) BUT an echo was meant to be drawn
    // This part ensures that if echo was drawn, it remains visible even if image fails.
    // The standard echo logic (echoIsBase) already handles this by drawing echo first.
    // For overlap echo, if image fails, echo is already there.

    if (!imageDrawn && (layer.overlapEcho?.active /* || (params.useColorBlockEcho && params.useColorBlockEchoVariation) */)) {
      // If an echo (overlap or standard base) was intended/drawn and image failed,
      // we don't need to do anything extra as the echo is already on canvas.
      // If it was a standard overlay echo and image failed, then nothing shows (which is fine).
       console.log(`[LayeredGeometric drawLayers] Image for mask ${type} not drawn, echo was active: ${!!layer.overlapEcho?.active}`);
    } else if (!imageDrawn && !layer.overlapEcho?.active && !params.useColorBlockEcho) {
        // If no image and no echo of any kind, fill with a semi-transparent version of background as a fallback placeholder
        // to indicate the shape was there, but only if not using any echo which would have already filled it.
        ctx.save();
        ctx.setTransform(currentTransform);
        ctx.fillStyle = mainBgColor; 
        ctx.globalAlpha = 0.15 * finalOpacity;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fill();
        ctx.restore();
        console.warn(`[LayeredGeometric drawLayers] Image for mask ${type} not drawn and no echo. Filled with placeholder.`);
    }

    // Old outline logic - keep for now if params.showOutlines is true
    if (params.showOutlines) {
      ctx.setTransform(currentTransform);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5 * (100 / Math.max(width, height));
      ctx.stroke(path);
    }
    ctx.restore(); // Restore for the main save() at the start of this layer's drawing
  });
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
const layeredGeometric = {
  key: 'layeredGeometric',
  name: 'Layered Geometric',
  generate: generateLayeredGeometric,
  params: {
    layerCount: { type: 'number', min: 3, max: 8, default: 5 },
    style: { type: 'select', options: ['dynamic', 'cascade', 'radial', 'fibonacci'], default: 'dynamic' },
    useColorBlocking: { type: 'boolean', default: false },
    useBlendModes: { type: 'boolean', default: true },
    showOutlines: { type: 'boolean', default: false },
    bgColor: { type: 'color' },
    useMultiply: { type: 'boolean', default: true },
    useColorBlockEcho: { type: 'boolean', default: false },
    useColorBlockEchoVariation: { type: 'boolean', default: false },
  }
};

export default layeredGeometric;
