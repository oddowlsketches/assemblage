// CollageService.js
import paper from 'paper';
import { createClient } from '@supabase/supabase-js';
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';
import { CrystalEffect } from '../effects/CrystalEffect.ts';
import { ArchitecturalEffect } from '../effects/ArchitecturalEffect.ts';
import maskImplementations from '../legacy/js/collage/maskImplementations.js';
import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry.ts';
import { TemplateRenderer } from './TemplateRenderer';
import { svgToPath2D } from './svgUtils.js';
import { EventEmitter } from '../utils/EventEmitter.ts';
import { getRandomTemplate } from '../templates/templateManager.ts';
import { getSupabase, getImageUrl } from '../supabaseClient';

export class CollageService {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.isLoadingImages = false;
        this.imagesAttemptedToLoad = 0;
        this.imagesSuccessfullyLoaded = 0;
        this.currentEffect = null;
        this.currentEffectName = null;
        this.crystalVariant = 'standard';
        this.paperProject = null;
        this.paperView = null;
        this.masks = maskImplementations;
        this.supabaseClient = null;
        
        // Lazy loading configuration
        this.imageMetadata = []; // Store metadata without loading images
        this.imageCache = new Map(); // Cache loaded images by ID
        this.maxCacheSize = 50; // Maximum images to keep in cache
        this.placeholderImages = []; // Placeholder for development
        this.currentCollectionId = null; // Track current collection filter

