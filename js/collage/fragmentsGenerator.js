/**
 * Fragments Generator for Assemblage
 * Handles fragments-specific collage generation with enhanced parameters
 */

export class FragmentsGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.parameters = {};
        
        // Set default canvas dimensions if not provided
        if (!this.canvas) {
            this.canvas = {
                width: 1200,
                height: 800
            };
        }
        
        // Ensure canvas has dimensions
        if (!this.canvas.width || !this.canvas.height) {
            this.canvas.width = 1200;
            this.canvas.height = 800;
        }
    }

    generateBackgroundColor() {
        // Use the same background color set as the original app
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    calculateRequiredScale(image, targetWidth, targetHeight, minVisibility = 0.7) {
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
        
        // Account for minimum visibility requirement
        const minScale = Math.max(
            minVisibility / imgRatio,
            minVisibility * imgRatio
        );
        
        return Math.max(scale, minScale);
    }

    async generateFragments(images, fortuneText, parameters = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided for fragments generation');
            return [];
        }

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
        if (validImages.length === 0) {
            console.warn('No valid images found for fragments generation');
            return [];
        }

        // Calculate number of fragments based on complexity and available images
        const complexity = parameters.complexity || 0.5;
        const numFragments = Math.min(
            Math.max(4, Math.floor(validImages.length * complexity)),
            parameters.maxFragments || 8
        );

        const fragments = [];
        const margin = 20; // Minimum margin from canvas edges

        for (let i = 0; i < numFragments; i++) {
            // Select image
            const image = validImages[i % validImages.length];
            
            // Calculate fragment dimensions based on variation
            let fragmentWidth, fragmentHeight;
            if (parameters.variation === 'Organic') {
                const size = this.calculateOrganicSize();
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else if (parameters.variation === 'Focal') {
                const size = this.calculateFocalSize();
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else {
                const size = this.calculateClassicSize();
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            }

            // Calculate position with margin and overlap consideration
            const maxX = this.canvas.width - fragmentWidth - margin;
            const maxY = this.canvas.height - fragmentHeight - margin;
            const x = margin + Math.random() * maxX;
            const y = margin + Math.random() * maxY;

            // Create fragment with calculated position
            const fragment = {
                image: image,
                x: x,
                y: y,
                width: fragmentWidth,
                height: fragmentHeight,
                rotation: Math.random() < 0.8 ? Math.random() * 0.3 : Math.random() * 0.1, // More controlled rotation
                depth: Math.random(),
                mask: this.generateMask()
            };
            fragments.push(fragment);
        }

        // Sort fragments by depth for proper layering
        fragments.sort((a, b) => a.depth - b.depth);

        // Draw fragments
        fragments.forEach(fragment => {
            this.drawFragment(fragment);
        });

        return fragments;
    }

    generateMask() {
        // Increased probability of masks and more mask types
        const maskEnabled = Math.random() < 0.6; // 60% chance of having a mask
        if (!maskEnabled) return { enabled: false };

        const maskTypes = [
            'circle',
            'ellipse',
            'rectangle',
            'triangle',
            'diamond',
            'hexagon',
            'organic',
            'wave',
            'spiral',
            'custom'
        ];

        return {
            enabled: true,
            type: maskTypes[Math.floor(Math.random() * maskTypes.length)],
            opacity: 0.7 + Math.random() * 0.3 // Higher base opacity
        };
    }

    calculateOrganicSize() {
        const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        return {
            width: baseSize * (0.8 + Math.random() * 0.4),
            height: baseSize * (0.8 + Math.random() * 0.4)
        };
    }

    calculateFocalSize() {
        const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.6;
        return {
            width: baseSize * (0.9 + Math.random() * 0.2),
            height: baseSize * (0.9 + Math.random() * 0.2)
        };
    }

    calculateClassicSize() {
        const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.5;
        return {
            width: baseSize * (0.7 + Math.random() * 0.6),
            height: baseSize * (0.7 + Math.random() * 0.6)
        };
    }

    drawFragment(fragment) {
        this.ctx.save();

        // Set opacity based on depth
        this.ctx.globalAlpha = 0.4 + fragment.depth * 0.6;

        // Apply rotation around fragment center
        this.ctx.translate(fragment.x + fragment.width / 2, fragment.y + fragment.height / 2);
        this.ctx.rotate(fragment.rotation);
        this.ctx.translate(-(fragment.x + fragment.width / 2), -(fragment.y + fragment.height / 2));

        // Apply mask if enabled
        if (fragment.mask && fragment.mask.enabled) {
            this.ctx.beginPath();
            
            switch (fragment.mask.type) {
                case 'circle':
                    this.drawCircleMask(fragment);
                    break;
                case 'ellipse':
                    this.drawEllipseMask(fragment);
                    break;
                case 'rectangle':
                    this.drawRectangleMask(fragment);
                    break;
                case 'triangle':
                    this.drawTriangleMask(fragment);
                    break;
                case 'diamond':
                    this.drawDiamondMask(fragment);
                    break;
                case 'hexagon':
                    this.drawHexagonMask(fragment);
                    break;
                case 'organic':
                    this.drawOrganicMask(fragment);
                    break;
                case 'wave':
                    this.drawWaveMask(fragment);
                    break;
                case 'spiral':
                    this.drawSpiralMask(fragment);
                    break;
                case 'custom':
                    this.drawCustomMask(fragment);
                    break;
            }
            
            this.ctx.clip();
        }

        // Draw the image
        this.ctx.drawImage(fragment.image, fragment.x, fragment.y, fragment.width, fragment.height);

        this.ctx.restore();
    }

    // Mask drawing methods
    drawCircleMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        const radius = Math.min(fragment.width, fragment.height) / 2;
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }

    drawEllipseMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        this.ctx.ellipse(centerX, centerY, fragment.width / 2, fragment.height / 2, 0, 0, Math.PI * 2);
    }

    drawRectangleMask(fragment) {
        const radius = Math.min(fragment.width, fragment.height) * 0.1;
        this.ctx.roundRect(fragment.x, fragment.y, fragment.width, fragment.height, radius);
    }

    drawTriangleMask(fragment) {
        this.ctx.moveTo(fragment.x + fragment.width / 2, fragment.y);
        this.ctx.lineTo(fragment.x + fragment.width, fragment.y + fragment.height);
        this.ctx.lineTo(fragment.x, fragment.y + fragment.height);
        this.ctx.closePath();
    }

    drawDiamondMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        this.ctx.moveTo(centerX, fragment.y);
        this.ctx.lineTo(fragment.x + fragment.width, centerY);
        this.ctx.lineTo(centerX, fragment.y + fragment.height);
        this.ctx.lineTo(fragment.x, centerY);
        this.ctx.closePath();
    }

    drawHexagonMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        const radius = Math.min(fragment.width, fragment.height) / 2;
        this.ctx.moveTo(centerX + radius, centerY);
        for (let i = 1; i <= 6; i++) {
            const angle = (i * Math.PI) / 3;
            this.ctx.lineTo(
                centerX + radius * Math.cos(angle),
                centerY + radius * Math.sin(angle)
            );
        }
        this.ctx.closePath();
    }

    drawOrganicMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        const points = 8;
        const radius = Math.min(fragment.width, fragment.height) / 2;
        
        this.ctx.moveTo(centerX + radius, centerY);
        for (let i = 1; i <= points; i++) {
            const angle = (i * 2 * Math.PI) / points;
            const r = radius * (0.8 + Math.random() * 0.4);
            this.ctx.lineTo(
                centerX + r * Math.cos(angle),
                centerY + r * Math.sin(angle)
            );
        }
        this.ctx.closePath();
    }

    drawWaveMask(fragment) {
        const amplitude = fragment.height * 0.1;
        const frequency = Math.PI * 2 / fragment.width;
        
        this.ctx.moveTo(fragment.x, fragment.y);
        for (let x = 0; x <= fragment.width; x += 5) {
            const y = fragment.y + amplitude * Math.sin(frequency * x);
            this.ctx.lineTo(fragment.x + x, y);
        }
        this.ctx.lineTo(fragment.x + fragment.width, fragment.y + fragment.height);
        this.ctx.lineTo(fragment.x, fragment.y + fragment.height);
        this.ctx.closePath();
    }

    drawSpiralMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        const radius = Math.min(fragment.width, fragment.height) / 2;
        
        this.ctx.moveTo(centerX, centerY);
        for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
            const r = (radius * angle) / (Math.PI * 4);
            this.ctx.lineTo(
                centerX + r * Math.cos(angle),
                centerY + r * Math.sin(angle)
            );
        }
    }

    drawCustomMask(fragment) {
        const centerX = fragment.x + fragment.width / 2;
        const centerY = fragment.y + fragment.height / 2;
        const points = 5 + Math.floor(Math.random() * 4);
        const radius = Math.min(fragment.width, fragment.height) / 2;
        
        this.ctx.moveTo(centerX + radius, centerY);
        for (let i = 1; i <= points; i++) {
            const angle = (i * 2 * Math.PI) / points;
            const r1 = radius * (0.5 + Math.random() * 0.5);
            const r2 = radius * (0.3 + Math.random() * 0.3);
            
            const angle1 = angle - (Math.PI / points);
            const angle2 = angle;
            
            this.ctx.quadraticCurveTo(
                centerX + r1 * Math.cos(angle1),
                centerY + r1 * Math.sin(angle1),
                centerX + r2 * Math.cos(angle2),
                centerY + r2 * Math.sin(angle2)
            );
        }
        this.ctx.closePath();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
} 