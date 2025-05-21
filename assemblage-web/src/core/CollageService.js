// CollageService.js
import paper from 'paper';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';
import { CrystalEffect } from '../effects/CrystalEffect';
import { ArchitecturalEffect } from '../effects/ArchitecturalEffect';
import { getRandomCrystalSettings } from '../effects/randomCrystal';
import { PromptPlanner } from '../planner/PromptPlanner';
import maskImplementations from '../legacy/js/collage/maskImplementations.js';
import { getMaskDescriptor } from '../masks/maskRegistry';
import { TemplateRenderer } from './TemplateRenderer';
import { svgToPath2D } from './svgUtils.js';

class EventEmitter {
  constructor() { this._listeners = {}; }
  on(evt, fn) { (this._listeners[evt] ||= []).push(fn); }
  off(evt, fn) { this._listeners[evt] = (this._listeners[evt]||[]).filter(f => f !== fn); }
  emit(evt, data) { (this._listeners[evt]||[]).forEach(f => f(data)); }
}

export class CollageService {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.isLoadingImages = false; // Flag to prevent concurrent loads
        this.currentEffect = null;
        this.currentEffectName = null;
        this.crystalVariant = 'standard';
        this.paperProject = null;
        this.paperView = null;
        this.masks = maskImplementations;
        this.supabaseClient = null;

        // Store options
        this.options = options;
        this.events = new EventEmitter();
        
