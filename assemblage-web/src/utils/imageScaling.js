/**
 * Utility functions for proper image scaling and aspect ratio handling in templates
 */

/**
 * Calculate optimal image scaling to fill a mask completely while maintaining aspect ratio
 * This prevents edge visibility by ensuring the image covers the entire mask area
 * 
 * @param {HTMLImageElement} image - The image to scale
 * @param {number} maskWidth - Width of the mask area
 * @param {number} maskHeight - Height of the mask area
 * @param {number} maskAspectRatio - Optional: aspect ratio of the mask if different from width/height
 * @returns {Object} Scaling parameters for drawImage
 */
export function calculateImageScaling(image, maskWidth, maskHeight, maskAspectRatio = null) {
  if (!image || !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
    console.warn('[calculateImageScaling] Image not loaded or invalid');
    return null;
  }

  const imgWidth = image.naturalWidth;
  const imgHeight = image.naturalHeight;
  const imgRatio = imgWidth / imgHeight;
  const targetRatio = maskAspectRatio || (maskWidth / maskHeight);

  // Source cropping parameters (what part of the image to use)
  let sourceX = 0, sourceY = 0, sourceWidth = imgWidth, sourceHeight = imgHeight;
  
  // Destination drawing parameters (where to draw in the mask)
  let destX = 0, destY = 0, destWidth = maskWidth, destHeight = maskHeight;

  // First, crop the source image to match the mask's aspect ratio
  if (imgRatio > targetRatio) {
    // Image is wider than mask - crop image width, keep full height
    sourceWidth = imgHeight * targetRatio;
    sourceX = (imgWidth - sourceWidth) / 2;
  } else if (imgRatio < targetRatio) {
    // Image is taller than mask - crop image height, keep full width
    sourceHeight = imgWidth / targetRatio;
    sourceY = (imgHeight - sourceHeight) / 2;
  }
  // If ratios match exactly, no cropping needed

  // FIXED: Always scale to COVER the mask area (no gaps or edges visible)
  // Calculate scale to ensure the image completely fills the mask
  const croppedRatio = sourceWidth / sourceHeight;
  const maskDisplayRatio = maskWidth / maskHeight;

  // Always use "cover" behavior - scale the image so it completely fills the mask
  // This may cause some parts of the image to be clipped, but ensures no gaps
  if (croppedRatio > maskDisplayRatio) {
    // Image is wider than mask - scale to fill height completely, overflow width
    destHeight = maskHeight;
    destWidth = destHeight * croppedRatio;
    destX = (maskWidth - destWidth) / 2;
    destY = 0;
  } else {
    // Image is taller than mask - scale to fill width completely, overflow height  
    destWidth = maskWidth;
    destHeight = destWidth / croppedRatio;
    destX = 0;
    destY = (maskHeight - destHeight) / 2;
  }
  
  // CRITICAL FIX: Always scale to COMPLETELY COVER the mask area
  // For architectural masks like arches, we need to ensure no gaps are visible
  // Always scale up to ensure complete coverage, even if it means clipping image content
  const coverageScaleX = maskWidth / destWidth;
  const coverageScaleY = maskHeight / destHeight;
  const minimumCoverageScale = Math.max(coverageScaleX, coverageScaleY, 1.0);
  
  // Apply the coverage scale to guarantee complete filling
  destWidth *= minimumCoverageScale;
  destHeight *= minimumCoverageScale;
  destX = (maskWidth - destWidth) / 2;
  destY = (maskHeight - destHeight) / 2;
  
  // ADDITIONAL FIX: For architectural shapes, add a safety margin to ensure complete coverage
  // This accounts for any irregularities in mask shapes like arches
  const safetyScale = 1.05; // 5% additional scaling for safety
  destWidth *= safetyScale;
  destHeight *= safetyScale;
  destX = (maskWidth - destWidth) / 2;
  destY = (maskHeight - destHeight) / 2;

  return {
    // Source rectangle (from the original image)
    sourceX: Math.round(sourceX),
    sourceY: Math.round(sourceY), 
    sourceWidth: Math.round(sourceWidth),
    sourceHeight: Math.round(sourceHeight),
    
    // Destination rectangle (in the mask coordinate space)
    destX: Math.round(destX),
    destY: Math.round(destY),
    destWidth: Math.round(destWidth),
    destHeight: Math.round(destHeight),
    
    // Metadata for debugging
    originalImageRatio: imgRatio,
    maskRatio: targetRatio,
    croppedRatio: croppedRatio
  };
}

/**
 * Draw an image into a mask with proper aspect ratio scaling
 * This is a convenience function that combines scaling calculation with drawing
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context (already transformed and clipped)
 * @param {HTMLImageElement} image - Image to draw
 * @param {number} maskWidth - Width of the mask area (usually 100 for normalized coords)
 * @param {number} maskHeight - Height of the mask area (usually 100 for normalized coords)
 * @param {Object} options - Drawing options
 */
