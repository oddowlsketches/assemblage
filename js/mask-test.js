/**
 * Mask Integration Test Module
 * This module provides a test environment for safely integrating mask shapes
 * into the main Assemblage app without affecting production code.
 */

// Import required modules
import CollageGenerator from './collage/collageGenerator.js';
import { loadImageCollection } from './data.js';
import backgroundManager from './backgroundManager.js';
import { updateBackground } from './script.js';
import FortuneGenerator from './fortuneGenerator.js';
// Import SimpleMaskManager for masking functionality
import { SimpleMaskManager } from './simpleMaskManager.js';

// MaskTestApp class for testing mask integration
class MaskTestApp {
    constructor() {
        // Elements
        this.canvas = document.getElementById('collageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');
        this.loadingElement = document.getElementById('loading');
        this.shiftButton = document.getElementById('shiftButton');
        this.saveButton = document.getElementById('saveButton');
        
        // Get mask control elements
        this.maskProbabilityInput = document.getElementById('maskProbability');
        this.maskProbabilityValue = document.getElementById('maskProbabilityValue');
        this.consistentMasksCheckbox = document.getElementById('consistentMasks');
        this.maskTypesSelect = document.getElementById('maskTypes');
        
        // Components
        this.backgroundManager = backgroundManager;
        this.generator = new CollageGenerator(this.canvas);
        this.fortuneGenerator = new FortuneGenerator();
        this.maskManager = new SimpleMaskManager();
        
        // State
        this.isLoading = false;
        this.allImages = [];
        this.lastResizeTime = 0;
        
        // Mask settings
        this.maskSettings = {
            probability: 0.2, // 20% chance of applying masks
            consistentMasks: true, // Use consistent mask type for mosaic layouts
            enabledMaskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'] // Default enabled mask types
        };
        
        // Initialize the application
        this.initialize();
    }
    
    // Set up the canvas dimensions
    resizeCanvas() {
        // Get device pixel ratio for high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Set canvas dimensions with device pixel ratio for sharpness
        this.canvas.width = viewportWidth * dpr;
        this.canvas.height = viewportHeight * dpr;
        
        // Scale the canvas style to fit the viewport
        this.canvas.style.width = viewportWidth + 'px';
        this.canvas.style.height = viewportHeight + 'px';
    }
    
