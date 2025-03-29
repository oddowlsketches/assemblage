/**
 * Layouts Module for Oracle Stack
 * 
 * Handles the row layout for displaying images
 */

export default class LayoutManager {
    constructor() {
        this.container = document.getElementById('imageContainer');
        this.currentImages = []; // Store current images
    }
    
    /**
     * Create an image card element
     * @param {Object} image - Image object with src and description
     * @returns {HTMLElement} The created image card element
     */
    createImageCard(image) {
        const imageCard = document.createElement('div');
        imageCard.classList.add('image-card');
        imageCard.dataset.id = image.id;
        imageCard.style.backgroundColor = 'transparent';
        
        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.description;
        img.loading = 'lazy';
        img.style.mixBlendMode = 'multiply';
        img.style.backgroundColor = 'transparent';
        
        // Add error handling for image loading
        img.onerror = () => {
            console.error(`Failed to load image: ${image.src}`);
            imageCard.style.display = 'none';
        };
        
        imageCard.appendChild(img);
        return imageCard;
    }

    /**
     * Display images in the row layout
     * @param {Array} images - Array of image objects to display
     */
    displayImages(images) {
        // Store current images for redrawing
        this.currentImages = images;
        
        // Clear container
        this.container.innerHTML = '';
        this.container.style.backgroundColor = 'transparent';
        
        // Calculate how many images to show based on viewport width
        const viewportWidth = window.innerWidth;
        const minImageWidth = 300; // Minimum width for each image
        const numImages = Math.max(1, Math.floor(viewportWidth / minImageWidth));
        
        // Select images to display
        const selectedImages = this.selectImages(images, numImages);
        
        // Display selected images
        selectedImages.forEach(image => {
            const imageCard = this.createImageCard(image);
            this.container.appendChild(imageCard);
        });
    }

    /**
     * Select images to display based on viewport size
     * @param {Array} images - Array of all available images
     * @param {number} numImages - Number of images to select
     * @returns {Array} Selected images
     */
    selectImages(images, numImages) {
        // Shuffle the images array
        const shuffled = [...images].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numImages);
    }
}

// This will be initialized in app.js
// const layoutManager = new LayoutManager();
