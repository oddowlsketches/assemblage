// Remove Paper.js imports
import maskImpl from '../legacy/js/collage/maskImplementations.js';

/* Shared parameter bag ---------------------------------------------------- */
export interface EffectParams {
  complexity: number;          // 0-1 for simple, 1-5 for advanced, etc.
  density?: number;            // optional, used by tiling-style effects
  blendOpacity?: number;       // 0-1 alpha applied when compositing
  seedPattern?: string;        // 'grid' | 'clusters' | …
  variation?: string;          // 'Classic' | 'Organic' | 'Focal' | …
  // 👉  Add new keys any time; the interface will grow with future effects.
}

/* Mask placement interface ------------------------------------------------- */
export interface MaskPlacement {
  maskName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layer: number;
}

/* Abstract base every effect must extend ---------------------------------- */
export abstract class EffectBase {
  protected ctx: CanvasRenderingContext2D;
  protected images: HTMLImageElement[];
  protected params: EffectParams;
  protected maskSvgs: { [key: string]: string } = {};
  // Remove Paper.js dependency
  // protected paperScope: InstanceType<typeof PaperScope>;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: Partial<EffectParams> = {}
  ) {
    this.ctx = ctx;
    this.images = images;
    // Remove Paper.js initialization
    // this.paperScope = new PaperScope();
    
    // Create SVG strings for each mask type
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 100;  // Use 100x100 for SVG viewBox
    tempCanvas.height = 100;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Could not get 2D context for temp canvas');

    this.maskSvgs = {};
    for (const [maskName, impl] of Object.entries(maskImpl)) {
        tempCtx.clearRect(0, 0, 100, 100);
        tempCtx.fillStyle = '#000000';
        tempCtx.save();
        impl.draw(tempCtx, 100, 100);
        tempCtx.fill();
        tempCtx.restore();

        // Get the image data and convert to SVG path
        const imageData = tempCtx.getImageData(0, 0, 100, 100);
        const pathData = this.canvasToSVGPath(imageData);
        
        // Create SVG string with viewBox
        this.maskSvgs[maskName] = `<svg viewBox="0 0 100 100"><path d="${pathData}"/></svg>`;
    }
    
    console.log(
      '[EffectBase] maskImpl keys:', 
      Object.keys(maskImpl), 
      '→ maskSvgs length:', 
      Object.keys(this.maskSvgs).length
    );
    
    /** merge with sensible defaults so missing keys never blow up */
    this.params = {
      complexity: 1,
      density: 0.5,
      blendOpacity: 0.7,
      seedPattern: 'grid',
      variation: 'Classic',
      ...params,
    };
  }

  /** Every concrete effect must implement its own drawing logic */
  abstract draw(): void;

  /** Pick a background color for the effect */
  protected pickBGColor(): string {
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
      '#2ECC71'  // Green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /** Draw a plan of mask placements using Canvas clip API */
  drawPlan(plan: MaskPlacement[]) {
    // Capture the main canvas dimensions
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    const dpr = window.devicePixelRatio || 1;
    
    // Create an offscreen canvas for the collage
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offscreenCtx = offscreen.getContext('2d');
    if (!offscreenCtx) {
      console.error('Failed to get offscreen context');
      return;
    }
    
    // Set up the offscreen context with proper DPR scaling
    offscreenCtx.scale(dpr, dpr);
    
    // Fill the main canvas background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw images from the collage onto the offscreen canvas
    if (this.images && this.images.length > 0) {
      console.log('Drawing images to offscreen canvas:', this.images.length);
      
      // Calculate how many images to draw based on the plan
      const numImages = Math.min(this.images.length, plan.length);
      
      // Draw images in a grid pattern
      const cols = Math.ceil(Math.sqrt(numImages));
      const rows = Math.ceil(numImages / cols);
      const cellWidth = width / dpr / cols;
      const cellHeight = height / dpr / rows;
      
      for (let i = 0; i < numImages; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        // Draw the image into its cell
        offscreenCtx.drawImage(this.images[i], x, y, cellWidth, cellHeight);
      }
    } else {
      console.log('No images available, using solid color');
      // If no images, fill with a solid color
      offscreenCtx.fillStyle = '#3498db';
      offscreenCtx.fillRect(0, 0, width, height);
    }
    
    // Build a single Path2D that contains all mask shapes as subpaths
    const maskUnion = new Path2D();
    
    // Process each mask placement
    plan.forEach((placement, _index) => {
      const { maskName, x, y, width: maskWidth, height: maskHeight, rotation } = placement;
      
      // Get the SVG path for this mask type
      const svgString = this.maskSvgs[maskName];
      if (!svgString) {
        console.warn(`No SVG path found for mask type: ${maskName}`);
        return;
      }
      
      // Extract just the path data from the SVG string
      const pathMatch = svgString.match(/d="([^"]+)"/);
      if (!pathMatch) {
        console.warn(`Could not extract path data from SVG string for mask type: ${maskName}`);
        return;
      }
      
      const pathData = pathMatch[1];
      
      // Create a Path2D object from the path data
      const shape = new Path2D(pathData);
      
      // Create a transformation matrix for this mask
      const matrix = new DOMMatrix()
        .translate(x, y)
        .translate(maskWidth/2, maskHeight/2)
        .rotate(rotation)
        .translate(-maskWidth/2, -maskHeight/2)
        .scale(maskWidth/100, maskHeight/100); // SVG viewBox is 100x100
      
      // Add the transformed path to the union
      maskUnion.addPath(shape, matrix);
    });
    
    // Apply the clip once to the combined path
    this.ctx.save();
    this.ctx.clip(maskUnion);
    
    // Draw the offscreen collage into the clipped region
    this.ctx.drawImage(offscreen, 0, 0, width, height);
    
    // Restore the context state
    this.ctx.restore();
  }

  // Helper method to convert canvas image data to SVG path
  private canvasToSVGPath(imageData: ImageData): string {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const path: string[] = [];
    const visited = new Set<string>();
    const maxSteps = width * height; // Prevent infinite loops
    let steps = 0;
    
    // Find first non-transparent pixel
    let startX = -1, startY = -1;
    for (let y = 0; y < height && startY === -1; y++) {
      for (let x = 0; x < width && startX === -1; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] > 0) {  // Alpha > 0
          startX = x;
          startY = y;
          break;
        }
      }
    }
    
    if (startX === -1 || startY === -1) {
      // No non-transparent pixels found, return a default path
      return 'M50,10 L90,50 L50,90 L10,50 Z';
    }
    
    // Start the path
    path.push(`M${startX},${startY}`);
    visited.add(`${startX},${startY}`);
    
    // Trace the outline
    let x = startX;
    let y = startY;
    let direction = 0;  // 0: right, 1: down, 2: left, 3: up
    
    const isPixelSolid = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const i = (y * width + x) * 4;
      return data[i + 3] > 0;
    };
    
    const getNextDirection = (currentDir: number): number => {
      // Try to maintain current direction, then try turning right
      const dirs = [currentDir, (currentDir + 1) % 4, (currentDir + 3) % 4, (currentDir + 2) % 4];
      return dirs.find(dir => {
        let newX = x, newY = y;
        switch (dir) {
          case 0: newX++; break;  // right
          case 1: newY++; break;  // down
          case 2: newX--; break;  // left
          case 3: newY--; break;  // up
        }
        return isPixelSolid(newX, newY) && !visited.has(`${newX},${newY}`);
      }) ?? -1;
    };
    
    do {
      if (steps++ > maxSteps) {
        console.warn('Path tracing exceeded maximum steps');
        break;
      }
      
      const nextDir = getNextDirection(direction);
      if (nextDir === -1) break;
      
      let newX = x, newY = y;
      switch (nextDir) {
        case 0: newX++; break;  // right
        case 1: newY++; break;  // down
        case 2: newX--; break;  // left
        case 3: newY--; break;  // up
      }
      
      path.push(`L${newX},${newY}`);
      visited.add(`${newX},${newY}`);
      x = newX;
      y = newY;
      direction = nextDir;
      
    } while (x !== startX || y !== startY);
    
    // Close the path if we haven't already
    if (path[path.length - 1] !== 'Z') {
      path.push('Z');
    }
    
    return path.join(' ');
  }
} 