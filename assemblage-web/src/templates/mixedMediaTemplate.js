// Attempting to resolve Vite parsing error by ensuring .jsx extension for any potential JSX content.

// mixedMediaTemplate.js - A template that combines masked shapes with color blocking

import { getMaskDescriptor } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageWithAspectRatio } from '../utils/imageDrawing';
import { vibrantColors, getRandomColorFromPalette } from '../utils/colors';
import { getComplementaryColor } from '../utils/colorUtils';

const MAX_TOTAL_IMAGES = 7; // Maximum images to use in a collage

/**
 * Mixed Media Template - Combines masked images with color blocks for a rich, full composition
 * Follows design principles: rule of thirds, visual hierarchy, balance, and rhythm
 */
function renderMixedMedia(canvas, images, params = {}) {
  if (!canvas || !images) {
    console.warn('[MixedMediaTemplate] Canvas or initial images not provided');
    return { canvas, bgColor: '#FFFFFF' };
  }

  const ctx = canvas.getContext('2d');
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  let initialBgColor = params.bgColor || getRandomColorFromPalette(images, 'auto');
  let finalBgColorForReport = initialBgColor; // For UI reporting, always the initial color

  // Base fill for the entire canvas
  ctx.fillStyle = initialBgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let currentBgImage = null;
  let imagesForElements = [...images]; 

  // Force NO background image much more often for testing variation (80% chance of NO full BG)
  const shouldUseBackgroundImage = (params.useBackgroundImage !== undefined ? params.useBackgroundImage : Math.random() < 0.2); 

  if (shouldUseBackgroundImage && imagesForElements.length > 0) {
    const bgImageIndex = Math.floor(Math.random() * imagesForElements.length);
    currentBgImage = imagesForElements.splice(bgImageIndex, 1)[0];
    if (currentBgImage && currentBgImage.complete && currentBgImage.naturalWidth > 0) {
      const useShapedBackground = Math.random() < 0.5; 
      if (useShapedBackground) {
        // 1. Adjust Shaped Background Sizing & 2. Outer Color
        if (Math.random() < 0.5) { // 50% chance for complementary outer background
            ctx.fillStyle = getComplementaryColor(initialBgColor);
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } // else, initialBgColor is already there

        // 1. Refined Shaped Background Mask Choices
        const shapedBgMaskOptions = [
            'basic/rectangleMask', 'basic/semiCircleMask', 'basic/triangleMask', 
            'basic/hexagonMask', 'architectural/archClassical' 
            // 'sliced/sliceHorizontalWide' was removed as beam might be too narrow by default
        ];
        const bgMaskName = shapedBgMaskOptions[Math.floor(Math.random() * shapedBgMaskOptions.length)];
        const bgMaskDescriptor = getMaskDescriptor(bgMaskName);
        
        let bgShapeWidth, bgShapeHeight;
        // Make shaped backgrounds generally larger and full-bleed on one axis
        if (Math.random() < 0.5) { // Fill width
            bgShapeWidth = canvasWidth; 
            bgShapeHeight = canvasHeight * (0.7 + Math.random() * 0.3); // 70-100% height
        } else { // Fill height
            bgShapeHeight = canvasHeight;
            bgShapeWidth = canvasWidth * (0.7 + Math.random() * 0.3); // 70-100% width
        }
        // Center it
        const bgShapeX = (canvasWidth - bgShapeWidth) / 2;
        const bgShapeY = (canvasHeight - bgShapeHeight) / 2;

        ctx.save();
        ctx.translate(bgShapeX, bgShapeY);
        let actualMaskApplied = false;
        if (bgMaskDescriptor && bgMaskDescriptor.kind === 'svg') {
          const svgString = bgMaskDescriptor.getSvg();
          const maskPath = svgToPath2D(svgString);
          if (maskPath) {
            ctx.scale(bgShapeWidth / 100, bgShapeHeight / 100);
            ctx.clip(maskPath); 
            ctx.scale(100 / bgShapeWidth, 100 / bgShapeHeight); 
            actualMaskApplied = true;
          }
        }
        if (!actualMaskApplied) { 
            ctx.beginPath(); ctx.rect(0, 0, bgShapeWidth, bgShapeHeight); ctx.clip();
        }
        
        // Fill the clipped shape area with initialBgColor first (so multiply has a base)
        ctx.fillStyle = initialBgColor; 
        ctx.fillRect(0, 0, bgShapeWidth, bgShapeHeight);

        const bgImageDrawOpts = { blendMode: 'multiply', opacity: 0.9, cover: true };
        drawImageWithAspectRatio(ctx, currentBgImage, 0, 0, bgShapeWidth, bgShapeHeight, bgImageDrawOpts);
        ctx.restore();

      } else { // Full canvas background image (as before)
        const bgImageDrawOptions = { blendMode: 'multiply', opacity: 0.85, cover: true };
        drawImageWithAspectRatio(ctx, currentBgImage, 0, 0, canvasWidth, canvasHeight, bgImageDrawOptions);
      }
    } else { currentBgImage = null; }
  }
  // Canvas now has initialBgColor, potentially overlaid with a multiplied currentBgImage.

  // Calculate grid based on rule of thirds
  const cols = 3;
  const rows = 3;
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  // Define composition types
  const compositionTypes = ['dynamic', 'balanced', 'hierarchical'];
  const compositionType = params.compositionType || compositionTypes[Math.floor(Math.random() * compositionTypes.length)];

  // Corrected maskOptions list
  const maskOptions = [
    'basic/circleMask',
    'basic/hexagonMask',
    'basic/diamondMask',
    'basic/triangleMask',
    'basic/semiCircleMask',
    'basic/rectangleMask',      
    'architectural/archClassical',
    'abstract/blobIrregular',
    'abstract/polygonSoft',
    'altar/nicheArch',          
    'altar/gableAltar',           
    'narrative/panelRectWide',    
    'narrative/panelRectTall',    
    'narrative/panelSquare',      
    'narrative/panelGutter',      
    'sliced/sliceHorizontalWide', // Adding some slices back for variety
    'sliced/sliceVerticalWide'
  ];

  let elements = [];
  switch (compositionType) {
    case 'dynamic':
      elements = createDynamicComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage);
      break;
    case 'balanced':
      elements = createBalancedComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage);
      break;
    case 'hierarchical':
      elements = createHierarchicalComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage);
      break;
  }

  const unmaskedElements = createUnmaskedElements(canvasWidth, canvasHeight, elements);
  const allElements = [...elements, ...unmaskedElements];
  
  const maxImagesForElements = currentBgImage ? MAX_TOTAL_IMAGES - 1 : MAX_TOTAL_IMAGES;
  
  const imageIndices = selectImageElements(allElements, imagesForElements, params.imageRatio || 0.6, maxImagesForElements);
  
  // Color Harmony: Always use generateAccentColors based on initialBgColor
  const complementaryColor = getComplementaryColor(initialBgColor);
  const accentColorsForForeground = generateAccentColors(initialBgColor, complementaryColor);

  // Corrected population of actualImagesToDrawForElements
  const actualImagesToDrawForElements = [];
  if (imagesForElements.length > 0 && imageIndices.length > 0) {
    for (let i = 0; i < imageIndices.length; i++) {
      actualImagesToDrawForElements.push(imagesForElements[i % imagesForElements.length]);
    }
  }

  allElements.forEach((element, index) => {
    const isImageElement = imageIndices.includes(index);
    const imageToDraw = isImageElement ? actualImagesToDrawForElements[imageIndices.indexOf(index)] : null;
    if (!imageToDraw && params.skipPureColorBlocks === true) { return; } // Hardcoding removal of color blocks
    if (!imageToDraw && true) { return; } // FORCE REMOVE COLOR BLOCKS FOR THIS TEST

    ctx.save(); 
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.max(1, Math.floor(element.width));
      tempCanvas.height = Math.max(1, Math.floor(element.height));
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) { ctx.restore(); return; }

      let effectiveMaskName = element.maskName;
      if (imageToDraw && element.maskName === 'none') { effectiveMaskName = 'basic/rectangleMask'; }
      
      let maskAppliedOnTemp = false;
      if (effectiveMaskName && effectiveMaskName !== 'none') {
        const maskDescriptor = getMaskDescriptor(effectiveMaskName);
        if (maskDescriptor && maskDescriptor.kind === 'svg') {
          const svgString = maskDescriptor.getSvg();
          const maskPath = svgToPath2D(svgString);
          if (maskPath) {
            tempCtx.scale(tempCanvas.width / 100, tempCanvas.height / 100);
            tempCtx.clip(maskPath);
            tempCtx.scale(100 / tempCanvas.width, 100 / tempCanvas.height);
            maskAppliedOnTemp = true;
          }
        }
      }
      if (!maskAppliedOnTemp) { 
        tempCtx.beginPath(); tempCtx.rect(0, 0, tempCanvas.width, tempCanvas.height); tempCtx.clip(); 
        maskAppliedOnTemp = true; 
      }

      if (maskAppliedOnTemp && imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
        const colorIndexToUse = Math.abs(index) % accentColorsForForeground.length;
        const baseFillColor = accentColorsForForeground[colorIndexToUse];
        tempCtx.fillStyle = baseFillColor; 
        tempCtx.globalAlpha = 1.0;      
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.globalCompositeOperation = 'multiply';
        tempCtx.globalAlpha = element.opacity || 0.9; 
        const imgWidth = imageToDraw.naturalWidth || imageToDraw.width;
        const imgHeight = imageToDraw.naturalHeight || imageToDraw.height;
        const imgRatio = imgWidth / imgHeight;
        const tempCanvasRatio = tempCanvas.width / tempCanvas.height;
        let sourceX = 0, sourceY = 0, sourceWidth = imgWidth, sourceHeight = imgHeight;
        if (imgRatio > tempCanvasRatio) {
          sourceWidth = imgHeight * tempCanvasRatio; sourceX = (imgWidth - sourceWidth) / 2;
        } else { 
          sourceHeight = imgWidth / tempCanvasRatio; sourceY = (imgHeight - sourceHeight) / 2;
        }
        try { tempCtx.drawImage(imageToDraw, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, tempCanvas.width, tempCanvas.height); }
        catch (e) { console.error(`[Element ${index}] Error in tempCtx.drawImage:`, e); }
      } 
      
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      if (element.rotation) ctx.rotate(element.rotation * Math.PI / 180);
      ctx.translate(-element.width / 2, -element.height / 2);
      ctx.drawImage(tempCanvas, 0, 0);

    } catch (error) {
      console.error(`[Element ${index}] Error drawing element:`, error, element);
    } finally {
      ctx.restore(); 
    }
  });

  if (params.useTexture !== false) {
    addTextureOverlay(ctx, canvasWidth, canvasHeight);
  }

  return { canvas, bgColor: finalBgColorForReport };
}

