/**
 * Narrative Composition Manager for Assemblage
 * Manages the narrative flow and composition of collage elements
 */

export class NarrativeCompositionManager {
    constructor(parameters = {}) {
        this.parameters = {
            ...parameters,
            canvasWidth: parameters.canvasWidth || window.innerWidth,
            canvasHeight: parameters.canvasHeight || window.innerHeight
        };
    }

    adjustOpacity(fragment, progress, depthOpacity = false) {
        fragment.opacity = 0.85 + (Math.sin(progress * Math.PI) * 0.15); // Higher base opacity

        if (depthOpacity) {
            const minOpacity = 0.5; // Increased from 0.3
            const maxOpacity = 1.0;
            fragment.opacity = minOpacity + ((maxOpacity - minOpacity) * (1 - fragment.depth));
        }
    }

    createHexagonMask(element) {
        const width = element.width;
        const height = element.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2;
        
        // Calculate vertices for a regular hexagon
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 6; // Start from flat top
            vertices.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        // Create the mask path
        const path = new Path2D();
        path.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            path.lineTo(vertices[i].x, vertices[i].y);
        }
        path.closePath();
        
        // Store mask parameters for later use
        element.maskParams = {
            type: 'hexagon',
            vertices: vertices,
            centerX: centerX,
            centerY: centerY,
            radius: radius
        };
        
        return path;
    }

    createArcMask(element) {
        const width = element.width;
        const height = element.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Calculate arc parameters
        const arcRadius = Math.min(width, height) / 2;
        const arcWidth = Math.max(30, arcRadius * 0.2); // Ensure minimum width of 30px
        
        // Create the mask path
        const path = new Path2D();
        
        // Draw a single arc path
        path.arc(centerX, centerY, arcRadius, 0, Math.PI * 2);
        
        // Create a clipping region
        const clipPath = new Path2D();
        clipPath.rect(0, 0, width, height);
        
        // Store mask parameters for later use
        element.maskParams = {
            type: 'arc',
            centerX: centerX,
            centerY: centerY,
            radius: arcRadius,
            width: arcWidth
        };
        
        return {
            path: path,
            clipPath: clipPath
        };
    }

    async generate(images, fortuneText, effect, parameters = {}) {
        // Clear canvas and set background
        const ctx = this.parameters.ctx;
        const canvas = this.parameters.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate layered composition
        const fragments = [];
        const numLayers = Math.min(images.length, 4); // Use up to 4 layers
        
        for (let i = 0; i < numLayers; i++) {
            const image = images[i];
            if (!image || !image.complete) continue;
            
            // Calculate layer dimensions
            const scale = 0.8 + (i * 0.1); // Each layer slightly larger
            const width = canvas.width * scale;
            const height = canvas.height * scale;
            
            // Center the layer
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            // Create fragment with mask
            const fragment = {
                image,
                x,
                y,
                width,
                height,
                depth: i / numLayers,
                opacity: 0.7 + (i * 0.1)
            };
            
            // Apply mask based on layer
            if (i % 2 === 0) {
                fragment.mask = this.createHexagonMask(fragment);
            } else {
                fragment.mask = this.createArcMask(fragment);
            }
            
            fragments.push(fragment);
        }
        
        // Draw fragments
        fragments.forEach(fragment => {
            ctx.save();
            ctx.globalAlpha = fragment.opacity;
            
            if (fragment.mask) {
                if (fragment.mask.path && fragment.mask.clipPath) {
                    ctx.clip(fragment.mask.clipPath);
                    ctx.drawImage(fragment.image, fragment.x, fragment.y, fragment.width, fragment.height);
                } else {
                    ctx.clip(fragment.mask);
                    ctx.drawImage(fragment.image, fragment.x, fragment.y, fragment.width, fragment.height);
                }
            } else {
                ctx.drawImage(fragment.image, fragment.x, fragment.y, fragment.width, fragment.height);
            }
            
            ctx.restore();
        });
        
        return fragments;
    }
} 