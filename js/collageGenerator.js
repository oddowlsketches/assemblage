/**
 * Collage Generator
 * 
 * Generates collages from a set of images with various layout options.
 */

import { maskImplementations } from './maskImplementations.js';

class CollageGenerator {
    constructor(options = {}) {
        this.options = {
            width: options.width || 800,
            height: options.height || 600,
            padding: options.padding || 10,
            backgroundColor: options.backgroundColor || '#ffffff',
            ...options
        };
    }

    generate(fragments) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = this.options.width;
        canvas.height = this.options.height;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = this.options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw each fragment
        fragments.forEach(fragment => {
            this.drawFragment(ctx, fragment);
        });

        return canvas;
    }

    drawFragment(ctx, fragment) {
        const { x, y, width, height, image, rotation = 0, opacity = 1, mask } = fragment;

        // Save context state
        ctx.save();

        // Apply transformations
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-(x + width / 2), -(y + height / 2));

        // Set opacity
        ctx.globalAlpha = opacity;

        // Create clipping path if mask is enabled
        if (mask && mask.enabled && mask.implementation) {
            ctx.beginPath();
            mask.implementation(ctx, x, y, width, height);
            ctx.clip();
        }

        // Draw image
        this.drawImage(ctx, image, x, y, width, height);

        // Restore context state
        ctx.restore();
    }

    drawImage(ctx, image, x, y, width, height) {
        // Calculate aspect ratio preserving dimensions
        const imageRatio = image.width / image.height;
        const targetRatio = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;

        if (imageRatio > targetRatio) {
            // Image is wider than target
            drawWidth = height * imageRatio;
            drawX = x + (width - drawWidth) / 2;
        } else {
            // Image is taller than target
            drawHeight = width / imageRatio;
            drawY = y + (height - drawHeight) / 2;
        }

        // Draw the image
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }
}

// Export the class
export default CollageGenerator; 