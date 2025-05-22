// architecturalTemplate.js
// Template for architectural compositions using available masks

import { getMaskDescriptor } from '../masks/maskRegistry';

// Available mask families and their masks from the registry
const AVAILABLE_MASKS = {
  architectural: ['archClassical', 'archFlat', 'triptychArch', 'windowRect', 'windowGrid', 'columnPair', 'columnSingle', 'columnTriplet', 'facadeGrid', 'houseGable'],
  basic: ['circleMask', 'ovalMask', 'diamondMask', 'hexagonMask', 'semiCircleMask', 'triangleMask', 'beamMask', 'donutMask', 'arcMask'],
  abstract: ['blobIrregular', 'blobCrescent', 'polygonSoft', 'cloudLike', 'archBlob']
};

const PRESETS = {
  classic: [
    { maskName: 'archClassical', x: 0.3, y: 0.2, width: 0.4, height: 0.5 },
    { maskName: 'windowRect', x: 0.1, y: 0.3, width: 0.2, height: 0.3 },
    { maskName: 'windowRect', x: 0.7, y: 0.3, width: 0.2, height: 0.3 },
    { maskName: 'columnPair', x: 0.05, y: 0.2, width: 0.1, height: 0.7 },
    { maskName: 'columnPair', x: 0.85, y: 0.2, width: 0.1, height: 0.7 },
    { maskName: 'facadeGrid', x: 0.1, y: 0.1, width: 0.8, height: 0.1 }
  ],
  modern: [
    { maskName: 'diamondMask', x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
    { maskName: 'windowGrid', x: 0.4, y: 0.6, width: 0.2, height: 0.3 },
    { maskName: 'hexagonMask', x: 0.1, y: 0.1, width: 0.8, height: 0.05 }
  ],
  gothic: [
    { maskName: 'triptychArch', x: 0.3, y: 0.1, width: 0.4, height: 0.6 },
    { maskName: 'arcMask', x: 0.1, y: 0.3, width: 0.2, height: 0.4 },
    { maskName: 'arcMask', x: 0.7, y: 0.3, width: 0.2, height: 0.4 },
    { maskName: 'columnSingle', x: 0.05, y: 0.2, width: 0.08, height: 0.7 },
    { maskName: 'columnSingle', x: 0.87, y: 0.2, width: 0.08, height: 0.7 },
    { maskName: 'houseGable', x: 0.1, y: 0.05, width: 0.8, height: 0.15 }
  ]
};

function renderArchitectural(canvas, images, params = {}) {
  if (!canvas || images.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background color
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get preset based on style
  const style = params.style || 'classic';
  const preset = PRESETS[style] || PRESETS.classic;
  
  // Choose image mode
  const useUniqueImages = params.imageMode === 'unique';
  const singleImage = useUniqueImages ? null : images[Math.floor(Math.random() * images.length)];
  
  // Draw each mask
  preset.forEach((placement, index) => {
    const { maskName, x, y, width, height } = placement;
    
    // Get mask descriptor from registry
    const maskDesc = getMaskDescriptor(maskName);
    if (!maskDesc) return;
    
    // Convert relative coordinates to absolute
    const absX = x * canvas.width;
    const absY = y * canvas.height;
    const absWidth = width * canvas.width;
    const absHeight = height * canvas.height;
    
    // Choose image
    const image = useUniqueImages ? 
      images[Math.floor(Math.random() * images.length)] : 
      singleImage;
    
    if (!image || !image.complete) return;
    
    ctx.save();
    
    // Create clipping path from mask SVG
    if (maskDesc.kind === 'svg' && maskDesc.getSvg) {
      const maskSvg = maskDesc.getSvg();
      const path = new Path2D(maskSvg);
      ctx.translate(absX, absY);
      ctx.scale(absWidth / 100, absHeight / 100); // SVG viewBox is 100x100
      ctx.clip(path);
      ctx.translate(-absX, -absY); // Translate back for image drawing
    } else {
      // Fallback to rectangular clip
      ctx.beginPath();
      ctx.rect(absX, absY, absWidth, absHeight);
      ctx.clip();
    }
    
    // Set blend mode
    if (params.useMultiply !== false) {
      ctx.globalCompositeOperation = 'multiply';
    }
    
    // Calculate image dimensions to fill mask
    const imgRatio = image.width / image.height;
    const maskRatio = absWidth / absHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgRatio > maskRatio) {
      drawHeight = absHeight;
      drawWidth = absHeight * imgRatio;
      offsetX = absX - (drawWidth - absWidth) / 2;
      offsetY = absY;
    } else {
      drawWidth = absWidth;
      drawHeight = absWidth / imgRatio;
      offsetX = absX;
      offsetY = absY - (drawHeight - absHeight) / 2;
    }
    
    // Draw image
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    ctx.restore();
  });
  
  return canvas;
}

const architecturalTemplate = {
  key: 'architectural',
  name: 'Architectural',
  generate: renderArchitectural,
  params: {
    style: { type: 'select', options: ['classic', 'modern', 'gothic'], default: 'classic' },
    imageMode: { type: 'select', options: ['single', 'unique'], default: 'unique' },
    bgColor: { type: 'color', default: '#ffffff' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default architecturalTemplate; 