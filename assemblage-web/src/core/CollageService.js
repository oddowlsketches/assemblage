// CollageService.js
import paper from 'paper';
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';
import { CrystalEffect } from '../effects/CrystalEffect';
import { ArchitecturalEffect } from '../effects/ArchitecturalEffect';
import { getRandomCrystalSettings } from '../effects/randomCrystal';
import { PromptPlanner } from '../planner/PromptPlanner';
import maskImplementations from '../legacy/js/collage/maskImplementations.js';

export class CollageService {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.currentEffect = null;
        this.currentEffectName = null;
        this.crystalVariant = 'standard';
        this.paperProject = null;
        this.paperView = null;
        this.masks = maskImplementations;
        
        // Initialize Paper.js
        this.initializePaper();
        
        // Initialize the legacy collage generator
        this.generator = new CollageGenerator(this.canvas);
        this.legacyAdapter = new LegacyCollageAdapter(this.generator);
        
        // Initialize the crystal generators
        this.crystalEffect = new CrystalEffect(this.ctx, [], { variant: this.crystalVariant });
        this.crystalGenerator = new IsolatedCrystalGenerator(this.ctx, this.canvas);
        
        // Initialize the architectural effect
        this.architecturalEffect = new ArchitecturalEffect(this.ctx, []);
        
        // Initialize the prompt planner
        this.promptPlanner = new PromptPlanner(Object.keys(this.masks));
        
        // Set default parameters
        this.parameters = {
            cleanTiling: false,
            // Add other parameters as needed
        };

        // Set initial effect
        this.setEffect('crystal');
    }

    initializePaper() {
        if (this.canvas) {
            paper.setup(this.canvas);
            this.paperProject = paper.project;
            this.paperView = paper.view;
            
            // Configure Paper.js view
            this.paperView.onFrame = () => {
                // Animation frame callback if needed
            };
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.paperView.viewSize = new paper.Size(
                    this.canvas.width / this.devicePixelRatio,
                    this.canvas.height / this.devicePixelRatio
                );
            });
        }
    }

    createPaperProject(canvas) {
        if (!canvas) return null;
        
        // Create a new project
        const project = new paper.Project();
        
        // Create a new view
        const view = new paper.View(canvas);
        view.viewSize = new paper.Size(
            canvas.width / this.devicePixelRatio,
            canvas.height / this.devicePixelRatio
        );
        
        return { project, view };
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Update the canvas in the generators
        this.generator.canvas = canvas;
        this.generator.ctx = this.ctx;
        this.crystalGenerator.canvas = canvas;
        this.crystalGenerator.ctx = this.ctx;
        
        // Apply proper DPR handling
        this.resizeCanvas();
    }

    resizeCanvas() {
        // Get the canvas container dimensions
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        // Use window.innerHeight if container height is 0
        const containerHeight = container.clientHeight || window.innerHeight;
        
        // Get device pixel ratio
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Log initial dimensions
        console.log('[CollageService] Initial canvas dimensions:', {
            containerWidth,
            containerHeight,
            devicePixelRatio,
            currentWidth: this.canvas.width,
            currentHeight: this.canvas.height,
            styleWidth: this.canvas.style.width,
            styleHeight: this.canvas.style.height,
            transform: this.ctx.getTransform()
        });
        
        // Set display size (CSS pixels) to match container
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${containerHeight}px`;
        
        // Set actual canvas buffer size (scaled by DPR)
        this.canvas.width = Math.floor(containerWidth * devicePixelRatio);
        this.canvas.height = Math.floor(containerHeight * devicePixelRatio);
        
        // Reset the context transform and scale
        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        
        // Enable high-quality image rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Store the device pixel ratio for use in drawing operations
        this.devicePixelRatio = devicePixelRatio;
        
        // Log final dimensions and transform
        console.log('[CollageService] Final canvas dimensions:', {
            width: this.canvas.width,
            height: this.canvas.height,
            styleWidth: this.canvas.style.width,
            styleHeight: this.canvas.style.height,
            transform: this.ctx.getTransform(),
            dpr: devicePixelRatio,
            effectiveScale: this.ctx.getTransform().a
        });
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
        // Store the effect name for reference
        this.currentEffectName = effect;
        this.generator.currentEffect = effect;
        
        // Create the appropriate effect instance based on the name
        if (effect === 'crystal') {
            this.currentEffect = this.crystalEffect;
        } else if (effect === 'architectural') {
            this.currentEffect = this.architecturalEffect;
        } else {
            // Default to crystal effect
            this.currentEffect = this.crystalEffect;
        }
        
        console.log('[CollageService] Setting effect to:', effect);
    }

    setCrystalVariant(variant) {
        this.crystalVariant = variant;
        this.crystalEffect = new CrystalEffect(this.ctx, this.images, { variant });
    }

    async generateCollage(userPrompt = '') {
        if (!this.canvas || this.images.length === 0) {
            console.warn('Cannot generate collage: canvas or images not available');
            return;
        }

        // Determine which effect to use based on the prompt
        if (userPrompt.toLowerCase().includes('arch')) {
            this.setEffect('architectural');
        } else if (userPrompt.toLowerCase().includes('crystal')) {
            this.setEffect('crystal');
        } else {
            // Randomly select an effect if no specific keyword is found
            const effects = ['crystal', 'architectural'];
            const randomEffect = effects[Math.floor(Math.random() * effects.length)];
            this.setEffect(randomEffect);
        }

        // Get a plan from the prompt planner
        const plan = await this.promptPlanner.plan(userPrompt);
        console.log('[CollageService] plan generated →', plan);
        
        // Handle different effects
        switch (this.currentEffectName) {
            case 'crystal':
                // Randomize crystal variant
                const variant = Math.random() > 0.5 ? 'standard' : 'isolated';
                this.setCrystalVariant(variant);
                console.log(`Using ${variant} crystal variant`);
                
                // Get random crystal settings and log the imageMode
                const params = getRandomCrystalSettings();
                console.log('[CollageService] passing imageMode →', params.imageMode);
                
                // Create new crystal effect with the settings
                this.crystalEffect = new CrystalEffect(this.ctx, this.images, params);
                this.currentEffect = this.crystalEffect; // Update the current effect instance
                this.crystalEffect.draw();
                break;

            case 'architectural':
                // Create new architectural effect instance with current images
                this.architecturalEffect = new ArchitecturalEffect(this.ctx, this.images);
                this.currentEffect = this.architecturalEffect; // Update the current effect instance
                this.architecturalEffect.draw();
                break;

            default:
                // Use legacy collage generator for other effects
                await this.legacyAdapter.generate(this.images, 'mosaic');
                break;
        }

        // Apply the plan if the current effect supports it
        console.log(
            '[CollageService] has drawPlan?',
            typeof this.currentEffect.drawPlan,
            'on',
            this.currentEffect.constructor.name
        );
        
        if (this.currentEffect && typeof this.currentEffect.drawPlan === 'function') {
            console.log('[CollageService] calling drawPlan with →', plan);
            this.currentEffect.drawPlan(plan);
        }

        // Get the background color from the canvas and update UI colors
        const bgColor = this.getBackgroundColor();
        this.updateUIColors(bgColor);
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

    shiftPerspective(userPrompt = '') {
        if (!this.ctx) return;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Generate a new collage with the prompt
        this.generateCollage(userPrompt);
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