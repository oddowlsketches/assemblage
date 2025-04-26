/**
 * Collage App for Assemblage
 * 
 * Handles the collage generator application logic and user interactions
 */

import { CollageGenerator } from './collageGenerator.js';
import { LegacyCollageAdapter } from './legacyCollageAdapter.js';

class CollageApp {
    constructor() {
        this.canvas = document.getElementById('collageCanvas');
        this.generator = new CollageGenerator(this.canvas);
        this.legacyAdapter = new LegacyCollageAdapter(this.generator);
        this.imageCollection = [];
        this.currentEffect = null;
        
        this.initializeUI();
        this.loadImageCollection();
    }
    
    initializeUI() {
        // Set canvas size to match the viewport
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
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

        // Set initial parameters for mosaic effect
        if (effect === 'mosaic') {
            // Get current slider values
            const complexity = parseInt(document.getElementById('complexitySlider').value);
            const density = parseInt(document.getElementById('densitySlider').value);
            const contrast = parseInt(document.getElementById('contrastSlider').value);
            
            // Randomly select a variation
            const variations = ['Classic', 'Organic', 'Focal'];
            const variation = variations[Math.floor(Math.random() * variations.length)];
            
            // Set parameters with the new variation
            this.generator.parameters = {
                complexity,
                density,
                contrast,
                blendOpacity: 0.3,
                variation: variation,
                cleanTiling: false
            };
        }
    }
    
    updateParameters() {
        if (this.currentEffect === 'mosaic') {
            // For mosaic, randomly select a new variation each time
            const variations = ['Classic', 'Organic', 'Focal'];
            const variation = variations[Math.floor(Math.random() * variations.length)];
            
            this.generator.parameters = {
                complexity: parseInt(document.getElementById('complexitySlider').value),
                density: parseInt(document.getElementById('densitySlider').value),
                contrast: parseInt(document.getElementById('contrastSlider').value),
                blendOpacity: 0.3,
                variation: variation, // Select a new random variation
                cleanTiling: this.generator.parameters.cleanTiling || false
            };
        } else {
            // For other effects, update normally
            const currentParams = this.generator.parameters;
            this.generator.parameters = {
                ...currentParams,
                complexity: parseInt(document.getElementById('complexitySlider').value),
                density: parseInt(document.getElementById('densitySlider').value),
                contrast: parseInt(document.getElementById('contrastSlider').value)
            };
        }
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
            // Use legacy styles for mosaic and tiling effects
            if (this.currentEffect === 'mosaic' || this.currentEffect === 'tiling') {
                this.legacyAdapter.generate(
                    this.currentEffect,
                    this.generator.parameters,
                    this.generator.parameters.variation || 'Classic'
                );
            } else {
                // Pass the current effect to the generator for non-legacy effects
                this.generator.generate(this.generator.images, null, this.currentEffect);
            }
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