// photoStrip.js - A template that creates a horizontal strip of 3 images

import { randomVibrantColor, vibrantColors, getRandomColorFromPalette } from '../utils/colors.js';
import { getComplementaryColor } from '../utils/colorUtils.js';

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

/**
 * Generate a photo strip with 3 images in a horizontal row
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {HTMLImageElement[]} images - Array of available images
 * @param {Object} params - Configuration parameters
 */
export function generatePhotoStrip(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fill with background color using palette-aware selection
  const bgColor = params.bgColor || getRandomColorFromPalette(images, 'auto');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Configuration
  const imageCount = 3;
  const stripHeight = canvas.height * 0.7; // 70% of canvas height
  const stripWidth = canvas.width; // Full width of canvas
  const stripY = (canvas.height - stripHeight) / 2; // Center vertically
  const stripX = 0; // No left margin
  
  const imageWidth = stripWidth / imageCount; // Equal width for each image
  const imageHeight = stripHeight; // Same height for all images
  
  // Color mode: 60% multiply only, 40% color blocks with multiply
  const useColorBlocks = Math.random() < 0.4;
  
  // Generate color palette for color blocks
  let colorPalette = [];
  if (useColorBlocks) {
    const complementaryColor = getComplementaryColor(bgColor);
    // FIXED: Use lightened complementary colors for better visibility
    const lightenedComplementaryColor = lightenColor(complementaryColor, 0.3);
    const colorMode = Math.random();
    
    if (colorMode < 0.5) {
      // Each image gets a different complementary color - but lightened
      colorPalette = [
        lightenedComplementaryColor,
        lightenColor(vibrantColors[0] || '#FF6B6B', 0.2),
        lightenColor(vibrantColors[1] || '#4ECDC4', 0.2)
      ];
    } else {
      // All images get the same color - but lightened
      const singleColor = Math.random() < 0.5 ? lightenedComplementaryColor : lightenColor(bgColor, 0.2);
      colorPalette = [singleColor, singleColor, singleColor];
    }
  }
  
  // Create array of random image indices to ensure different images
  const usedIndices = new Set();
  const imageIndices = [];
  
  for (let i = 0; i < imageCount; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * images.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < images.length);
    
    usedIndices.add(randomIndex);
    imageIndices.push(randomIndex);
  }
  
  // Draw each image in the strip
  for (let i = 0; i < imageCount; i++) {
    const imageIndex = imageIndices[i];
    const img = images[imageIndex];
    
    if (!img || !img.complete) continue;
    
    const x = stripX + (i * imageWidth);
    const y = stripY;
    
    ctx.save();
    
    // Create clipping rectangle for this image slot
    ctx.beginPath();
    ctx.rect(x, y, imageWidth, imageHeight);
    ctx.clip();
    
    // Draw color block if enabled
    if (useColorBlocks) {
      ctx.fillStyle = colorPalette[i];
      ctx.fillRect(x, y, imageWidth, imageHeight);
    }
    
    // Set blend mode
    ctx.globalCompositeOperation = 'multiply';
    
    // Calculate image scaling to fill the slot while maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const slotAspect = imageWidth / imageHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > slotAspect) {
      // Image is wider than slot - scale by height
      drawHeight = imageHeight;
      drawWidth = drawHeight * imgAspect;
      drawX = x + (imageWidth - drawWidth) / 2; // Center horizontally
      drawY = y;
    } else {
      // Image is taller than slot - scale by width
      drawWidth = imageWidth;
      drawHeight = drawWidth / imgAspect;
      drawX = x;
      drawY = y + (imageHeight - drawHeight) / 2; // Center vertically
    }
    
    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  }
  
  return { canvas, bgColor };
}

// Template configuration
const photoStrip = {
  key: 'photoStrip',
  name: 'Photo Strip',
  render: generatePhotoStrip,
  params: {
    bgColor: { type: 'color' }
  }
};

export default photoStrip;
