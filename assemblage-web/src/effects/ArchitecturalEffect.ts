import { EffectBase, EffectParams, MaskPlacement } from './EffectBase';

type ShapeType = 'door' | 'window' | 'arch' | 'column' | 'cornice';
const SHAPES: ShapeType[] = ['door','window','arch','column','cornice'];

// Update MaskPlacement type to allow polygon points
// (If MaskPlacement is imported, we can extend it locally)
type PolygonMaskPlacement = MaskPlacement & { polygon?: {x: number, y: number}[] };

export class ArchitecturalEffect extends EffectBase {
  static id = "architectural";
  
  // Image mode: 'single' uses one image for all masks, 'unique' uses different images
  private imageMode: 'single' | 'unique' = 'unique';
  private singleImage?: HTMLImageElement;

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
          path.moveTo(polygon[0].x, polygon[0].y);
          for (let i = 1; i < polygon.length; i++) {
            path.lineTo(polygon[i].x, polygon[i].y);
          }
          path.closePath();
        } else {
          // fallback to original shape
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
        this.ctx.globalCompositeOperation = 'multiply';
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
          this.ctx.fillStyle = this.chooseBackgroundColor(0.9);
          this.ctx.fillRect(0, 0, maskWidth, maskHeight);
        }
        this.ctx.globalCompositeOperation = 'source-over';
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
  public generateArchitecturalPlan(): PolygonMaskPlacement[] {
    const plan: PolygonMaskPlacement[] = [];
    const dpr = window.devicePixelRatio || 1;
    const width = this.ctx.canvas.width / dpr;
    const height = this.ctx.canvas.height / dpr;
    // Helper to generate jittered grid fragments for a rectangle, with custom grid size
    function jitteredGridFragments(maskName: string, x: number, y: number, w: number, h: number, rotation: number, layer: number, rowsOverride?: number, colsOverride?: number): PolygonMaskPlacement[] {
      let rows = 2, cols = 2;
      if (typeof rowsOverride === 'number') rows = rowsOverride;
      if (typeof colsOverride === 'number') cols = colsOverride;
      if (maskName === 'column') {
        rows = 1;
        cols = Math.random() > 0.5 ? 1 : 2;
      } else if (maskName === 'window' || maskName === 'door') {
        rows = 1;
        cols = Math.random() > 0.5 ? 1 : 2;
      } else if (maskName === 'cornice') {
        rows = Math.random() > 0.5 ? 2 : 3;
        cols = Math.random() > 0.5 ? 2 : 3;
      }
      const gap = 0.08;
      const jitter = 0.12;
      const cellW = w / cols;
      const cellH = h / rows;
      const points: {x: number, y: number}[][] = [];
      for (let row = 0; row <= rows; row++) {
        points[row] = [];
        for (let col = 0; col <= cols; col++) {
          let px = col * cellW;
          let py = row * cellH;
          px += (Math.random() - 0.5) * cellW * jitter;
          py += (Math.random() - 0.5) * cellH * jitter;
          points[row][col] = { x: px, y: py };
        }
      }
      const fragments: PolygonMaskPlacement[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const shrink = gap * 0.5;
          const p1 = points[row][col];
          const p2 = points[row][col+1];
          const p3 = points[row+1][col+1];
          const p4 = points[row+1][col];
          const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
          const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
          const shrinkPt = (pt: {x: number, y: number}) => ({
            x: cx + (pt.x - cx) * (1 - shrink),
            y: cy + (pt.y - cy) * (1 - shrink)
          });
          const poly = [shrinkPt(p1), shrinkPt(p2), shrinkPt(p3), shrinkPt(p4)];
          fragments.push({
            maskName,
            x,
            y,
            width: w,
            height: h,
            rotation,
            layer,
            polygon: poly
          });
        }
      }
      return fragments;
    }
    // Scale up the overall building size
    const buildingWidth = width * 0.82;
    const buildingHeight = height * 0.88;
    const buildingX = (width - buildingWidth) / 2;
    const buildingY = (height - buildingHeight) / 2;
    // Cornice (jittered grid fragments)
    plan.push(...jitteredGridFragments('cornice', buildingX, buildingY, buildingWidth, buildingHeight * 0.08, 0, 1));
    // Columns (jittered grid fragments, fewer fragments)
    const columnWidth = buildingWidth * 0.10;
    const columnHeight = buildingHeight - buildingHeight * 0.08;
    const columnY = buildingY + buildingHeight * 0.08;
    plan.push(...jitteredGridFragments('column', buildingX, columnY, columnWidth, columnHeight, 0, 1));
    plan.push(...jitteredGridFragments('column', buildingX + buildingWidth - columnWidth, columnY, columnWidth, columnHeight, 0, 1));
    // Windows (jittered grid fragments, fewer fragments)
    const windowRows = 2 + Math.floor(Math.random() * 2);
    const windowCols = 2 + Math.floor(Math.random() * 2);
    const windowWidth = (buildingWidth * 0.55) / windowCols;
    const windowHeight = buildingHeight * 0.13;
    const windowStartX = buildingX + columnWidth + (buildingWidth - 2 * columnWidth - windowWidth * windowCols) / 2;
    const windowStartY = buildingY + buildingHeight * 0.08 + buildingHeight * 0.10;
    const windowSpacing = windowWidth * 0.12;
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        plan.push(...jitteredGridFragments('window', windowStartX + col * (windowWidth + windowSpacing), windowStartY + row * (windowHeight + windowSpacing), windowWidth, windowHeight, 0, 1));
      }
    }
    // Door (jittered grid fragments, fewer fragments)
    const doorWidth = buildingWidth * 0.18;
    const doorHeight = buildingHeight * 0.28;
    const doorX = buildingX + (buildingWidth - doorWidth) / 2;
    const doorY = buildingY + buildingHeight - doorHeight;
    plan.push(...jitteredGridFragments('door', doorX, doorY, doorWidth, doorHeight, 0, 1));
    // Arches (single mask for now)
    const archWidth = windowWidth * 1.1;
    const archHeight = buildingHeight * 0.13;
    const archStartY = windowStartY - archHeight * 0.9;
    for (let col = 0; col < windowCols; col++) {
      plan.push({
        maskName: 'arch',
        x: windowStartX + col * (windowWidth + windowSpacing) - (archWidth - windowWidth) / 2,
        y: archStartY,
        width: archWidth,
        height: archHeight,
        rotation: 0,
        layer: 1
      });
    }
    return plan;
  }
} 