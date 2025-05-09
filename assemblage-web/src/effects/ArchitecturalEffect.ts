import { EffectBase, EffectParams, MaskPlacement } from './EffectBase';

// Update MaskPlacement type to allow polygon points
// (If MaskPlacement is imported, we can extend it locally)
type PolygonMaskPlacement = MaskPlacement & { polygon?: {x: number, y: number}[] };

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
    
    return [
      {
        maskName: 'arch',
        x: mainX - mainSize/2,
        y: mainY,
        width: mainSize,
        height: mainSize,
        rotation: 0,
        layer: 1
      },
      {
        maskName: 'diamond',
        x: smallX - smallSize/2,
        y: smallY - smallSize/2,
        width: smallSize,
        height: smallSize,
        rotation: 0,
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
        maskName: 'arch',
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
          maskName: 'arch',
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
          maskName: 'arch',
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
    
    // Add the central arch
    placements.push({
      maskName: 'arch',
      x: centerX - archSize/2,
      y: centerY - archSize/2,
      width: archSize,
      height: archSize,
      rotation: 0,
      layer: 1
    });

    // Two smaller arches on sides with more variation
    const sideSizeFactor = 0.4 + (Math.random() * 2 - 1) * sizeVariation;
    const sideSize = archSize * sideSizeFactor;
    
    // Randomly position the side arches
    const leftX = centerX - archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const rightX = centerX + archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const sideY = centerY + archSize * (0.2 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the side arches
    placements.push({
      maskName: 'arch',
      x: leftX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: 'arch',
      x: rightX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });

    return placements;
  },

  // House facade with windows and door
  houseFacade: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Add more variation to size and position
    const sizeVariation = 0.15; // 15% variation
    const positionVariation = 0.1; // 10% variation
    
    // Randomly determine if we want a larger or smaller facade
    const facadeWidthFactor = 0.8 + (Math.random() * 2 - 1) * sizeVariation;
    const facadeHeightFactor = 0.8 + (Math.random() * 2 - 1) * sizeVariation;
    const facadeWidth = w * facadeWidthFactor;
    const facadeHeight = h * facadeHeightFactor;
    
    // Randomly position the facade
    const facadeX = w * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const facadeY = h * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the main facade structure
    placements.push({
      maskName: 'rect',
      x: facadeX - facadeWidth/2,
      y: facadeY - facadeHeight/2,
      width: facadeWidth,
      height: facadeHeight,
      rotation: 0,
      layer: 1
    });
    
    // Add windows with more variation
    const windowSizeFactor = 0.15 + (Math.random() * 2 - 1) * sizeVariation;
    const windowSize = facadeWidth * windowSizeFactor;
    
    // Randomly position the windows
    const leftWindowX = facadeX - facadeWidth * (0.25 + (Math.random() * 2 - 1) * positionVariation);
    const rightWindowX = facadeX + facadeWidth * (0.25 + (Math.random() * 2 - 1) * positionVariation);
    const windowY = facadeY - facadeHeight * (0.2 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the windows
    placements.push({
      maskName: 'window',
      x: leftWindowX - windowSize/2,
      y: windowY - windowSize/2,
      width: windowSize,
      height: windowSize,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: 'window',
      x: rightWindowX - windowSize/2,
      y: windowY - windowSize/2,
      width: windowSize,
      height: windowSize,
      rotation: 0,
      layer: 2
    });
    
    // Add a door with more variation
    const doorWidthFactor = 0.2 + (Math.random() * 2 - 1) * sizeVariation;
    const doorHeightFactor = 0.3 + (Math.random() * 2 - 1) * sizeVariation;
    const doorWidth = facadeWidth * doorWidthFactor;
    const doorHeight = facadeHeight * doorHeightFactor;
    
    // Randomly position the door
    const doorX = facadeX + facadeWidth * ((Math.random() * 2 - 1) * positionVariation);
    const doorY = facadeY + facadeHeight * (0.2 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the door
    placements.push({
      maskName: 'door',
      x: doorX - doorWidth/2,
      y: doorY - doorHeight/2,
      width: doorWidth,
      height: doorHeight,
      rotation: 0,
      layer: 2
    });
    
    // Add a roof with more variation
    const roofWidthFactor = 0.9 + (Math.random() * 2 - 1) * sizeVariation;
    const roofHeightFactor = 0.2 + (Math.random() * 2 - 1) * sizeVariation;
    const roofWidth = facadeWidth * roofWidthFactor;
    const roofHeight = facadeHeight * roofHeightFactor;
    
    // Randomly position the roof
    const roofX = facadeX + facadeWidth * ((Math.random() * 2 - 1) * positionVariation);
    const roofY = facadeY - facadeHeight * (0.4 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the roof
    placements.push({
      maskName: 'triangle',
      x: roofX - roofWidth/2,
      y: roofY - roofHeight/2,
      width: roofWidth,
      height: roofHeight,
      rotation: 0,
      layer: 3
    });
    
    return placements;
  },
};

interface ArchitecturalEffectParams extends EffectParams {
  promptText?: string;         // optional, used to influence architectural composition
  useMixedBlending?: boolean; // whether to use mixed blending modes for fragments
  useComplementaryShapes?: boolean; // whether to add complementary color shapes
}

// Add ShapeType type definition
// (If MaskPlacement is imported, we can extend it locally)
type ShapeType = 'door' | 'window' | 'arch' | 'column' | 'cornice';

export class ArchitecturalEffect extends EffectBase {
  static id = "architectural";
  
  // Image mode: 'single' uses one image for all masks, 'unique' uses different images
  private imageMode: 'single' | 'unique' = 'unique';
  private singleImage?: HTMLImageElement;

  private readonly shapeTypes = ['door', 'window', 'arch', 'column', 'cornice'] as const;
  private readonly architecturalPresets: Record<string, MaskPlacement[]> = {
    'classic': [
      // Main building structure
      { maskName: 'cornice', x: 0.1, y: 0.1, width: 0.8, height: 0.1, rotation: 0, layer: 1 },
      { maskName: 'column', x: 0.1, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      { maskName: 'column', x: 0.8, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      // Windows
      { maskName: 'window', x: 0.3, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      { maskName: 'window', x: 0.55, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      // Door
      { maskName: 'door', x: 0.4, y: 0.7, width: 0.2, height: 0.2, rotation: 0, layer: 2 },
      // Arches above windows
      { maskName: 'arch', x: 0.25, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 },
      { maskName: 'arch', x: 0.5, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 }
    ],
    'modern': [
      // Minimalist structure
      { maskName: 'cornice', x: 0.2, y: 0.1, width: 0.6, height: 0.05, rotation: 0, layer: 1 },
      // Large windows
      { maskName: 'window', x: 0.25, y: 0.2, width: 0.5, height: 0.4, rotation: 0, layer: 2 },
      // Minimal door
      { maskName: 'door', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Decorative elements
      { maskName: 'arch', x: 0.3, y: 0.15, width: 0.4, height: 0.1, rotation: 0, layer: 3 }
    ],
    'gothic': [
      // Main structure
      { maskName: 'cornice', x: 0.1, y: 0.1, width: 0.8, height: 0.15, rotation: 0, layer: 1 },
      // Tall columns
      { maskName: 'column', x: 0.15, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      { maskName: 'column', x: 0.77, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      // Pointed windows
      { maskName: 'window', x: 0.3, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      { maskName: 'window', x: 0.55, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      // Grand entrance
      { maskName: 'door', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Pointed arches
      { maskName: 'arch', x: 0.25, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 },
      { maskName: 'arch', x: 0.55, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 }
    ]
  };

  protected declare params: ArchitecturalEffectParams;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: Partial<ArchitecturalEffectParams> = {}
  ) {
    super(ctx, images, params);
  }

  private chooseBackgroundColor(alpha: number = 1.0): string {
    const colors = [
      '#FF6B6B', // Coral Red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Sky Blue
      '#96CEB4', // Sage Green
      '#FFEEAD', // Cream
      '#D4A5A5', // Dusty Rose
      '#9B59B6', // Purple
      '#3498DB', // Blue
      '#E67E22', // Orange
      '#1ABC9C'  // Green
    ];
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

  private drawComplementaryShape(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const height = ctx.canvas.height / dpr;
    
    // Get background color and its complementary
    const bgColor = this.chooseBackgroundColor();
    const compColor = this.getComplementaryColor(bgColor);
    
    // Draw 1-2 large shapes in complementary color
    const numShapes = Math.random() > 0.5 ? 1 : 2;
    
    for (let i = 0; i < numShapes; i++) {
      const shapeType = Math.random() > 0.5 ? 'arch' : 'rect';
      const size = Math.min(width, height) * (0.3 + Math.random() * 0.2);
      const x = width * (0.2 + Math.random() * 0.6);
      const y = height * (0.2 + Math.random() * 0.6);
      
      ctx.save();
      ctx.fillStyle = compColor;
      ctx.globalAlpha = 0.5;
      
      if (shapeType === 'arch') {
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.arc(x + size/2, y + size * 0.6, size/2, Math.PI, 0);
        ctx.lineTo(x + size, y + size);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.restore();
    }
  }

  public draw(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const height = ctx.canvas.height / dpr;

    // Clear the canvas and set initial state
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Fill with background color
    ctx.fillStyle = this.chooseBackgroundColor();
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw complementary shapes if enabled
    if (this.params.useComplementaryShapes) {
      this.drawComplementaryShape();
    }

    // Generate and draw the architectural plan
    const plan = this.generateArchitecturalPlan();
    this.drawPlan(plan);
  }

  // helper mask paths
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
  
  /**
   * Draw a plan of mask placements using Canvas clip API
   * This implementation follows the same pattern as CrystalEffect
   */
  public drawPlan(plan: PolygonMaskPlacement[]): void {
    this.imageMode = Math.random() > 0.5 ? 'single' : 'unique';
    if (this.imageMode === 'single' && this.images.length > 0) {
      this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
    }
    plan.forEach((placement) => {
      const { maskName, x, y, width: maskWidth, height: maskHeight, rotation, polygon } = placement;
      this.ctx.save();
      try {
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation * Math.PI / 180);
        let path: Path2D;
        if (polygon && polygon.length >= 3) {
          path = new Path2D();
          path.moveTo(polygon[0].x - x, polygon[0].y - y);
          for (let i = 1; i < polygon.length; i++) {
            path.lineTo(polygon[i].x - x, polygon[i].y - y);
          }
          path.closePath();
        } else {
          path = new Path2D();
          switch (maskName as ShapeType) {
            case 'door':
            case 'window':
            case 'column':
            case 'cornice':
              path.rect(0, 0, maskWidth, maskHeight);
              break;
            case 'arch':
              path.moveTo(0, maskHeight);
              path.arc(maskWidth/2, maskHeight * 0.6, maskWidth/2, Math.PI, 0);
              path.lineTo(maskWidth, maskHeight);
              path.closePath();
              break;
            default:
              return;
          }
        }
        this.ctx.clip(path);
        
        // Always use multiply for fragments, except for complementary shapes
        if (maskName === 'complementary') {
          this.ctx.globalCompositeOperation = 'source-over';
        } else {
          this.ctx.globalCompositeOperation = 'multiply';
        }
        
        let image: HTMLImageElement | undefined;
        if (this.imageMode === 'single' && this.singleImage) {
          image = this.singleImage;
        } else if (this.images.length > 0) {
          image = this.images[Math.floor(Math.random() * this.images.length)];
        }
        if (image && image.complete) {
          const imgWidth = image.naturalWidth;
          const imgHeight = image.naturalHeight;
          const imgRatio = imgWidth / imgHeight;
          const maskRatio = maskWidth / maskHeight;
          let drawWidth, drawHeight, offsetX, offsetY;
          if (imgRatio > maskRatio) {
            drawHeight = maskHeight;
            drawWidth = maskHeight * imgRatio;
            offsetX = -(drawWidth - maskWidth) / 2;
            offsetY = 0;
          } else {
            drawWidth = maskWidth;
            drawHeight = maskWidth / imgRatio;
            offsetX = 0;
            offsetY = -(drawHeight - maskHeight) / 2;
          }
          this.ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        } else {
          this.ctx.fillStyle = this.chooseBackgroundColor(1.0);
          this.ctx.fillRect(0, 0, maskWidth, maskHeight);
        }
      } catch (error) {
        console.error('Error drawing architectural element:', error);
      } finally {
        this.ctx.restore();
      }
    });
  }
  
  /**
   * Generate a more architectural-focused plan with proper building shapes
   * This method creates a plan that resembles a building with doors, windows, arches, etc.
   */
  public generateArchitecturalPlan(): MaskPlacement[] {
    const dpr = window.devicePixelRatio || 1;
    const width = this.ctx.canvas.width / dpr;
    const height = this.ctx.canvas.height / dpr;

    // If we have a prompt, use it to influence the composition
    if (this.params.promptText) {
      const lowerPrompt = this.params.promptText.toLowerCase();
      
      // Choose preset based on prompt keywords
      if (lowerPrompt.includes('series') || lowerPrompt.includes('row')) {
        return presets.archSeries(width, height);
      } else if (lowerPrompt.includes('nested')) {
        return presets.nestedArches(width, height);
      } else if (lowerPrompt.includes('coliseum')) {
        return presets.coliseum(width, height);
      }
    }

    // For random compositions, choose a random preset
    const presetKeys = Object.keys(presets);
    const randomPreset = presetKeys[Math.floor(Math.random() * presetKeys.length)];
    return presets[randomPreset](width, height);
  }

  private generateRandomArchitecturalPlan(): MaskPlacement[] {
    const plan: MaskPlacement[] = [];
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    
    // Add a cornice at the top
    plan.push({
      maskName: 'cornice',
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: height * 0.1,
      rotation: 0,
      layer: 1
    });
    
    // Add columns on the sides
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
    
    // Add windows (2-4)
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
      
      // Add an arch above each window
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
    
    // Add a door
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
  // Generate random seed points within the rectangle
  const points = Array.from({ length: numFragments }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));
  // Add corners to ensure full coverage
  points.push({ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height });
  // For each seed, make a cell as a rough polygon (for minimal, just make a random quadrilateral around each point)
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
  jitterRatio = 0.04, // reduced from 0.12
  gapRatio = 0.02     // reduced from 0.08
): PolygonMaskPlacement[] {
  const { x, y, width, height, ...rest } = placement;
  const points: { x: number, y: number }[][] = [];
  // Generate grid points with jitter
  for (let r = 0; r <= rows; r++) {
    points[r] = [];
    for (let c = 0; c <= cols; c++) {
      const px = x + (c * width) / cols;
      const py = y + (r * height) / rows;
      // Jitter each point
      const jx = px + (Math.random() - 0.5) * width * jitterRatio;
      const jy = py + (Math.random() - 0.5) * height * jitterRatio;
      points[r][c] = { x: jx, y: jy };
    }
  }
  // Create fragments as polygons with a gap
  const fragments: PolygonMaskPlacement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Shrink polygon towards its center for gap
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
        rotation: 0, // Force rotation to 0 to prevent random rotations
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