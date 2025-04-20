/**
 * Main Application for Oracle Stack
 * 
 * Initializes and coordinates all the components of the application
 */

import BackgroundManager from './backgroundManager.js';
import LayoutManager from './layouts.js';
import FortuneGenerator from './fortuneGenerator.js';
import { imageCollection } from './data.js';
import CollageGenerator from './collage/collageGenerator.js';

class App {
    constructor() {
        this.layoutManager = new LayoutManager();
        this.backgroundManager = new BackgroundManager();
        this.fortuneGenerator = new FortuneGenerator();
        this.currentFortune = null;
        this.currentImages = null;
        this.isFortuneVisible = false;
        this.currentIconPosition = null;
        this.iconOptions = [
            'arch.svg', 'bird.svg', 'compass.svg', 'crystal.svg',
            'halfmoon.svg', 'hand.svg', 'plant.svg', 'shell.svg',
            'spiral.svg', 'sun.svg', 'tree.svg', 'vase.svg'
        ];
        
        // Initialize collage generator
        this.collageGenerator = null;
        this.tilingParameters = {
            // Base parameters
            complexity: 6,        // Controls number of images (5-10 recommended)
            density: 5,           // Controls spacing between images (3-8 recommended)
            contrast: 6,          // Controls image contrast (5-7 recommended)
            
            // Tiling specific parameters
            cleanTiling: false,   // Set to false for more artistic layouts
            blendOpacity: 0.6,    // Increased for better visibility
            
            // Image repetition - key new feature
            allowImageRepetition: true  // Allow some images to repeat
        };
        
        // Store app instance globally for data.js to access
        window.app = this;
        
        // Initialize the app
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeCollageGenerator();
        
        // Wait for image collection to be loaded
        if (imageCollection.length > 0) {
            this.initializeDefaultState();
        } else {
            // Check periodically for image collection to be loaded
            const checkInterval = setInterval(() => {
                if (imageCollection.length > 0) {
                    clearInterval(checkInterval);
                    this.initializeDefaultState();
                }
            }, 100);
        }
    }

    initializeCollageGenerator() {
        const collageCanvas = document.getElementById('collageCanvas');
        if (!collageCanvas) {
            console.error('Collage canvas not found');
            return;
        }
        
        // Initialize collage generator with the canvas
        this.collageGenerator = new CollageGenerator(collageCanvas);
        
        // Set initial canvas size
        this.resizeCollageCanvas();
        
        // Add window resize listener
        window.addEventListener('resize', () => this.resizeCollageCanvas());
    }

    resizeCollageCanvas() {
        const collageCanvas = document.getElementById('collageCanvas');
        const container = document.getElementById('collageContainer');
        
        if (!collageCanvas || !container) return;
        
        // Match canvas size to container
        collageCanvas.width = container.clientWidth;
        collageCanvas.height = container.clientHeight;
        
        // Redraw if we have current images
        if (this.imageCollection && this.imageCollection.length > 0) {
            this.generateCollage();
        }
    }

    generateCollage() {
        if (!this.collageGenerator || !this.imageCollection || this.imageCollection.length === 0) {
            console.error('Cannot generate collage: missing generator or images');
            return;
        }
        
        // Randomize some parameters
        const randomParams = {
            ...this.tilingParameters,
            complexity: 5 + Math.floor(Math.random() * 5),    // 5-9
            density: 3 + Math.floor(Math.random() * 5),       // 3-7
            allowImageRepetition: Math.random() > 0.3         // 70% chance to allow repetition
        };
        
        // Generate tiling collage with the current images
        this.collageGenerator.generate(
            this.imageCollection,
            null,  // No fortune text on the canvas
            'tiling',
            randomParams
        );
    }

    initializeDefaultState() {
        // Create a copy of the collection and shuffle it
        const shuffledCollection = [...imageCollection];
        for (let i = shuffledCollection.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCollection[i], shuffledCollection[j]] = [shuffledCollection[j], shuffledCollection[i]];
        }

        // Take the first 3 images
        this.imageCollection = shuffledCollection.slice(0, 3);
        console.log('Initial images:', this.imageCollection.map(img => img.id));
        
        // Generate initial fortune
        this.currentFortune = this.fortuneGenerator.generateFortune(this.imageCollection);
        this.isFortuneVisible = false;
        
        // Update display
        this.displayImages();
        
