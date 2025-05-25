import { EffectBase, EffectParams, MaskPlacement } from './EffectBase';
import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';

// Update MaskPlacement type to allow polygon points
// (If MaskPlacement is imported, we can extend it locally)
type PolygonMaskPlacement = MaskPlacement & { polygon?: {x: number, y: number}[] };

const validArchMasks = [
  'architectural/archClassical',
  'architectural/archFlat',
  'architectural/triptychArch',
  'architectural/houseGable',
  'altar/nicheArch',
  'altar/gableAltar',
  'basic/diamondMask',
  'basic/hexagonMask',
  'basic/circleMask',
  'abstract/polygonSoft',
];

// Architectural composition presets keyed by prompt
const presets: Record<string, (width: number, height: number) => MaskPlacement[]> = {
  // Single large arch with small secondary mask
  singleArch: (w, h) => {
    // Add more variation to size and position
    const sizeVariation = 0.1; // 10% variation
    const positionVariation = 0.15; // 15% variation
    
    // Randomly determine if we want a larger or smaller main arch
    const mainSizeFactor = 0.7 + (Math.random() * 2 - 1) * sizeVariation;
    const mainSize = h * mainSizeFactor;
    
    // Randomly position the main arch
    const mainX = w * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const mainY = h * (0.15 + (Math.random() * 2 - 1) * positionVariation);
    
    // Randomly determine if we want a larger or smaller secondary element
    const smallSizeFactor = 0.2 + (Math.random() * 2 - 1) * sizeVariation;
    const smallSize = h * smallSizeFactor;
    
    // Randomly position the secondary element
    const smallX = w * (0.8 + (Math.random() * 2 - 1) * positionVariation);
    const smallY = h * (0.6 + (Math.random() * 2 - 1) * positionVariation);
    
    // Use masks from the registry
    return [
      {
        maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
        x: mainX - mainSize/2,
        y: mainY,
        width: mainSize,
        height: mainSize,
        rotation: 0,
        layer: 1
      },
      {
        maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
        x: smallX - smallSize/2,
        y: smallY - smallSize/2,
        width: smallSize,
        height: smallSize,
        rotation: Math.random() * 360,
        layer: 2
      }
    ];
  },

  // Three equal arches in a row
  archSeries: (w, h) => {
    // Add more variation to size and position
    const sizeVariation = 0.15; // 15% variation
    const positionVariation = 0.2; // 20% variation
    
    // Randomly determine if we want larger or smaller arches
    const baseSizeFactor = 0.4 + (Math.random() * 2 - 1) * sizeVariation;
    const size = h * baseSizeFactor;
    
    // Randomly position the baseline
    const baseY = h * (0.3 + (Math.random() * 2 - 1) * positionVariation);
    
    // Create three arches with varying positions
    return [0.25, 0.5, 0.75].map((fx, i) => {
      // Add individual position variation to each arch
      const xVariation = (Math.random() * 2 - 1) * positionVariation;
      const x = w * (fx + xVariation);
      
      // Add slight size variation to each arch
      const individualSizeFactor = 1 + (Math.random() * 2 - 1) * 0.1;
      const individualSize = size * individualSizeFactor;
      
      return {
        maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
        x: x - individualSize/2,
        y: baseY,
        width: individualSize,
        height: individualSize,
        rotation: 0,
        layer: i
      };
    });
  },

  // Three concentric arches
  nestedArches: (w, h) => {
    // Randomly choose between centered and offset variations
    const variation = Math.random() > 0.5 ? 'centered' : 'offset';
    
    // Helper function to add subtle variance
    const addVariance = (value: number, variancePercent: number = 0.15) => {
      const variance = value * variancePercent;
      return value + (Math.random() * 2 - 1) * variance;
    };
    
    // Randomly determine if we want larger or smaller arches
    const baseSizeFactor = 0.8 + (Math.random() * 2 - 1) * 0.2;
    const baseSize = Math.min(w, h) * baseSizeFactor;
    
    // Use different arch types for variety
    if (variation === 'centered') {
      // Original centered version with more variance
      const centerX = w * 0.5;
      const centerY = h * 0.5;
      
      // Add more position variance to center
      const varianceX = addVariance(centerX, 0.1);
      const varianceY = addVariance(centerY, 0.1);
      
      // Create three arches with varying scales
      const scales = [1, 0.7, 0.4];
      // Randomly adjust the scale ratios
      const scaleVariation = 0.1;
      const adjustedScales = scales.map(scale => 
        scale + (Math.random() * 2 - 1) * scaleVariation
      );
      
      return adjustedScales.map((scale, i) => {
        // Add more size variance
        const sizeVariance = addVariance(baseSize * scale, 0.1);
        
        return {
          maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
          x: varianceX - sizeVariance/2,
          y: varianceY - sizeVariance/2,
          width: sizeVariance,
          height: sizeVariance,
          rotation: 0,
          layer: i
        };
      });
    } else {
      // New offset version with more variance
      const bottomY = h * 0.7; // Position at 70% of height
      
      // Random x offset for each arch with more variance
      const xOffsets = [
        addVariance(w * 0.4, 0.15), // Left arch
        addVariance(w * 0.5, 0.15), // Middle arch
        addVariance(w * 0.6, 0.15)  // Right arch
      ];
      
      // Add more variance to bottom position
      const varianceBottomY = addVariance(bottomY, 0.1);
      
      // Create three arches with varying scales
      const scales = [1, 0.7, 0.4];
      // Randomly adjust the scale ratios
      const scaleVariation = 0.1;
      const adjustedScales = scales.map(scale => 
        scale + (Math.random() * 2 - 1) * scaleVariation
      );
      
      return adjustedScales.map((scale, i) => {
        // Add more size variance
        const sizeVariance = addVariance(baseSize * scale, 0.1);
        
        return {
          maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
          x: xOffsets[i] - sizeVariance/2,
          y: varianceBottomY - sizeVariance, // Bottom align with variance
          width: sizeVariance,
          height: sizeVariance,
          rotation: 0,
          layer: i
        };
      });
    }
  },

  // Minimal coliseum with large central arch
  coliseum: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Add more variation to size and position
    const sizeVariation = 0.15; // 15% variation
    const positionVariation = 0.1; // 10% variation
    
    // Randomly determine if we want a larger or smaller central arch
    const archSizeFactor = 0.8 + (Math.random() * 2 - 1) * sizeVariation;
    const archSize = Math.min(w, h) * archSizeFactor;
    
    // Randomly position the central arch
    const centerX = w * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const centerY = h * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    
    // Mix of architectural elements
    const centralArch = Math.random() > 0.5 ? 'architectural/archClassical' : 'altar/nicheArch';
    const sideElements = ['architectural/columnSingle', 'architectural/windowRect', 'architectural/archFlat'];
    
    // Add the central arch
    placements.push({
      maskName: centralArch,
      x: centerX - archSize/2,
      y: centerY - archSize/2,
      width: archSize,
      height: archSize,
      rotation: 0,
      layer: 1
    });

    // Two smaller elements on sides with more variation
    const sideSizeFactor = 0.4 + (Math.random() * 2 - 1) * sizeVariation;
    const sideSize = archSize * sideSizeFactor;
    
    // Randomly position the side elements
    const leftX = centerX - archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const rightX = centerX + archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const sideY = centerY + archSize * (0.2 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the side elements
    placements.push({
      maskName: sideElements[Math.floor(Math.random() * sideElements.length)],
      x: leftX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: sideElements[Math.floor(Math.random() * sideElements.length)],
      x: rightX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });

    return placements;
  },

  // Classic facade composition
  classic: (w, h) => {
    const placements: MaskPlacement[] = [];
    const randomFactor = (factor = 0.1) => (Math.random() - 0.5) * factor; // Helper for small random adjustments

    // Top element (cornice or arch)
    const topElements = ['architectural/archClassical', 'architectural/facadeGrid', 'altar/gableAltar'];
    placements.push({
      maskName: topElements[Math.floor(Math.random() * topElements.length)],
      x: w * (0.15 + randomFactor(0.1)), // Slightly more inset, less wide
      y: h * (0.08 + randomFactor(0.05)), // Slightly lower, more variable
      width: w * (0.7 + randomFactor(0.15)), // Base 70% width, variable
      height: h * (0.18 + randomFactor(0.08)), // Taller, base 18% height, variable
      rotation: randomFactor(5), // Slight rotation
      layer: 1
    });

    // Side columns
    const columnTypes = ['architectural/columnSingle', 'architectural/columnPair', 'architectural/columnTriplet'];
    const columnType = columnTypes[Math.floor(Math.random() * columnTypes.length)];
    const baseColumnWidth = w * (0.12 + randomFactor(0.04));
    const baseColumnHeight = h * (0.6 + randomFactor(0.1));
    
    placements.push({ // Left Column
      maskName: columnType,
      x: w * (0.1 + randomFactor(0.05)),
      y: h * (0.25 + randomFactor(0.1)),
      width: baseColumnWidth + w * randomFactor(0.03),
      height: baseColumnHeight + h * randomFactor(0.05),
      rotation: randomFactor(3),
      layer: 1
    });
    
    placements.push({ // Right Column
      maskName: columnType, // Could be different for more variety, but classic often symmetrical
      x: w * (0.78 - baseColumnWidth/w + randomFactor(0.05)), // Position based on its own width
      y: h * (0.25 + randomFactor(0.1)),
      width: baseColumnWidth + w * randomFactor(0.03),
      height: baseColumnHeight + h * randomFactor(0.05),
      rotation: randomFactor(3),
      layer: 1
    });
    
    // Windows
    const windowTypes = ['architectural/windowRect', 'architectural/windowGrid', 'altar/nicheCluster'];
    const numWindows = 2 + Math.floor(Math.random() * 2); // 2 or 3 windows
    const windowZoneXStart = w * 0.3;
    const windowZoneWidth = w * 0.4;
    
    for (let i = 0; i < numWindows; i++) {
      const xPos = windowZoneXStart + (i * windowZoneWidth / numWindows) + windowZoneWidth / (numWindows * 2) + w * randomFactor(0.05); // Centered in segment + jitter
      const yPos = h * (0.3 + randomFactor(0.1));
      placements.push({
        maskName: windowTypes[Math.floor(Math.random() * windowTypes.length)],
        x: xPos - (w * (0.18 + randomFactor(0.04))) / 2, // Center the window after calculating its width
        y: yPos,
        width: w * (0.18 + randomFactor(0.04)), // Larger base, more variable
        height: h * (0.22 + randomFactor(0.06)), // Larger base, more variable
        rotation: randomFactor(5),
        layer: 2
      });
    }
    
    // Door or entrance
    const doorTypes = ['altar/gableAltar', 'architectural/archFlat', 'altar/nicheArch'];
    const doorWidth = w * (0.2 + randomFactor(0.08));
    placements.push({
      maskName: doorTypes[Math.floor(Math.random() * doorTypes.length)],
      x: w * (0.5 - doorWidth / (2*w) + randomFactor(0.08)), // Centered + jitter
      y: h * (0.65 + randomFactor(0.05)),
      width: doorWidth,
      height: h * (0.3 + randomFactor(0.08)), // Taller, more variable
      rotation: randomFactor(3),
      layer: 2
    });
    
    return placements;
  },

  // Modern minimalist composition
  modern: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Large geometric shapes
    const modernShapes = ['basic/rectangleMask', 'narrative/panelRectWide', 'narrative/panelSquare', 'abstract/polygonSoft'];
    
    // Main large element
    placements.push({
      maskName: modernShapes[Math.floor(Math.random() * modernShapes.length)],
      x: w * 0.2,
      y: h * 0.1,
      width: w * 0.6,
      height: h * 0.4,
      rotation: Math.random() > 0.7 ? Math.random() * 15 - 7.5 : 0,
      layer: 1
    });
    
    // Secondary elements
    const numSecondary = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSecondary; i++) {
      const size = w * (0.1 + Math.random() * 0.2);
      placements.push({
        maskName: modernShapes[Math.floor(Math.random() * modernShapes.length)],
        x: w * (0.1 + Math.random() * 0.7),
        y: h * (0.5 + Math.random() * 0.3),
        width: size,
        height: size * (0.5 + Math.random()),
        rotation: Math.random() > 0.5 ? Math.random() * 30 - 15 : 0,
        layer: 2
      });
    }
    
    return placements;
  },

  // Gothic-inspired composition
  gothic: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Pointed arch elements
    const gothicElements = ['altar/nicheArch', 'altar/circleAboveArch', 'architectural/triptychArch'];
    
    // Central tall arch
    placements.push({
      maskName: gothicElements[Math.floor(Math.random() * gothicElements.length)],
      x: w * 0.35,
      y: h * 0.1,
      width: w * 0.3,
      height: h * 0.6,
      rotation: 0,
      layer: 1
    });
    
    // Side arches
    placements.push({
      maskName: 'altar/nicheCluster',
      x: w * 0.1,
      y: h * 0.2,
      width: w * 0.2,
      height: h * 0.5,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: 'altar/nicheCluster',
      x: w * 0.7,
      y: h * 0.2,
      width: w * 0.2,
      height: h * 0.5,
      rotation: 0,
      layer: 2
    });
    
    // Rose window or circular element at top
    placements.push({
      maskName: 'altar/circleInset',
      x: w * 0.4,
      y: h * 0.05,
      width: w * 0.2,
      height: w * 0.2,
      rotation: 0,
      layer: 3
    });
    
    return placements;
  }
};

