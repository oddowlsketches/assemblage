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
  let singleImage = null;
  if (!useUniqueImages && images.length > 0) {
    singleImage = images[Math.floor(Math.random() * images.length)];
  }

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
    // Translate to the placement's top-left corner
    ctx.translate(absX, absY);

    const svgPathData = getPathDataFromSvg(maskDesc.getSvg());
    let pathForClipping = null;
    if (svgPathData) {
      pathForClipping = new Path2D(svgPathData);
    } else {
      console.warn(`[Architectural] No path data for mask ${maskName}, using full rect.`);
      // Create a rectangular path if SVG path extraction fails, to still clip to placement bounds
      pathForClipping = new Path2D();
      pathForClipping.rect(0, 0, absWidth, absHeight); 
      // Note: if using rect for fallback, scaling below needs to be to absWidth/absHeight, not 100x100
    }

    // Scale the context so that the 100x100 viewBox of the SVG path maps to absWidth x absHeight
    // This scaling applies to the pathForClipping itself when used.
    // If it's the fallback rectangular path, we scale to 1x1 essentially, since it's already in absWidth/Height.
    if (svgPathData) {
      ctx.scale(absWidth / 100, absHeight / 100);
    }
    
    ctx.clip(pathForClipping);

    // Reset scale if we scaled for SVG, so image drawing is in placement's original coordinate space (0,0 to absWidth,absHeight)
    if (svgPathData) {
      ctx.scale(100 / absWidth, 100 / absHeight);
    }

    const useSolidColor = Math.random() < 0.2; // 20% chance for solid color

    if (useSolidColor) {
      ctx.fillStyle = getComplimentaryColor(baseBgColor);
      if (params.useMultiply !== false) ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, absWidth, absHeight); // Fill the clipped, translated area
    } else {
      const imageToUse = useUniqueImages ? images[Math.floor(Math.random() * images.length)] : singleImage;
      if (!imageToUse || !imageToUse.complete) {
        console.warn(`[Architectural] Image not loaded for ${maskName}`);
        ctx.restore(); return;
      }

      const imgAspect = imageToUse.width / imageToUse.height;
      const placementAspect = absWidth / absHeight;
      let drawW, drawH, drawX = 0, drawY = 0;

      if (imgAspect > placementAspect) { // Image wider than placement
        drawH = absHeight;
        drawW = absHeight * imgAspect;
        drawX = (absWidth - drawW) / 2; 
      } else { // Image taller or same aspect
        drawW = absWidth;
        drawH = absWidth / imgAspect;
        drawY = (absHeight - drawH) / 2;
      }
      if (params.useMultiply !== false) ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(imageToUse, drawX, drawY, drawW, drawH);
    }
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
    bgColor: { type: 'color', default: '#FFFFFF' },
    useMultiply: { type: 'boolean', default: true }
  }
};

export default architecturalTemplate; 