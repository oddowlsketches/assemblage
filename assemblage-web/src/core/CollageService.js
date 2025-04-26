// CollageService.js
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';

export class CollageService {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.currentEffect = null;
        
        // Initialize the legacy collage generator
        this.generator = new CollageGenerator(this.canvas);
        this.legacyAdapter = new LegacyCollageAdapter(this.generator);
        
        // Initialize the crystal generator
        this.crystalGenerator = new IsolatedCrystalGenerator(this.ctx, this.canvas);
        
        // Set default parameters
        this.parameters = {
            cleanTiling: false,
            // Add other parameters as needed
        };
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Update the canvas in the generators
        this.generator.canvas = canvas;
        this.generator.ctx = this.ctx;
        this.crystalGenerator.canvas = canvas;
        this.crystalGenerator.ctx = this.ctx;
    }

    async loadImages() {
        try {
            // Load images from the original image library
            const response = await fetch('/images/metadata.json');
            const metadata = await response.json();
            
            // Load all images
            this.images = await Promise.all(
                metadata.map(async (img) => {
                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.src = `/images/collages/${img.id}.jpg`;
                    await new Promise((resolve, reject) => {
                        image.onload = resolve;
                        image.onerror = () => {
                            console.warn(`Failed to load image: ${img.id}`);
                            resolve(null); // Resolve with null instead of rejecting
                        };
                    });
                    return image;
                })
            );
            
            // Filter out any failed image loads
            this.images = this.images.filter(img => img !== null);
            
            console.log(`Loaded ${this.images.length} images`);
            
            // Update the images in the generators
            this.generator.images = this.images;
            
            return this.images;
        } catch (error) {
            console.error('Error loading images:', error);
            return [];
        }
    }

    setEffect(effect) {
        this.currentEffect = effect;
        this.generator.currentEffect = effect;
    }

    async generateCollage() {
        if (!this.ctx || this.images.length === 0) {
            console.error('Canvas or images not initialized');
            return;
        }

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply the current effect
        if (this.currentEffect === 'crystal') {
            await this.applyCrystalEffect();
        } else {
            // Use the legacy generator for other effects
            await this.generator.generate(this.images);
        }
    }

    async applyCrystalEffect() {
        try {
            // Use the crystal generator to create a crystal field
            await this.crystalGenerator.generateCrystalField(this.images);
        } catch (error) {
            console.error('Error applying crystal effect:', error);
        }
    }

    shiftPerspective() {
        if (!this.ctx) return;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Generate a new collage with the current effect
        this.generateCollage();
    }

    saveCollage() {
        if (!this.canvas) return;
        
        // Create a download link
        const link = document.createElement('a');
        link.download = 'assemblage-collage.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
} 