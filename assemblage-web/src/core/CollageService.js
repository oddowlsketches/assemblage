// CollageService.js
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';
import { CrystalEffect } from '../effects/CrystalEffect';

export class CollageService {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.currentEffect = null;
        this.crystalVariant = 'standard';
        
        // Initialize the legacy collage generator
        this.generator = new CollageGenerator(this.canvas);
        this.legacyAdapter = new LegacyCollageAdapter(this.generator);
        
        // Initialize the crystal generators
        this.crystalEffect = new CrystalEffect(this.ctx, [], { variant: this.crystalVariant });
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

    setCrystalVariant(variant) {
        this.crystalVariant = variant;
        this.crystalEffect = new CrystalEffect(this.ctx, this.images, { variant });
    }

    async generateCollage() {
        if (!this.canvas || this.images.length === 0) {
            console.warn('Cannot generate collage: canvas or images not available');
            return;
        }

        // Randomize crystal variant if crystal effect is selected
        if (this.currentEffect === 'crystal') {
            const variant = Math.random() > 0.5 ? 'standard' : 'isolated';
            this.setCrystalVariant(variant);
            console.log(`Using ${variant} crystal variant`);
        }

        // Generate the collage using the current effect
        if (this.currentEffect === 'crystal') {
            this.crystalEffect.draw();
            
            // Get the background color from the canvas and update UI colors
            const bgColor = this.getBackgroundColor();
            this.updateUIColors(bgColor);
        } else {
            // Use legacy collage generator for other effects
            await this.legacyAdapter.generateCollage(this.images);
        }
    }

    async applyCrystalEffect() {
        try {
            if (this.crystalVariant === 'isolated') {
                // Use the legacy isolated crystal generator
                await this.crystalGenerator.generateCrystalField(this.images);
            } else {
                // Use the new CrystalEffect class
                this.crystalEffect = new CrystalEffect(this.ctx, this.images, { variant: 'standard' });
                this.crystalEffect.draw();
            }
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

    // Get the background color from the canvas
    getBackgroundColor() {
        // Get a sample of the background color from the center of the canvas
        const centerX = Math.floor(this.canvas.width / 2);
        const centerY = Math.floor(this.canvas.height / 2);
        const pixelData = this.ctx.getImageData(centerX, centerY, 1, 1).data;
        return `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
    }
    
    // Update UI colors based on the background color
    updateUIColors(bgColor) {
        // Convert RGB to HSL for easier color manipulation
        const rgbToHsl = (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            return [h * 360, s * 100, l * 100];
        };
        
        // Extract RGB values from the background color
        const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!rgbMatch) return;
        
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        // Convert to HSL
        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Create complementary color (opposite on the color wheel)
        const complementaryH = (h + 180) % 360;
        
        // Create a complementary color with good contrast
        const complementaryColor = `hsl(${complementaryH}, ${Math.min(s + 20, 100)}%, ${Math.max(l - 20, 20)}%)`;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--background-color', bgColor);
        document.documentElement.style.setProperty('--text-color', complementaryColor);
        document.documentElement.style.setProperty('--button-border-color', complementaryColor);
        document.documentElement.style.setProperty('--button-hover-bg', complementaryColor);
    }
} 