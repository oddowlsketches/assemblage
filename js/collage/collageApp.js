/**
 * Collage App for Assemblage
 * 
 * Handles the collage generator application logic and user interactions
 */

import CollageGenerator from './collageGenerator.js';

class CollageApp {
    constructor() {
        this.canvas = document.getElementById('collageCanvas');
        this.generator = new CollageGenerator(this.canvas);
        this.imageCollection = [];
        this.currentEffect = null;
        
        this.initializeUI();
        this.loadImageCollection();
    }
    
    initializeUI() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Effect buttons
        document.querySelectorAll('.effect-button').forEach(button => {
            button.addEventListener('click', () => {
                this.setEffect(button.dataset.effect);
            });
        });
        
        // Parameter sliders
        document.querySelectorAll('.parameter-slider').forEach(slider => {
            slider.addEventListener('input', () => {
                this.updateParameters();
            });
        });

        // Clean tiling toggle (only show for tiling effect)
        const cleanTilingToggle = document.createElement('div');
        cleanTilingToggle.className = 'parameter-group';
        cleanTilingToggle.innerHTML = `
            <label>
                <input type="checkbox" id="cleanTilingToggle">
                Clean Tiling (No Rotation)
            </label>
        `;
        document.querySelector('.parameters').appendChild(cleanTilingToggle);

        // Toggle clean tiling
        document.getElementById('cleanTilingToggle').addEventListener('change', (e) => {
            this.generator.parameters.cleanTiling = e.target.checked;
        });
        
        // Action buttons
        document.getElementById('generateButton').addEventListener('click', () => {
            this.generate();
        });
        
        document.getElementById('saveButton').addEventListener('click', () => {
            this.save();
        });
    }
    
    async loadImageCollection() {
        try {
            const response = await fetch('images/metadata.json');
            const metadata = await response.json();
            
            // Load all images
            this.imageCollection = await Promise.all(
                metadata.map(async (img) => {
                    const image = new Image();
                    image.src = `images/collages/${img.id}.jpg`;
                    await new Promise((resolve, reject) => {
                        image.onload = resolve;
                        image.onerror = () => {
                            console.warn(`Failed to load image: ${img.id}`);
                            resolve(null); // Resolve with null instead of rejecting
                        };
                    });
                    return image;
                })
            );
            
            // Filter out any failed image loads
            this.imageCollection = this.imageCollection.filter(img => img !== null);
            
            console.log(`Loaded ${this.imageCollection.length} images`);
            this.generator.images = this.imageCollection;
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }
    
    setEffect(effect) {
        this.currentEffect = effect;
        this.generator.currentEffect = effect;
        
        // Update button states
        document.querySelectorAll('.effect-button').forEach(button => {
            button.classList.toggle('active', button.dataset.effect === effect);
        });

        // Show/hide clean tiling toggle based on effect
        const cleanTilingToggle = document.getElementById('cleanTilingToggle').parentElement;
        cleanTilingToggle.style.display = effect === 'tiling' ? 'block' : 'none';
    }
    
    updateParameters() {
        this.generator.parameters = {
            ...this.generator.parameters,
            complexity: parseInt(document.getElementById('complexitySlider').value),
            density: parseInt(document.getElementById('densitySlider').value),
            contrast: parseInt(document.getElementById('contrastSlider').value)
        };
    }
    
    generate() {
        if (!this.currentEffect) {
            alert('Please select an effect first');
            return;
        }
        
        const generateButton = document.getElementById('generateButton');
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';
        
        try {
            this.generator.generate();
            generateButton.textContent = 'Generate';
        } catch (error) {
            console.error('Error generating collage:', error);
            alert('Error generating collage. Please try again.');
        } finally {
            generateButton.disabled = false;
        }
    }
    
    save() {
        try {
            this.generator.save();
        } catch (error) {
            console.error('Error saving collage:', error);
            alert('Error saving collage. Please try again.');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CollageApp();
}); 