/**
 * Create a dynamic composition with overlapping elements
 */
function createDynamicComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage) {
  const elements = [];
  const numElements = currentBgImage ? (2 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 2)); // 2-3 elements
  const MIN_ELEMENT_SIDE = Math.max(80, Math.min(canvasWidth, canvasHeight) * (currentBgImage ? 0.20 : 0.28)); // Slightly larger base if no BG
  const placedElements = [];

  for (let i = 0; i < numElements; i++) {
    let currentSize;
    if (i === 0) { 
      currentSize = Math.min(canvasWidth, canvasHeight) * (currentBgImage ? (0.45 + Math.random() * 0.2) : (0.60 + Math.random() * 0.2)); // 60-80% if no BG
    } else { 
      currentSize = (placedElements[0].width) * (0.5 + Math.random() * 0.3); // 50-80% of the first element's size
    }
    currentSize = Math.max(MIN_ELEMENT_SIDE, currentSize);
    currentSize = Math.min(currentSize, Math.min(canvasWidth, canvasHeight) * 0.90);

    let x, y;
    let attempts = 0;
    let placementFound = false;

    while(!placementFound && attempts < 50) {
        attempts++;
        if (i === 0 || placedElements.length === 0) {
            x = canvasWidth * (0.25 + Math.random() * 0.5) - currentSize / 2; 
            y = canvasHeight * (0.25 + Math.random() * 0.5) - currentSize / 2;
        } else {
            const anchorElement = placedElements[placedElements.length - 1]; // Anchor to the LAST placed element
            const sideToAttach = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
            
            // Aim for direct edge contact or slight overlap
            const overlapFactor = 0.05 + Math.random() * 0.15; // 5% to 20% overlap of new element's size

            switch (sideToAttach) {
                case 0: // Place above anchor, aligning horizontal centers, overlapping bottom of new with top of anchor
                    x = anchorElement.x + (anchorElement.width - currentSize) / 2;
                    y = anchorElement.y - currentSize + (currentSize * overlapFactor);
                    break;
                case 1: // Place to right of anchor, aligning vertical centers, overlapping left of new with right of anchor
                    x = anchorElement.x + anchorElement.width - (currentSize * overlapFactor);
                    y = anchorElement.y + (anchorElement.height - currentSize) / 2;
                    break;
                case 2: // Place below anchor, aligning horizontal centers, overlapping top of new with bottom of anchor
                    x = anchorElement.x + (anchorElement.width - currentSize) / 2;
                    y = anchorElement.y + anchorElement.height - (currentSize * overlapFactor);
                    break;
                case 3: // Place to left of anchor, aligning vertical centers, overlapping right of new with left of anchor
                    x = anchorElement.x - currentSize + (currentSize * overlapFactor);
                    y = anchorElement.y + (anchorElement.height - currentSize) / 2;
                    break;
            }
        }
        const maxOffCanvas = 0.20; // Allow up to 20% off canvas
        x = Math.max(-currentSize * maxOffCanvas, Math.min(canvasWidth - currentSize * (1 - maxOffCanvas), x));
        y = Math.max(-currentSize * maxOffCanvas, Math.min(canvasHeight - currentSize * (1 - maxOffCanvas), y));
        
        let tooMuchTotalOverlap = false;
        if (i > 0) {
            for (const el of placedElements) {
                const overlapX = Math.max(0, Math.min(x + currentSize, el.x + el.width) - Math.max(x, el.x));
                const overlapY = Math.max(0, Math.min(y + currentSize, el.y + el.height) - Math.max(y, el.y));
                const overlapArea = overlapX * overlapY;
                if ((overlapArea / (currentSize * currentSize) > 0.70) ) {
                    tooMuchTotalOverlap = true; break;
                }
            }
        }
        if (!tooMuchTotalOverlap) placementFound = true;
    }
     if (!placementFound) { 
        x = Math.random() * (canvasWidth - currentSize);
        y = Math.random() * (canvasHeight - currentSize);
    }
    elements.push({
      maskName: maskOptions[Math.floor(Math.random() * maskOptions.length)],
      x, y, width: currentSize, height: currentSize,
      rotation: (Math.random() - 0.5) * 5, // Max +/- 2.5 degrees rotation, very subtle
      opacity: 0.92 + Math.random() * 0.08, // Consistently high opacity
      blendMode: 'multiply', layer: i
    });
    placedElements.push({x, y, width: currentSize, height: currentSize});
  }
  return elements;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Create a balanced composition using grid with variations
 */
function createBalancedComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage) {
  const elements = [];
  const padding = Math.min(cellWidth, cellHeight) * 0.1;

  const MIN_ELEMENT_SIDE = Math.max(50, Math.min(canvasWidth, canvasHeight) * 0.1);

  // Create a 3x3 grid with some cells merged
  const gridPattern = [
    { col: 0, row: 0, colspan: 1, rowspan: 1 },
    { col: 1, row: 0, colspan: 2, rowspan: 1 },
    { col: 0, row: 1, colspan: 1, rowspan: 2 },
    { col: 1, row: 1, colspan: 1, rowspan: 1 },
    { col: 2, row: 1, colspan: 1, rowspan: 1 },
    { col: 1, row: 2, colspan: 2, rowspan: 1 }
  ];

  gridPattern.forEach((cell, index) => {
    let width = cell.colspan * cellWidth - padding * 2;
    let height = cell.rowspan * cellHeight - padding * 2;
    width = Math.max(MIN_ELEMENT_SIDE, width);
    height = Math.max(MIN_ELEMENT_SIDE, height);

    // Add some variation to prevent perfect grid
    const x = cell.col * cellWidth + padding + (Math.random() - 0.5) * padding;
    const y = cell.row * cellHeight + padding + (Math.random() - 0.5) * padding;

    elements.push({
      maskName: maskOptions[Math.floor(Math.random() * maskOptions.length)],
      x: Math.max(0, Math.min(canvasWidth - width, x)),
      y: Math.max(0, Math.min(canvasHeight - height, y)),
      width: width,
      height: height,
      rotation: Math.random() > 0.7 ? (Math.random() - 0.5) * 10 : 0,
      opacity: 0.8 + Math.random() * 0.2,
      blendMode: 'multiply',
      layer: index
    });
  });

  return elements;
}