interface ArchitecturalEffectParams extends EffectParams {
  promptText?: string;         // optional, used to influence architectural composition
  useMixedBlending?: boolean; // whether to use mixed blending modes for fragments
  useComplementaryShapes?: boolean; // whether to add complementary color shapes
  bgColor?: string;            // optional background color
  dpr?: number;                // optional device pixel ratio
  imageMode?: 'single' | 'unique'; // Added imageMode
  useMultiply?: boolean;       // whether to use multiply blend mode (used for the main image draw before echo logic)

  // New parameters for Color Block Echo
  useColorBlockEcho?: boolean;
  echoPolicy?: 'all' | 'subset' | 'none';
  echoOpacity?: number; // Opacity for the echo color block itself
  elementOpacity?: number; // General opacity for the masked elements (renamed from opacity)
}

// Add ShapeType type definition
// (If MaskPlacement is imported, we can extend it locally)
type ShapeType = 'door' | 'window' | 'arch' | 'column' | 'cornice';

// Define favored masks for architectural effect
const favoredMasks = [
  'architectural/archClassical',
  'architectural/columnPair',
  'architectural/columnSingle',
  'architectural/columnTriplet',
  'architectural/houseGable',
  'altar/nicheStack',
  'altar/nicheArch',
  'architectural/windowRect',
  'basic/triangleMask',
];

