/**
 * Sliced Collage Generator for Assemblage
 * Handles sliced-specific collage generation with enhanced parameters
 */

export class SlicedCollageGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        
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
        // Array of vibrant background colors
        const colors = [
            '#FF6B6B', // Coral Red
            '#4ECDC4', // Turquoise
            '#45B7D1', // Sky Blue
            '#96CEB4', // Sage Green
            '#FFEEAD', // Cream
            '#D4A5A5', // Dusty Rose
            '#9B59B6', // Purple
            '#3498DB', // Blue
            '#E67E22', // Orange
            '#2ECC71'  // Green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Calculate required scale for an image based on target dimensions
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

    async generateSliced(images, fortuneText, parameters = {}) {
        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);

        if (validImages.length === 0) {
            console.warn('No valid images provided for sliced generation');
            return [];
        }

        // Determine slice behavior
        const sliceBehavior = parameters.sliceBehavior || 'single-image';
        let selectedImage = null;
        let secondImage = null;
        
        console.log('Slice behavior:', sliceBehavior);
        
        // Calculate number of slices based on behavior
        let numSlices;
        if (sliceBehavior === 'single-image') {
            // For single image, use 5-50 slices
            numSlices = Math.min(
                Math.max(5, Math.floor(Math.random() * 46) + 5),
                parameters.maxSlices || 50
            );
            console.log('Single image behavior: using', numSlices, 'slices');
        } else {
            // For alternating images, use 7-50 slices
            numSlices = Math.min(
                Math.max(7, Math.floor(Math.random() * 44) + 7),
                parameters.maxSlices || 50
            );
            console.log('Alternating behavior: using', numSlices, 'slices');
        }
        
        // Calculate base strip dimensions
        const baseStripWidth = this.canvas.width / numSlices;
        const baseStripHeight = this.canvas.height;
        
        // Filter images based on scaling requirements
        const filteredImages = [];
        const MAX_ATTEMPTS = 5;
        
        for (const image of validImages) {
            // Calculate required scale for this image
            const requiredScale = this.calculateRequiredScale(
                image,
                baseStripWidth,
                baseStripHeight
            );
            
            // Check if this scale is within our acceptable range
            const maxAllowedScale = 2.0; // Maximum allowed scale for sliced effect
            if (requiredScale <= maxAllowedScale) {
                filteredImages.push(image);
            }
        }
        
        if (filteredImages.length === 0) {
            console.warn('No images found that meet scaling requirements, using all valid images');
            // If no images meet the scaling requirements, use all valid images
            filteredImages.push(...validImages);
        }
        
        // Select images based on slice behavior
        if (sliceBehavior === 'single-image' && filteredImages.length > 0) {
            // Select a single image to use for all slices
            selectedImage = filteredImages[Math.floor(Math.random() * filteredImages.length)];
            console.log('Using single image for all slices:', selectedImage.src);
        } else if (sliceBehavior === 'alternating' && filteredImages.length >= 2) {
            // Select two images to alternate between
            const randomIndex = Math.floor(Math.random() * filteredImages.length);
            selectedImage = filteredImages[randomIndex];
            secondImage = filteredImages[(randomIndex + 1) % filteredImages.length];
            console.log('Using alternating images for slices:', selectedImage.src, secondImage.src);
        } else {
            console.log('Using random images for slices');
        }
        
        // Create the sliced effect
        const slices = this.createSlicedEffect(numSlices, filteredImages, selectedImage, secondImage, parameters);
        
        // Draw the slices
        this.drawSlices(slices);
        
        return slices;
    }
    
    // Create a sliced effect with evenly divided strips
    createSlicedEffect(numberOfSlices, images, selectedImage, secondImage, parameters) {
        const slices = [];
        const baseStripWidth = this.canvas.width / numberOfSlices;
        const baseStripHeight = this.canvas.height;
        
        // Calculate width variation
        const variation = parameters.sliceWidthVariation || 0.1;
        
        // Create slices with minimal variation to ensure even distribution
        let currentPosition = 0;
        
        // For random behavior, create a shuffled array of images to ensure uniqueness
        let shuffledImages = [];
        if (!selectedImage) {
            // Create a copy of the images array and shuffle it
            shuffledImages = [...images];
            this.shuffleArray(shuffledImages);
            
            // If we have fewer images than slices, we'll need to reuse some
            if (shuffledImages.length < numberOfSlices) {
                // Fill the array with repeated images to match the number of slices
                while (shuffledImages.length < numberOfSlices) {
                    shuffledImages.push(...this.shuffleArray([...images]));
                }
            }
        }
        
        for (let i = 0; i < numberOfSlices; i++) {
            // Use larger variation for single-image slices to make them more distinct
            const widthVariation = selectedImage && !secondImage ? 0.2 : 0.1;
            const stripWidth = baseStripWidth * (1 + (Math.random() * widthVariation - widthVariation/2));
            
            // Determine which image to use for this slice
            let imageToUse;
            if (selectedImage) {
                // For single-image or alternating behavior
                if (secondImage && i % 2 === 1) {
                    imageToUse = secondImage;
                } else {
                    imageToUse = selectedImage;
                }
            } else {
                // For random behavior - use a unique image from the shuffled array
                imageToUse = shuffledImages[i];
            }
            
            // Create slice with proper image positioning
            const slice = {
                image: imageToUse,
                x: currentPosition,
                y: 0,
                width: stripWidth,
                height: baseStripHeight,
                rotation: 0,
                // Add slight opacity variation for single-image slices
                opacity: selectedImage && !secondImage ? 0.85 + (Math.random() * 0.3) : 1.0,
                // Add offset properties for single-image and alternating behaviors
                imageOffsetX: selectedImage ? i / numberOfSlices : 0,
                imageOffsetY: 0
            };
            
            slices.push(slice);
            currentPosition += stripWidth;
        }
        
        // Ensure the last slice fills any remaining space
        if (slices.length > 0) {
            const lastSlice = slices[slices.length - 1];
            lastSlice.width = this.canvas.width - lastSlice.x;
        }
        
        return slices;
    }
    
    // Draw the slices
    drawSlices(slices) {
        for (const slice of slices) {
            this.drawSlice(slice);
        }
    }
    
    // Draw a single slice
    drawSlice(slice) {
        if (!slice.image || !slice.image.complete) return;
        
        // Save the current context state
        this.ctx.save();
        
        // Set opacity
        this.ctx.globalAlpha = slice.opacity || 1.0;
        
        // Calculate dimensions to maintain aspect ratio
        const imgAspectRatio = slice.image.naturalWidth / slice.image.naturalHeight;
        const sliceAspectRatio = slice.width / slice.height;
        
        let drawWidth, drawHeight;
        let offsetX = 0, offsetY = 0;
        
        // Apply image offsets if they exist (for single-image and alternating behaviors)
        if (slice.imageOffsetX !== undefined || slice.imageOffsetY !== undefined) {
            if (imgAspectRatio > sliceAspectRatio) {
                // Image is wider than slice
                drawHeight = slice.height;
                drawWidth = drawHeight * imgAspectRatio;
                // Adjust offset calculation to ensure full image visibility
                offsetX = (drawWidth - slice.width) * (slice.imageOffsetX || 0);
            } else {
                // Image is taller than slice
                drawWidth = slice.width;
                drawHeight = drawWidth / imgAspectRatio;
                // Adjust offset calculation to ensure full image visibility
                offsetY = (drawHeight - slice.height) * (slice.imageOffsetY || 0);
            }
        } else {
            // No offsets, just fit the image to the slice
            if (imgAspectRatio > sliceAspectRatio) {
                drawHeight = slice.height;
                drawWidth = drawHeight * imgAspectRatio;
                offsetX = (drawWidth - slice.width) / 2;
            } else {
                drawWidth = slice.width;
                drawHeight = drawWidth / imgAspectRatio;
                offsetY = (drawHeight - slice.height) / 2;
            }
        }
        
        // Create clipping path for the slice
        this.ctx.beginPath();
        this.ctx.rect(slice.x, slice.y, slice.width, slice.height);
        this.ctx.clip();
        
        // Draw the image with proper positioning
        this.ctx.drawImage(
            slice.image,
            slice.x - offsetX,
            slice.y - offsetY,
            drawWidth,
            drawHeight
        );
        
        // Restore the context state
        this.ctx.restore();
    }
    
    // Helper function to shuffle an array
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
} 