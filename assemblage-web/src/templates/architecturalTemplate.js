// architecturalTemplate.js
// Template for architectural compositions using available masks

import { getMaskDescriptor } from '../masks/maskRegistry';
import { randomVibrantColor, getComplimentaryColor } from '../utils/colors'; // Assuming you have color utils

// Helper function to extract path data from SVG string
function getPathDataFromSvg(svgString) {
  const match = svgString.match(/<path[^>]*d=(?:"([^"]*)"|'([^']*)')/);
  return match ? (match[1] || match[2]) : null;
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
  if (!canvas || !images || images.length === 0) {
    console.warn('[ArchitecturalTemplate] Canvas or images not provided.');
    return;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const baseBgColor = params.bgColor || randomVibrantColor();
  ctx.fillStyle = baseBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const style = params.style || 'classic';
  const preset = PRESETS[style] || PRESETS.classic;
  const useUniqueImages = params.imageMode === 'unique';
  const singleImage = useUniqueImages ? null : images[Math.floor(Math.random() * images.length)];

  preset.forEach((placement) => {
    const { maskName, x, y, width, height } = placement;
    
    let maskDesc = getMaskDescriptor('architectural', maskName) || getMaskDescriptor('basic', maskName) || getMaskDescriptor(maskName);

    if (!maskDesc || maskDesc.kind !== 'svg' || !maskDesc.getSvg) {
      console.warn(`[Architectural] SVG Mask not found or invalid for: ${maskName}`);
      return;
    }

    const absX = x * canvas.width;
    const absY = y * canvas.height;
    const absWidth = width * canvas.width;
    const absHeight = height * canvas.height;

    ctx.save();
    // Overall clip to the placement area bounds first
    ctx.beginPath();
    ctx.rect(absX, absY, absWidth, absHeight);
    ctx.clip();
    ctx.translate(absX, absY); // Translate to the placement origin

    const useSolidColor = Math.random() < 0.2; // 20% chance for solid color

    if (useSolidColor) {
      ctx.fillStyle = getComplimentaryColor(baseBgColor);
      if (params.useMultiply !== false) ctx.globalCompositeOperation = 'multiply';
      const svgPathData = getPathDataFromSvg(maskDesc.getSvg());
      if (svgPathData) {
        const path = new Path2D(svgPathData);
        ctx.scale(absWidth / 100, absHeight / 100); // Scale SVG path (viewBox 0 0 100 100)
        ctx.fill(path);
      } else {
        ctx.fillRect(0, 0, absWidth, absHeight); // Fallback to fill rect if path fails
      }
    } else {
      const imageToUse = useUniqueImages ? images[Math.floor(Math.random() * images.length)] : singleImage;
      if (!imageToUse || !imageToUse.complete) {
        console.warn(`[Architectural] Image not loaded for ${maskName}`);
        ctx.restore(); return;
      }

      const svgPathData = getPathDataFromSvg(maskDesc.getSvg());
      if (!svgPathData) {
        console.warn(`[Architectural] No path data for mask ${maskName}, drawing full image in rect.`);
        // Draw image filling the pre-clipped rectangular placement area if no path
        const imgAspect = imageToUse.width / imageToUse.height;
        const placementAspect = absWidth / absHeight;
        let drawW, drawH, drawX = 0, drawY = 0;
        if (imgAspect > placementAspect) {
          drawH = absHeight; drawW = absHeight * imgAspect; drawX = (absWidth - drawW) / 2;
        } else {
          drawW = absWidth; drawH = absWidth / imgAspect; drawY = (absHeight - drawH) / 2;
        }
        if (params.useMultiply !== false) ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(imageToUse, drawX, drawY, drawW, drawH);
        ctx.restore();
        return;
      }

      const path = new Path2D(svgPathData);
      ctx.save(); // Save for clipping
      ctx.scale(absWidth / 100, absHeight / 100); // Scale context to draw mask as 100x100 units
      ctx.clip(path); // Clip to the scaled SVG path
      ctx.scale(100 / absWidth, 100 / absHeight); // Scale back context for image drawing

      // Draw image to fill the original absWidth/absHeight of the placement area
      const imgAspect = imageToUse.width / imageToUse.height;
      const placementAspect = absWidth / absHeight;
      let drawW, drawH, drawX = 0, drawY = 0;

      if (imgAspect > placementAspect) {
        drawH = absHeight;
        drawW = absHeight * imgAspect;
        drawX = (absWidth - drawW) / 2; 
      } else {
        drawW = absWidth;
        drawH = absWidth / imgAspect;
        drawY = (absHeight - drawH) / 2;
      }
      if (params.useMultiply !== false) ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(imageToUse, drawX, drawY, drawW, drawH);
      ctx.restore(); // Restore from clipping save
    }
    ctx.restore(); // Restore from initial save (after translate)
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
    bgColor: { type: 'color', default: '#FFFFFF' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default architecturalTemplate; 