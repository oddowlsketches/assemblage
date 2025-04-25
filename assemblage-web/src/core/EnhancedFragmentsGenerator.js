/**
 * Enhanced Fragments Generator for Assemblage
 * Extends the legacy fragments generator with improved validation and scaling
 */

import { FragmentsGenerator } from '../../legacy/js/collage/fragmentsGenerator.js';

export class EnhancedFragmentsGenerator extends FragmentsGenerator {
    constructor(ctx, canvas) {
        super(ctx, canvas);
    }

    async generate(images, fortuneText, effect, parameters = {}) {
        // Validate and filter images
        const validImages = this.validateAndFilterImages(images, parameters);
        if (validImages.length === 0) {
            console.error('No valid images found after validation');
            return [];
        }

        // Generate fragments with the validated images
        return super.generate(validImages, fortuneText, effect, parameters);
    }

    validateAndFilterImages(images, parameters) {
        return images.filter(image => {
            // Basic image validation
            if (!image || !image.complete || image.naturalWidth === 0) {
                console.warn('Skipping invalid image:', image);
                return false;
            }

            // Calculate maximum allowed dimensions based on canvas size
            const maxWidth = this.canvas.width * 0.5;  // Max 50% of canvas width
            const maxHeight = this.canvas.height * 0.5; // Max 50% of canvas height

            // Check if image dimensions are within acceptable range
            const imageRatio = image.naturalWidth / image.naturalHeight;
            const canvasRatio = this.canvas.width / this.canvas.height;

            // Calculate scaling factors
            let scaleX = maxWidth / image.naturalWidth;
            let scaleY = maxHeight / image.naturalHeight;
            let scale = Math.min(scaleX, scaleY);

            // Additional checks based on variation
            if (parameters.variation === 'Focal') {
                // Focal variation allows slightly larger images
                scale *= 1.2;
            } else if (parameters.variation === 'Organic') {
                // Organic variation prefers more varied sizes
                scale *= 0.8 + Math.random() * 0.4; // 0.8-1.2 range
            }

            // Final validation
            const finalWidth = image.naturalWidth * scale;
            const finalHeight = image.naturalHeight * scale;

            // Check if the scaled dimensions are acceptable
            const minDimension = Math.min(this.canvas.width, this.canvas.height) * 0.1;
            const isAcceptableSize = 
                finalWidth >= minDimension &&
                finalHeight >= minDimension &&
                finalWidth <= maxWidth &&
                finalHeight <= maxHeight;

            if (!isAcceptableSize) {
                console.warn('Image dimensions not suitable:', {
                    original: { width: image.naturalWidth, height: image.naturalHeight },
                    scaled: { width: finalWidth, height: finalHeight },
                    limits: { min: minDimension, maxWidth, maxHeight }
                });
            }

            return isAcceptableSize;
        });
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