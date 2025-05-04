import { SeededRandom } from './randomization';

interface Cell {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  operation: string;
  rotation?: number;
}

export class MosaicGenerator {
  private random: SeededRandom;
  private gridSize: number;
  private patternType: string;
  private revealPct: number;
  private cells: Cell[] = [];
  private selectedCells: Cell[] = [];

  constructor(
    private template: any,
    seed: number = Math.random() * 1000000
  ) {
    this.random = new SeededRandom(seed);
    this.gridSize = this.random.rangeInt(...template.gridSizeRange);
    this.patternType = this.random.choice(template.patternTypeOptions);
    this.revealPct = this.random.range(...template.revealPctRange);
  }

  private generateGrid(canvasWidth: number, canvasHeight: number) {
    const cellWidth = canvasWidth / this.gridSize;
    const cellHeight = canvasHeight / this.gridSize;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        this.cells.push({
          x: x * cellWidth,
          y: y * cellHeight,
          width: cellWidth,
          height: cellHeight,
          shape: this.random.choice(this.template.shapeOptions),
          operation: this.random.choice(this.template.operationOptions),
          rotation: this.random.range(-45, 45)
        });
      }
    }
  }

  private selectCells() {
    const totalCells = this.gridSize * this.gridSize;
    const numCells = Math.floor(totalCells * this.revealPct);

    switch (this.patternType) {
      case 'random':
        this.selectedCells = this.random.sample(this.cells, numCells);
        break;
      case 'clustered':
        this.selectClusteredCells(numCells);
        break;
      case 'silhouette':
        this.selectSilhouetteCells(numCells);
        break;
      case 'portrait':
        this.selectPortraitCells(numCells);
        break;
    }
  }

  private selectClusteredCells(numCells: number) {
    const startCell = this.random.choice(this.cells);
    this.selectedCells = [startCell];
    const visited = new Set([startCell]);

    while (this.selectedCells.length < numCells) {
      const currentCell = this.random.choice(this.selectedCells);
      const neighbors = this.getNeighbors(currentCell);
      const unvisitedNeighbors = neighbors.filter(cell => !visited.has(cell));

      if (unvisitedNeighbors.length === 0) continue;

      const nextCell = this.random.choice(unvisitedNeighbors);
      this.selectedCells.push(nextCell);
      visited.add(nextCell);
    }
  }

  private getNeighbors(cell: Cell): Cell[] {
    return this.cells.filter(c => {
      const dx = Math.abs(c.x - cell.x);
      const dy = Math.abs(c.y - cell.y);
      return (dx === cell.width && dy === 0) || (dy === cell.height && dx === 0);
    });
  }

  private selectSilhouetteCells(numCells: number) {
    // TODO: Implement silhouette mask loading and cell selection
    this.selectedCells = this.random.sample(this.cells, numCells);
  }

  private selectPortraitCells(numCells: number) {
    // TODO: Implement face detection and cell selection
    this.selectedCells = this.random.sample(this.cells, numCells);
  }

  public generateMosaic(ctx: CanvasRenderingContext2D, sourceImage: HTMLImageElement) {
    const canvas = ctx.canvas;
    this.generateGrid(canvas.width, canvas.height);
    this.selectCells();

    // Fill background
    ctx.fillStyle = this.random.choice(this.template.bgColors);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set blend mode
    ctx.globalCompositeOperation = this.template.blendMode;

    // Draw cells
    for (const cell of this.selectedCells) {
      ctx.save();
      ctx.translate(cell.x + cell.width/2, cell.y + cell.height/2);
      
      if (cell.operation === 'rotate') {
        ctx.rotate(cell.rotation! * Math.PI / 180);
      }

      // Draw cell shape
      this.drawCellShape(ctx, cell);

      // Apply operation
      if (cell.operation === 'reveal') {
        ctx.clip();
        ctx.drawImage(
          sourceImage,
          cell.x, cell.y, cell.width, cell.height,
          -cell.width/2, -cell.height/2, cell.width, cell.height
        );
      } else if (cell.operation === 'swap') {
        const swapCell = this.random.choice(this.selectedCells.filter(c => c !== cell));
        ctx.clip();
        ctx.drawImage(
          sourceImage,
          swapCell.x, swapCell.y, swapCell.width, swapCell.height,
          -cell.width/2, -cell.height/2, cell.width, cell.height
        );
      }

      ctx.restore();
    }
  }

  private drawCellShape(ctx: CanvasRenderingContext2D, cell: Cell) {
    switch (cell.shape) {
      case 'square':
        ctx.fillRect(-cell.width/2, -cell.height/2, cell.width, cell.height);
        break;
      case 'rectHorizontal':
        ctx.fillRect(-cell.width/2, -cell.height/4, cell.width, cell.height/2);
        break;
      case 'rectVertical':
        ctx.fillRect(-cell.width/4, -cell.height/2, cell.width/2, cell.height);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(cell.width, cell.height)/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'stripe':
        ctx.fillRect(-cell.width/2, -cell.height/2, cell.width, cell.height/4);
        break;
    }
  }
} 