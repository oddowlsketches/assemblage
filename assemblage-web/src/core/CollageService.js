// CollageService.js
import paper from 'paper';
import { createClient } from '@supabase/supabase-js';
import { IsolatedCrystalGenerator } from '../legacy/js/collage/isolatedCrystalGenerator.js';
import { CollageGenerator } from '../legacy/js/collage/collageGenerator.js';
import { LegacyCollageAdapter } from '../legacy/js/collage/legacyCollageAdapter.js';
import { CrystalEffect } from '../effects/CrystalEffect';
import { ArchitecturalEffect } from '../effects/ArchitecturalEffect';
import maskImplementations from '../legacy/js/collage/maskImplementations.js';
import { getMaskDescriptor, maskRegistry } from '../masks/maskRegistry';
import { TemplateRenderer } from './TemplateRenderer';
import { svgToPath2D } from './svgUtils.js';
import { EventEmitter } from '../utils/EventEmitter';
import { getRandomTemplate } from '../templates/templateManager';
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

    async loadImages() {
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
            const { data: rows, error } = await this.supabaseClient
                .from('images')
                .select('id, src')
                .order('created_at', { ascending: false });

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
        if (!this.images || this.images.length === 0) {
            if (!this.isLoadingImages) {
                console.log('[CollageService] Images not available. Attempting to load...');
                await this.loadImages();
                if (!this.images || this.images.length === 0) {
                    console.warn('Cannot generate collage: images still not available after load attempt.');
                    return;
                }
            } else {
                 console.warn('Cannot generate collage: images are currently loading. Try again shortly.');
                 return;
            }
        }

        const { type, template, params } = getRandomTemplate();
        console.log(`[CollageService] Using template: ${type} with params:`, params);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        template.generate(this.canvas, this.images, params);
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
        
        const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!rgbMatch) return;
        
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        const [h, s, l] = rgbToHsl(r, g, b);
        
        const complementaryH = (h + 180) % 360;
        
        const complementaryColor = `hsl(${complementaryH}, ${Math.min(s + 20, 100)}%, ${Math.max(l - 20, 20)}%)`;
        
        document.documentElement.style.setProperty('--background-color', bgColor);
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
                console.warn('Cannot render template: images still not available after load attempt.');
                return null; 
            }
        } else if (this.isLoadingImages) {
            console.warn('Cannot render template: images are currently loading. Try again shortly.');
            return null;
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