        // Position and show fortune icon after delay
        this.updateFortuneIcon();
        setTimeout(() => {
            const fortuneIcon = document.getElementById('fortuneIcon');
            if (fortuneIcon) {
                fortuneIcon.classList.add('visible');
            }
        }, 2000);
    }

    setupEventListeners() {
        // Add click event listener for the fortune icon
        const fortuneIcon = document.getElementById('fortuneIcon');
        console.log('Setting up fortune icon event listener:', !!fortuneIcon);
        if (fortuneIcon) {
            fortuneIcon.addEventListener('click', () => this.toggleFortune());
        }

        // Add click event listener for the shuffle button
        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => this.shuffleImages());
        }
    }

    shuffleImages() {
        if (!imageCollection || imageCollection.length === 0) {
            console.error('No images available to shuffle');
            return;
        }

        console.log('Shuffling images...');
        console.log('Current collection size:', imageCollection.length);
        
        // Hide fortune icon and text first
        const fortuneIcon = document.getElementById('fortuneIcon');
        if (fortuneIcon) {
            fortuneIcon.classList.remove('visible');
        }
        const fortuneText = document.getElementById('fortuneText');
        if (fortuneText) {
            fortuneText.style.display = 'none';
        }
        
        // Create a copy of the collection and shuffle it
        const shuffledCollection = [...imageCollection];
        for (let i = shuffledCollection.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCollection[i], shuffledCollection[j]] = [shuffledCollection[j], shuffledCollection[i]];
        }

        // Take the first 3 images
        this.imageCollection = shuffledCollection.slice(0, 3);
        console.log('Selected images:', this.imageCollection.map(img => img.id));
        
        // Generate new fortune for the new set of images
        this.currentFortune = this.fortuneGenerator.generateFortune(this.imageCollection);
        this.isFortuneVisible = false;
        
        // Update display
        this.displayImages();
        
        // Wait for images to load and then update icon position
        setTimeout(() => {
            this.updateFortuneIcon();
            // Show icon after position is updated
            setTimeout(() => {
                if (fortuneIcon) {
                    fortuneIcon.classList.add('visible');
                }
            }, 100);
        }, 2000);
    }

    toggleFortune() {
        const fortuneText = document.getElementById('fortuneText');
        console.log('Current fortune visibility:', this.isFortuneVisible);
        
        // Toggle visibility state first
        this.isFortuneVisible = !this.isFortuneVisible;
        console.log('New fortune visibility:', this.isFortuneVisible);
        
        if (this.isFortuneVisible) {
            // Show fortune
            if (!this.currentFortune) {
                // Generate new fortune with styling
                this.currentFortune = this.fortuneGenerator.generateFortune(this.imageCollection);
            }
            
            fortuneText.innerHTML = this.currentFortune.text;
            fortuneText.style.cssText = this.currentFortune.style;
            fortuneText.style.display = 'inline-block';
            fortuneText.style.opacity = '1';
            fortuneText.style.pointerEvents = 'auto';
            console.log('Showing fortune:', this.currentFortune.text);
        } else {
            // Hide fortune
            fortuneText.style.display = 'none';
            fortuneText.style.opacity = '0';
            fortuneText.style.pointerEvents = 'none';
            console.log('Hiding fortune');
        }
    }

    updateFortuneIcon() {
        const fortuneIcon = document.getElementById('fortuneIcon');
        const imageContainer = document.getElementById('imageContainer');
        
        console.log('Updating fortune icon:', {
            fortuneIcon: !!fortuneIcon,
            imageContainer: !!imageContainer
        });
        
        if (fortuneIcon && imageContainer) {
            // Get container dimensions and position
            const containerRect = imageContainer.getBoundingClientRect();
            const iconRect = fortuneIcon.getBoundingClientRect();
            
            console.log('Container dimensions:', {
                containerWidth: containerRect.width,
                containerHeight: containerRect.height,
                iconWidth: iconRect.width,
                iconHeight: iconRect.height
            });
            
            // Calculate safe boundaries (20% margin from edges)
            const marginX = containerRect.width * 0.2;
            const marginY = containerRect.height * 0.2;
            
            // Calculate maximum positions that ensure icon stays within container
            const maxX = containerRect.width - marginX * 2;
            const maxY = containerRect.height - marginY * 2;
            
            // Randomly choose position type (edge or near-center)
            const positionType = Math.random();
            
            let x, y;
            
            if (positionType < 0.5) {
                // Position along edges
                const isTopEdge = Math.random() < 0.5;
                x = marginX + Math.random() * maxX;
                y = isTopEdge ? marginY : containerRect.height - marginY - iconRect.height;
            } else {
                // Position near center but not exactly center
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                const offsetX = (Math.random() - 0.5) * maxX * 0.5;
                const offsetY = (Math.random() - 0.5) * maxY * 0.5;
                x = centerX + offsetX;
                y = centerY + offsetY;
            }
            
            // Ensure icon stays within container bounds
            x = Math.max(marginX, Math.min(x, containerRect.width - marginX - iconRect.width));
            y = Math.max(marginY, Math.min(y, containerRect.height - marginY - iconRect.height));
            
            console.log('Setting position:', { x, y });
            
            // Position the icon
            fortuneIcon.style.position = 'absolute';
            fortuneIcon.style.left = `${x}px`;
            fortuneIcon.style.top = `${y}px`;
            
            // Store the current position
            this.currentIconPosition = {
                left: `${x}px`,
                top: `${y}px`
            };

            // Select a random icon
            const randomIndex = Math.floor(Math.random() * this.iconOptions.length);
            const iconPath = this.iconOptions[randomIndex];
            
            console.log('Loading icon:', iconPath);
            
            // Clear any existing content
            fortuneIcon.innerHTML = '';
            
            // Create new image element for the SVG
            const iconImg = document.createElement('img');
            iconImg.src = `images/ui/icons/${iconPath}`;
            iconImg.alt = 'Fortune Icon';
            iconImg.classList.add('fortune-svg-icon');
            
            // Add error handling for icon loading
            iconImg.onerror = (e) => {
                console.error('Failed to load icon:', iconPath, e);
                // Try to load a fallback icon
                iconImg.src = 'images/ui/icons/compass.svg';
            };
            
            // Add load handler to confirm icon loaded
            iconImg.onload = () => {
                console.log('Icon loaded successfully:', iconPath);
            };
            
            // Add the image to the fortune icon
            fortuneIcon.appendChild(iconImg);
        }
    }

    displayImages() {
        if (!this.imageCollection || this.imageCollection.length === 0) {
            console.error('No images to display');
            return;
        }

        console.log('Displaying images:', this.imageCollection.map(img => img.id));
        
        // Update background color based on current images
        this.backgroundManager.setBackgroundFromImages(this.imageCollection);
        
        // Display images in row layout
        this.layoutManager.displayImages(this.imageCollection);
        
        // Generate collage
        this.generateCollage();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    new App();
});