// Helper to pick a random favored mask
function pickFavoredMask() {
  return favoredMasks[Math.floor(Math.random() * favoredMasks.length)];
}

// Helper to pick a random 90-degree rotation
function pickRotation90() {
  const options = [0, 90, 180, 270];
  return options[Math.floor(Math.random() * options.length)];
}

interface OverlapEchoParams {
  active: boolean;
  useComplementary: boolean;
  // Could add specific opacity/color if needed later
}

// Update MaskPlacement type to include overlapEcho
type ExtendedMaskPlacement = PolygonMaskPlacement & { overlapEcho?: OverlapEchoParams };

export class ArchitecturalEffect extends EffectBase {
  static id = "architectural";
  
  // Image mode: 'single' uses one image for all masks, 'unique' uses different images
  private imageMode: 'single' | 'unique' = 'unique';
  private singleImage?: HTMLImageElement;

  private readonly shapeTypes = ['door', 'window', 'arch', 'column', 'cornice'] as const;
  private readonly architecturalPresets: Record<string, MaskPlacement[]> = {
    'classic': [
      // Main building structure (cornice)
      { maskName: 'basic/rectangleMask', x: 0.1, y: 0.1, width: 0.8, height: 0.1, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnSingle', x: 0.1, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnSingle', x: 0.8, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      // Windows
      { maskName: 'architectural/windowRect', x: 0.3, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      { maskName: 'architectural/windowGrid', x: 0.55, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      // Door
      { maskName: 'altar/nicheArch', x: 0.4, y: 0.7, width: 0.2, height: 0.2, rotation: 0, layer: 2 },
      // Arches above windows
      { maskName: 'architectural/archClassical', x: 0.25, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 },
      { maskName: 'architectural/archFlat', x: 0.5, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 }
    ],
    'modern': [
      // Minimalist structure
      { maskName: 'basic/rectangleMask', x: 0.2, y: 0.1, width: 0.6, height: 0.05, rotation: 0, layer: 1 },
      // Large windows
      { maskName: 'architectural/windowRect', x: 0.25, y: 0.2, width: 0.5, height: 0.4, rotation: 0, layer: 2 },
      // Minimal door
      { maskName: 'altar/gableAltar', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Decorative elements
      { maskName: 'abstract/polygonSoft', x: 0.3, y: 0.15, width: 0.4, height: 0.1, rotation: 0, layer: 3 }
    ],
    'gothic': [
      // Main structure (cornice)
      { maskName: 'basic/rectangleMask', x: 0.1, y: 0.1, width: 0.8, height: 0.15, rotation: 0, layer: 1 },
      // Tall columns
      { maskName: 'architectural/columnPair', x: 0.15, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnPair', x: 0.77, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      // Pointed windows
      { maskName: 'architectural/windowGrid', x: 0.3, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      { maskName: 'architectural/windowGrid', x: 0.55, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      // Grand entrance
      { maskName: 'altar/gableAltar', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Pointed arches
      { maskName: 'architectural/triptychArch', x: 0.25, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 },
      { maskName: 'architectural/triptychArch', x: 0.55, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 }
    ]
  };

  protected declare params: ArchitecturalEffectParams;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: Partial<ArchitecturalEffectParams> = {}
  ) {
    super(ctx, images, params);
    console.log('[ArchEffect Constructor] Received images:', images.length, images.map(img => ({ src: img.src, complete: img.complete })));
    this.params = {
        imageMode: 'unique',
        useComplementaryShapes: true,
        useMixedBlending: false,
        useMultiply: true,
        useColorBlockEcho: false,
        echoPolicy: 'subset',
        echoOpacity: 0.6,
        elementOpacity: 1,
        ...this.params,
        ...params
    };
    console.log('[ArchEffect Constructor] Effective Params:', JSON.parse(JSON.stringify(this.params)));
    this.imageMode = this.params.imageMode || 'unique';
  }

  private _chooseRandomBackgroundColor(alpha: number = 1.0): string {
    const colors = ['#FF6B6B', /* ... */ '#1ABC9C'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return alpha < 1.0 ? `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : color;
  }

  private drawImageFragment(x: number, y: number, width: number, height: number): void {
    if (this.images.length === 0) return;
    
    const image = this.images[Math.floor(Math.random() * this.images.length)];
    if (!image || !image.complete) return;
    
    const imgAspectRatio = image.naturalWidth / image.naturalHeight;
    const shapeAspectRatio = width / height;
    let drawWidth, drawHeight;
    
    if (imgAspectRatio > shapeAspectRatio) {
      drawHeight = height;
      drawWidth = height * imgAspectRatio;
    } else {
      drawWidth = width;
      drawHeight = width / imgAspectRatio;
    }
    
    const offsetX = (drawWidth - width) / 2;
    const offsetY = (drawHeight - height) / 2;
    
    this.ctx.drawImage(image, x - offsetX, y - offsetY, drawWidth, drawHeight);
  }

  private getComplementaryColor(baseColor: string): string {
    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // Get complementary color
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;
    
    // Convert back to hex
    return `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;
  }

  private calculateOverlap(rect1: MaskPlacement, rect2: MaskPlacement): number {
    const x_overlap = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
    const y_overlap = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
    const overlapArea = x_overlap * y_overlap;

    const area1 = rect1.width * rect1.height;
    const area2 = rect2.width * rect2.height;

    if (area1 === 0 || area2 === 0) return 0;
    // Return overlap as a percentage of the smaller area
    return overlapArea / Math.min(area1, area2);
  }

  public draw(): void {
    console.log('[ArchEffect draw()] Start. Images available:', this.images.length, this.images.map(img => ({ src: img.src, complete: img.complete })));
    console.log('[ArchEffect draw()] Current singleImage before plan:', this.singleImage ? { src: this.singleImage.src, complete: this.singleImage.complete } : 'undefined');

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    const bgColor = this.params.bgColor || this._chooseRandomBackgroundColor();
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    let plan: MaskPlacement[];
    if (this.params.promptText && presets[this.params.promptText]) {
        plan = presets[this.params.promptText](this.ctx.canvas.width / (this.params.dpr || 1) , this.ctx.canvas.height / (this.params.dpr || 1));
    } else if (this.params.promptText && this.architecturalPresets[this.params.promptText]) {
        const scaledPreset = this.architecturalPresets[this.params.promptText].map(p => ({
            ...p,
            x: p.x * this.ctx.canvas.width / (this.params.dpr || 1),
            y: p.y * this.ctx.canvas.height / (this.params.dpr || 1),
            width: p.width * this.ctx.canvas.width / (this.params.dpr || 1),
            height: p.height * this.ctx.canvas.height / (this.params.dpr || 1),
        }));
        plan = scaledPreset;
    }else {
        plan = this.generateArchitecturalPlan();
    }

    // Cast to ExtendedMaskPlacement for overlap logic
    let extendedPlan = plan as ExtendedMaskPlacement[];

    // Overlap detection logic
    const OVERLAP_THRESHOLD = 0.3; // 30% overlap
    for (let i = 0; i < extendedPlan.length; i++) {
      for (let j = i + 1; j < extendedPlan.length; j++) {
        const elementA = extendedPlan[i];
        const elementB = extendedPlan[j];

        const overlapPercentage = this.calculateOverlap(elementA, elementB);

        if (overlapPercentage > OVERLAP_THRESHOLD) {
          // Determine which element is on top (higher layer, or later in array if same layer)
          let topElement = (elementA.layer || 0) > (elementB.layer || 0) ? elementA :
                           (elementB.layer || 0) > (elementA.layer || 0) ? elementB :
                           j > i ? elementB : elementA; // if layers are same, j is later so B is on top
          let bottomElement = topElement === elementA ? elementB : elementA;

          console.log(`[ArchEffect Overlap] Significant overlap (${(overlapPercentage * 100).toFixed(1)}%) between:`, elementA.maskName, `(layer ${elementA.layer}) and`, elementB.maskName, `(layer ${elementB.layer}). Top: ${topElement.maskName}`);

          if (!topElement.overlapEcho || !topElement.overlapEcho.active) { // Only apply if not already set by another overlap
             topElement.overlapEcho = {
              active: true,
              useComplementary: Math.random() < 0.5, // 50% chance for complementary, else use background color
            };
          }
        }
      }
    }

    this.imageMode = this.params.imageMode || 'unique';
    if (this.imageMode === 'single' && this.images.length > 0) {
      this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
    } else {
      this.singleImage = undefined;
    }

    this.drawPlan(plan as PolygonMaskPlacement[]);

    if (this.params.useComplementaryShapes && !this.params.useColorBlockEcho) {
      this.drawComplementaryShape(bgColor);
    }
  }

  private drawComplementaryShape(baseBgColor: string): void {
    const ctx = this.ctx;
    const canvasWidth = ctx.canvas.width / (this.params.dpr || 1);
    const canvasHeight = ctx.canvas.height / (this.params.dpr || 1);
    
    const compColor = this.getComplementaryColor(baseBgColor);
    
    const numShapes = Math.random() > 0.5 ? 1 : 2;
    for (let i = 0; i < numShapes; i++) {
      const shapeType = Math.random() > 0.5 ? 'arch' : 'rect';
      const size = Math.min(canvasWidth, canvasHeight) * (0.3 + Math.random() * 0.2);
      const x = canvasWidth * (0.2 + Math.random() * 0.6) - size / 2;
      const y = canvasHeight * (0.2 + Math.random() * 0.6) - size / 2;
      
      ctx.save();
      ctx.fillStyle = compColor;
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.beginPath();
      if (shapeType === 'arch') {
        ctx.moveTo(x, y + size);
        ctx.arc(x + size/2, y + size * 0.6, size/2, Math.PI, 0, false);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
      } else {
        ctx.rect(x, y, size, size);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMask(type: ShapeType, x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    
    if (type === 'door') {
      ctx.rect(x, y, w, h);
    }
    else if (type === 'window') {
      ctx.rect(x, y, w, h);
      ctx.moveTo(x + w/2, y);
      ctx.lineTo(x + w/2, y + h);
      ctx.moveTo(x, y + h/2);
      ctx.lineTo(x + w, y + h/2);
    }
    else if (type === 'arch') {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h*0.6);
      ctx.arc(x + w/2, y + h*0.6, w/2, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
    }
    else if (type === 'column') {
      ctx.moveTo(x + w*0.2, y);
      ctx.rect(x + w*0.2, y, w*0.6, h);
    }
    else if (type === 'cornice') {
      const bar = h * 0.2;
      ctx.rect(x, y, w, bar);
    }
  }
  
  public drawPlan(plan: PolygonMaskPlacement[]): void {
    console.log('[ArchEffect drawPlan()] Start. Images available:', this.images.length, 'Single image:', this.singleImage ? { src: this.singleImage.src, complete: this.singleImage.complete } : 'undefined');
    this.imageMode = this.params.imageMode || 'unique';
    if (this.imageMode === 'single' && this.images.length > 0 && (!this.singleImage || !this.singleImage.complete)) {
      this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
    }
    
    const mainBgColorForEcho = this.params.bgColor || '#FFFFFF';
    let imgIndex = 0;

    plan.forEach((placement) => {
      const extendedPlacement = placement as ExtendedMaskPlacement;
      const { maskName, x, y, width: maskWidth, height: maskHeight, rotation, polygon } = placement;
      
      this.ctx.save(); // Outer save for each placement
      try {
        let path: Path2D;
        // Get mask path
        if (polygon && polygon.length >= 3) {
          path = new Path2D();
          // Convert polygon points to 0-100 space relative to maskWidth/Height
          path.moveTo((polygon[0].x - x) * 100 / maskWidth, (polygon[0].y - y) * 100 / maskHeight); 
          for (let i = 1; i < polygon.length; i++) {
            path.lineTo((polygon[i].x - x) * 100 / maskWidth, (polygon[i].y - y) * 100 / maskHeight);
          }
          path.closePath();
        } else if (maskName.includes('/')) {
          const [family, type] = maskName.split('/');
          const maskFn = maskRegistry[family]?.[type];
          if (maskFn) {
            let svgDesc = maskFn(); // Call the function that returns the descriptor
            let svg = '';
            if (svgDesc && svgDesc.kind === 'svg' && typeof svgDesc.getSvg === 'function') {
              svg = svgDesc.getSvg({}); // Call getSvg on the descriptor
            }
            const maskPathFromSvg = svgToPath2D(svg);
            path = maskPathFromSvg || new Path2D();
            if (!maskPathFromSvg) path.rect(0, 0, 100, 100);
          } else {
            console.warn(`Mask not found in registry: ${maskName}, using fallback rectangle.`);
            path = new Path2D(); path.rect(0, 0, 100, 100);
          }
        } else {
           console.warn(`Mask name ${maskName} does not conform to 'family/type' format, using fallback rectangle.`);
           path = new Path2D(); path.rect(0,0,100,100);
        }

        // Apply transformations for the current element
        this.ctx.translate(x + maskWidth / 2, y + maskHeight / 2); 
        if (rotation) this.ctx.rotate(rotation * Math.PI / 180);
        this.ctx.translate(-maskWidth / 2, -maskHeight / 2); 
        this.ctx.scale(maskWidth / 100, maskHeight / 100); 
        
        this.ctx.clip(path); 

        let drawStandardEcho = false;
        let useOverlapEcho = false;
        let echoColorToUse = 'transparent';
        let finalImageOpacity = this.params.elementOpacity !== undefined ? this.params.elementOpacity : 1.0;
        let imageBlendMode = (this.params.useMultiply !== false ? 'multiply' : 'source-over') as GlobalCompositeOperation;
        let finalEchoOpacity = this.params.echoOpacity !== undefined ? this.params.echoOpacity : 0.7;

        if (extendedPlacement.overlapEcho?.active) {
          useOverlapEcho = true;
          console.log(`[ArchitecturalEffect] Overlap Echo active for ${maskName}`);
          echoColorToUse = extendedPlacement.overlapEcho.useComplementary
            ? this.getComplementaryColor(mainBgColorForEcho)
            : mainBgColorForEcho;
          finalImageOpacity = 1.0;
          imageBlendMode = 'multiply';
          finalEchoOpacity = 0.85;
        } else if (this.params.useColorBlockEcho) {
          const policy = this.params.echoPolicy || 'subset';
          if (policy === 'all' || (policy === 'subset' && (maskName.length + x + y) % 10 < 5) ) {
            drawStandardEcho = true;
            console.log(`[ArchitecturalEffect] Standard Echo for ${maskName}`);
            echoColorToUse = this.getComplementaryColor(mainBgColorForEcho);
            imageBlendMode = 'multiply'; 
          }
        }

        if (useOverlapEcho || drawStandardEcho) {
          this.ctx.fillStyle = echoColorToUse;
          this.ctx.globalAlpha = finalEchoOpacity;
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.fillRect(0, 0, 100, 100); 
        }

        let imageToDraw: HTMLImageElement | undefined;
        if (this.imageMode === 'single') {
            imageToDraw = this.singleImage;
        } else if (this.images.length > 0) {
            imageToDraw = this.images[imgIndex % this.images.length];
            if (this.imageMode === 'unique') imgIndex++; // Corrected: check for 'unique' not '!== single'
        }

        console.log(`[ArchEffect drawPlan Loop] Mask ${maskName}: imageMode='${this.imageMode}', Image: ${imageToDraw ? imageToDraw.src.substring(imageToDraw.src.lastIndexOf('/')+1) : 'N/A'}, Complete: ${imageToDraw?.complete}, Broken: ${(imageToDraw as any)?.isBroken}`);

        if (imageToDraw && imageToDraw.complete && !(imageToDraw as any)?.isBroken) {
          this.ctx.globalAlpha = finalImageOpacity;
          this.ctx.globalCompositeOperation = imageBlendMode;

          const imgWidth = imageToDraw.width || imageToDraw.naturalWidth;
          const imgHeight = imageToDraw.height || imageToDraw.naturalHeight;
          const imgRatio = imgWidth / imgHeight;
          const targetClipWidth = 100; 
          const targetClipHeight = 100;
          const targetRatio = targetClipWidth / targetClipHeight;
          let sX = 0, sY = 0, sWidth = imgWidth, sHeight = imgHeight;

          if (imgRatio > targetRatio) { 
              sWidth = imgHeight * targetRatio;
              sX = (imgWidth - sWidth) / 2;
          } else { 
              sHeight = imgWidth / targetRatio;
              sY = (imgHeight - sHeight) / 2;
          }
          this.ctx.drawImage(imageToDraw, sX, sY, sWidth, sHeight, 0, 0, targetClipWidth, targetClipHeight);
          console.log(`[ArchitecturalEffect] Drawn image for ${maskName}. Opacity: ${this.ctx.globalAlpha}, Blend: ${this.ctx.globalCompositeOperation}`);
        } else {
            console.warn(`[ArchitecturalEffect] Image for mask ${maskName} not drawn.`);
        }

      } catch (error) {
        console.error('Error drawing architectural element:', placement.maskName, error);
      } finally {
        this.ctx.restore(); 
      }
    });
  }
  
  public generateArchitecturalPlan(): MaskPlacement[] {
    const canvasWidth = this.ctx.canvas.width / (this.params.dpr || 1);
    const canvasHeight = this.ctx.canvas.height / (this.params.dpr || 1);

    const numPrimary = 1 + Math.floor(Math.random() * 3);
    const placements: MaskPlacement[] = [];
    for (let i = 0; i < numPrimary; i++) {
      const maskName = pickFavoredMask();
      const w = canvasWidth * (0.3 + Math.random() * 0.3);
      const h = canvasHeight * (0.3 + Math.random() * 0.3);
      const x = Math.random() * (canvasWidth - w);
      const y = Math.random() * (canvasHeight - h);
      placements.push({
        maskName,
        x,
        y,
        width: w,
        height: h,
        rotation: pickRotation90(),
        layer: 1
      });
    }
    const numSecondary = Math.floor(Math.random() * 3);
    for (let i = 0; i < numSecondary; i++) {
      const maskName = pickFavoredMask();
      const w = canvasWidth * (0.15 + Math.random() * 0.15);
      const h = canvasHeight * (0.15 + Math.random() * 0.15);
      const x = Math.random() * (canvasWidth - w);
      const y = Math.random() * (canvasHeight - h);
      placements.push({
        maskName,
        x,
        y,
        width: w,
        height: h,
        rotation: pickRotation90(),
        layer: 2
      });
    }
    return placements;
  }

  private generateRandomArchitecturalPlan(): MaskPlacement[] {
    const plan: MaskPlacement[] = [];
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    
    plan.push({
      maskName: 'cornice',
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: height * 0.1,
      rotation: 0,
      layer: 1
    });
    
    plan.push({
      maskName: 'column',
      x: width * 0.1,
      y: height * 0.2,
      width: width * 0.1,
      height: height * 0.7,
      rotation: 0,
      layer: 1
    });
    
    plan.push({
      maskName: 'column',
      x: width * 0.8,
      y: height * 0.2,
      width: width * 0.1,
      height: height * 0.7,
      rotation: 0,
      layer: 1
    });
    
    const numWindows = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numWindows; i++) {
      const xPos = width * (0.2 + (i * 0.8 / (numWindows + 1)));
      plan.push({
        maskName: 'window',
        x: xPos,
        y: height * 0.3,
        width: width * 0.15,
        height: height * 0.2,
        rotation: 0,
        layer: 2
      });
      
      plan.push({
        maskName: 'arch',
        x: xPos - width * 0.05,
        y: height * 0.25,
        width: width * 0.25,
        height: height * 0.15,
        rotation: 0,
        layer: 3
      });
    }
    
    plan.push({
      maskName: 'door',
      x: width * 0.4,
      y: height * 0.7,
      width: width * 0.2,
      height: height * 0.2,
      rotation: 0,
      layer: 2
    });
    
    return plan;
  }
}

function voronoiFragments(placement: PolygonMaskPlacement, numFragments = 4): PolygonMaskPlacement[] {
  const { x, y, width, height, ...rest } = placement;
  const points = Array.from({ length: numFragments }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));
  points.push({ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height });
  const cells: PolygonMaskPlacement[] = [];
  for (let i = 0; i < numFragments; i++) {
    const px = points[i].x, py = points[i].y;
    const jitter = (v: number) => v + (Math.random() - 0.5) * width * 0.1;
    const poly = [
      { x: jitter(px - width * 0.15), y: jitter(py - height * 0.15) },
      { x: jitter(px + width * 0.15), y: jitter(py - height * 0.15) },
      { x: jitter(px + width * 0.15), y: jitter(py + height * 0.15) },
      { x: jitter(px - width * 0.15), y: jitter(py + height * 0.15) },
    ].map(pt => ({ x: Math.max(0, Math.min(width, pt.x)), y: Math.max(0, Math.min(height, pt.y)) }));
    cells.push({
      ...rest,
      x, y, width, height,
      polygon: poly,
    });
  }
  return cells;
}

function organicFragmentGrid(
  placement: PolygonMaskPlacement,
  rows: number,
  cols: number,
  jitterRatio = 0.04,
  gapRatio = 0.02
): PolygonMaskPlacement[] {
  const { x, y, width, height, ...rest } = placement;
  const points: { x: number, y: number }[][] = [];
  for (let r = 0; r <= rows; r++) {
    points[r] = [];
    for (let c = 0; c <= cols; c++) {
      const px = x + (c * width) / cols;
      const py = y + (r * height) / rows;
      const jx = px + (Math.random() - 0.5) * width * jitterRatio;
      const jy = py + (Math.random() - 0.5) * height * jitterRatio;
      points[r][c] = { x: jx, y: jy };
    }
  }
  const fragments: PolygonMaskPlacement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const centerX = (points[r][c].x + points[r][c+1].x + points[r+1][c+1].x + points[r+1][c].x) / 4;
      const centerY = (points[r][c].y + points[r][c+1].y + points[r+1][c+1].y + points[r+1][c].y) / 4;
      const shrink = (pt: {x: number, y: number}) => ({
        x: centerX + (pt.x - centerX) * (1 - gapRatio),
        y: centerY + (pt.y - centerY) * (1 - gapRatio),
      });
      fragments.push({
        ...rest,
        x: centerX, y: centerY,
        width: width / cols, height: height / rows,
        rotation: 0,
        polygon: [
          shrink(points[r][c]),
          shrink(points[r][c+1]),
          shrink(points[r+1][c+1]),
          shrink(points[r+1][c]),
        ]
      });
    }
  }
  return fragments;
}