export function drawImageInMask(ctx, image, maskWidth, maskHeight, options = {}) {
  const {
    maskAspectRatio = null,
    opacity = 1.0,
    blendMode = 'multiply'
  } = options;

  const scaling = calculateImageScaling(image, maskWidth, maskHeight, maskAspectRatio);
  if (!scaling) {
    console.warn('[drawImageInMask] Could not calculate scaling parameters');
    return;
  }

  // Apply drawing options
  const previousAlpha = ctx.globalAlpha;
  const previousBlendMode = ctx.globalCompositeOperation;
  
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = blendMode;

  try {
    ctx.drawImage(
      image,
      scaling.sourceX, scaling.sourceY, scaling.sourceWidth, scaling.sourceHeight,
      scaling.destX, scaling.destY, scaling.destWidth, scaling.destHeight
    );
    
    console.log(`[drawImageInMask] Drew image with scaling:`, {
      originalRatio: scaling.originalImageRatio.toFixed(2),
      maskRatio: scaling.maskRatio.toFixed(2),
      croppedRatio: scaling.croppedRatio.toFixed(2),
      source: `${scaling.sourceX},${scaling.sourceY},${scaling.sourceWidth}x${scaling.sourceHeight}`,
      dest: `${scaling.destX},${scaling.destY},${scaling.destWidth}x${scaling.destHeight}`,
      maskDimensions: `${maskWidth}x${maskHeight}`,
      maskAspectRatio: options.maskAspectRatio ? options.maskAspectRatio.toFixed(2) : 'auto',
      fillsCoverage: `${((scaling.destWidth >= maskWidth && scaling.destHeight >= maskHeight) ? 'FULL' : 'PARTIAL')} coverage`
    });
  } catch (error) {
    console.error('[drawImageInMask] Error drawing image:', error);
  } finally {
    // Restore previous state
    ctx.globalAlpha = previousAlpha;
    ctx.globalCompositeOperation = previousBlendMode;
  }
}

/**
 * Prevent mask distortion by adjusting mask dimensions to maintain proper proportions
 * This is particularly important for architectural shapes like arches
 * 
 * @param {string} maskFamily - The mask family (e.g., 'architectural')
 * @param {string} maskType - The mask type (e.g., 'archClassical')
 * @param {Object} placement - The placement object with x, y, width, height
 * @returns {Object} Adjusted placement object
 */
export function adjustMaskProportions(maskFamily, maskType, placement) {
  const { x, y, width, height } = placement;
  let adjustedPlacement = { ...placement };

  // Define ideal aspect ratios for different mask types
  const aspectRatioTargets = {
    architectural: {
      archClassical: 0.8,     // 4:5 ratio (width:height) - arches should be taller
      archFlat: 1.2,          // 6:5 ratio - flatter arches can be wider
      triptychArch: 1.5,      // 3:2 ratio - three arches side by side
      windowRect: 0.8,        // 4:5 ratio - windows are typically taller
      windowGrid: 1.0,        // 1:1 ratio - grid windows are often square
      columnSingle: 0.3,      // 3:10 ratio - columns are very tall
      columnPair: 0.6,        // 3:5 ratio - pair of columns
      columnTriplet: 0.9,     // 9:10 ratio - three columns
    },
    altar: {
      nicheArch: 0.8,         // 4:5 ratio - niches are tall
      gableAltar: 1.0,        // 1:1 ratio - gable is often square-ish
      circleInset: 1.0,       // 1:1 ratio - circles should be square
    },
    basic: {
      circleMask: 1.0,        // 1:1 ratio - circles should be square
      ovalMask: 0.8,          // 4:5 ratio - ovals are typically taller
      diamondMask: 1.0,       // 1:1 ratio - diamonds are typically square
      hexagonMask: 1.0,       // 1:1 ratio - hexagons work best as squares
      triangleMask: 1.0,      // 1:1 ratio - triangles work best as squares
    }
  };

  const targetAspectRatio = aspectRatioTargets[maskFamily]?.[maskType];
  
  if (targetAspectRatio) {
    const currentAspectRatio = width / height;
    const tolerance = 0.15; // Allow 15% deviation before adjusting
    
    if (Math.abs(currentAspectRatio - targetAspectRatio) > tolerance) {
      console.log(`[adjustMaskProportions] Adjusting ${maskFamily}/${maskType} from ratio ${currentAspectRatio.toFixed(2)} to ${targetAspectRatio.toFixed(2)}`);
      
      if (currentAspectRatio > targetAspectRatio) {
        // Too wide, reduce width
        const newWidth = height * targetAspectRatio;
        const widthDiff = width - newWidth;
        adjustedPlacement.x = x + widthDiff / 2; // Center the adjustment
        adjustedPlacement.width = newWidth;
      } else {
        // Too tall, reduce height  
        const newHeight = width / targetAspectRatio;
        const heightDiff = height - newHeight;
        adjustedPlacement.y = y + heightDiff / 2; // Center the adjustment
        adjustedPlacement.height = newHeight;
      }
    }
  }

  return adjustedPlacement;
}