/**
 * Create a hierarchical composition with clear focal point
 */
function createHierarchicalComposition(canvasWidth, canvasHeight, cellWidth, cellHeight, maskOptions, currentBgImage) {
  const elements = [];

  const MIN_ELEMENT_SIDE = Math.max(50, Math.min(canvasWidth, canvasHeight) * 0.1);

  // Main focal element (large)
  let mainSize = Math.min(canvasWidth, canvasHeight) * 0.5;
  mainSize = Math.max(MIN_ELEMENT_SIDE, mainSize);
  elements.push({
    maskName: maskOptions[Math.floor(Math.random() * 5)], // Use more interesting masks for focal
    x: (canvasWidth - mainSize) / 2,
    y: (canvasHeight - mainSize) / 2,
    width: mainSize,
    height: mainSize,
    rotation: 0,
    opacity: 1,
    blendMode: 'multiply',
    layer: 10
  });

  // Secondary elements (medium)
  let secondarySize = mainSize * 0.5;
  secondarySize = Math.max(MIN_ELEMENT_SIDE, secondarySize);
  // Ensure secondary elements are not excessively small relative to main, but still smaller
  secondarySize = Math.max(mainSize * 0.25, secondarySize); 

  const positions = [
    { x: mainSize * 0.1, y: mainSize * 0.1 },
    { x: canvasWidth - secondarySize - mainSize * 0.1, y: mainSize * 0.1 },
    { x: mainSize * 0.1, y: canvasHeight - secondarySize - mainSize * 0.1 },
    { x: canvasWidth - secondarySize - mainSize * 0.1, y: canvasHeight - secondarySize - mainSize * 0.1 }
  ];

  positions.forEach((pos, index) => {
    if (Math.random() > 0.3) { // 70% chance to add secondary element
      elements.push({
        maskName: maskOptions[Math.floor(Math.random() * maskOptions.length)],
        x: pos.x,
        y: pos.y,
        width: secondarySize,
        height: secondarySize,
        rotation: (Math.random() - 0.5) * 20,
        opacity: 0.8,
        blendMode: 'multiply',
        layer: 5 + index
      });
    }
  });

  // Tertiary elements (small accents)
  const numAccents = 2 + Math.floor(Math.random() * 2); // Reduced accents: 2-3
  for (let i = 0; i < numAccents; i++) {
    let accentSize = secondarySize * 0.4; // Accent relative to secondary
    accentSize = Math.max(MIN_ELEMENT_SIDE * 0.75, accentSize); // Slightly smaller min for accents if needed
    accentSize = Math.max(mainSize*0.1, accentSize); // Ensure not too tiny vs main element
    elements.push({
      maskName: maskOptions[Math.floor(Math.random() * maskOptions.length)],
      x: Math.random() * (canvasWidth - accentSize),
      y: Math.random() * (canvasHeight - accentSize),
      width: accentSize,
      height: accentSize,
      rotation: Math.random() * 360,
      opacity: 0.6 + Math.random() * 0.2,
      blendMode: Math.random() > 0.5 ? 'multiply' : 'source-over',
      layer: i
    });
  }

  return elements;
}

