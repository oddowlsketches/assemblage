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
} 