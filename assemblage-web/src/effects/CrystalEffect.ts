import { EffectBase, MaskPlacement } from './EffectBase';
import { CrystalSettings, getRandomCrystalSettings } from './randomCrystal';

interface Point {
  x: number;
  y: number;
}

interface Fragment {
  vertices: Point[];
  x: number;
  y: number;
  opacity: number;
  rotation: number;
  size: number;
  image?: HTMLImageElement;
}

export class CrystalEffect extends EffectBase {
  static id = "crystal";
  static defaultOptions = {
    complexity: 1,
    maxFacets: 12,
    blendOpacity: 0.7,
    variant: 'standard'
  };

  private fragments: Fragment[] = [];
  private crystalOutline: Point[] = [];
  protected settings: CrystalSettings;
  private singleImage?: HTMLImageElement;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    settings: CrystalSettings = getRandomCrystalSettings()
  ) {
    super(ctx, images);
    this.settings = settings;
    console.log('[CrystalEffect] settings →', this.settings);
  }

  // Helper functions ported from legacy code
  private randBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (!polygon || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private getBounds(points: Point[]): { x: number; y: number; width: number; height: number } {
    if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private generateCrystalOutline(centerX: number, centerY: number, size: number): Point[] {
    const points: Point[] = [];
    let sides = 5 + Math.floor(Math.random() * 3); // 5-7 sides
    
    // Apply template-specific modifications
    let variance = 0.8;
    let angleOffset = 0;
    
    switch (this.settings.template) {
      case 'hexagonal':
        sides = 6;
        variance = 0.9;
        break;
      case 'irregular':
        variance = 0.6 + Math.random() * 0.4; // More irregular
        break;
      case 'angular':
        variance = 0.7;
        angleOffset = Math.PI / 6; // Makes it more angular
        break;
      case 'elongated':
        variance = 0.9;
        // Stretch horizontally
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + angleOffset;
          const stretchFactor = Math.abs(Math.cos(angle)) < 0.5 ? 1.3 : 0.9;
          points.push({
            x: centerX + size * variance * stretchFactor * Math.cos(angle),
            y: centerY + size * variance * Math.sin(angle)
          });
        }
        return points;
    }
    
    // Default case or non-elongated templates
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + angleOffset;
      points.push({
        x: centerX + size * variance * Math.cos(angle),
        y: centerY + size * variance * Math.sin(angle)
      });
    }
    
    return points;
  }

  private generateSeedPoints(centerX: number, centerY: number, radius: number, count: number): Point[] {
    const points: Point[] = [];
    
    switch (this.settings.seedPattern) {
      case 'random':
        // Original random distribution
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = radius * Math.random();
          points.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance
          });
        }
        break;
        
      case 'grid':
        // Grid-like pattern
        const gridSize = Math.ceil(Math.sqrt(count));
        const cellSize = (radius * 2) / gridSize;
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (points.length >= count) break;
            const x = centerX - radius + (i + 0.5) * cellSize;
            const y = centerY - radius + (j + 0.5) * cellSize;
            // Add some jitter
            points.push({
              x: x + (Math.random() - 0.5) * cellSize * 0.3,
              y: y + (Math.random() - 0.5) * cellSize * 0.3
            });
          }
        }
        break;
        
      case 'spiral':
        // Spiral pattern
        const spiralCount = Math.min(count, 100);
        for (let i = 0; i < spiralCount; i++) {
          const t = i / spiralCount;
          const angle = t * Math.PI * 8;
          const distance = radius * t;
          points.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance
          });
        }
        break;
        
      case 'radial':
        // Radial pattern
        const radialCount = Math.min(count, 100);
        const rings = 5;
        for (let ring = 0; ring < rings; ring++) {
          const ringRadius = (ring + 1) * radius / rings;
          const pointsInRing = Math.floor(radialCount / rings);
          for (let i = 0; i < pointsInRing; i++) {
            const angle = (i / pointsInRing) * Math.PI * 2;
            points.push({
              x: centerX + Math.cos(angle) * ringRadius,
              y: centerY + Math.sin(angle) * ringRadius
            });
          }
        }
        break;
    }
    
    return points;
  }

  private createVoronoiCells(seedPoints: Point[], crystalOutline: Point[], resolution = 50): Fragment[] {
    const bounds = this.getBounds(crystalOutline);
    const fragments: Fragment[] = [];
    const cellWidth = bounds.width / resolution;
    const cellHeight = bounds.height / resolution;
    const grid: { x: number; y: number; seedIndex: number }[] = [];

    // Assign grid points to nearest seeds
    for (let x = 0; x < resolution; x++) {
      for (let y = 0; y < resolution; y++) {
        const px = bounds.x + x * cellWidth + cellWidth / 2;
        const py = bounds.y + y * cellHeight + cellHeight / 2;

        if (!this.isPointInPolygon({ x: px, y: py }, crystalOutline)) continue;

        let minDist = Infinity;
        let nearestSeed = -1;

        for (let i = 0; i < seedPoints.length; i++) {
          const seed = seedPoints[i];
          const dx = px - seed.x;
          const dy = py - seed.y;
          const dist = dx * dx + dy * dy;

          if (dist < minDist) {
            minDist = dist;
            nearestSeed = i;
          }
        }

        if (nearestSeed >= 0) {
          grid.push({ x: px, y: py, seedIndex: nearestSeed });
        }
      }
    }

    // Group points by seed
    const pointsBySeed: { [key: number]: Point[] } = {};
    for (const point of grid) {
      if (!pointsBySeed[point.seedIndex]) {
        pointsBySeed[point.seedIndex] = [];
      }
      pointsBySeed[point.seedIndex].push({ x: point.x, y: point.y });
    }

    // Create fragments from grouped points
    for (let i = 0; i < seedPoints.length; i++) {
      const points = pointsBySeed[i];
      if (!points || points.length < 5) continue;

      const vertices = this.getConvexHull(points);
      if (vertices.length >= 3) {
        const center = seedPoints[i];
        fragments.push({
          vertices,
          x: center.x,
          y: center.y,
          opacity: this.settings.blendOpacity || 0.7,
          rotation: (Math.random() * 20 - 10),
          size: Math.max(bounds.width, bounds.height) / 4
        });
      }
    }

    return fragments;
  }

  private getConvexHull(points: Point[]): Point[] {
    if (!points || points.length < 3) return points || [];

    // Find point with lowest y-coordinate
    let lowestPoint = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[lowestPoint].y ||
        (points[i].y === points[lowestPoint].y && points[i].x < points[lowestPoint].x)) {
        lowestPoint = i;
      }
    }

    // Swap lowest point to position 0
    [points[0], points[lowestPoint]] = [points[lowestPoint], points[0]];

    // Sort points by polar angle
    const p0 = points[0];
    points.sort((a, b) => {
      if (a === p0) return -1;
      if (b === p0) return 1;

      const theta1 = Math.atan2(a.y - p0.y, a.x - p0.x);
      const theta2 = Math.atan2(b.y - p0.y, b.x - p0.x);

      if (theta1 === theta2) {
        const dist1 = Math.pow(a.x - p0.x, 2) + Math.pow(a.y - p0.y, 2);
        const dist2 = Math.pow(b.x - p0.x, 2) + Math.pow(b.y - p0.y, 2);
        return dist1 - dist2;
      }

      return theta1 - theta2;
    });

    // Build hull
    const hull = [points[0], points[1]];
    for (let i = 2; i < points.length; i++) {
      while (hull.length >= 2 && !this.isLeftTurn(hull[hull.length - 2], hull[hull.length - 1], points[i])) {
        hull.pop();
      }
      hull.push(points[i]);
    }

    return hull;
  }

  private isLeftTurn(p1: Point, p2: Point, p3: Point): boolean {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0;
  }

  private drawFragment(fragment: Fragment): void {
    if (!fragment.image || !fragment.image.complete) return;

    this.ctx.save();
    
    // Set blend mode to multiply for all fragments
    this.ctx.globalCompositeOperation = 'multiply';

    // Set opacity
    this.ctx.globalAlpha = fragment.opacity;

    // Move to fragment position and rotate
    this.ctx.translate(fragment.x, fragment.y);
    this.ctx.rotate((fragment.rotation * Math.PI) / 180);

    // Create clipping path
    if (fragment.vertices && fragment.vertices.length >= 3) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        (fragment.vertices[0].x - fragment.x),
        (fragment.vertices[0].y - fragment.y)
      );
      for (let i = 1; i < fragment.vertices.length; i++) {
        this.ctx.lineTo(
          (fragment.vertices[i].x - fragment.x),
          (fragment.vertices[i].y - fragment.y)
        );
      }
      this.ctx.closePath();
      this.ctx.clip();
    }

    // Draw image
    const imgWidth = fragment.image.naturalWidth;
    const imgHeight = fragment.image.naturalHeight;
    const imgRatio = imgWidth / imgHeight;

    // Calculate draw dimensions
    let drawWidth, drawHeight;
    if (imgRatio > 1) {
      drawHeight = fragment.size * 1.2;
      drawWidth = drawHeight * imgRatio;
    } else {
      drawWidth = fragment.size * 1.2;
      drawHeight = drawWidth / imgRatio;
    }

    this.ctx.drawImage(
      fragment.image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    this.ctx.restore();
  }

  public draw(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Get the device pixel ratio for logging
    const dpr = window.devicePixelRatio || 1;
    
    // Log canvas dimensions and scaling info
    console.log('[CrystalEffect] Canvas dimensions:', {
      width: this.ctx.canvas.width,
      height: this.ctx.canvas.height,
      dpr,
      scaledWidth: this.ctx.canvas.width / dpr,
      scaledHeight: this.ctx.canvas.height / dpr,
      containerWidth: this.ctx.canvas.parentElement?.clientWidth,
      containerHeight: this.ctx.canvas.parentElement?.clientHeight,
      transform: this.ctx.getTransform(),
      effectiveScale: this.ctx.getTransform().a
    });
    
    // Save the current context state
    this.ctx.save();
    
    // Draw backdrop using one of the vibrant colors from legacy code
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
    this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    // Use actual canvas dimensions since scaling is handled by CollageService
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Initialize fragments based on variant
    if (this.settings.variant === 'Isolated') {
      this.drawIsolatedCrystal();
    } else {
      this.drawStandardCrystal();
    }

    // Draw all fragments with proper blend mode
    this.ctx.globalCompositeOperation = 'multiply';
    this.fragments.forEach(fragment => {
      if (fragment.image) {
        this.drawFragment(fragment);
      }
    });
    
    // Restore the context state
    this.ctx.restore();
  }

  private drawStandardCrystal(): void {
    // Calculate center point using ACTUAL CANVAS BUFFER dimensions
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    // Calculate size based on ACTUAL CANVAS BUFFER dimensions
    const size = Math.min(
      this.ctx.canvas.width,
      this.ctx.canvas.height
    ) * 0.45; // Use 45% of the smaller canvas dimension
    
    // Use complexity from settings to determine facets
    const facets = this.settings.complexity * 2;
    
    // Generate seed points across the entire canvas
    const seedPoints = this.generateSeedPoints(
      centerX, 
      centerY, 
      size, // Use the calculated size directly
      facets * this.settings.density
    );
    
    // Create fragments with resolution based on complexity
    const resolution = 50 + this.settings.complexity * 5;
    
    // Create a rectangular outline that covers the entire canvas BUFFER
    const canvasOutline = [
      { x: centerX - size, y: centerY - size },
      { x: centerX + size, y: centerY - size },
      { x: centerX + size, y: centerY + size },
      { x: centerX - size, y: centerY + size }
    ];
    
    this.fragments = this.createVoronoiCells(seedPoints, canvasOutline, resolution);

    // Draw all fragments
    this.fragments.forEach(fragment => {
      this.assignImageToFragment(fragment);
      this.drawFragment(fragment);
    });
  }

  private drawIsolatedCrystal(): void {
    // Clear canvas and set background color
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Draw backdrop using one of the vibrant colors from legacy code
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
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
    this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.restore();

    // Get device pixel ratio - NO LONGER NEEDED FOR THESE BASE CALCULATIONS
    // const dpr = window.devicePixelRatio || 1;
    
    // Calculate center point using ACTUAL CANVAS BUFFER dimensions
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    // Calculate size based on ACTUAL CANVAS BUFFER dimensions
    const size = Math.min(
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2
    ) * (0.9 + Math.random() * 0.05); 
    
    // Use complexity from settings to determine facets
    const facets = this.settings.complexity;
    
    // Generate crystal outline based on template
    this.crystalOutline = this.generateCrystalOutline(centerX, centerY, size);
    
    // Generate seed points with density from settings - keep within outline for isolated
    const seedPoints = this.generateSeedPoints(
      centerX, 
      centerY, 
      size * 0.8, // Keep points within outline for isolated
      facets * this.settings.density
    );
    
    // Create fragments with resolution based on complexity
    const resolution = 30 + this.settings.complexity * 3;
    this.fragments = this.createVoronoiCells(seedPoints, this.crystalOutline, resolution);

    // Draw all fragments
    this.fragments.forEach(fragment => {
      this.assignImageToFragment(fragment);
      this.drawFragment(fragment);
    });
  }

  private pickImageForCollage(): HTMLImageElement {
    if (this.settings.imageMode === 'single') {
      // Cache one image for the whole collage
      if (!this.singleImage) {
        this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
      }
      return this.singleImage;
    }
    // unique mode → random every time
    return this.images[Math.floor(Math.random() * this.images.length)];
  }

  private assignImageToFragment(fragment: Fragment) {
    fragment.image = this.pickImageForCollage();
  }

  /**
   * Called by CollageService after draw() when a user prompt is present.
   * We're just logging the plan right now to confirm it arrives properly.
   */
  public async drawPlan(plan: MaskPlacement[]): Promise<void> {
    console.log('[CrystalEffect] drawPlan plan:', plan);
    // no-op for now
  }
} 