/**
 * Create unmasked image elements to add visual variety
 */
function createUnmaskedElements(canvasWidth, canvasHeight, existingElements) {
  const unmaskedElements = [];
  const numUnmasked = 1 + Math.floor(Math.random() * 2); // Reduced to 1-2 unmasked elements
  
  const MIN_ELEMENT_SIDE = Math.max(50, Math.min(canvasWidth, canvasHeight) * 0.15); // Slightly larger min for unmasked

  for (let i = 0; i < numUnmasked; i++) {
    // Vary sizes for unmasked elements
    const sizeType = Math.random();
    let width, height;
    
    if (sizeType < 0.3) {
      // Large unmasked element
      width = canvasWidth * (0.3 + Math.random() * 0.2);
      height = canvasHeight * (0.3 + Math.random() * 0.2);
    } else if (sizeType < 0.7) {
      // Medium unmasked element
      width = canvasWidth * (0.15 + Math.random() * 0.15);
      height = canvasHeight * (0.15 + Math.random() * 0.15);
    } else {
      // Small accent element
      width = canvasWidth * (0.1 + Math.random() * 0.1);
      height = canvasHeight * (0.1 + Math.random() * 0.1);
    }
    
    width = Math.max(MIN_ELEMENT_SIDE, width);
    height = Math.max(MIN_ELEMENT_SIDE, height);
    
    // Position with some overlap consideration
    let x, y;
    let attempts = 0;
    do {
      x = Math.random() * (canvasWidth - width);
      y = Math.random() * (canvasHeight - height);
      attempts++;
    } while (attempts < 10 && checkOverlap(x, y, width, height, existingElements) > 0.6);
    
    unmaskedElements.push({
      maskName: 'none', // No mask for these elements
      x,
      y,
      width,
      height,
      rotation: (Math.random() - 0.5) * 15, // Less extreme rotation for unmasked
      opacity: 0.85 + Math.random() * 0.15, // Tend to be lower layers
      blendMode: 'multiply',
      layer: Math.floor(Math.random() * 5)
    });
  }
  
  return unmaskedElements;
}