    // Initialize the application
    async initialize() {
        try {
            // Set up event listeners
            window.addEventListener('resize', this.handleResize.bind(this));
            this.shiftButton.addEventListener('click', this.generateNewCollage.bind(this));
            this.saveButton.addEventListener('click', this.saveCollage.bind(this));
            
            // Set up mask control event listeners
            this.maskProbabilityInput.addEventListener('input', this.updateMaskSettings.bind(this));
            this.consistentMasksCheckbox.addEventListener('change', this.updateMaskSettings.bind(this));
            this.maskTypesSelect.addEventListener('change', this.updateMaskSettings.bind(this));
            
            // Set canvas dimensions
            this.resizeCanvas();
            
            // Load images
            this.allImages = await loadImageCollection();
            console.log('Image collection initialized with', this.allImages.length, 'images');
            
            // Update initial mask settings from UI
            this.updateMaskSettings();
            
            // Generate initial collage
            await this.generateNewCollage();
            
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }
    
    // Update mask settings from UI controls
    updateMaskSettings() {
        // Update probability
        const probability = parseInt(this.maskProbabilityInput.value) / 100;
        this.maskSettings.probability = probability;
        this.maskProbabilityValue.textContent = `${this.maskProbabilityInput.value}%`;
        
        // Update consistent masks setting
        this.maskSettings.consistentMasks = this.consistentMasksCheckbox.checked;
        
        // Update enabled mask types
        const selectedOptions = Array.from(this.maskTypesSelect.selectedOptions);
        this.maskSettings.enabledMaskTypes = selectedOptions.map(option => option.value);
        
        console.log('Updated mask settings:', this.maskSettings);
    }
    
    // Handle window resize with throttling
    handleResize() {
        const now = Date.now();
        if (now - this.lastResizeTime > 200) { // Throttle to prevent rapid firing
            this.lastResizeTime = now;
            this.resizeCanvas();
            if (this.generator) {
                this.generator.redraw();
            }
        }
    }
    
    // Generate a new collage
    async generateNewCollage() {
        this.showLoading(true);
        
        try {
            // Get a random effect
            const effect = this.getRandomEffect();
            console.log(`Selected effect: ${effect}`);
            
            // Get the appropriate number of images for this effect
            const imageCount = this.getImageCountForEffect(effect);
            console.log(`Getting ${imageCount} images for ${effect} effect`);
            
            // Get a random subset of images
            const images = await this.getRandomImageSubset(imageCount);
            
            if (images.length === 0) {
                console.error('No images available for collage generation');
                this.showLoading(false);
                return;
            }
            
            // Generate a new fortune
            const fortune = this.fortuneGenerator.generateFortune(images);
            
            // Get effect settings
            const effectSettings = this.getEffectSettings(effect);
            console.log(`Using settings for ${effect}:`, effectSettings);
            
            // Generate the collage based on the effect
            let fragments = [];
            try {
                switch (effect) {
                    case 'tiling':
                        fragments = await this.generator.generateTiling(images, fortune, effectSettings);
                        break;
                    case 'mosaic':
                        fragments = await this.generator.generateMosaic(images, fortune, effectSettings);
                        break;
                    case 'fragments':
                        fragments = await this.generator.generateFragments(images, fortune, effectSettings);
                        break;
                    case 'layers':
                        fragments = await this.generator.generateLayers(images, fortune, effectSettings);
                        break;
                }
            } catch (error) {
                console.error(`Error generating ${effect} collage:`, error);
                this.showLoading(false);
                return;
            }
            
            // Check if fragments is an array or a single fragment
            if (!fragments) {
                console.error(`Error generating ${effect} collage: No fragments returned`);
                this.showLoading(false);
                return;
            }
            
            // Convert to array if it's a single fragment
            const fragmentsArray = Array.isArray(fragments) ? fragments : [fragments];
            
            if (fragmentsArray.length === 0) {
                console.error(`Error generating ${effect} collage: No fragments generated`);
                this.showLoading(false);
                return;
            }
            
            // Apply masks to fragments
            const maskedFragments = this.applyMasksToFragments(fragmentsArray, effect);
            
            // Draw the fragments
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            maskedFragments.forEach(fragment => {
                if (fragment && fragment.image) {
                    this.maskManager.drawMaskedElement(this.ctx, fragment, fragment.image);
                }
            });
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error generating collage:', error);
            this.showLoading(false);
        }
    }
    
    // Apply masks to fragments based on current settings
    applyMasksToFragments(fragments, layoutType) {
        console.log(`Applying masks to ${fragments?.length || 0} fragments for ${layoutType} layout`);
        
        // Skip if mask probability is 0 or no enabled mask types
        if (this.maskSettings.probability <= 0 || this.maskSettings.enabledMaskTypes.length === 0) {
            console.log('Skipping mask application: probability zero or no enabled mask types');
            return fragments;
        }
        
        try {
            // Make a shallow copy of fragments to preserve Image objects
            const fragmentsCopy = fragments.map(fragment => ({
                ...fragment,
                image: fragment.image // Keep the original Image object reference
            }));
            
            if (fragmentsCopy.length === 0) {
                console.warn('No fragments to apply masks to');
                return fragments;
            }
            
            // Special handling for mosaic layouts with consistent masks
            if (layoutType === 'mosaic' && this.maskSettings.consistentMasks) {
                // Select a single mask type for the entire mosaic
                const maskTypes = this.maskSettings.enabledMaskTypes;
                const selectedMaskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
                
                console.log(`Applying consistent ${selectedMaskType} mask to mosaic layout`);
                
                // Apply the same mask type to a random subset of elements
                fragmentsCopy.forEach(fragment => {
                    // Apply masks with probability adjusted for mosaic (higher than standard)
                    const maskProbability = Math.min(this.maskSettings.probability * 1.5, 0.8);
                    if (Math.random() < maskProbability) {
                        fragment.maskType = selectedMaskType;
                    }
                });
            } else {
                // Apply random masks to fragments based on probability
                fragmentsCopy.forEach((fragment, index) => {
                    if (Math.random() < this.maskSettings.probability) {
                        // Select a random mask type from enabled types
                        const maskTypes = this.maskSettings.enabledMaskTypes;
                        const selectedMaskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
                        fragment.maskType = selectedMaskType;
                        console.log(`Applying ${selectedMaskType} mask to fragment ${index}`);
                    }
                });
            }
            
            return fragmentsCopy;
        } catch (error) {
            console.error('Error applying masks:', error);
            return fragments;
        }
    }
    
    // Get effect settings based on effect type
    getEffectSettings(effect) {
        // Common settings for all effects
        const commonSettings = {
            blendOpacity: 0.7,
            complexity: 6,
            density: 3,
            contrast: 6
        };

        switch (effect) {
            case 'tiling':
                return {
                    ...commonSettings,
                    allowImageRepetition: true,
                    minScale: 0.3,
                    maxScale: 0.7,
                    overlapFactor: 0.5,
                    selectedCompositionStyle: 'Focal',
                    style: 'Focal'
                };
                
            case 'mosaic':
                return {
                    ...commonSettings,
                    variation: 'Classic',
                    minImages: 10,
                    maxImages: 80,
                    gridSize: {
                        min: 3,
                        max: 6
                    },
                    spacing: 0.1,
                    rotation: {
                        enabled: true,
                        maxAngle: 15
                    }
                };
                
            case 'fragments':
                return {
                    ...commonSettings,
                    minCoverage: 85,
                    initialFragments: {
                        min: 3,
                        max: 7
                    },
                    maxAdditionalFragments: 10,
                    cropProbability: {
                        focal: 0.25,
                        field: 0.15
                    }
                };
                
            case 'layers':
                return {
                    ...commonSettings,
                    minLayers: 3,
                    maxLayers: 6,
                    scaleRange: { min: 0.3, max: 0.7 },
                    opacityRange: { min: 0.3, max: 0.8 },
                    rotationRange: 15,
                    depthVariation: 0.3,
                    selectedCompositionStyle: 'Focal',
                    style: 'Focal',
                    minVisibility: 0.7,
                    opacityTargets: {
                        high: 0.35,
                        full: 0.12
                    },
                    scaleVariation: {
                        focal: { min: 0.6, max: 1.2 },
                        field: { min: 0.3, max: 0.7 }
                    },
                    allowImageRepetition: false
                };
                
            default:
                return commonSettings;
        }
    }
    
    // Get the appropriate number of images based on the effect
    getImageCountForEffect(effect) {
        switch (effect) {
            case 'tiling':
                return 8; // Tiling works best with 8 images
            case 'mosaic':
                return 19; // Mosaic needs more images for variety
            case 'fragments':
                return 10; // Fragments work well with 10 images
            case 'layers':
                return 8; // Layers work best with 8 images
            default:
                return 10; // Default to 10 images
        }
    }
    
    // Select a random effect
    getRandomEffect() {
        const effects = ['tiling', 'fragments', 'mosaic', 'layers'];
        return effects[Math.floor(Math.random() * effects.length)];
    }
    
    // Get a random subset of images
    async getRandomImageSubset(count) {
        // Shuffle the images
        const shuffled = [...this.allImages];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Take the first few images
        const subset = shuffled.slice(0, Math.min(count, shuffled.length));
        
        // Load the images
        const promises = subset.map(img => {
            return new Promise((resolve) => {
                const image = new Image();
                image.crossOrigin = "anonymous";
                
                image.onload = () => resolve(image);
                image.onerror = () => {
                    console.warn(`Failed to load image: ${img.src || img.filename}`);
                    resolve(null);
                };
                
                const src = img.src || img.path || `/images/collages/${img.filename}`;
                image.src = src;
            });
        });
        
        // Wait for all images to load
        const loadedImages = await Promise.all(promises);
        return loadedImages.filter(img => img !== null);
    }
    
    // Save the collage as an image
    saveCollage() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = 'assemblage-mask-test.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    // Generate a random color for the background
    generateRandomColor() {
        const newColor = this.backgroundManager.generateRandomColor();
        this.container.style.backgroundColor = newColor;
        return newColor;
    }
    
    // Show/hide loading indicator
    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'block' : 'none';
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MaskTestApp();
});
