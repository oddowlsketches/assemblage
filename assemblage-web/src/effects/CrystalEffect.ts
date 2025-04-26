import { EffectBase } from './EffectBase';
import { CrystalParams, defaultCrystalParams } from './randomCrystal';

interface CrystalOpts {
  maxFacets?: number;
  blendOpacity?: number;
  complexity?: number;
  imageMode?: 'single' | 'unique';
  variant?: 'standard' | 'isolated';
}

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
  static defaultOptions: CrystalOpts = {
    complexity: 1,
    maxFacets: 12,
    blendOpacity: 0.7,
    variant: 'standard'
  };

  private fragments: Fragment[] = [];
  private crystalOutline: Point[] = [];
  protected params: CrystalParams;
  private singleImage?: HTMLImageElement;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: CrystalParams = defaultCrystalParams
  ) {
    super(ctx, images);
    this.params = params;
    console.log('[CrystalEffect] ctor imageMode =', this.params?.imageMode);
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
    const sides = 5 + Math.floor(Math.random() * 3); // 5-7 sides
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
      const variance = 0.8 + Math.random() * 0.4; // 80-120% of size
      points.push({
        x: centerX + size * variance * Math.cos(angle),
        y: centerY + size * variance * Math.sin(angle)
      });
    }
    return points;
  }

  private generateSeedPoints(centerX: number, centerY: number, radius: number, count: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * Math.random();
      points.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
      });
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
          opacity: this.params.blendOpacity || 0.7,
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
        fragment.vertices[0].x - fragment.x,
        fragment.vertices[0].y - fragment.y
      );
      for (let i = 1; i < fragment.vertices.length; i++) {
        this.ctx.lineTo(
          fragment.vertices[i].x - fragment.x,
          fragment.vertices[i].y - fragment.y
        );
      }
      this.ctx.closePath();
      this.ctx.clip();
    }

    // Draw image
    const imgWidth = fragment.image.naturalWidth;
    const imgHeight = fragment.image.naturalHeight;
    const imgRatio = imgWidth / imgHeight;

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
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Initialize fragments based on variant
    if (this.params.variant === 'isolated') {
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
  }

  private drawStandardCrystal(): void {
    // Initialize fragments for standard crystal with randomized parameters
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    // Randomize size between 70% and 90% of max canvas dimension
    const size = Math.max(this.ctx.canvas.width, this.ctx.canvas.height) * 
      (0.7 + Math.random() * 0.2);

    // Randomize number of facets between 8 and 20
    const facets = 8 + Math.floor(Math.random() * 13);

    // Generate a larger crystal outline for standard variant
    this.crystalOutline = this.generateCrystalOutline(centerX, centerY, size * 1.2);
    
    // Generate seed points with randomized density
    const seedPoints = this.generateSeedPoints(
      centerX, 
      centerY, 
      size, 
      facets * (1.5 + Math.random())  // Randomize density multiplier
    );
    
    // Create fragments with randomized resolution
    const resolution = 75 + Math.floor(Math.random() * 50);  // Random resolution between 75-125
    this.fragments = this.createVoronoiCells(seedPoints, this.crystalOutline, resolution);

    // Draw all fragments
    this.fragments.forEach(fragment => {
      // Assign a random image to each fragment
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

    // Initialize isolated crystal with randomized parameters
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    // Randomize size between 30% and 50% of canvas
    const size = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) * 
      (0.3 + Math.random() * 0.2);
    
    // Randomize number of facets between 6 and 14
    const facets = 6 + Math.floor(Math.random() * 9);
    
    // Generate crystal outline
    this.crystalOutline = this.generateCrystalOutline(centerX, centerY, size);
    
    // Generate seed points with randomized density
    const seedPoints = this.generateSeedPoints(
      centerX, 
      centerY, 
      size * 0.8, 
      facets * (0.8 + Math.random() * 0.4)  // Randomize density multiplier
    );
    
    // Create fragments with randomized resolution
    const resolution = 40 + Math.floor(Math.random() * 40);  // Random resolution between 40-80
    this.fragments = this.createVoronoiCells(seedPoints, this.crystalOutline, resolution);

    // Draw all fragments
    this.fragments.forEach(fragment => {
      this.assignImageToFragment(fragment);
      this.drawFragment(fragment);
    });
  }

  private pickImageForCollage(): HTMLImageElement {
    if (this.params.imageMode === 'single') {
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
} 