        // Initialize Supabase client
        if (options.supabaseClient) {
            this.supabaseClient = options.supabaseClient;
            console.log('[CollageService] Using provided Supabase client instance.');
        } else {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseAnonKey) {
                this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
                console.log('[CollageService] Created new Supabase client instance (fallback).');
            } else {
                console.error('[CollageService] Supabase URL or Anon Key is missing. Images will not load from Supabase.');
            }
        }
        
        // Initialize Paper.js
        this.initializePaper();
        
        // Initialize the legacy collage generator
        this.generator = new CollageGenerator(this.canvas, { verbose: false });
        this.legacyAdapter = new LegacyCollageAdapter(this.generator);
        
        // Only initialize crystal generators if enabled
        if (options.initCrystals !== false) {
        this.crystalEffect = new CrystalEffect(this.ctx, [], { variant: this.crystalVariant });
        this.crystalGenerator = new IsolatedCrystalGenerator(this.ctx, this.canvas);
        } else {
            this.crystalEffect = null;
            this.crystalGenerator = null;
        }
        
        // Initialize the architectural effect
        this.architecturalEffect = new ArchitecturalEffect(this.ctx, []);
        
        // Initialize the prompt planner
        this.promptPlanner = new PromptPlanner(Object.keys(this.masks));
        
        // Initialize the template renderer
        this.templateRenderer = new TemplateRenderer(this);
        
        // Set default parameters
        this.parameters = {
            cleanTiling: false,
            // Add other parameters as needed
        };

        // Set initial effect
        if (options.initCrystals !== false) {
        this.setEffect('crystal');
        } else {
            this.setEffect('architectural');
        }
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
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
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
        
        // Reset transform to identity – templates will draw in CSS pixel space,
        // but the backing store has higher resolution to remain crisp on HiDPI.
        // This avoids double-scaling that previously caused drawings to appear
        // twice as large as the visible canvas.
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
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
        if (!this.supabaseClient || this.isLoadingImages) {
            return;
        }
        this.isLoadingImages = true;
        this.events.emit('imagesLoadingStart');
        try {
            const { data: rows, error } = await this.supabaseClient
                .from('images')
                .select('id, src')
                .order('created_at', { ascending: false });

            if (error) {
                this.events.emit('imagesLoadError', error);
                this.isLoadingImages = false;
                return;
            }

            this.events.emit('imagesMetadataLoaded', rows.length);
            const total = rows.length;
            this.images = [];

            rows.forEach(r => {
                if (!r.src) return;
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = r.src;
                img.onload = () => {
                    this.images.push(img);
                    if (this.generator) this.generator.images = this.images;
                    if (this.crystalEffect) this.crystalEffect.images = this.images;
                    if (this.architecturalEffect) this.architecturalEffect.images = this.images;
                    const loaded = this.images.length;
                    this.events.emit('imageLoaded', { loaded, total });
                    if (loaded === total) {
                        this.isLoadingImages = false;
                        this.events.emit('imagesLoaded', this.images);
                    }
                };
                img.onerror = (e) => {
                    console.warn(`[CollageService] Failed to load ${r.src}`, e);
                    this.events.emit('imageLoadError', { src: r.src, error: e });
                };
            });
        } catch (e) {
            console.error('[CollageService] Error loading images:', e);
            this.events.emit('imagesLoadError', e);
            this.isLoadingImages = false;
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
        // Ensure images are loaded before creating effect if crystalEffect might use them immediately
        if (this.images.length > 0 && this.crystalEffect) {
        this.crystalEffect = new CrystalEffect(this.ctx, this.images, { variant });
        } else if (this.crystalEffect) {
            // If images not loaded, crystalEffect might be initialized with an empty array for now
            this.crystalEffect.images = []; 
            this.crystalEffect.settings.variant = variant;
            console.warn("[CollageService] CrystalEffect variant set, but images not yet loaded for it.");
        }
    }

    async generateCollage(userPrompt = '') {
        if (!this.canvas) {
            console.warn('Cannot generate collage: canvas not available');
            return;
        }
        if (this.images.length === 0 && !this.isLoadingImages) {
            console.log('[CollageService] Images not loaded. Attempting to load images before generating collage...');
            await this.loadImages(); // Ensure images are loaded
            if (this.images.length === 0) { // Check again after load attempt
                console.warn('Cannot generate collage: images still not available after load attempt.');
                return;
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot generate collage: images are currently loading. Try again shortly.');
            return;
        }

        // Determine which effect to use based on the prompt
        const lowerPrompt = userPrompt.toLowerCase();
        if (lowerPrompt.includes('arch') || 
            lowerPrompt.includes('window') || 
            lowerPrompt.includes('door') || 
            lowerPrompt.includes('building') || 
            lowerPrompt.includes('facade')) {
            this.setEffect('architectural');
        } else if (lowerPrompt.includes('crystal')) {
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
                // Create new architectural effect instance with current images and prompt
                this.architecturalEffect = new ArchitecturalEffect(this.ctx, this.images, {
                    promptText: userPrompt,
                    useMixedBlending: true,
                    useComplementaryShapes: true
                });
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
        if (this.images.length === 0 && !this.isLoadingImages) {
            console.log('[CollageService] Images not loaded. Attempting to load images before applying crystal effect...');
            await this.loadImages();
            if (this.images.length === 0) {
                console.warn('Cannot apply crystal effect: images still not available after load attempt.');
                return;
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot apply crystal effect: images are currently loading. Try again shortly.');
            return;
        }
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

    /**
     * Generate a collage from a mask plan JSON (from LLM)
     * @param {object} plan - The mask plan JSON
     */
    async generateCollageFromPlan(plan) {
        console.log('[CollageService] generateCollageFromPlan called with:', plan);
        if (!plan || !Array.isArray(plan.masks)) {
            console.warn('Plan is missing masks array');
            return;
        }
        if (!this.images || this.images.length === 0) {
            console.warn('No images loaded for collage');
            return;
        }
        // Fill the canvas with a random background color
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
        ];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const maskSpec of plan.masks) {
            const { family, type, params } = maskSpec;
            const familyObj = maskRegistry[family];
            if (!familyObj) {
                console.warn(`Mask family not found: ${family}`);
                continue;
            }
            const availableTypes = Object.keys(familyObj);
            const maskFn = familyObj[type];
            if (!maskFn) {
                console.warn(`Mask type not found in family ${family}: ${type}. Available types:`, availableTypes);
                continue;
            }
            const svg = maskFn(params || {});
            console.log(`[CollageService] Generated SVG for ${family}/${type}:`, svg);

            // Use the robust SVG to Path2D converter
            const maskPath = svgToPath2D(svg);
            console.log('[CollageService] maskPath:', maskPath);
            if (!maskPath) {
                console.warn('SVG to Path2D failed:', svg);
                continue;
            }

            // Pick a random image from the loaded images
            const img = this.images[Math.floor(Math.random() * this.images.length)];
            console.log('[CollageService] image for mask:', img);
            if (!img || !img.complete) continue;

            // Save context, apply mask, and draw image with multiply blending
            this.ctx.save();
            // Scale the mask from SVG viewBox (100x100) to canvas size
            this.ctx.setTransform(
                this.canvas.width / 100, 0, 0,
                this.canvas.height / 100, 0, 0
            );
            this.ctx.clip(maskPath);
            // Reset transform so image draws normally
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.globalCompositeOperation = 'multiply';

            // Fit the image to the canvas (can be improved for aspect ratio)
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            this.ctx.restore();
        }
        // Reset composite mode
        this.ctx.globalCompositeOperation = 'source-over';
    }

    async drawTemplate(template) {
        if (!this.canvas) {
             console.warn('Cannot draw template: canvas not available');
             return;
        }
        if (this.images.length === 0 && !this.isLoadingImages) {
            console.log('[CollageService] Images not loaded. Attempting to load images before drawing template...');
            await this.loadImages();
            if (this.images.length === 0) {
                console.warn('Cannot draw template: images still not available after load attempt.');
                return;
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot draw template: images are currently loading. Try again shortly.');
            return;
        }

        console.log('[CollageService] Drawing template:', template);

        // Clear the canvas and apply background color
        if (template.defaultBG) {
            this.ctx.fillStyle = template.defaultBG;
        } else {
            this.ctx.fillStyle = '#ffffff';
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Edge-to-edge placement for pairedForms
        if (template.key === 'pairedForms') {
            const formCount = template.placements.length;
            const cellW = this.canvas.width / formCount;
            const cellH = this.canvas.height;
            for (let i = 0; i < formCount; i++) {
                const placement = template.placements[i];
                const img = this.images[i % this.images.length];
                if (!img || !img.complete) continue;
                const [family, maskName] = placement.maskName.split('/');
                const maskFunction = maskRegistry[family]?.[maskName];
                if (!maskFunction) continue;
                const svg = maskFunction(placement.params || {});
                const maskPath = svgToPath2D(svg);
                if (!maskPath) continue;
                this.ctx.save();
                // Snap to row, no rotation
                this.ctx.translate(i * cellW, 0);
                this.ctx.scale(cellW / 100, cellH / 100);
                this.ctx.clip(maskPath);
                // Aspect-ratio logic
                const imgAspect = img.width / img.height;
                const maskAspect = cellW / cellH;
                let drawWidth = cellW;
                let drawHeight = cellH;
                let drawX = 0;
                let drawY = 0;
                if (imgAspect > maskAspect) {
                    drawHeight = cellW / imgAspect;
                    drawY = (cellH - drawHeight) / 2;
                } else {
                    drawWidth = cellH * imgAspect;
                    drawX = (cellW - drawWidth) / 2;
                }
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.restore();
            }
            return;
        }

        // Process each placement
        for (let i = 0; i < template.placements.length; i++) {
            const placement = template.placements[i];
            const img = this.images[i % this.images.length];
            
            if (!img || !img.complete) {
                console.warn('Image not ready:', { index: i, img });
                continue;
            }

            // Split maskName into family and name
            const [family, maskName] = placement.maskName.split('/');
            console.log(`[CollageService] Processing mask: ${family}/${maskName}`, placement);
            
            const maskFunction = maskRegistry[family]?.[maskName];
            if (!maskFunction) {
                console.warn(`Mask ${placement.maskName} not found in registry`);
                continue;
            }

            // Convert relative coordinates to actual canvas coordinates
            const actualWidth = placement.width * this.canvas.width;
            const actualHeight = placement.height * this.canvas.height;
            const actualX = placement.x * this.canvas.width;
            const actualY = placement.y * this.canvas.height;

            console.log('[CollageService] Actual dimensions:', {
                width: actualWidth,
                height: actualHeight,
                x: actualX,
                y: actualY
            });

            // Generate SVG string and create mask
            const maskDescriptor = getMaskDescriptor(template.mask);
            if (!maskDescriptor || maskDescriptor.kind !== 'svg') {
                console.error(`Invalid or missing mask: ${template.mask}`);
                return;
            }
            const svgString = maskDescriptor.getSvg();
            console.log('[CollageService] Generated SVG string:', svgString);

            try {
                // Create Path2D from SVG
                const maskPath = svgToPath2D(svgString);
                if (!maskPath) {
                    console.warn('Failed to create Path2D from SVG');
                    continue;
                }

                // Save context state
                this.ctx.save();

                // Move to placement position and apply rotation if specified
                this.ctx.translate(actualX, actualY);
                if (placement.rotation) {
                    this.ctx.rotate((placement.rotation * Math.PI) / 180);
                }
                
                // Scale the mask to actual dimensions
                this.ctx.scale(actualWidth / 100, actualHeight / 100);

                // Apply the clipping path
                this.ctx.clip(maskPath);

                // Calculate image drawing dimensions to maintain aspect ratio
                const imgAspect = img.width / img.height;
                const maskAspect = actualWidth / actualHeight;
                let drawWidth = actualWidth;
                let drawHeight = actualHeight;
                let drawX = 0; // Draw at origin since we're already translated
                let drawY = 0;

                if (imgAspect > maskAspect) {
                    // Image is wider than mask
                    drawHeight = actualWidth / imgAspect;
                    drawY = (actualHeight - drawHeight) / 2;
                } else {
                    // Image is taller than mask
                    drawWidth = actualHeight * imgAspect;
                    drawX = (actualWidth - drawWidth) / 2;
                }

                // Draw the image with multiply blend mode
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // Reset composite operation
                this.ctx.globalCompositeOperation = 'source-over';

                // Restore context state
                this.ctx.restore();

                // Add a subtle stroke around the mask
                this.ctx.save();
                this.ctx.translate(actualX, actualY);
                if (placement.rotation) {
                    this.ctx.rotate((placement.rotation * Math.PI) / 180);
                }
                this.ctx.scale(actualWidth / 100, actualHeight / 100);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke(maskPath);
                this.ctx.restore();

            } catch (error) {
                console.error('Error drawing placement:', error);
                continue;
            }
        }
    }

    async renderTemplate(key, params) {
        if (this.images.length === 0 && !this.isLoadingImages) {
            console.log('[CollageService] Images not loaded. Attempting to load images before rendering template...');
            await this.loadImages();
            if (this.images.length === 0) {
                console.warn('Cannot render template: images still not available after load attempt.');
                // Potentially return a placeholder or throw an error
                return null; 
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot render template: images are currently loading. Try again shortly.');
            return null;
        }
        // Delegate to the template renderer
        return this.templateRenderer.renderTemplate(key, params);
    }
    
    /**
     * Save feedback about a template
     */
    saveTemplateFeedback(key, params, liked) {
        return this.templateRenderer.saveFeedback(key, params, liked);
    }
    
    /**
     * Get all available templates
     */
    getAllTemplates() {
        return this.templateRenderer.getAllTemplates();
    }
    
    /**
     * Get a template by key
     */
    getTemplate(key) {
        return this.templateRenderer.getTemplate(key);
    }
} 