/**
 * Check overlap between a rectangle and existing elements
 */
function checkOverlap(x, y, width, height, elements) {
  let maxOverlap = 0;
  
  for (const element of elements) {
    const overlapX = Math.max(0, Math.min(x + width, element.x + element.width) - Math.max(x, element.x));
    const overlapY = Math.max(0, Math.min(y + height, element.y + element.height) - Math.max(y, element.y));
    const overlapArea = overlapX * overlapY;
    const elementArea = element.width * element.height;
    const newArea = width * height;
    const overlapRatio = overlapArea / Math.min(elementArea, newArea);
    maxOverlap = Math.max(maxOverlap, overlapRatio);
  }
  
  return maxOverlap;
}

/**
 * Select which elements should display images vs color blocks, respecting maxImages.
 */
function selectImageElements(allElements, availableImagesInput, imageRatio, maxImagesToUse) {
  const numElements = allElements.length;
  // Ensure availableImages is always an array, even if empty.
  const availableImages = Array.isArray(availableImagesInput) ? availableImagesInput : [];


  if (availableImages.length === 0 || maxImagesToUse <= 0) {
    return []; // No images to assign
  }

  let numImageElementsToAssign = Math.floor(numElements * imageRatio);
  // Cap by maxImagesToUse, the number of available images, and the number of elements
  numImageElementsToAssign = Math.min(numImageElementsToAssign, maxImagesToUse, availableImages.length, numElements);

  const indices = [];
  // Prioritize larger elements for images
  const sortedIndicesByElementSize = allElements
    .map((el, idx) => ({ idx, size: el.width * el.height, ...el })) // spread el for potential metadata use later
    .sort((a, b) => b.size - a.size)
    .map(item => item.idx);

  for (let i = 0; i < numImageElementsToAssign && i < sortedIndicesByElementSize.length; i++) {
    indices.push(sortedIndicesByElementSize[i]);
  }
  return indices;
}

