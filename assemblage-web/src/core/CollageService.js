// CollageService.js - Simplified Version
import { TemplateRenderer } from './TemplateRenderer';
import { svgToPath2D } from './svgUtils.js';
import { EventEmitter } from '../utils/EventEmitter.ts';
import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry.ts';
import { getSupabase, getImageUrl } from '../supabaseClient';
import { getDefaultCollectionId } from '../hooks/useImages';

export class CollageService {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.supabaseClient = options.supabaseClient || getSupabase();
        
        // Simplified image management
        this.imageMetadata = []; // Metadata from DB
        this.imageCache = new Map(); // Loaded images cache
        this.availableImages = []; // Current working set of images
        this.currentCollectionId = null;
        
        // Loading states
        this.isInitialized = false;
        this.isLoading = false;
        this.isRendering = false;
        
        // Configuration
        this.maxCacheSize = 50;
        this.isDevelopment = import.meta.env.MODE === 'development';
        
        // Events and rendering
        this.events = new EventEmitter();
        this.templateRenderer = new TemplateRenderer(this);
        
        // Template rendering tracking
        this.currentEffectName = null;
        this.lastRenderInfo = null;
        
        console.log('[CollageService] Initialized', { isDevelopment: this.isDevelopment });

    }
    
    // Helper method to normalize collection ID
    normalizeCollectionId(collectionId) {
        // If no collection ID provided, use the default
        return collectionId || getDefaultCollectionId();
    }

    // Initialize images for the service
    async initialize(collectionId) {
        const normalizedCollectionId = this.normalizeCollectionId(collectionId);
        
        if (this.isInitialized && this.currentCollectionId === normalizedCollectionId) {
            console.log('[CollageService] Already initialized with same collection');
            return;
        }
        
        this.isLoading = true;
        this.currentCollectionId = normalizedCollectionId;
        
        try {
            // Check if this is the default collection
            const isDefaultCollection = normalizedCollectionId === getDefaultCollectionId() || normalizedCollectionId === 'cms';
            
            // In development, use placeholders for default collection
            if (this.isDevelopment && isDefaultCollection) {
                await this.setupDevelopmentImages();
            } else {
                // Load real images for user collections or production
                await this.loadImageMetadata(normalizedCollectionId);
            }
            
            this.isInitialized = true;
            console.log(`[CollageService] Initialized with ${this.imageMetadata.length} images for collection: ${normalizedCollectionId}`);
        } catch (error) {
            console.error('[CollageService] Failed to initialize:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    // Force reinitialize with a new collection (clears cache)
    async reinitialize(collectionId) {
        console.log(`[CollageService] Reinitializing with collection: ${collectionId}`);
        
        // Reset state
        this.isInitialized = false;
        this.imageMetadata = [];
        this.imageCache.clear();
        this.availableImages = [];
        
        // Initialize with new collection
        await this.initialize(collectionId);
    }
    
    // Load metadata from Supabase
    async loadImageMetadata(collectionId) {
        if (!this.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        // Normalize collection ID - handle 'cms' as default collection
        const normalizedId = collectionId === 'cms' ? getDefaultCollectionId() : collectionId;
        
        try {
            // Use the RPC function that handles the OR logic server-side
            const { data: rows, error } = await this.supabaseClient
                .rpc('list_images', { collection_uuid: normalizedId });
            
            if (error) {
                console.error('[CollageService] Database error:', error);
                throw error;
            }
            
            this.imageMetadata = rows || [];
            console.log(`[CollageService] Loaded ${this.imageMetadata.length} image records for collection ${collectionId}`);
        } catch (error) {
            console.error('[CollageService] Failed to load images:', error);
            this.imageMetadata = [];
        }
    }
    
    // Setup placeholder images for development
    async setupDevelopmentImages() {
        // Create dummy metadata
        this.imageMetadata = Array.from({ length: 20 }, (_, i) => ({
            id: `dummy-${i}`,
            src: `placeholder${i + 1}.png`,
            image_role: Math.random() < 0.3 ? 'texture' : (Math.random() < 0.5 ? 'narrative' : 'conceptual'),
            is_black_and_white: true
        }));
        
        // Load placeholder images
        const loadPromise = Promise.all(
            Array.from({ length: 20 }, (_, i) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = `/images/collages/placeholder${i + 1}.png`;
                    img.onload = () => {
                        img.image_role = Math.random() < 0.3 ? 'texture' : 'conceptual';
                        img.is_black_and_white = true;
                        resolve(img);
                    };
                    img.onerror = () => resolve(null);
                });
            })
        );
        
        const images = await loadPromise;
        this.availableImages = images.filter(img => img !== null);
        console.log(`[CollageService] Loaded ${this.availableImages.length} development images`);
    }

    // Load specific images for rendering
    async loadImagesForRender(count = 10) {
        // Check if this is the default collection
        const isDefaultCollection = this.currentCollectionId === getDefaultCollectionId() || this.currentCollectionId === 'cms';
        
        if (this.isDevelopment && isDefaultCollection) {
            // Return development images for default collection
            return this.availableImages.slice(0, Math.min(count, this.availableImages.length));
        }
        
        // For user collections or production, load real images
        // Get random image IDs from metadata
        const imageIds = this.getRandomImageIds(count);
        
        // Check cache first
        const cachedImages = imageIds.map(id => this.imageCache.get(id)).filter(img => img);
        
        if (cachedImages.length >= count) {
            return cachedImages.slice(0, count);
        }
        
        // Load missing images
        const imagesToLoad = imageIds.filter(id => !this.imageCache.has(id));
        const loadPromises = imagesToLoad.map(id => this.loadSingleImage(id));
        
        const newImages = await Promise.all(loadPromises);
        const validNewImages = newImages.filter(img => img !== null);
        
        // Add to cache
        validNewImages.forEach((img, idx) => {
            const id = imagesToLoad[idx];
            this.addToCache(id, img);
        });
        
        // Return combined cached + new images
        const allImages = [...cachedImages, ...validNewImages];
        return allImages.slice(0, count);
    }
    
    // Load a single image by ID
    async loadSingleImage(id) {
        const metadata = this.imageMetadata.find(m => m.id === id);
        if (!metadata || !metadata.src) return null;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            // For uploads, use src directly (it's already a full URL)
            // For CMS images, use getImageUrl to construct the URL
            if (metadata.provider === 'upload') {
                img.src = metadata.src;
            } else {
                img.src = getImageUrl(metadata.src);
            }
            img.dataset.imageId = id;
            img.image_role = metadata.image_role || 'unknown';
            img.is_black_and_white = metadata.is_black_and_white;
            
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`[CollageService] Failed to load image ${id}`);
                resolve(null);
            };
        });
    }



    // Add image to cache with LRU eviction
    addToCache(id, image) {
        if (this.imageCache.size >= this.maxCacheSize) {
            // Remove least recently used image
            const firstKey = this.imageCache.keys().next().value;
            this.imageCache.delete(firstKey);
        }
        this.imageCache.set(id, image);
    }

    // Get random image IDs for collage
    getRandomImageIds(count) {
        if (this.imageMetadata.length === 0) return [];
        
        const shuffled = [...this.imageMetadata].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, this.imageMetadata.length)).map(m => m.id);
    }



    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight || window.innerHeight;
        const devicePixelRatio = window.devicePixelRatio || 1;
        
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
        
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${containerHeight}px`;
        this.canvas.width = Math.floor(containerWidth * devicePixelRatio);
        this.canvas.height = Math.floor(containerHeight * devicePixelRatio);
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.devicePixelRatio = devicePixelRatio;
        
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



    setEffect(effectName) {
        this.currentEffectName = effectName;
        console.log('[CollageService] Setting effect to:', effectName);
    }

    async generateCollage(userPrompt = '') {
        if (!this.canvas) {
            console.warn('[CollageService] Cannot generate collage: canvas not available');
            return;
        }
        
        // Ensure we're initialized
        if (!this.isInitialized) {
            console.log('[CollageService] Not initialized, initializing now...');
            await this.initialize(this.currentCollectionId);
        }
        
        if (this.isRendering) {
            console.warn('[CollageService] Render already in progress. Skipping.');
            return;
        }
        
        this.isRendering = true;
        this.events.emit('renderStart');
        
        try {
            // Select template
            const selectedTemplate = this.currentEffectName 
                ? this.templateRenderer.getTemplate(this.currentEffectName) || this.templateRenderer.getRandomTemplate()
                : this.templateRenderer.getRandomTemplate();
                
            if (!selectedTemplate?.key) {
                throw new Error('No valid template available');
            }
            
            const templateKey = selectedTemplate.key;
            console.log(`[CollageService] Using template: ${templateKey}`, {
                selectedTemplate: selectedTemplate,
                templateParams: selectedTemplate.params
            });
            
            // Determine how many images we need
            const numImagesNeeded = this.getImageCountForTemplate(selectedTemplate);
            
            // Load images for rendering
            const images = await this.loadImagesForRender(numImagesNeeded);
            
            if (!images || images.length === 0) {
                throw new Error('No images available for rendering');
            }
            
            console.log(`[CollageService] Loaded ${images.length} images for template`);
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Prepare template parameters
            const templateParams = { userPrompt, images };
            
            console.log('[CollageService] Template parameters before render:', {
                templateKey: templateKey,
                templateParams: templateParams,
                selectedTemplate: selectedTemplate
            });
            
            // Render the template
            const renderOutput = await this.templateRenderer.renderTemplate(templateKey, templateParams);
            
            // Store render information for saving - get processed params from render output
            const processedParams = renderOutput?.processedParams || {};
            
            this.lastRenderInfo = {
                templateKey: templateKey,
                templateName: selectedTemplate.name || templateKey,
                params: processedParams,
                timestamp: new Date().toISOString(),
                numImages: images.length,
                userPrompt: templateParams.userPrompt || ''
            };
            
            console.log('[CollageService] Stored render info with processed params:', this.lastRenderInfo);
            
            // Update UI colors if background color was returned
            if (renderOutput?.bgColor) {
                this.updateUIColors(renderOutput.bgColor);
            }
            
            this.events.emit('renderEnd', { success: true, templateKey });
            console.log(`[CollageService] Successfully rendered ${templateKey}`);
            
        } catch (error) {
            console.error('[CollageService] Error generating collage:', error);
            this.events.emit('renderEnd', { success: false, error: error.message });
        } finally {
            this.isRendering = false;
        }
    }
    
    // Helper method to determine image count for a template
    getImageCountForTemplate(template) {
        if (template.params?.imageCount?.default) {
            return template.params.imageCount.default;
        }
        
        // Default counts based on template type
        const templateKey = template.key;
        switch (templateKey) {
            case 'crystal':
            case 'dynamicArchitectural':
                return 5 + Math.floor(Math.random() * 4); // 5-8 images
            case 'tilingTemplate':
                return 10 + Math.floor(Math.random() * 11); // 10-20 images
            case 'scrambledMosaic':
                return 8 + Math.floor(Math.random() * 8); // 8-15 images
            default:
                return 6; // Default
        }
    }





    shiftPerspective(userPrompt = '') {
        if (!this.ctx) return;
        this.generateCollage(userPrompt);
    }

    saveCollage() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = 'assemblage-collage.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    getBackgroundColor() {
        const centerX = Math.floor(this.canvas.width / 2);
        const centerY = Math.floor(this.canvas.height / 2);
        const pixelData = this.ctx.getImageData(centerX, centerY, 1, 1).data;
        // Convert to hex format for consistency with color utilities
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        return hex;
    }
    
    updateUIColors(bgColor) {
        // Import the same complementary color function used by templates
        import('../utils/colorUtils.js').then(({ getComplementaryColor }) => {
            // Use the exact same complementary color logic as templates
            const complementaryColor = getComplementaryColor(bgColor);
            
            console.log(`[CollageService] UI Colors - BG: ${bgColor}, Complementary: ${complementaryColor}`);
            
            // Convert bgColor to CSS format if it was hex
            const cssBgColor = bgColor.startsWith('#') ? bgColor : bgColor;
            
            document.documentElement.style.setProperty('--background-color', cssBgColor);
            document.documentElement.style.setProperty('--text-color', complementaryColor);
            document.documentElement.style.setProperty('--button-border-color', complementaryColor);
            document.documentElement.style.setProperty('--button-hover-bg', complementaryColor);
        }).catch(err => {
            console.warn('[CollageService] Could not load colorUtils, using fallback');
            // Fallback color logic
            const hexToRgb = (hex) => {
                hex = hex.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return { r, g, b };
            };
            
            const rgbToHex = (r, g, b) => {
                return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
            };
            
            let r, g, b;
            if (bgColor.startsWith('#')) {
                const rgb = hexToRgb(bgColor);
                r = rgb.r; g = rgb.g; b = rgb.b;
            } else {
                const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgbMatch) return;
                r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]);
            }
            
            // Simple complementary color (invert RGB)
            const compR = 255 - r;
            const compG = 255 - g;
            const compB = 255 - b;
            const complementaryColor = rgbToHex(compR, compG, compB);
            
            document.documentElement.style.setProperty('--background-color', bgColor);
            document.documentElement.style.setProperty('--text-color', complementaryColor);
            document.documentElement.style.setProperty('--button-border-color', complementaryColor);
            document.documentElement.style.setProperty('--button-hover-bg', complementaryColor);
        });
    }

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

            const maskPath = svgToPath2D(svg);
            console.log('[CollageService] maskPath:', maskPath);
            if (!maskPath) {
                console.warn('SVG to Path2D failed:', svg);
                continue;
            }

            const img = this.images[Math.floor(Math.random() * this.images.length)];
            console.log('[CollageService] image for mask:', img);
            if (!img || !img.complete) continue;

            this.ctx.save();
            this.ctx.setTransform(
                this.canvas.width / 100, 0, 0,
                this.canvas.height / 100, 0, 0
            );
            this.ctx.clip(maskPath);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.globalCompositeOperation = 'multiply';

            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

            this.ctx.restore();
        }
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

        if (template.defaultBG) {
            this.ctx.fillStyle = template.defaultBG;
        } else {
            this.ctx.fillStyle = '#ffffff';
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
                this.ctx.translate(i * cellW, 0);
                this.ctx.scale(cellW / 100, cellH / 100);
                this.ctx.clip(maskPath);
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

        for (let i = 0; i < template.placements.length; i++) {
            const placement = template.placements[i];
            const img = this.images[i % this.images.length];
            
            if (!img || !img.complete) {
                console.warn('Image not ready:', { index: i, img });
                continue;
            }

            const [family, maskName] = placement.maskName.split('/');
            console.log(`[CollageService] Processing mask: ${family}/${maskName}`, placement);
            
            const maskFunction = maskRegistry[family]?.[maskName];
            if (!maskFunction) {
                console.warn(`Mask ${placement.maskName} not found in registry`);
                continue;
            }

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

            const maskDescriptor = getMaskDescriptor(template.mask);
            if (!maskDescriptor || maskDescriptor.kind !== 'svg') {
                console.error(`Invalid or missing mask: ${template.mask}`);
                return;
            }
            const svgString = maskDescriptor.getSvg();
            console.log('[CollageService] Generated SVG string:', svgString);

            try {
                const maskPath = svgToPath2D(svgString);
                if (!maskPath) {
                    console.warn('Failed to create Path2D from SVG');
                    continue;
                }

                this.ctx.save();

                this.ctx.translate(actualX, actualY);
                if (placement.rotation) {
                    this.ctx.rotate((placement.rotation * Math.PI) / 180);
                }
                
                this.ctx.scale(actualWidth / 100, actualHeight / 100);

                this.ctx.clip(maskPath);

                const imgAspect = img.width / img.height;
                const maskAspect = actualWidth / actualHeight;
                let drawWidth = actualWidth;
                let drawHeight = actualHeight;
                let drawX = 0;
                let drawY = 0;

                if (imgAspect > maskAspect) {
                    drawHeight = actualWidth / imgAspect;
                    drawY = (actualHeight - drawHeight) / 2;
                } else {
                    drawWidth = actualHeight * imgAspect;
                    drawX = (actualWidth - drawWidth) / 2;
                }

                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                this.ctx.globalCompositeOperation = 'source-over';

                this.ctx.restore();

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
        return this.templateRenderer.renderTemplate(key, params);
    }
    
    saveTemplateFeedback(key, params, liked) {
        return this.templateRenderer.saveFeedback(key, params, liked);
    }
    
    getAllTemplates() {
        return this.templateRenderer.getAllTemplates();
    }
    
    getTemplate(key) {
        return this.templateRenderer.getTemplate(key);
    }
    
    // Get information about the last rendered template
    getLastRenderInfo() {
        return this.lastRenderInfo;
    }
    
    // Extract only the relevant template parameters for saving
    extractTemplateParams(templateParams, selectedTemplate) {
        console.log('[CollageService] extractTemplateParams called with:', {
            templateParams: templateParams,
            selectedTemplate: selectedTemplate,
            templateParamsKeys: templateParams ? Object.keys(templateParams) : 'null',
            selectedTemplateParams: selectedTemplate?.params
        });
        
        if (!selectedTemplate?.params || !templateParams) {
            console.warn('[CollageService] Missing template or params:', {
                hasSelectedTemplate: !!selectedTemplate,
                hasSelectedTemplateParams: !!selectedTemplate?.params,
                hasTemplateParams: !!templateParams
            });
            return {};
        }
        
        const relevantParams = {};
        
        // Extract only the parameters that are defined in the template's param schema
        Object.keys(selectedTemplate.params).forEach(paramKey => {
            console.log('[CollageService] Checking param:', paramKey, '- value:', templateParams[paramKey]);
            if (templateParams[paramKey] !== undefined) {
                relevantParams[paramKey] = templateParams[paramKey];
            }
        });
        
        // Also include userPrompt if it exists
        if (templateParams.userPrompt) {
            relevantParams.userPrompt = templateParams.userPrompt;
        }
        
        console.log('[CollageService] Extracted template params:', {
            templateKey: selectedTemplate.key,
            allParams: Object.keys(templateParams),
            extracted: Object.keys(relevantParams),
            values: relevantParams
        });
        
        return relevantParams;
    }
} 