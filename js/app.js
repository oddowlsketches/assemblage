/**
 * Main Application for Oracle Stack
 * 
 * Initializes and coordinates all the components of the application
 */

import BackgroundManager from './backgroundManager.js';
import LayoutManager from './layouts.js';
import FortuneGenerator from './fortuneGenerator.js';
import { imageCollection } from './data.js';

class App {
    constructor() {
        this.layoutManager = new LayoutManager();
        this.backgroundManager = new BackgroundManager();
        this.fortuneGenerator = new FortuneGenerator();
        this.currentFortune = null;
        this.currentImages = null;
        this.isFortuneVisible = false;
        this.currentIconPosition = null;
        this.iconOptions = ['★', '◆', '✧', '⚹', '⁕'];
        
        // Store app instance globally for data.js to access
        window.app = this;
        
        // Initialize the app
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
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
            if (fortuneIcon) fortuneIcon.classList.add('visible');
        }, 2000);
    }

    setupEventListeners() {
        // Add click event listener for the fortune icon
        const fortuneIcon = document.getElementById('fortuneIcon');
        if (fortuneIcon) {
            fortuneIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFortune();
            });
        }

        // Add click event listener for the shuffle button
        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => {
                this.shuffleImages();
            });
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
        const fortuneText = document.getElementById('fortuneText');
        if (fortuneIcon) fortuneIcon.classList.remove('visible');
        if (fortuneText) fortuneText.style.display = 'none';

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
                if (fortuneIcon) fortuneIcon.classList.add('visible');
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
        
        if (fortuneIcon && imageContainer) {
            // Get container dimensions and position
            const containerRect = imageContainer.getBoundingClientRect();
            const iconRect = fortuneIcon.getBoundingClientRect();
            
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
            fortuneIcon.textContent = this.iconOptions[randomIndex];
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
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