/**
 * Generate accent colors based on background and complementary colors
 */
function generateAccentColors(bgColor, complementaryColor) {
  const colors = [complementaryColor];
  
  // Add variations of the complementary color
  const comp = hexToRgb(complementaryColor);
  if (comp) {
    // Lighter version
    colors.push(rgbToHex(
      Math.min(255, comp.r + 50),
      Math.min(255, comp.g + 50),
      Math.min(255, comp.b + 50)
    ));
    
    // Darker version
    colors.push(rgbToHex(
      Math.max(0, comp.r - 50),
      Math.max(0, comp.g - 50),
      Math.max(0, comp.b - 50)
    ));
  }

  // Add a contrasting color from the vibrant palette
  const contrastColor = vibrantColors.find(color => 
    color !== bgColor && color !== complementaryColor &&
    color.toUpperCase() !== '#FFFFFF' && color.toUpperCase() !== '#FEFEFE' // Explicitly avoid white here too
  ) || (complementaryColor === '#FFFFFF' ? '#AAAAAA' : getComplementaryColor(complementaryColor)); // Better fallback for contrast
  colors.push(contrastColor);

  let filteredColors = colors.filter(c => c && c.toUpperCase() !== '#FFFFFF' && c.toUpperCase() !== '#FEFEFE');
  if (filteredColors.length === 0) {
    // Fallback if all generated/found colors were white/very light
    // Provide a broader fallback palette not solely dependent on complement of white
    filteredColors = ['#AAAAAA', '#888888', getComplementaryColor(bgColor === '#FFFFFF' ? '#000000' : bgColor)];
    // Ensure this fallback also doesn't contain white
    filteredColors = filteredColors.filter(c => c && c.toUpperCase() !== '#FFFFFF' && c.toUpperCase() !== '#FEFEFE');
    if (filteredColors.length === 0) filteredColors = ['#CCCCCC']; // Absolute fallback
  }
  return filteredColors;
}

/**
 * Add subtle texture overlay for visual interest
 */
function addTextureOverlay(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.1;

  // Create a simple noise texture
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
    ctx.fill();
  }

  ctx.restore();
}

// Helper functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Template configuration
const mixedMediaTemplate = {
  key: 'mixedMedia',
  name: 'Mixed Media',
  render: renderMixedMedia,
  generate: renderMixedMedia,
  params: {
    compositionType: { type: 'select', options: ['dynamic', 'balanced', 'hierarchical'], default: 'dynamic' },
    imageRatio: { type: 'number', min: 0.3, max: 0.8, default: 0.6, step: 0.1 },
    useTexture: { type: 'boolean', default: true },
    bgColor: { type: 'color' },
    useBackgroundImage: { type: 'boolean', default: true },
    shapeUnmaskedColorBlocks: { type: 'boolean', default: true },
    skipPureColorBlocks: { type: 'boolean', default: false }
  }
};

export default mixedMediaTemplate;
