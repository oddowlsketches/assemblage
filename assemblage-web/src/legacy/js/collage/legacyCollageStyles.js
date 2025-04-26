/**
 * Legacy Collage Styles
 * 
 * This file contains the original implementation of collage styles.
 * It provides the classic mosaic and tiling effects from the previous version.
 */

class LegacyCollageStyles {
    constructor(collageGenerator) {
        this.collageGenerator = collageGenerator;
        this.canvas = collageGenerator.canvas;
        this.ctx = collageGenerator.ctx;
        this.images = collageGenerator.images;
        this.parameters = collageGenerator.parameters;
    }

    /**
     * Generate a mosaic collage
     */
    generateMosaic() {
        const { variation = 'Classic' } = this.parameters;
        const imageCount = this.images.length;
        
        // Calculate grid size based on image count
        const baseGridSize = Math.max(4, Math.floor(Math.sqrt(imageCount)));
        const gridSize = variation === 'Organic' ? 
            baseGridSize + Math.floor(Math.random() * 3) :
            baseGridSize;

        // Calculate cell dimensions
        const cellWidth = this.canvas.width / gridSize;
        const cellHeight = this.canvas.height / gridSize;

        // Create cells with variations
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const imageIndex = (row * gridSize + col) % imageCount;
                const image = this.images[imageIndex];

                // Calculate cell position and size with variations
                let x = col * cellWidth;
                let y = row * cellHeight;
                let width = cellWidth;
                let height = cellHeight;

                if (variation === 'Organic') {
                    // Add randomness for organic feel
                    x += (Math.random() - 0.5) * cellWidth * 0.2;
                    y += (Math.random() - 0.5) * cellHeight * 0.2;
                    width *= 0.8 + Math.random() * 0.4;
                    height *= 0.8 + Math.random() * 0.4;
                } else if (variation === 'Focal') {
                    // Larger cells towards center
                    const centerX = gridSize / 2;
                    const centerY = gridSize / 2;
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2)
                    );
                    const scale = 1 - (distanceFromCenter / (gridSize / 2)) * 0.3;
                    width *= scale;
                    height *= scale;
                }

                // Calculate opacity based on variation
                let opacity = 1;
                if (variation === 'Classic') {
                    opacity = 0.8 + Math.random() * 0.2;
                } else if (variation === 'Organic') {
                    opacity = 0.7 + Math.random() * 0.3;
                } else if (variation === 'Focal') {
                    const centerX = gridSize / 2;
                    const centerY = gridSize / 2;
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2)
                    );
                    opacity = 0.8 + (1 - distanceFromCenter / (gridSize / 2)) * 0.2;
                }

                // Use the main CollageGenerator's drawImage method with cropping
                this.collageGenerator.drawImage(image, x, y, width, height, true, opacity);
            }
        }
    }

    /**
     * Generate a tiling collage
     */
    generateTiling() {
        const { variation = 'Classic' } = this.parameters;
        const imageCount = this.images.length;

        // Style-specific parameters
        const styleParams = {
            Focal: {
                dramaticTileScale: 1.5,
                dramaticTileOpacity: 1,
                surroundingTileOpacity: 0.7
            },
            Field: {
                minScale: 0.8,
                maxScale: 1.2,
                baseOpacity: 0.8
            }
        };

        if (variation === 'Focal') {
            // Create a dramatic center tile
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const dramaticImage = this.images[0];
            const dramaticSize = Math.min(this.canvas.width, this.canvas.height) * 
                styleParams.Focal.dramaticTileScale;

            this.collageGenerator.drawImage(
                dramaticImage,
                centerX - dramaticSize / 2,
                centerY - dramaticSize / 2,
                dramaticSize,
                dramaticSize,
                true,
                styleParams.Focal.dramaticTileOpacity
            );

            // Add surrounding tiles
            for (let i = 1; i < imageCount; i++) {
                const image = this.images[i];
                const size = dramaticSize * 0.6;
                const angle = (i / imageCount) * Math.PI * 2;
                const distance = dramaticSize * 0.8;

                const x = centerX + Math.cos(angle) * distance - size / 2;
                const y = centerY + Math.sin(angle) * distance - size / 2;

                this.collageGenerator.drawImage(
                    image,
                    x,
                    y,
                    size,
                    size,
                    true,
                    styleParams.Focal.surroundingTileOpacity
                );
            }
        } else {
            // Field variation - distribute tiles across canvas
            const gridSize = Math.ceil(Math.sqrt(imageCount));
            const cellWidth = this.canvas.width / gridSize;
            const cellHeight = this.canvas.height / gridSize;

            for (let i = 0; i < imageCount; i++) {
                const image = this.images[i];
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;

                const scale = styleParams.Field.minScale + 
                    Math.random() * (styleParams.Field.maxScale - styleParams.Field.minScale);
                const size = Math.min(cellWidth, cellHeight) * scale;

                const x = col * cellWidth + (cellWidth - size) / 2;
                const y = row * cellHeight + (cellHeight - size) / 2;

                this.collageGenerator.drawImage(
                    image,
                    x,
                    y,
                    size,
                    size,
                    true,
                    styleParams.Field.baseOpacity
                );
            }
        }
    }
}

export default LegacyCollageStyles; 