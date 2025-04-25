/**
 * Enhanced Fragments Generator for Assemblage
 * Extends the legacy fragments generator with improved validation and scaling
 */

import { FragmentsGenerator } from '@legacy/collage/fragmentsGenerator.js';

export class EnhancedFragmentsGenerator extends FragmentsGenerator {
    constructor(canvas, parameters = {}) {
        super(canvas, parameters);
        this.parameters = parameters;
    }

    generate(images, fortuneText) {
        // First validate and filter images
        const validImages = this.validateAndFilterImages(images);
        
        if (!validImages || validImages.length === 0) {
            console.warn('No valid images found for fragments generation');
            return null;
        }

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate number of fragments based on complexity
        const complexity = this.parameters.complexity || 0.5;
        const numFragments = Math.max(3, Math.floor(validImages.length * complexity * 0.7));
        
        // Generate fragments
        const fragments = [];
        for (let i = 0; i < numFragments; i++) {
            const image = validImages[i % validImages.length];
            
            // Calculate fragment dimensions based on variation
            let fragmentWidth, fragmentHeight;
            if (this.parameters.variation === 'Organic') {
                const size = this.calculateOrganicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else if (this.parameters.variation === 'Focal') {
                const size = this.calculateFocalSize(this.canvas.width, this.canvas.height, this.canvas.width/2, this.canvas.height/2);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else {
                const size = this.calculateClassicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            }

            // Calculate position
            const x = Math.random() * (this.canvas.width - fragmentWidth);
            const y = Math.random() * (this.canvas.height - fragmentHeight);

            // Create fragment
            fragments.push({
                image,
                x,
                y,
                width: fragmentWidth,
                height: fragmentHeight,
                rotation: Math.random() < 0.7 ? 0 : Math.random() * 0.2,
                depth: Math.random()
            });
        }

        // Sort fragments by depth
        fragments.sort((a, b) => a.depth - b.depth);

        // Draw fragments
        fragments.forEach(fragment => {
            this.drawFragment(fragment, this.ctx);
        });

        return fragments;
    }

    validateAndFilterImages(images) {
        if (!images || images.length === 0) {
            console.warn('No images provided for fragments generation');
            return [];
        }

        const validImages = [];
        const MIN_WIDTH = 100;
        const MIN_HEIGHT = 100;
        const MAX_SCALE = 2.0;

        for (const image of images) {
            if (!image || !image.complete || image.naturalWidth === 0) {
                console.warn('Invalid or incomplete image:', image);
                continue;
            }

            // Calculate required scale to fit the image
            const scale = Math.max(
                MIN_WIDTH / image.naturalWidth,
                MIN_HEIGHT / image.naturalHeight
            );

            if (scale <= MAX_SCALE) {
                validImages.push(image);
            } else {
                console.debug('Image dimensions not suitable:', {
                    original: {
                        width: image.naturalWidth,
                        height: image.naturalHeight
                    },
                    scaled: {
                        width: image.naturalWidth * scale,
                        height: image.naturalHeight * scale
                    },
                    limits: {
                        minWidth: MIN_WIDTH,
                        minHeight: MIN_HEIGHT,
                        maxScale: MAX_SCALE
                    }
                });
            }
        }

        return validImages;
    }

    drawFragment(fragment, ctx) {
        const { image, x, y, width, height, rotation } = fragment;
        
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(rotation);
        
        // Calculate source dimensions to maintain aspect ratio
        const imgRatio = image.naturalWidth / image.naturalHeight;
        const destRatio = width / height;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;
        
        if (imgRatio > destRatio) {
            // Image is wider than destination
            sourceWidth = image.naturalHeight * destRatio;
            sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
            // Image is taller than destination
            sourceHeight = image.naturalWidth / destRatio;
            sourceY = (image.naturalHeight - sourceHeight) / 2;
        }
        
        ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            -width/2, -height/2, width, height
        );
        
        ctx.restore();
    }

    calculateRequiredScale(image, targetWidth, targetHeight, minVisibility = 0.7) {
        // Enhanced scale calculation with better aspect ratio handling
        const imgRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let scale;
        if (imgRatio > targetRatio) {
            // Image is wider than target
            scale = targetHeight / image.naturalHeight;
        } else {
            // Image is taller than target
            scale = targetWidth / image.naturalWidth;
        }
        
        // Account for minimum visibility requirement with aspect ratio consideration
        const minScale = Math.max(
            minVisibility / Math.max(imgRatio, 1),
            minVisibility * Math.min(imgRatio, 1)
        );
        
        return Math.max(scale, minScale);
    }
} 