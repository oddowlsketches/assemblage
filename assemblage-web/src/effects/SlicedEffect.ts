import { EffectBase } from './EffectBase';

export type SliceBehavior = 'random' | 'single-image' | 'alternating';

export interface SlicedEffectParams {
    sliceBehavior?: SliceBehavior;
    maxSlices?: number;
    sliceWidthVariation?: number;
}

export class SlicedEffect extends EffectBase {
    private numSlices: number;
    private sliceBehavior: SliceBehavior;
    private selectedImage: HTMLImageElement | null = null;
    private secondImage: HTMLImageElement | null = null;

    constructor(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], params: SlicedEffectParams = {}) {
        super(ctx, images);
        this.sliceBehavior = params.sliceBehavior || 'random';
        
        // Determine number of slices based on behavior
        if (this.sliceBehavior === 'random') {
            // For random images, use 3-7 slices
            this.numSlices = Math.min(
                Math.max(3, Math.floor(Math.random() * 5) + 3),
                params.maxSlices || 7
            );
        } else if (this.sliceBehavior === 'single-image') {
            // For single image, use 5-50 slices
            this.numSlices = Math.min(
                Math.max(5, Math.floor(Math.random() * 46) + 5),
                params.maxSlices || 50
            );
        } else {
            // For alternating images, use 7-50 slices
            this.numSlices = Math.min(
                Math.max(7, Math.floor(Math.random() * 44) + 7),
                params.maxSlices || 50
            );
        }
    }

    private calculateRequiredScale(image: HTMLImageElement, targetWidth: number, targetHeight: number): number {
        const imgRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let scale;
        if (imgRatio > targetRatio) {
            scale = targetHeight / image.naturalHeight;
        } else {
            scale = targetWidth / image.naturalWidth;
        }
        
        return scale;
    }

    private selectImages(): void {
        const validImages = this.images.filter(img => img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
        
        if (this.sliceBehavior === 'single-image' && validImages.length > 0) {
            this.selectedImage = validImages[Math.floor(Math.random() * validImages.length)];
        } else if (this.sliceBehavior === 'alternating' && validImages.length >= 2) {
            const randomIndex = Math.floor(Math.random() * validImages.length);
            this.selectedImage = validImages[randomIndex];
            this.secondImage = validImages[(randomIndex + 1) % validImages.length];
        }
    }

    private shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    draw(): void {
        this.selectImages();
        
        const baseStripWidth = this.ctx.canvas.width / this.numSlices;
        const baseStripHeight = this.ctx.canvas.height;
        
        // For random behavior, create a shuffled array of images
        let shuffledImages: HTMLImageElement[] = [];
        if (!this.selectedImage) {
            // Create a pool of images that's at least twice the size needed
            const imagePool = [...this.images];
            while (imagePool.length < this.numSlices * 2) {
                imagePool.push(...this.images);
            }
            // Shuffle the entire pool and take what we need
            shuffledImages = this.shuffleArray(imagePool).slice(0, this.numSlices);
        }
        
        let currentPosition = 0;
        
        for (let i = 0; i < this.numSlices; i++) {
            // Use larger variation for single-image slices
            const widthVariation = this.selectedImage && !this.secondImage ? 0.2 : 0.1;
            const stripWidth = baseStripWidth * (1 + (Math.random() * widthVariation - widthVariation/2));
            
            // Determine which image to use for this slice
            let imageToUse: HTMLImageElement;
            if (this.selectedImage) {
                if (this.secondImage && i % 2 === 1) {
                    imageToUse = this.secondImage;
                } else {
                    imageToUse = this.selectedImage;
                }
            } else {
                imageToUse = shuffledImages[i];
            }
            
            // Calculate scale and dimensions
            const scale = this.calculateRequiredScale(imageToUse, stripWidth, baseStripHeight);
            const scaledWidth = imageToUse.naturalWidth * scale;
            const scaledHeight = imageToUse.naturalHeight * scale;
            
            // Calculate offsets for proper centering
            const offsetX = (stripWidth - scaledWidth) / 2;
            const offsetY = (baseStripHeight - scaledHeight) / 2;
            
            // Add image offset for single-image and alternating behaviors
            const imageOffsetX = this.selectedImage ? i / this.numSlices : 0;
            
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(currentPosition, 0, stripWidth, baseStripHeight);
            this.ctx.clip();
            
            // Apply opacity variation for single-image slices
            if (this.selectedImage && !this.secondImage) {
                this.ctx.globalAlpha = 0.85 + (Math.random() * 0.3);
            }
            
            this.ctx.drawImage(
                imageToUse,
                currentPosition - (imageOffsetX * imageToUse.naturalWidth * scale) + offsetX,
                offsetY,
                scaledWidth,
                scaledHeight
            );
            
            this.ctx.restore();
            currentPosition += stripWidth;
        }
        
        // Ensure the last slice fills any remaining space
        if (currentPosition < this.ctx.canvas.width) {
            const lastStripWidth = this.ctx.canvas.width - currentPosition;
            const lastImage = this.selectedImage || shuffledImages[shuffledImages.length - 1];
            
            const scale = this.calculateRequiredScale(lastImage, lastStripWidth, baseStripHeight);
            const scaledWidth = lastImage.naturalWidth * scale;
            const scaledHeight = lastImage.naturalHeight * scale;
            
            const offsetX = (lastStripWidth - scaledWidth) / 2;
            const offsetY = (baseStripHeight - scaledHeight) / 2;
            
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(currentPosition, 0, lastStripWidth, baseStripHeight);
            this.ctx.clip();
            
            if (this.selectedImage && !this.secondImage) {
                this.ctx.globalAlpha = 0.85 + (Math.random() * 0.3);
            }
            
            this.ctx.drawImage(
                lastImage,
                currentPosition + offsetX,
                offsetY,
                scaledWidth,
                scaledHeight
            );
            
            this.ctx.restore();
        }
    }
} 