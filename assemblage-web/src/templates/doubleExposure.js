// doubleExposure.js - A template that creates double exposure effects with 2-3 layered images

import { getRandomColorFromPalette, areImagesMostlyBlackAndWhite } from '../utils/colors.js';
import { chooseBlend } from '../utils/blendModeUtils';

/**
 * Generate a double exposure effect with 2-3 layered images
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {HTMLImageElement[]} images - Array of available images
 * @param {Object} params - Configuration parameters
 */
export function generateDoubleExposure(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill with background color
  const bgColor = params.bgColor || getRandomColorFromPalette(images, 'auto');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Randomly decide between 2 or 3 images
  const layerCount = Math.random() < 0.5 ? 2 : 3;
  
  // Select random unique images
  const usedIndices = new Set();
  const selectedImages = [];
  const imageIndices = [];
  
  for (let i = 0; i < layerCount; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * images.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < images.length);
    
    usedIndices.add(randomIndex);
    imageIndices.push(randomIndex);
    selectedImages.push(images[randomIndex]);
  }
  
  // Check if all images are black and white using the color analysis function
  const allBlackAndWhite = areImagesMostlyBlackAndWhite(selectedImages);
  
  // Debug logging
  console.log('[DoubleExposure] Selected images:', selectedImages.length);
  console.log('[DoubleExposure] All B&W?', allBlackAndWhite);
  
  // For B&W images, 90% chance to use all multiply (no white/hard-light)
  const useAllMultiply = allBlackAndWhite && Math.random() < 0.9;
  console.log('[DoubleExposure] Use all multiply?', useAllMultiply);
  
  // Choose layout style: 'center', 'left', 'right', 'fullBleed', 'border'
  const layoutStyles = ['center', 'left', 'right', 'fullBleed', 'border'];
  const layoutStyle = layoutStyles[Math.floor(Math.random() * layoutStyles.length)];
  
  // Define border size for 'border' layout
  const borderSize = canvas.width * 0.05; // 5% of canvas width
  
  // Store blend mode choices and positioning for each layer
  const blendChoices = [];
  const positioningData = [];
  
  // Draw each image layer
  selectedImages.forEach((img, index) => {
    if (!img || !img.complete) return;
    
    ctx.save();
    
    // For first image, always use normal composite operation
    if (index === 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      blendChoices.push({ mode: 'normal', opacity: 1.0 });
    } else {
      // For subsequent images, choose blend mode
      if (useAllMultiply) {
        // Force multiply mode for B&W images
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.4 + Math.random() * 0.4; // Still vary opacity
        blendChoices.push({ mode: 'multiply', opacity: ctx.globalAlpha });
      } else {
        // Use standard blend choice
        const previousImg = selectedImages[index - 1];
        const blendChoice = chooseBlend(previousImg, img);
        
        ctx.globalCompositeOperation = blendChoice.mode;
        ctx.globalAlpha = blendChoice.opacity;
        blendChoices.push(blendChoice);
      }
    }
    
    // Calculate dimensions based on layout style
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, drawX, drawY;
    let scalingMode;
    
    switch (layoutStyle) {
      case 'fullBleed':
        // Cover entire canvas - some parts may be cropped
        if (imgAspect > canvasAspect) {
          // Image is wider - scale by height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller - scale by width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }
        scalingMode = 'cover';
        break;
        
      case 'border':
        // Fit within borders
        const maxWidth = canvas.width - (borderSize * 2);
        const maxHeight = canvas.height - (borderSize * 2);
        const borderAspect = maxWidth / maxHeight;
        
        if (imgAspect > borderAspect) {
          // Image is wider - fit by width
          drawWidth = maxWidth;
          drawHeight = drawWidth / imgAspect;
          drawX = borderSize;
          drawY = borderSize + (maxHeight - drawHeight) / 2;
        } else {
          // Image is taller - fit by height
          drawHeight = maxHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = borderSize + (maxWidth - drawWidth) / 2;
          drawY = borderSize;
        }
        scalingMode = 'contain-border';
        break;
        
      case 'left':
        // Align to left edge
        if (imgAspect > canvasAspect) {
          // Image is wider - fit by width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller - fit by height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = 0;
          drawY = 0;
        }
        scalingMode = 'contain-left';
        break;
        
      case 'right':
        // Align to right edge
        if (imgAspect > canvasAspect) {
          // Image is wider - fit by width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller - fit by height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = canvas.width - drawWidth;
          drawY = 0;
        }
        scalingMode = 'contain-right';
        break;
        
      case 'center':
      default:
        // Center the image (original behavior)
        if (imgAspect > canvasAspect) {
          // Image is wider - fit by width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller - fit by height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }
        scalingMode = 'contain-center';
        break;
    }
    
    // Store positioning data
    positioningData.push({
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
      scalingMode: scalingMode
    });
    
    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  });
  
  // Return processed parameters
  const processedParams = {
    bgColor: bgColor,
    layerCount: layerCount,
    imageIndices: imageIndices,
    blendChoices: blendChoices,
    layoutStyle: layoutStyle,
    useAllMultiply: useAllMultiply,
    borderSize: layoutStyle === 'border' ? borderSize : null,
    positioningData: positioningData,
    userPrompt: params.userPrompt || ''
  };
  
  console.log('[DoubleExposureTemplate] Returning processed params:', processedParams);
  
  return { 
    canvas, 
    bgColor,
    processedParams 
  };
}

// Template configuration
const doubleExposure = {
  key: 'doubleExposure',
  name: 'Double Exposure',
  render: generateDoubleExposure,
  params: {
    bgColor: { type: 'color' }
  }
};

export default doubleExposure;
