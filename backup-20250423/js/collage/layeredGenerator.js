class LayeredGenerator {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    generateLayers(images, parameters = {}) {
        if (!images || images.length === 0) {
            console.warn('No images provided for layered effect');
            return;
        }

        console.log(`Generating layered effect with ${images.length} images`);

        // Determine number of layers (2-5)
        const numLayers = Math.floor(Math.random() * 4) + 2;
        console.log(`Creating ${numLayers} layers`);

        // Create layers with random images, scales, and positions
        const layers = [];
        for (let i = 0; i < numLayers; i++) {
            const randomImage = images[Math.floor(Math.random() * images.length)];
            const scale = 0.7 + Math.random() * 0.5; // Scale between 0.7 and 1.2

            // Calculate position to ensure at least one layer bleeds off the edges
            const x = Math.random() * this.canvas.width * 1.2 - this.canvas.width * 0.1;
            const y = Math.random() * this.canvas.height * 1.2 - this.canvas.height * 0.1;

            layers.push({
                image: randomImage,
                scale: scale,
                x: x,
                y: y,
                opacity: i === 0 ? 1.0 : 0.3 + Math.random() * 0.4 // First layer full opacity, others 0.3-0.7
            });
        }

        // Sort layers by scale (smaller scales drawn first)
        layers.sort((a, b) => a.scale - b.scale);

        // Draw layers
        layers.forEach(layer => {
            const { image, scale, x, y, opacity } = layer;

            // Calculate dimensions maintaining aspect ratio
            const aspectRatio = image.width / image.height;
            let width = this.canvas.width * scale;
            let height = width / aspectRatio;

            // Ensure minimum visibility of 70%
            if (height < this.canvas.height * 0.7) {
                height = this.canvas.height * 0.7;
                width = height * aspectRatio;
            }

            // Set opacity
            this.ctx.globalAlpha = opacity;

            // Draw the image
            this.ctx.drawImage(image, x, y, width, height);
        });

        // Reset opacity
        this.ctx.globalAlpha = 1.0;

        return layers;
    }
}

export { LayeredGenerator }; 