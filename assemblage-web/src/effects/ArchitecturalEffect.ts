import { EffectBase, EffectParams } from './EffectBase';

export class ArchitecturalEffect extends EffectBase {
  static id = "architectural";

  private drawArch(x: number, y: number, width: number, height: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height * 0.5);
    ctx.quadraticCurveTo(x + width / 2, y, x + width, y + height * 0.5);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
  }

  private drawColumn(x: number, y: number, width: number, height: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
  }

  private drawWindow(x: number, y: number, width: number, height: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.closePath();
  }

  private drawImageFragment(shape: string, x: number, y: number, width: number, height: number, image: HTMLImageElement) {
    const ctx = this.ctx;
    ctx.save();

    // Create clipping path based on shape
    switch (shape) {
      case 'arch':
        this.drawArch(x, y, width, height);
        break;
      case 'column':
        this.drawColumn(x, y, width, height);
        break;
      case 'window':
        this.drawWindow(x, y, width, height);
        break;
    }

    // Apply clipping path
    ctx.clip();

    // Calculate image dimensions to preserve aspect ratio
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

    // Center the image in the shape
    const offsetX = (drawWidth - width) / 2;
    const offsetY = (drawHeight - height) / 2;

    // Draw the image
    ctx.drawImage(image, x - offsetX, y - offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  private chooseBackgroundColor(): string {
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
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public draw(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const height = ctx.canvas.height / dpr;

    // Clear canvas and set background
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = this.chooseBackgroundColor();
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Set blend mode for architectural elements
    ctx.globalCompositeOperation = 'multiply';

    // Calculate grid size based on canvas dimensions
    const gridSize = Math.min(width, height) / 4;
    const numCols = Math.ceil(width / gridSize);
    const numRows = Math.ceil(height / gridSize);

    // Draw architectural elements in a grid
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * gridSize;
        const y = row * gridSize;
        const elementWidth = gridSize * 0.8;
        const elementHeight = gridSize * 1.2;

        // Randomly choose shape and image
        const shapes = ['arch', 'column', 'window'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const image = this.images[Math.floor(Math.random() * this.images.length)];

        if (image && image.complete) {
          // Set random opacity for variety
          ctx.globalAlpha = 0.4 + Math.random() * 0.3;
          this.drawImageFragment(shape, x, y, elementWidth, elementHeight, image);
        }
      }
    }

    // Reset context properties
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }
} 