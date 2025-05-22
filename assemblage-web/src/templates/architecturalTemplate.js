// architecturalTemplate.js
// Template for architectural compositions using available masks

import { getMaskDescriptor } from '../masks/maskRegistry';
import { randomVibrantColor, getComplimentaryColor } from '../utils/colors'; // Assuming you have color utils

// Helper function to extract path data from SVG string
function getPathDataFromSvg(svgString) {
  // Regex to find the d attribute in a path tag, allowing for other attributes and whitespace
  const match = svgString.match(/<path[^>]*d="([^"]*)"[^>]*>/);
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
  
  const baseBgColor = params.bgColor || '#FFFFFF';
  ctx.fillStyle = baseBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const style = params.style || 'classic';
  const preset = PRESETS[style] || PRESETS.classic;
  const useUniqueImages = params.imageMode === 'unique';
  const singleImage = useUniqueImages ? null : images[Math.floor(Math.random() * images.length)];

  const dpr = window.devicePixelRatio || 1;

  preset.forEach((placement, index) => {
    const { maskName, x, y, width, height } = placement;
    
    let maskDesc = getMaskDescriptor('architectural', maskName) || getMaskDescriptor('basic', maskName);
    if (!maskDesc) maskDesc = getMaskDescriptor(maskName);

    if (!maskDesc || maskDesc.kind !== 'svg' || !maskDesc.getSvg) {
      console.warn(`[ArchitecturalTemplate] SVG Mask not found or invalid for: ${maskName}`);
      return;
    }

    const absX = x * canvas.width;
    const absY = y * canvas.height;
    const absWidth = width * canvas.width;
    const absHeight = height * canvas.height;

    ctx.save();
    ctx.beginPath(); // Start a new path for clipping
    // Create a simple rectangular clipping path for the placement area first
    ctx.rect(absX, absY, absWidth, absHeight);
    ctx.clip();

    // Decide if this placement will be a solid color or an image
    const isSolidColor = Math.random() < 0.2; // 20% chance for solid color

    if (isSolidColor) {
      ctx.fillStyle = getComplimentaryColor(baseBgColor); // Or use another randomVibrantColor()
      if (params.useMultiply !== false) {
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.fillRect(absX, absY, absWidth, absHeight);
      ctx.globalCompositeOperation = 'source-over'; // Reset for next iteration
    } else {
      const imageToUse = useUniqueImages ? images[Math.floor(Math.random() * images.length)] : singleImage;
      if (!imageToUse || !imageToUse.complete) {
        console.warn(`[ArchitecturalTemplate] Image not loaded for ${maskName}`);
        ctx.restore();
        return;
      }

      // Attempt to draw SVG as an image for robust masking
      const svgString = maskDesc.getSvg();
      const svgImage = new Image();
      const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
      
      svgImage.onload = () => {
        ctx.save(); // Save context for this specific drawing operation
        // Create a temporary canvas for the mask
        const tempMaskCanvas = document.createElement('canvas');
        tempMaskCanvas.width = absWidth * dpr;
        tempMaskCanvas.height = absHeight * dpr;
        const tempMaskCtx = tempMaskCanvas.getContext('2d');
        if(!tempMaskCtx) { ctx.restore(); return; }

        // Draw the SVG mask onto the temporary canvas
        tempMaskCtx.drawImage(svgImage, 0, 0, absWidth * dpr, absHeight * dpr);

        // Draw the image, then use the mask
        // Calculate fill/fit for the image within absWidth/absHeight
        const imgAspect = imageToUse.width / imageToUse.height;
        const placementAspect = absWidth / absHeight;
        let drawImgWidth, drawImgHeight, imgDrawX = absX, imgDrawY = absY;

        if (imgAspect > placementAspect) { // Image wider than placement area
            drawImgHeight = absHeight;
            drawImgWidth = absHeight * imgAspect;
            imgDrawX = absX - (drawImgWidth - absWidth) / 2; // Center X
        } else { // Image taller than or same aspect as placement area
            drawImgWidth = absWidth;
            drawImgHeight = absWidth / imgAspect;
            imgDrawY = absY - (drawImgHeight - absHeight) / 2; // Center Y
        }
        
        ctx.globalCompositeOperation = params.useMultiply !== false ? 'multiply' : 'source-over';
        ctx.drawImage(imageToUse, imgDrawX, imgDrawY, drawImgWidth, drawImgHeight);
        
        // Apply the mask from the temporary canvas
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(tempMaskCanvas, absX, absY, absWidth, absHeight);

        ctx.restore(); // Restore from specific drawing operation
      };
      svgImage.onerror = () => {
        console.warn(`[ArchitecturalTemplate] Failed to load SVG as image for mask: ${maskName}`);
      };
      svgImage.src = svgUrl;
    }
    ctx.restore(); // Restore from initial save (after clipping path)
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