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
import { enableCrystalEffect } from './enableCrystalEffect.js';

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
        
        // Initialize the app
        this.init().then(() => {
            // Store app instance globally after initialization
            window.app = this;
            console.log('App initialized and exposed to window');
            
            // Enable crystal effect
            enableCrystalEffect(this);
        });
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
        
        // Define available effects with weights
        const effectWeights = [
            { effect: 'tiling', weight: 20 },
            { effect: 'fragments', weight: 20 },
            { effect: 'mosaic', weight: 10 },
            { effect: 'sliced', weight: 25 },
            { effect: 'layers', weight: 15 }
        ];
        
        // Add crystal effect if available with highest weight
        if (this.collageGenerator.hasCrystalEffect) {
            effectWeights.push({ effect: 'crystal', weight: 25 });
        }
        
        // Calculate total weight
        const totalWeight = effectWeights.reduce((sum, item) => sum + item.weight, 0);
        
        // Generate random number between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Select effect based on weights
        let selectedEffect = effectWeights[0].effect;
        for (const item of effectWeights) {
            if (random < item.weight) {
                selectedEffect = item.effect;
                break;
            }
            random -= item.weight;
        }
        
        console.log(`Selected effect: ${selectedEffect} (weighted random)`);
        
        // Randomize parameters based on selected effect
        const randomParams = {
            ...this.tilingParameters,
            complexity: 5 + Math.floor(Math.random() * 5),    // 5-9
            density: 3 + Math.floor(Math.random() * 5),       // 3-7
            allowImageRepetition: Math.random() > 0.3         // 70% chance to allow repetition
        };
        
        // Add crystal-specific parameters if crystal effect is selected
        if (selectedEffect === 'crystal') {
            // Randomize isolated mode instead of forcing it
            randomParams.isolatedMode = Math.random() > 0.5; // 50% chance of isolated mode
            randomParams.isIsolated = randomParams.isolatedMode;
            
            console.log(`Using ${randomParams.isolatedMode ? 'ISOLATED' : 'STANDARD'} crystal mode`);
            
            randomParams.crystalComplexity = 3 + Math.floor(Math.random() * 5);  // 3-7
            randomParams.crystalDensity = 3 + Math.floor(Math.random() * 5);     // 3-7
            randomParams.crystalOpacity = 0.6 + Math.random() * 0.3;             // 0.6-0.9
            randomParams.addGlow = false;  // Explicitly disable glow effect
            randomParams.seedPattern = ['random', 'grid', 'spiral', 'radial'][Math.floor(Math.random() * 4)];
            randomParams.template = ['hexagonal', 'irregular', 'angular', 'elongated'][Math.floor(Math.random() * 4)];
        }
        
        // Generate collage with the selected effect and parameters
        this.collageGenerator.generate(
            this.imageCollection,
            null,  // No fortune text on the canvas
            selectedEffect,
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

    async generateNewCollage() {
        console.log('[DEBUG] Starting new collage generation');
        
        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const backgroundColor = this.generateBackgroundColor();
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Select effect type
        const effectType = this.selectEffectType();
        console.log('[DEBUG] Selected effect type:', {
            effectType,
            isCrystal: effectType === 'crystal',
            currentIsolatedMode: this.generator.parameters.isolatedMode
        });
        
        // Get images for the effect
        const numImages = this.getNumImagesForEffect(effectType);
        const images = await this.getRandomImages(numImages);
        
        // Generate fortune text
        const fortuneText = this.generateFortune();
        
        // Get effect settings
        const settings = this.getEffectSettings(effectType);
        console.log('[DEBUG] Effect settings:', {
            effectType,
            settings,
            isolatedMode: settings.isolatedMode,
            hasCrystalEffect: this.generator.hasCrystalEffect,
            hasIsolatedGenerator: !!this.generator.isolatedCrystalGenerator
        });
        
        // Set background color
        const newBackgroundColor = this.generateBackgroundColor();
        this.ctx.fillStyle = newBackgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Generate collage
        console.log('[DEBUG] Starting collage generation with settings:', {
            effectType,
            settings,
            isolatedMode: settings.isolatedMode
        });
        
        await this.generator.generate(images, fortuneText, effectType, settings);
        
        console.log('[DEBUG] Collage generation completed');
    }

    getEffectSettings(effectType) {
        console.log('[DEBUG] Getting effect settings for:', {
            effectType,
            currentIsolatedMode: this.generator.parameters.isolatedMode
        });
        
        const settings = {
            complexity: this.getRandomComplexity(),
            density: this.getRandomDensity(),
            contrast: this.getRandomContrast(),
            blendOpacity: this.getRandomBlendOpacity(),
            cleanTiling: false
        };
        
        if (effectType === 'crystal') {
            // Crystal-specific parameters with detailed logging
            console.log('[DEBUG] Generating randomized crystal parameters');
            
            // Complexity (3-7)
            settings.crystalComplexity = 3 + Math.floor(Math.random() * 5);
            console.log('[DEBUG] Generated crystalComplexity:', settings.crystalComplexity);
            
            // Density (3-7)
            settings.crystalDensity = 3 + Math.floor(Math.random() * 5);
            console.log('[DEBUG] Generated crystalDensity:', settings.crystalDensity);
            
            // Opacity (0.6-0.9)
            settings.crystalOpacity = 0.6 + Math.random() * 0.3;
            console.log('[DEBUG] Generated crystalOpacity:', settings.crystalOpacity);
            
            // Seed Pattern
            const seedPatterns = ['random', 'grid', 'spiral', 'radial'];
            settings.seedPattern = seedPatterns[Math.floor(Math.random() * seedPatterns.length)];
            console.log('[DEBUG] Selected seedPattern:', settings.seedPattern);
            
            // Template
            const templates = ['hexagonal', 'irregular', 'angular', 'elongated'];
            settings.template = templates[Math.floor(Math.random() * templates.length)];
            console.log('[DEBUG] Selected template:', settings.template);
            
            // Facets (6-24)
            settings.maxFacets = 6 + Math.floor(Math.random() * 19);
            console.log('[DEBUG] Generated maxFacets:', settings.maxFacets);
            
            // Blend Opacity (0.3-0.8)
            settings.blendOpacity = 0.3 + Math.random() * 0.5;
            console.log('[DEBUG] Generated blendOpacity:', settings.blendOpacity);
            
            // Crystal Size (0.4-0.8)
            settings.crystalSize = 0.4 + Math.random() * 0.4;
            console.log('[DEBUG] Generated crystalSize:', settings.crystalSize);
            
            // Crystal Count (1-3)
            settings.crystalCount = 1 + Math.floor(Math.random() * 3);
            console.log('[DEBUG] Generated crystalCount:', settings.crystalCount);
            
            // Boolean parameters
            settings.preventOverlap = Math.random() < 0.7;  // 70% chance
            settings.facetBorders = Math.random() < 0.8;    // 80% chance
            settings.enableVisualEffects = Math.random() < 0.9; // 90% chance
            console.log('[DEBUG] Generated boolean parameters:', {
                preventOverlap: settings.preventOverlap,
                facetBorders: settings.facetBorders,
                enableVisualEffects: settings.enableVisualEffects
            });
            
            // Image Mode (unique/single)
            settings.imageMode = Math.random() < 0.5 ? 'unique' : 'single';
            console.log('[DEBUG] Selected imageMode:', settings.imageMode);
            
            // Ensure isolated mode is set
            settings.isolatedMode = true;
            settings.isIsolated = true;
            settings.variation = 'Isolated';
            
            // Add comprehensive debug logging for all crystal parameters
            console.log('[DEBUG] Final crystal effect settings:', {
                seedPattern: settings.seedPattern,
                template: settings.template,
                maxFacets: settings.maxFacets,
                blendOpacity: settings.blendOpacity,
                crystalSize: settings.crystalSize,
                crystalCount: settings.crystalCount,
                imageMode: settings.imageMode,
                complexity: settings.crystalComplexity,
                density: settings.crystalDensity,
                opacity: settings.crystalOpacity,
                preventOverlap: settings.preventOverlap,
                facetBorders: settings.facetBorders,
                enableVisualEffects: settings.enableVisualEffects
            });
        }
        
        return settings;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    new App();
});