        this.options = options;
        this.events = new EventEmitter();
        
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
                console.error('[CollageService] Supabase URL or Anon Key is missing.');
            }
        }
        
        this.generator = new CollageGenerator(this.canvas, { verbose: false });
        
        this.templateRenderer = new TemplateRenderer(this);
        
        this.parameters = {
            cleanTiling: false,
        };
    }

    // Load only image metadata (not the actual images)
    async loadImageMetadata(collectionId) {
        if (!this.supabaseClient) {
            console.error('[CollageService] Supabase client not initialized.');
            return;
        }

        // Store the current collection ID for future reference
        this.currentCollectionId = collectionId || null;
        console.log(`[CollageService] loadImageMetadata called with collectionId: ${collectionId}`);

        try {
            let query = this.supabaseClient
                .from('images')
                .select('id, src, imagetype, collection_id')
                .order('created_at', { ascending: false });
            if (collectionId) {
                query = query.eq('collection_id', collectionId);
                console.log(`[CollageService] Filtering by collection_id: ${collectionId}`);
            } else {
                console.log(`[CollageService] Loading ALL images (no collection filter)`);
            }
            const { data: rows, error } = await query;

            if (error) {
                console.error('[CollageService] Error fetching image metadata:', error);
                return;
            }

            this.imageMetadata = rows || [];
            console.log(`[CollageService] Loaded metadata for ${this.imageMetadata.length} images for collection: ${collectionId || 'ALL'}`);
            
            if (this.imageMetadata.length === 0 && import.meta.env.MODE === 'development') {
                console.log('[CollageService] No metadata found, creating dummy entries for development');
                this.imageMetadata = Array.from({ length: 50 }, (_, i) => ({
                    id: `dummy-${i}`,
                    src: `dummy-${i}.jpg`,
                    imagetype: Math.random() < 0.3 ? 'texture' : (Math.random() < 0.5 ? 'narrative' : 'conceptual')
                }));
            }
        } catch (e) {
            console.error('[CollageService] Error loading image metadata:', e);
            
            if (import.meta.env.MODE === 'development') {
                console.log('[CollageService] Creating dummy metadata for development');
                this.imageMetadata = Array.from({ length: 50 }, (_, i) => ({
                    id: `dummy-${i}`,
                    src: `dummy-${i}.jpg`,
                    imagetype: Math.random() < 0.3 ? 'texture' : (Math.random() < 0.5 ? 'narrative' : 'conceptual')
                }));
            }
        }
    }

    // Lazy load specific images by IDs
    async loadImagesByIds(imageIds) {
        if (import.meta.env.MODE === 'development') {
            if (!this.placeholderImages || this.placeholderImages.length === 0) {
                console.warn('[CollageService] Placeholder images array is empty in loadImagesByIds. Attempting to load.');
                await this.loadPlaceholder();
            }
            
            const validPlaceholders = this.placeholderImages.filter(img => img && img.complete && !img.isBroken);
            
            if (validPlaceholders.length === 0) {
                console.warn('[CollageService] No valid placeholder images available after filtering in loadImagesByIds. Returning empty array.');
                return [];
            }
            
            return imageIds.map((id, idx) => {
                const placeholder = validPlaceholders[idx % validPlaceholders.length];
                if (placeholder) {
                    const dummyMeta = this.imageMetadata.find(m => m.id === `dummy-${idx % this.imageMetadata.filter(m => m.id.startsWith('dummy-')).length}`);
                    placeholder.imagetype = dummyMeta?.imagetype || (Math.random() < 0.3 ? 'texture' : 'conceptual');
                }
                return placeholder;
            });
        }
        
        const imagesToLoad = imageIds.filter(id => !this.imageCache.has(id));
        
        if (imagesToLoad.length === 0) {
            return Array.from(imageIds).map(id => this.imageCache.get(id)).filter(img => img);
        }

        const loadPromises = imagesToLoad.map(async (id) => {
            const metadata = this.imageMetadata.find(m => m.id === id);
            if (!metadata || !metadata.src) return null;

            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = getImageUrl(metadata.src);
                img.dataset.supabaseSrc = metadata.src;
                img.dataset.imageId = id;
                img.imagetype = metadata.imagetype || 'unknown';
                
                img.onload = () => {
                    this.addToCache(id, img);
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn(`[CollageService] Failed to load image ${id}`);
                    resolve(null);
                };
            });
        });

        await Promise.all(loadPromises);
        return Array.from(imageIds).map(id => this.imageCache.get(id)).filter(img => img);
    }

    // Load placeholder image for development
    async loadPlaceholder() {
        if (this.placeholderImages && this.placeholderImages.length === 20 && this.placeholderImages.every(img => img instanceof Image)) {
            // If already loaded and all are Image instances, check completion and broken status
            const allCompleteAndNotBroken = this.placeholderImages.every(img => img.complete && !img.isBroken);
            if (allCompleteAndNotBroken && this.placeholderImages.filter(img => img.complete && !img.isBroken).length > 0) {
                 console.log('[CollageService] Placeholder images already loaded and valid.');
                 return true;
            }
            // If some are broken or not complete, attempt to reload them or re-verify
            console.log('[CollageService] Placeholder array exists, but some may be invalid. Re-checking/loading.');
        }
        
        this.placeholderImages = Array(20).fill(null);
        let loadedCount = 0;
        let errorCount = 0;
        const promises = [];

        for (let i = 0; i < 20; i++) {
            const promise = new Promise((resolveIteration) => {
                const img = new Image();
                img.isBroken = false; 
                img.src = `/images/collages/placeholder${i + 1}.png`;
                this.placeholderImages[i] = img;

                img.onload = () => {
                    loadedCount++;
                    resolveIteration(true);
                };
                img.onerror = () => {
                    errorCount++;
                    img.isBroken = true; // Mark as broken
                    console.warn(`[CollageService] Failed to load placeholder${i + 1}.png`);
                    resolveIteration(false);
                };
            });
            promises.push(promise);
        }

        return Promise.all(promises).then(results => {
            console.log(`[CollageService] All placeholder images processed. Loaded: ${loadedCount}, Errored: ${errorCount}`);
            // Resolve true if at least one image loaded successfully
            return loadedCount > 0;
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

    initializePaper() {
        if (this.canvas) {
            paper.setup(this.canvas);
            this.paperProject = paper.project;
            this.paperView = paper.view;
            
            this.paperView.onFrame = () => {
                // Animation frame callback if needed
            };
            
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
        
        const project = new paper.Project();
        
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

    async loadImages(collectionId) {
        if (!this.supabaseClient) {
            console.error('[CollageService] Supabase client not initialized. Cannot load images.');
            this.events.emit('imagesLoadError', { type: 'client_missing' });
            return;
        }
        if (this.isLoadingImages) {
            console.warn('[CollageService] Image load already in progress.');
            this.events.emit('imagesLoadingAlreadyInProgress');
            return;
        }

        this.isLoadingImages = true;
        this.images = [];
        this.imagesSuccessfullyLoaded = 0;
        let imagesErrored = 0;
        this.events.emit('imagesLoadingStart');

        try {
            let query = this.supabaseClient
                .from('images')
                .select('id, src, collection_id')
                .order('created_at', { ascending: false });
            if (collectionId) query = query.eq('collection_id', collectionId);
            const { data: rows, error } = await query;

            if (error) {
                console.error('[CollageService] Supabase error fetching image list:', error);
                this.events.emit('imagesLoadError', { type: 'list_fetch', error });
                this.isLoadingImages = false;
                return;
            }

            if (!rows || rows.length === 0) {
                console.warn('[CollageService] No images found in Supabase.');
                this.isLoadingImages = false;
                this.events.emit('imagesLoaded', this.images);
                return;
            }

            const totalToAttempt = rows.filter(r => r.src).length;
            this.imagesAttemptedToLoad = totalToAttempt;
            let imagesProcessed = 0;

            if (totalToAttempt === 0) {
                this.isLoadingImages = false;
                this.events.emit('imagesLoaded', this.images);
                console.log('[CollageService] Image loading complete (no valid image sources to load).');
                return;
            }

            rows.forEach(r => {
                if (!r.src) return;

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = getImageUrl(r.src);
                img.dataset.supabaseSrc = r.src;
                img.dataset.imageId = r.id;
                
                const onDone = () => {
                    imagesProcessed++;
                    if (imagesProcessed === totalToAttempt) {
                        this.isLoadingImages = false;
                        this.events.emit('imagesLoaded', this.images);
                        console.log(`[CollageService] Image loading complete. Successfully loaded: ${this.imagesSuccessfullyLoaded}/${totalToAttempt}. Errored: ${imagesErrored}.`);
                    }
                };

                img.onload = () => {
                    this.images.push(img);
                    this.imagesSuccessfullyLoaded++;
                    if (this.generator) this.generator.images = this.images;
                    this.events.emit('imageLoaded', { loaded: this.imagesSuccessfullyLoaded, total: totalToAttempt });
                    onDone();
                };
                img.onerror = (e) => {
                    console.warn(`[CollageService] Failed to load ${r.src}`, e);
                    this.events.emit('imageLoadError', { src: r.src, error: e });
                    imagesErrored++;
                    onDone();
                };
            });
        } catch (e) {
            console.error('[CollageService] General error in loadImages function:', e);
            this.events.emit('imagesLoadError', { type: 'general_catch', error: e });
            this.isLoadingImages = false;
        }
    }

    setEffect(effectName) {
        this.currentEffectName = effectName;
        this.generator.currentEffect = effectName;
        
        console.log('[CollageService] Setting effect to:', effectName);
    }

    setCrystalVariant(variant) {
        this.crystalVariant = variant;
    }

    async generateCollage(userPrompt = '') {
        if (!this.canvas) {
            console.warn('Cannot generate collage: canvas not available');
            return;
        }
        
        // Load metadata if not already loaded and not in development (dev uses placeholders)
        if (this.imageMetadata.length === 0 && import.meta.env.MODE !== 'development') {
            console.log('[CollageService] Loading image metadata...');
            await this.loadImageMetadata(this.currentCollectionId);
            // If still no metadata, and not in dev, we might have an issue fetching from Supabase
            // For now, we'll let it try to proceed, image loading might fail later.
            // Or, decide if we should fallback to old full loadImages() here.
            if (this.imageMetadata.length === 0) {
                 console.warn('[CollageService] Image metadata is empty after attempting to load (and not in dev mode).');
            }
        }

        // In development, ensure placeholders are loaded and valid
        if (import.meta.env.MODE === 'development') {
            const placeholdersReady = await this.loadPlaceholder(); // Ensures placeholders are attempted to load
            if (!placeholdersReady || this.placeholderImages.filter(img => img && img.complete && !img.isBroken).length === 0) {
                console.error('[CollageService] No valid placeholder images available. Cannot generate collage.');
                this.isRendering = false;
                this.events.emit('renderEnd', { success: false, error: 'No valid placeholders' });
                return;
            }
            this.images = this.placeholderImages.filter(img => img && img.complete && !img.isBroken);
            if (this.images.length === 0) { // Double check after filter
                console.error('[CollageService] Filtering placeholders resulted in an empty image list. Cannot generate.');
                this.isRendering = false;
                this.events.emit('renderEnd', { success: false, error: 'No valid placeholders after filter' });
                return;
            }
        }


        if (this.isRendering) {
            console.warn('[CollageService] Render already in progress. Skipping.');
            return;
        }
        this.isRendering = true;
        this.events.emit('renderStart');

        let selectedTemplate;
        if (this.currentEffectName) {
            selectedTemplate = this.templateRenderer.getTemplate(this.currentEffectName);
            if (!selectedTemplate) {
                 console.warn(`[CollageService] No template found for effect: ${this.currentEffectName}. Falling back to random.`);
                 selectedTemplate = this.templateRenderer.getRandomTemplate();
            }
        } else {
            selectedTemplate = this.templateRenderer.getRandomTemplate();
        }

        if (!selectedTemplate || !selectedTemplate.key) {
            console.error("[CollageService] Failed to get a valid template or template has no key.");
            this.isRendering = false;
            this.events.emit('renderEnd', { success: false, error: 'No valid template' });
            return;
        }
        
        const templateKey = selectedTemplate.key;
        console.log(`[CollageService] Using template: ${templateKey}`);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let numImagesNeeded = 3; // Default
        if (selectedTemplate.params && selectedTemplate.params.imageCount && selectedTemplate.params.imageCount.default) {
            numImagesNeeded = selectedTemplate.params.imageCount.default;
        } else if (templateKey === 'crystalEffect' || templateKey === 'dynamicArchitectural') { // Note: crystalEffect key might be 'crystal'
            numImagesNeeded = 5 + Math.floor(Math.random() * 4); 
        } else if (templateKey === 'tilingTemplate') {
            numImagesNeeded = 10 + Math.floor(Math.random() * 11); 
        }


        // Load images via IDs if NOT in dev mode (dev mode uses placeholders assigned above)
        if (import.meta.env.MODE !== 'development') {
            const imageIdsToLoad = this.getRandomImageIds(numImagesNeeded);
            const currentImages = await this.loadImagesByIds(imageIdsToLoad);

            if (!currentImages || currentImages.length === 0) {
                // If specific images failed, and we have globally loaded images (from an old full load), use them.
                // This an old fallback, ideally loadImagesByIds should be robust or imageMetadata sufficient.
                if(this.images && this.images.length > 0) { 
                     console.warn('[CollageService] No specific images loaded for template, using existing general pool (if any).');
                } else {
                    console.error('[CollageService] No images available (neither specific IDs nor general pool). Cannot render.');
                    this.isRendering = false;
                    this.events.emit('renderEnd', { success: false, error: 'No images for template' });
                    return;
                }
            } else {
                 this.images = currentImages.filter(img => img && img.complete && !img.isBroken); // Ensure only valid images
                 if (this.images.length === 0) {
                    console.error('[CollageService] No valid images after filtering loaded-by-ID images. Cannot render.');
                    this.isRendering = false;
                    this.events.emit('renderEnd', { success: false, error: 'No valid images after ID load and filter' });
                    return;
                 }
            }
        }
        
        // Ensure the generator (if used by a template directly, less common now) has the latest images
        if (this.generator) {
          this.generator.images = this.images;
        }

        try {
            // Ensure this.images passed to renderTemplate are valid
            if (!this.images || this.images.length === 0 || this.images.every(img => !img || img.isBroken || !img.complete)) {
                console.error(`[CollageService] No valid images to send to template ${templateKey}. Aborting render.`);
                this.events.emit('renderEnd', { success: false, error: 'No valid images for rendering', templateKey });
                this.isRendering = false;
                return;
            }
            
            // Generate random parameters for the template if using the "New" button functionality
            let templateParams = { userPrompt, images: this.images };
            
            // Import parameter generators from templateManager
            if (templateKey === 'dynamicArchitectural') {
                // Use the random parameter generator from templateManager
                const { generators } = await import('../templates/templateManager');
                if (generators && generators.dynamicArchitectural) {
                    const randomParams = generators.dynamicArchitectural();
                    templateParams = { ...templateParams, ...randomParams };
                    console.log(`[CollageService] Using random parameters for ${templateKey}:`, randomParams);
                }
            }
            
            const renderOutput = await this.templateRenderer.renderTemplate(templateKey, templateParams);
            
            if (renderOutput && renderOutput.bgColor) {
                console.log(`[CollageService] Finished rendering template: ${templateKey}. BG: ${renderOutput.bgColor}`);
                this.updateUIColors(renderOutput.bgColor); 
            } else {
                console.warn(`[CollageService] Template ${templateKey} did not return a bgColor. UI colors not updated dynamically.`);
                this.updateUIColors(this.getBackgroundColor()); 
            }
            this.events.emit('renderEnd', { success: true, templateKey });
        } catch (error) {
            console.error(`[CollageService] Error during template rendering (${templateKey}):`, error);
            this.events.emit('renderEnd', { success: false, error: error.message, templateKey });
        } finally {
            this.isRendering = false;
        }
    }

    // Estimate how many images a template needs
    estimateImageCount(templateType, params) {
        switch (templateType) {
            case 'crystal':
                return params.crystalCount || 20;
            case 'tiling':
                return params.tileCount || 20;
            case 'scrambledMosaic':
                const gridSize = params.gridSize || 6;
                return gridSize * gridSize;
            case 'sliced':
                return params.sliceBehavior === 'single-image' ? 1 : 10;
            case 'pairedForms':
                return params.formCount || 3;
            case 'dynamicArchitectural':
                return params.imageMode === 'single' ? 1 : 8;
            default:
                return 20; // Default fallback
        }
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
                await this.crystalGenerator.generateCrystalField(this.images);
            } else {
                this.crystalEffect = new CrystalEffect(this.ctx, this.images, { variant: 'standard' });
                this.crystalEffect.draw();
            }
        } catch (error) {
            console.error('Error applying crystal effect:', error);
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
        return `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
    }
    
    updateUIColors(bgColor) {
        // Helper function to convert hex to RGB
        const hexToRgb = (hex) => {
            // Remove # if present
            hex = hex.replace('#', '');
            // Parse the hex values
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return { r, g, b };
        };
        
        const rgbToHsl = (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0;
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
        
        let r, g, b;
        
        // Check if it's a hex color
        if (bgColor.startsWith('#')) {
            const rgb = hexToRgb(bgColor);
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;
        } else {
            // Try to parse as rgb format
            const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!rgbMatch) {
                console.warn('[CollageService] Invalid color format for updateUIColors:', bgColor);
                return;
            }
            r = parseInt(rgbMatch[1]);
            g = parseInt(rgbMatch[2]);
            b = parseInt(rgbMatch[3]);
        }
        
        const [h, s, l] = rgbToHsl(r, g, b);
        
        const complementaryH = (h + 180) % 360;
        
        // Adjust lightness for better contrast
        let textL;
        if (l > 50) {
            // Light background - use dark text
            textL = Math.max(l - 60, 10);
        } else {
            // Dark background - use light text
            textL = Math.min(l + 60, 90);
        }
        
        const complementaryColor = `hsl(${complementaryH}, ${Math.min(s + 20, 100)}%, ${textL}%)`;
        
        // Convert bgColor to CSS format if it was hex
        const cssBgColor = bgColor.startsWith('#') ? bgColor : bgColor;
        
        document.documentElement.style.setProperty('--background-color', cssBgColor);
        document.documentElement.style.setProperty('--text-color', complementaryColor);
        document.documentElement.style.setProperty('--button-border-color', complementaryColor);
        document.documentElement.style.setProperty('--button-hover-bg', complementaryColor);
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
        if (this.images.length === 0 && !this.isLoadingImages) {
            console.log('[CollageService] Images not loaded. Attempting to load images before rendering template...');
            await this.loadImages();
            if (this.images.length === 0) {
                console.warn('Cannot draw template: images still not available after load attempt.');
                return;
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot draw template: images are currently loading. Try again shortly.');
            return;
        }
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
} 