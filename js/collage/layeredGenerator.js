export class LayeredGenerator {
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

    async generateLayers(images, fortuneText, parameters = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided for layered generation');
            return [];
        }

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0);
        if (validImages.length === 0) {
            console.warn('No valid images found for layered generation');
            return [];
        }

        // Calculate number of layers based on complexity and available images
        const complexity = parameters.complexity || 0.5;
        const numLayers = Math.min(
            Math.max(3, Math.floor(validImages.length * complexity)),
            parameters.maxLayers || 6
        );

        const layers = [];
        const margin = 20; // Minimum margin from canvas edges

        for (let i = 0; i < numLayers; i++) {
            // Select image
            const image = validImages[i % validImages.length];
            
            // Calculate layer dimensions based on variation
            let layerWidth, layerHeight;
            if (parameters.variation === 'Organic') {
                const size = this.calculateOrganicSize();
                layerWidth = size.width;
                layerHeight = size.height;
            } else if (parameters.variation === 'Focal') {
                const size = this.calculateFocalSize();
                layerWidth = size.width;
                layerHeight = size.height;
            } else {
                const size = this.calculateClassicSize();
                layerWidth = size.width;
                layerHeight = size.height;
            }

            // Calculate position with margin and overlap consideration
            const maxX = this.canvas.width - layerWidth - margin;
            const maxY = this.canvas.height - layerHeight - margin;
            const x = margin + Math.random() * maxX;
            const y = margin + Math.random() * maxY;

            // Create layer with calculated position
            const layer = {
                image: image,
                x: x,
                y: y,
                width: layerWidth,
                height: layerHeight,
                rotation: Math.random() < 0.8 ? Math.random() * 0.3 : Math.random() * 0.1, // More controlled rotation
                depth: Math.random(),
                opacity: 0.4 + Math.random() * 0.6,
                blendMode: this.selectBlendMode(i)
            };
            layers.push(layer);
        }

        // Sort layers by depth for proper layering
        layers.sort((a, b) => a.depth - b.depth);

        // Draw layers
        layers.forEach(layer => {
            this.drawLayer(layer);
        });

        return layers;
    }

    selectBlendMode(layerIndex) {
        const blendModes = [
            'normal',
            'multiply',
            'screen',
            'overlay',
            'soft-light',
            'hard-light',
            'color-dodge',
            'color-burn',
            'difference',
            'exclusion'
        ];
        return blendModes[layerIndex % blendModes.length];
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

    drawLayer(layer) {
        this.ctx.save();

        // Set opacity and blend mode
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = layer.blendMode;

        // Apply rotation around layer center
        this.ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        this.ctx.rotate(layer.rotation);
        this.ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));

        // Draw the image
        this.ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);

        this.ctx.restore();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
} 