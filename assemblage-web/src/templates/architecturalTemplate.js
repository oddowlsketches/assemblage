// architecturalTemplate.js
// Template for architectural compositions using available masks

import { getMaskDescriptor } from '../masks/maskRegistry';

// Helper function to extract path data from SVG string
function getPathDataFromSvg(svgString) {
  const match = svgString.match(/d="([^"]*)"/);
  return match ? match[1] : null;
}

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
    if (!maskDesc) {
      console.warn(`[ArchitecturalTemplate] Mask not found: ${maskName}`);
      return;
    }
    
    // Convert relative coordinates to absolute
    const absX = x * canvas.width;
    const absY = y * canvas.height;
    const absWidth = width * canvas.width;
    const absHeight = height * canvas.height;
    
    // Choose image
    const image = useUniqueImages ? 
      images[Math.floor(Math.random() * images.length)] : 
      singleImage;
    
    if (!image || !image.complete) {
      console.warn(`[ArchitecturalTemplate] Image not loaded or invalid for mask: ${maskName}`);
      return;
    }
    
    ctx.save();
    
    // Create clipping path from mask SVG
    if (maskDesc.kind === 'svg' && maskDesc.getSvg) {
      const maskSvgString = maskDesc.getSvg();
      const pathData = getPathDataFromSvg(maskSvgString);
      if (pathData) {
        const path = new Path2D(pathData);
        ctx.translate(absX, absY);
        // Correct scaling: SVG is 100x100, scale to absWidth, absHeight
        ctx.scale(absWidth / 100, absHeight / 100); 
        ctx.clip(path);
        // No need to translate back here, image drawing will use the transformed context
      } else {
        console.warn(`[ArchitecturalTemplate] Could not extract path data from SVG for mask: ${maskName}`);
        // Fallback to rectangular clip if path data extraction fails
        ctx.rect(0, 0, absWidth, absHeight); // Draw rect in the translated and scaled context
        ctx.clip();
      }
    } else {
      // Fallback to rectangular clip if not an SVG mask or getSvg is missing
      console.warn(`[ArchitecturalTemplate] Mask is not SVG or getSvg is missing for: ${maskName}`);
      ctx.translate(absX, absY); // Still need to translate for the rect
      ctx.rect(0, 0, absWidth, absHeight);
      ctx.clip();
    }
    
    // Set blend mode
    if (params.useMultiply !== false) {
      ctx.globalCompositeOperation = 'multiply';
    }
    
    // Calculate image dimensions to fill mask, respecting aspect ratio
    // The context is already translated and scaled for the mask.
    // We need to draw the image at (0,0) in this new coordinate system,
    // but scaled and positioned to fill the 100x100 unit space of the mask.
    
    const imgOriginalWidth = image.width;
    const imgOriginalHeight = image.height;
    const maskUnitWidth = 100; // SVG viewBox width
    const maskUnitHeight = 100; // SVG viewBox height

    const imgAspect = imgOriginalWidth / imgOriginalHeight;
    const maskAspect = maskUnitWidth / maskUnitHeight; // Should be 1 for 100x100

    let drawImgWidth, drawImgHeight, drawImgX, drawImgY;

    if (imgAspect > maskAspect) { // Image is wider than mask
      drawImgHeight = maskUnitHeight;
      drawImgWidth = maskUnitHeight * imgAspect;
      drawImgX = (maskUnitWidth - drawImgWidth) / 2; // Center horizontally
      drawImgY = 0;
    } else { // Image is taller than or same aspect as mask
      drawImgWidth = maskUnitWidth;
      drawImgHeight = maskUnitWidth / imgAspect;
      drawImgX = 0;
      drawImgY = (maskUnitHeight - drawImgHeight) / 2; // Center vertically
    }
    
    // Draw image
    // The context is already scaled such that drawing at (0,0) with width/height 100
    // will fill the absWidth/absHeight area on the canvas.
    ctx.drawImage(image, drawImgX, drawImgY, drawImgWidth, drawImgHeight);
    
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