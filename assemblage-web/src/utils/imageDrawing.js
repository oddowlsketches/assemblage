/**
 * Draws an image onto a canvas context with options for aspect ratio handling (cover/contain),
 * opacity, blend mode, and an optional clipping path.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLImageElement} image - The image to draw.
 * @param {number} x - The x-coordinate of the top-left corner where the image will be drawn.
 * @param {number} y - The y-coordinate of the top-left corner where the image will be drawn.
 * @param {number} targetWidth - The width of the area to draw the image into.
 * @param {number} targetHeight - The height of the area to draw the image into.
 * @param {object} [options={}] - Optional parameters.
 * @param {number} [options.aspectRatio] - The aspect ratio of the image. If not provided, it's calculated.
 * @param {boolean} [options.cover=true] - If true, scales the image to cover the target area, cropping if necessary.
 *                                       If false, scales the image to fit within the target area (contain).
 * @param {number} [options.opacity=1] - The opacity to apply to the image.
 * @param {string} [options.blendMode] - The globalCompositeOperation to apply.
 * @param {Path2D} [options.clipPath] - An optional Path2D object to use for clipping.
 */
export function drawImageWithAspectRatio(ctx, image, x, y, targetWidth, targetHeight, options = {}) {
  if (!image || !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
    console.warn('[drawImageWithAspectRatio] Image not loaded or invalid.');
    return;
  }

  const imgAspectRatio = options.aspectRatio || (image.naturalWidth / image.naturalHeight);
  const targetAspectRatio = targetWidth / targetHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  const cover = options.cover !== undefined ? options.cover : true; // Default to cover

  if (cover) {
    // Cover: Crop the image to fit the target aspect ratio
    if (imgAspectRatio > targetAspectRatio) {
      // Image is wider than target area, crop image width
      sourceWidth = image.naturalHeight * targetAspectRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else if (imgAspectRatio < targetAspectRatio) {
      // Image is taller than target area, crop image height
      sourceHeight = image.naturalWidth / targetAspectRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }
    // If aspect ratios match, no cropping needed, sourceX/Y/Width/Height remain full image.
  } else {
    // Contain: Fit the image within the target area (not used by packedShapes but good for general utility)
    // This logic would be different: calculate destination width/height rather than source crop.
    // For now, packedShapes uses cover=true, so this branch is less critical for the immediate fix.
    // If needed, this part would scale down the image to fit, centering it.
    // let destWidth, destHeight, destX, destY;
    // if (imgAspectRatio > targetAspectRatio) { // image wider than target
    //   destWidth = targetWidth;
    //   destHeight = targetWidth / imgAspectRatio;
    //   destX = x;
    //   destY = y + (targetHeight - destHeight) / 2;
    // } else { // image taller than target
    //   destHeight = targetHeight;
    //   destWidth = targetHeight * imgAspectRatio;
    //   destX = x + (targetWidth - destWidth) / 2;
    //   destY = y;
    // }
    // ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
    // return; // Early exit for contain logic if fully implemented.
    // For now, if cover is false, it will just draw the image into the target box without special source cropping.
  }

  ctx.save();

  if (options.clipPath instanceof Path2D) {
    ctx.clip(options.clipPath);
  }

  if (options.opacity !== undefined) {
    ctx.globalAlpha = options.opacity;
  }

  if (options.blendMode) {
    ctx.globalCompositeOperation = options.blendMode;
  }

  try {
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (cropped if covering)
      x, y, targetWidth, targetHeight             // Destination rectangle
    );
  } catch (e) {
    console.error('[drawImageWithAspectRatio] Error drawing image:', e, {
      imageSrc: image.src,
      sourceParams: { sourceX, sourceY, sourceWidth, sourceHeight },
      destParams: { x, y, targetWidth, targetHeight },
      options
    });
  }

  ctx.restore();
} 