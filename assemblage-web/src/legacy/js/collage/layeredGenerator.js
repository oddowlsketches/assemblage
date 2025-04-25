class LayeredGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    generateBackgroundColor() {
        // Generate a light, muted background color using HSL
        const hue = Math.random() * 360;
        const saturation = 20 + Math.random() * 30; // 20-50%
        const lightness = 85 + Math.random() * 10; // 85-95%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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

    generateLayers(images, parameters = {}) {
        if (!images || images.length === 0) {
            console.warn('No images provided for layered effect');
            return [];
        }

        console.log(`Generating layered effect with ${images.length} images`);

        // Set background color
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Determine number of layers based on complexity
        const complexity = parameters.complexity || 0.5;
        const numLayers = Math.floor(2 + complexity * 3); // 2-5 layers based on complexity
        console.log(`Creating ${numLayers} layers`);

        // Create layers with random images, scales, and positions
        const layers = [];
        const MAX_ATTEMPTS = 5; // Maximum number of attempts to find a suitable image
        
        for (let i = 0; i < numLayers; i++) {
            let suitableImage = null;
            let attempts = 0;
            
            while (!suitableImage && attempts < MAX_ATTEMPTS) {
                const randomImage = images[Math.floor(Math.random() * images.length)];
                
                if (!randomImage || !randomImage.complete || randomImage.naturalWidth === 0) {
                    attempts++;
                    continue;
                }
                
                // Calculate required scale for this image
                const requiredScale = this.calculateRequiredScale(
                    randomImage,
                    this.canvas.width,
                    this.canvas.height
                );
                
                // Check if this scale is within our acceptable range (0.7 to 1.2)
                if (requiredScale <= 1.2) {
                    suitableImage = randomImage;
                } else {
                    attempts++;
                }
            }
            
            if (!suitableImage) {
                console.warn(`Could not find suitable image after ${MAX_ATTEMPTS} attempts`);
                continue;
            }
            
            // Calculate layer size based on depth
            const size = this.calculateLayerSize(i, numLayers);
            
            // Calculate position with margin for bleeding effect
            const margin = this.canvas.width * 0.1; // 10% margin
            const x = Math.random() * margin * 2 - margin;
            const y = Math.random() * margin * 2 - margin;
            
            // Calculate rotation (more rotation for deeper layers)
            const rotation = this.calculateRotation(i, numLayers);
            
            // Calculate opacity (deeper layers are more transparent)
            const opacity = this.calculateOpacity(i, numLayers);
            
            // Select blend mode based on layer depth
            const blendMode = this.selectBlendMode(i, numLayers);
            
            layers.push({
                image: suitableImage,
                size: size,
                x: x,
                y: y,
                rotation: rotation,
                opacity: opacity,
                blendMode: blendMode
            });
        }

        // Sort layers by size (smaller scales drawn first)
        layers.sort((a, b) => a.size - b.size);

        // Draw layers
        layers.forEach(layer => {
            this.drawLayer(layer);
        });

        return layers;
    }
    
    calculateLayerSize(layerIndex, totalLayers) {
        // Base size decreases with layer depth
        const baseSize = 0.7 + (1 - layerIndex / totalLayers) * 0.5;
        // Add some randomness
        return baseSize + (Math.random() - 0.5) * 0.2;
    }
    
    calculateRotation(layerIndex, totalLayers) {
        // Deeper layers have more rotation
        const maxRotation = 15 * (layerIndex / totalLayers);
        return (Math.random() - 0.5) * maxRotation * 2;
    }
    
    calculateOpacity(layerIndex, totalLayers) {
        // First layer is fully opaque, others decrease in opacity
        return layerIndex === 0 ? 1.0 : 0.3 + (1 - layerIndex / totalLayers) * 0.4;
    }
    
    selectBlendMode(layerIndex, totalLayers) {
        const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'];
        // Deeper layers use more interesting blend modes
        const index = Math.min(Math.floor(layerIndex / 2), blendModes.length - 1);
        return blendModes[index];
    }
    
    drawLayer(layer) {
        const { image, size, x, y, rotation, opacity, blendMode } = layer;
        
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = image.width / image.height;
        let width = this.canvas.width * size;
        let height = width / aspectRatio;
        
        // Ensure minimum visibility of 70%
        if (height < this.canvas.height * 0.7) {
            height = this.canvas.height * 0.7;
            width = height * aspectRatio;
        }
        
        // Set opacity and blend mode
        this.ctx.globalAlpha = opacity;
        this.ctx.globalCompositeOperation = blendMode;
        
        // Save context state
        this.ctx.save();
        
        // Translate to center of image position
        this.ctx.translate(x + width/2, y + height/2);
        
        // Rotate
        this.ctx.rotate(rotation * Math.PI / 180);
        
        // Draw the image
        this.ctx.drawImage(image, -width/2, -height/2, width, height);
        
        // Restore context state
        this.ctx.restore();
        
        // Reset blend mode
        this.ctx.globalCompositeOperation = 'source-over';
    }
}

export { LayeredGenerator }; 