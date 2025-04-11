/**
 * Collage Generator for Assemblage
 * 
 * Generates artistic collages using various effects and the image collection
 */

import { TilingGenerator } from './tilingGenerator.js';
import { FragmentsGenerator } from './fragmentsGenerator.js';
import MosaicGenerator from './mosaicGenerator.js';

class CollageGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = [];
        this.currentEffect = null;
        this.parameters = {
            // Base parameters
            complexity: 5,
            density: 5,
            contrast: 5,
            
            // Tiling specific parameters
            cleanTiling: false,
            blendOpacity: 0.3,
            variation: 'Classic',
            
            // Advanced tiling parameters
            tileSize: 0.2, // Size of tiles relative to canvas
            overlapFactor: 0.1, // Amount of overlap between tiles
            rotationRange: 15, // Maximum rotation angle in degrees
            scaleVariation: 0.2, // Amount of size variation between tiles
            depthVariation: 0.3, // Amount of depth variation for layering
            opacityRange: { min: 0.3, max: 0.8 }, // Opacity range for tiles
            
            // Image repetition control
            allowImageRepetition: null // null = random, true = always allow, false = never allow
        };
        
        // Composition Settings
        this.compositionTemplates = ['center', 'ruleOfThirds', 'diagonalTLBR', 'diagonalTRBL', 'goldenRatio'];
        this.selectedTemplate = null;
        this.selectedCompositionStyle = null; // Added style property ('Focal' or 'Field')
        this.focalPoints = []; 

        // Initialize generators
        this.tilingGenerator = new TilingGenerator(this.canvas, this.parameters);
        this.fragmentsGenerator = new FragmentsGenerator(this.ctx, canvas);
        this.mosaicGenerator = new MosaicGenerator(this.canvas, this.parameters);

        // Initialize canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        // Get the device pixel ratio for better quality on high-DPI screens
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Set the canvas dimensions
        this.canvas.width = window.innerWidth * devicePixelRatio;
        this.canvas.height = window.innerHeight * devicePixelRatio;
        
        // Set the display size (CSS pixels)
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        // Reset any transforms
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Scale the context
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    
    // Helper function to preserve aspect ratio when drawing tiles
    preserveAspectRatio(image, x, y, targetWidth, targetHeight) {
        if (!image || !image.complete) return false;
        
        const imgRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgRatio > targetRatio) {
            // Image is wider - match width and center vertically
            drawWidth = targetWidth;
            drawHeight = drawWidth / imgRatio;
            drawX = x;
            drawY = y + (targetHeight - drawHeight) / 2;
        } else {
            // Image is taller - match height and center horizontally
            drawHeight = targetHeight;
            drawWidth = drawHeight * imgRatio;
            drawX = x + (targetWidth - drawWidth) / 2;
            drawY = y;
        }
        
        // Draw with proper dimensions
        this.ctx.drawImage(
            image,
            0, 0, image.width, image.height, // Source
            drawX, drawY, drawWidth, drawHeight // Destination
        );
        
        return true;
    }

    setParameters(parameters) {
        this.parameters = { ...this.parameters, ...parameters };
    }

    generateBackgroundColor() {
        // Rich, vibrant colors that work well with multiply blend mode
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    calculateImageDimensions(image, targetWidth, targetHeight) {
        if (!image || !image.complete || image.naturalWidth === 0) {
            return null;
        }

        const imageRatio = image.width / image.height;
        const targetRatio = targetWidth / targetHeight;
        
        let width, height, x, y;
        
        if (imageRatio > targetRatio) {
            width = targetWidth;
            height = targetWidth / imageRatio;
            x = 0;
            y = (targetHeight - height) / 2;
        } else {
            height = targetHeight;
            width = targetHeight * imageRatio;
            x = (targetWidth - width) / 2;
            y = 0;
        }
        
        return { x, y, width, height };
    }
    
    drawImage(image, x, y, width, height, crop = false, forceOpacity = null, showCroppedPortion = false) {
        if (!image || !image.complete || image.naturalWidth === 0) {
            return;
        }

        try {
            // Save the current context state
            this.ctx.save();
            
            // --- Opacity Calculation Update ---
            let finalOpacity;
            if (forceOpacity !== null && forceOpacity >= 0 && forceOpacity <= 1) {
                // Use forced opacity if valid - THIS IS THE INTENDED BEHAVIOR
                finalOpacity = forceOpacity;
            } else {
                // Higher default opacity range for better visibility (0.3 - 0.6)
                const baseOpacity = this.parameters.blendOpacity || 0.45; // Increased base opacity
                const opacityVariation = 0.15; // Increased variation for more dynamic look
                let randomOpacity = baseOpacity + (Math.random() * 2 * opacityVariation) - opacityVariation;
                // Clamp the opacity to the improved 0.3 - 0.6 range
                finalOpacity = Math.max(0.3, Math.min(0.6, randomOpacity)); 
            }
            // Ensure opacity is clamped between 0 and 1
            this.ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));
            // --- End Opacity Calculation Update ---
            
            // Apply contrast enhancement for better visual definition
            const contrastLevel = this.parameters.contrast / 10;
            this.ctx.filter = `contrast(${1 + contrastLevel})`;

            if (crop) {
                // For mosaic tiles, we want to ensure the image fills the entire tile
                // Calculate the aspect ratio of the destination rectangle
                const destRatio = width / height;
                
                // Calculate the aspect ratio of the source image
                const srcRatio = image.width / image.height;
                
                let cropWidth, cropHeight, cropX, cropY;
                
                if (showCroppedPortion) {
                    // When showing a cropped portion, we'll randomly select a portion of the image
                    // This creates more abstract and interesting tiles
                    
                    // Determine how much of the image to show (between 30% and 100%)
                    const cropPercentage = 0.3 + Math.random() * 0.7;
                    
                    if (srcRatio > destRatio) {
                        // Image is wider than destination
                        cropHeight = image.height * cropPercentage;
                        cropWidth = cropHeight * destRatio;
                        
                        // Randomly position the crop horizontally
                        const maxCropX = image.width - cropWidth;
                        cropX = Math.random() * maxCropX;
                        
                        // Center vertically
                        cropY = (image.height - cropHeight) / 2;
                    } else {
                        // Image is taller than destination
                        cropWidth = image.width * cropPercentage;
                        cropHeight = cropWidth / destRatio;
                        
                        // Center horizontally
                        cropX = (image.width - cropWidth) / 2;
                        
                        // Randomly position the crop vertically
                        const maxCropY = image.height - cropHeight;
                        cropY = Math.random() * maxCropY;
                    }
                } else {
                    // Standard cropping to fit the tile
                    if (srcRatio > destRatio) {
                        // Image is wider than destination - crop width to match aspect ratio
                        cropHeight = image.height;
                        cropWidth = cropHeight * destRatio;
                        cropX = (image.width - cropWidth) / 2;
                        cropY = 0;
                    } else {
                        // Image is taller than destination - crop height to match aspect ratio
                        cropWidth = image.width;
                        cropHeight = cropWidth / destRatio;
                        cropX = 0;
                        cropY = (image.height - cropHeight) / 2;
                    }
                }
                
                this.ctx.drawImage(
                    image,
                    cropX, cropY, cropWidth, cropHeight,  // Source crop
                    x, y, width, height  // Destination
                );
            } else {
                const dimensions = this.calculateImageDimensions(image, width, height);
                if (dimensions) {
                    this.ctx.drawImage(
                        image,
                        dimensions.x + x,
                        dimensions.y + y,
                        dimensions.width,
                        dimensions.height
                    );
                }
            }

            // Restore the context state
            this.ctx.restore();
        } catch (error) {
            console.warn('Error drawing image:', error);
        }
    }
    
    generate(images, fortuneText, effect, settings = null) {
        try {
            if (images) {
                this.images = images;
            }
            
            this.currentEffect = effect || 'fragments';
            
            if (!this.currentEffect || this.images.length === 0) {
                console.error('No images available for collage generation');
                return;
            }
            
            if (settings) {
                this.parameters = { ...this.parameters, ...settings };
                console.log(`Applied settings for ${this.currentEffect}:`, this.parameters);
            }
            
            // Randomly decide on image repetition if not explicitly set
            if (this.parameters.allowImageRepetition === null) {
                this.parameters.allowImageRepetition = Math.random() < 0.5;
                console.log(`Randomly set image repetition to: ${this.parameters.allowImageRepetition}`);
            }
            
            // Get device pixel ratio and canvas dimensions
            const dpr = window.devicePixelRatio || 1;
            const displayWidth = this.canvas.width / dpr;
            const displayHeight = this.canvas.height / dpr;
            
            // Clear canvas completely
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, displayWidth, displayHeight);
            
            // Select composition style and template
            this.selectCompositionStyleAndTemplate();

            // Set background color
            this.ctx.fillStyle = this.generateBackgroundColor();
            this.ctx.fillRect(0, 0, displayWidth, displayHeight);

            // Set multiply blend mode for images
            this.ctx.globalCompositeOperation = 'multiply';

            console.log(`Generating collage with effect: ${this.currentEffect}, image repetition: ${this.parameters.allowImageRepetition}`);

            // Generate collage based on current effect
            switch (this.currentEffect) {
                case 'mosaic':
                    this.generateMosaic(this.images, fortuneText, this.parameters);
                    break;
                case 'tiling':
                    this.generateTiling(this.images, fortuneText, this.parameters);
                    break;
                case 'fragments':
                    this.generateFragments(this.images, fortuneText, this.parameters);
                    break;
                case 'layers':
                    this.generateLayers(this.images, fortuneText, this.parameters);
                    break;
                default:
                    console.warn(`Unknown effect type: ${this.currentEffect}`);
                    this.generateFragments(this.images, fortuneText, this.parameters);
            }
            
            // Add fortune text if provided
            if (fortuneText) {
                this.addFortuneText(fortuneText);
            }
            
        } catch (error) {
            console.error('Error generating collage:', error);
        }
    }
    
    generateCollage(effectName, params) {
        // Validate effect name to prevent undefined errors
        this.currentEffect = this.ensureValidEffectName(effectName || 'fragments');
        
        // Apply parameters if provided
        if (params) {
            this.setParameters(params);
        }
        
        // Generate the collage
        this.generate();
    }

    // Helper function to ensure effect type compatibility between bridge.html and collageGenerator.js
    ensureValidEffectName(effectName) {
        const validEffects = ['mosaic', 'tiling', 'fragments', 'layers'];
        if (!validEffects.includes(effectName)) {
            console.warn(`Invalid effect name: ${effectName}, defaulting to fragments`);
            return 'fragments';
        }
        return effectName;
    }
    
    generateMosaic(images, fortuneText, parameters) {
        try {
            console.log(`Generating mosaic with variation: ${parameters.variation}`);
            
            // Clear any previous content
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Set background color
            this.ctx.fillStyle = this.generateBackgroundColor();
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Use the new MosaicGenerator
            this.mosaicGenerator.generateMosaic(images, {
                ...parameters,
                compositionStyle: this.selectedCompositionStyle,
                tilesTouching: Math.random() < 0.3 // 30% chance of having tiles touch without overlap
            });
            
            // Add fortune text if provided
            if (fortuneText) {
                this.addFortuneText(fortuneText);
            }
            
        } catch (error) {
            console.error('Error generating mosaic:', error);
        }
    }
    
    async generateTiling(images, fortuneText, parameters) {
        if (!images || images.length === 0) return;
        
        const tilingGenerator = new TilingGenerator(this.canvas, parameters);
        const tiles = await tilingGenerator.generateTiles(images);
        
        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sort tiles by size and opacity for better layering
        tiles.sort((a, b) => {
            // First sort by opacity (higher opacity drawn later)
            const opacityDiff = (a.forceOpacity || 0.8) - (b.forceOpacity || 0.8);
            if (Math.abs(opacityDiff) > 0.1) return opacityDiff;
            
            // Then by size (smaller tiles drawn later)
            return (a.width * a.height) - (b.width * b.height);
        });
        
        let drawnTiles = 0;
        let skippedTiles = {
            invalid: 0,
            offCanvas: 0,
            drawError: 0
        };
        
        // Always use multiply blend mode for all tiles
        this.ctx.globalCompositeOperation = 'multiply';
        
        // Draw all tiles with multiply blend mode
        tiles.forEach((tile, index) => {
            if (!this.drawTile(tile, index, skippedTiles)) return;
            drawnTiles++;
        });
        
        console.log('Tile drawing summary:', {
            total: tiles.length,
            drawn: drawnTiles,
            skipped: skippedTiles,
            canvasSize: { width: this.canvas.width, height: this.canvas.height }
        });
        
        // Reset blend mode
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Add fortune text if provided
        if (fortuneText) {
            this.addFortuneText(fortuneText);
        }
    }

    // Helper method to draw individual tiles
    drawTile(tile, index, skippedTiles) {
        const img = tile.image;
        if (!img || !img.complete) {
            skippedTiles.invalid++;
            console.log(`Tile ${index}: Invalid image - exists: ${!!img}, complete: ${img ? img.complete : 'N/A'}`);
            return false;
        }
        
        // Skip tiles that would be completely outside the canvas
        if (tile.x >= this.canvas.width || tile.y >= this.canvas.height || 
            tile.x + tile.width <= 0 || tile.y + tile.height <= 0) {
            skippedTiles.offCanvas++;
            console.warn(`Tile ${index}: Off canvas at (${tile.x}, ${tile.y}) with size ${tile.width}x${tile.height}`);
            return false;
        }
        
        try {
            this.ctx.save();
            
            // Set opacity with a minimum value to ensure visibility
            this.ctx.globalAlpha = Math.max(0.6, tile.forceOpacity || 0.8);
            
            // Add slight contrast boost for better visibility
            this.ctx.filter = `contrast(1.1) brightness(1.05)`;
            
            // Move to tile center for rotation
            const centerX = tile.x + tile.width / 2;
            const centerY = tile.y + tile.height / 2;
            
            // Log first few tiles for debugging
            if (index < 5) {
                console.log(`Tile ${index} debug:`, {
                    position: { x: tile.x, y: tile.y },
                    center: { x: centerX, y: centerY },
                    size: { width: tile.width, height: tile.height },
                    opacity: tile.forceOpacity,
                    rotation: tile.rotation
                });
            }
            
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(tile.rotation * Math.PI / 180);
            
            // Draw the tile with aspect ratio preservation
            const imgRatio = img.width / img.height;
            let drawWidth = tile.width;
            let drawHeight = tile.height;
            
            if (imgRatio > 1) {
                drawHeight = drawWidth / imgRatio;
            } else {
                drawWidth = drawHeight * imgRatio;
            }
            
            // Extra validation for dimensions
            if (isNaN(drawWidth) || isNaN(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
                console.log(`Tile ${index}: Invalid dimensions - width: ${drawWidth}, height: ${drawHeight}`);
                this.ctx.restore();
                return false;
            }
            
            this.ctx.drawImage(
                img,
                -drawWidth / 2, -drawHeight / 2,
                drawWidth, drawHeight
            );
            
            this.ctx.restore();
            return true;
        } catch (error) {
            skippedTiles.drawError++;
            console.warn(`Tile ${index}: Error drawing:`, error);
            return false;
        }
    }
    
    generateWarhol() {
        const gridSize = Math.max(2, Math.min(4, Math.floor(this.parameters.complexity / 2)));
        const tileWidth = this.canvas.width / gridSize;
        const tileHeight = this.canvas.height / gridSize;

        // Select a few base images for repetition
        const baseImages = Array(3).fill().map(() => 
            this.images[Math.floor(Math.random() * this.images.length)]
        );

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const baseImage = baseImages[Math.floor(Math.random() * baseImages.length)];
                
                this.ctx.save();
                
                // Apply different filters based on position
                const filters = [
                    `hue-rotate(${Math.random() * 360}deg) saturate(${this.parameters.contrast})`,
                    'invert(1) contrast(1.2)',
                    'grayscale(1) contrast(1.5)',
                    'sepia(1) saturate(1.5)',
                    'brightness(1.2) contrast(1.2)'
                ];
                this.ctx.filter = filters[Math.floor(Math.random() * filters.length)];
                
                this.drawImage(
                    baseImage,
                    i * tileWidth,
                    j * tileHeight,
                    tileWidth,
                    tileHeight
                );
                
                this.ctx.restore();
            }
        }
    }
    
    generateFragments(images, fortuneText, parameters = {}) {
        try {
            // Clear any previous content
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Set background color
            this.ctx.fillStyle = this.generateBackgroundColor();
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Pass the allowImageRepetition parameter to the fragments generator
            const fragments = this.fragmentsGenerator.generateFragments(images, {
                ...parameters,
                allowImageRepetition: this.parameters.allowImageRepetition
            });
            
            // Draw fragments
            fragments.forEach(fragment => {
                const img = images[fragment.img];
                
                // Skip missing or incomplete images
                if (!img || !img.complete) return;
                
                this.ctx.save();
                
                // Calculate opacity based on depth and variation
                let opacity;
                if (fragment.forceFullOpacity) {
                    opacity = 1.0;
                } else if (parameters.variation === 'Classic') {
                    opacity = 0.3 + fragment.depth * 0.6;
                } else if (parameters.variation === 'Organic') {
                    opacity = 0.25 + fragment.depth * 0.7;
                } else if (parameters.variation === 'Focal') {
                    opacity = 0.35 + fragment.depth * 0.6;
                } else {
                    opacity = 0.3 + fragment.depth * 0.6;
                }
                
                // Clamp opacity between 0.25 and 1.0
                opacity = Math.max(0.25, Math.min(1.0, opacity));
                this.ctx.globalAlpha = opacity;
                
                // Apply rotation
                if (fragment.rotation) {
                    const centerX = fragment.x + fragment.width / 2;
                    const centerY = fragment.y + fragment.height / 2;
                    this.ctx.translate(centerX, centerY);
                    this.ctx.rotate(fragment.rotation * Math.PI / 180);
                    this.ctx.translate(-centerX, -centerY);
                }
                
                // Draw fragment with aspect ratio preservation
                const imgAspectRatio = img.width / img.height;
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspectRatio > 1) {
                    drawWidth = fragment.width * 1.5;
                    drawHeight = drawWidth / imgAspectRatio;
                } else {
                    drawHeight = fragment.height * 1.5;
                    drawWidth = drawHeight * imgAspectRatio;
                }
                
                drawX = fragment.x + (fragment.width - drawWidth) / 2;
                drawY = fragment.y + (fragment.height - drawHeight) / 2;
                
                // Add a very small random offset for more natural feeling
                drawX += (Math.random() - 0.5) * fragment.width * 0.05;
                drawY += (Math.random() - 0.5) * fragment.height * 0.05;
                
                this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                this.ctx.restore();
            });
            
            // Add fortune text if provided
            if (fortuneText) {
                this.addFortuneText(fortuneText);
            }
            
        } catch (error) {
            console.error('Error generating fragments:', error);
        }
    }

    // Enhanced helper to get a strategic focal point with improved aesthetic principles
    getStrategicFocalPoint() {
        // Prioritize strong composition templates (Rule of Thirds / Golden Ratio)
        let strategicPoints = this.focalPoints.filter(p => 
            this.selectedTemplate === 'ruleOfThirds' || this.selectedTemplate === 'goldenRatio'
        );
        
        if (strategicPoints.length > 0) {
            // Weight points by aesthetic importance
            const weightedPoints = strategicPoints.map(point => {
                // Calculate distance from center (normalized 0-1)
                const distFromCenter = Math.sqrt(
                    Math.pow(point.x - this.canvas.width/2, 2) + 
                    Math.pow(point.y - this.canvas.height/2, 2)
                ) / Math.sqrt(Math.pow(this.canvas.width/2, 2) + Math.pow(this.canvas.height/2, 2));
                
                // Points further from center (but not at edges) get higher weight
                // Creates more dynamic compositions
                const edgeProximity = Math.abs(0.5 - distFromCenter) * 2; // 0 at halfway, 1 at center or edge
                const weight = 1 - edgeProximity; // Higher weight for balanced distance
                
                return { point, weight };
            });
            
            // Sort by weight descending
            weightedPoints.sort((a, b) => b.weight - a.weight);
            
            // 70% chance to pick from top half of weighted points
            if (Math.random() < 0.7 && weightedPoints.length > 1) {
                const topHalf = weightedPoints.slice(0, Math.ceil(weightedPoints.length / 2));
                return topHalf[Math.floor(Math.random() * topHalf.length)].point;
            }
            
            return weightedPoints[Math.floor(Math.random() * weightedPoints.length)].point;
        } else if (this.focalPoints.length > 0) {
            // Fallback to any focal point if no thirds/GR points found
            return this.focalPoints[Math.floor(Math.random() * this.focalPoints.length)];
        } else {
            // Absolute fallback to center
            return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        }
    }
    
    generateLayers(images, fortuneText, parameters = {}) {
        // Use the class's images property if images parameter is not provided
        const imagesToUse = images || this.images;
        
        // Check if we have valid images
        if (!imagesToUse || !Array.isArray(imagesToUse) || imagesToUse.length === 0) {
            console.error('No valid images provided for layers generation');
            return;
        }
        
        console.log('Generating layers effect');
        console.log(`Layers: Using ${imagesToUse.length} images`);
        
        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.globalCompositeOperation = 'multiply';
        const isFocalStyle = this.selectedCompositionStyle === 'Focal';

        // Check if we have specific settings for layers
        const minLayers = this.parameters.minLayers || 3;
        const maxLayers = this.parameters.maxLayers || 6;
        const scaleVariationSettings = this.parameters.scaleVariation || { 
            focal: { min: 0.6, max: 1.2 }, 
            field: { min: 0.3, max: 0.7 } 
        };
        const minVisibility = this.parameters.minVisibility || 0.7;
        const opacityTargets = this.parameters.opacityTargets || { high: 0.35, full: 0.12 };

        // --- Calculate Layer Count based on parameters ---
        const baseLayerCalc = minLayers + Math.floor(Math.random() * (maxLayers - minLayers + 1));
        
        // Get scale variation based on style
        const scaleVariation = isFocalStyle ? 
            scaleVariationSettings.focal : 
            scaleVariationSettings.field;
        
        // Base scale and variation
        const baseScale = isFocalStyle ? 1.5 : 1.3;  // Increased from 1.2/1.0
        const scaleRange = scaleVariation.max - scaleVariation.min;
        
        // Adjust visibility settings
        const minVisibleScale = Math.max(1.0, minVisibility);  // Ensure minimum scale covers canvas
        
        // Adjust logic for composition flow
        const flowStrengthMultiplier = isFocalStyle ? 0.08 : 0.05;  // Reduced from 0.15/0.1
        const flowStrength = flowStrengthMultiplier * this.parameters.complexity;
        
        // Adjust opacity assignment
        const targetHighOpacity = Math.max(0.6, opacityTargets.high);  // Increased from 0.35
        const targetFullOpacity = Math.max(0.3, opacityTargets.full);  // Increased from 0.12
        
        // Adjust drawing process to maintain aspect ratio
        const ctx = this.ctx;
        const drawImage = this.drawImage.bind(this);

        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        let currentIndex = 0;

        const layers = [];
        // Generate layer data (WITHOUT forceOpacity initially)
        for (let i = 0; i < baseLayerCalc; i++) {
            const imageIndex = imageIndices[currentIndex % imageIndices.length];
            const image = this.images[imageIndex];
            currentIndex++;
            if (!image || !image.complete || image.naturalWidth === 0) continue;

            const isFocalCandidate = (i === 0);
            let scale = baseScale + Math.random() * scaleRange;
            scale = Math.max(minVisibleScale, scale);
            
            // Calculate dimensions with aspect ratio preservation and minimum visibility
            let width, height;
            if (image.naturalWidth / image.naturalHeight > this.canvas.width / this.canvas.height) {
                // Image is wider than canvas
                width = this.canvas.width * scale;
                height = width / (image.naturalWidth / image.naturalHeight);
            } else {
                // Image is taller than canvas
                height = this.canvas.height * scale;
                width = height * (image.naturalWidth / image.naturalHeight);
            }
            
            // Ensure at least 70% of the image is visible
            const minVisibleWidth = image.naturalWidth * 0.7;
            const minVisibleHeight = image.naturalHeight * 0.7;
            width = Math.max(minVisibleWidth, width);
            height = Math.max(minVisibleHeight, height);
            
            // Determine position with reduced offsets
            const baseOffsetX = (Math.random() - 0.5) * this.canvas.width * 0.04; // Adjusted from 0.05/0.03
            const baseOffsetY = (Math.random() - 0.5) * this.canvas.height * 0.04; // Adjusted from 0.05/0.03
            const cumulativeFlowX = flowStrength * i * this.canvas.width;
            const cumulativeFlowY = flowStrength * i * this.canvas.height;
            
            // Calculate position with better centering
            let x = (this.canvas.width * (1 - scale)) / 2 + baseOffsetX + cumulativeFlowX;
            let y = (this.canvas.height * (1 - scale)) / 2 + baseOffsetY + cumulativeFlowY;
            
            // Nudge focal layer towards strategic point only in Focal style
            if (isFocalStyle && isFocalCandidate) {
                 x += (this.getStrategicFocalPoint().x - x) * 0.08; // Adjusted from 0.1
                 y += (this.getStrategicFocalPoint().y - y) * 0.08; // Adjusted from 0.1
            }
            
            layers.push({ 
                image, x, y, scale, 
                isFocalCandidate: isFocalCandidate, 
                forceOpacity: null // Initialize opacity as null
            });
        }
        
        // --- Assign Opacities Probabilistically --- 
        let assignedMainFocal = false;

        // Assign 1.0 opacity to the designated focal layer
        if (0 >= 0 && 0 < layers.length) {
            layers[0].forceOpacity = 1.0;
            layers[0].isActuallyFocal = true;
            assignedMainFocal = true;
        }
         // Add fallback if needed (less likely here but good practice)
        if (!assignedMainFocal && layers.length > 0) {
            const forcedFocalIndex = Math.floor(Math.random() * layers.length);
            layers[forcedFocalIndex].forceOpacity = 1.0;
            layers[forcedFocalIndex].isActuallyFocal = true;
            console.warn("Layers: Had to force assign a 1.0 opacity layer.");
        }

        // Assign opacity to other layers
        layers.forEach((layer, index) => {
            if (layer.isActuallyFocal) return; // Skip the main one

            const rand = Math.random();
            if (rand < targetFullOpacity) {
                layer.forceOpacity = 1.0;
            } else if (rand < targetHighOpacity) {
                layer.forceOpacity = 0.6 + Math.random() * 0.3; // Adjusted from 0.7-1.0
            } else {
                layer.forceOpacity = 0.3 + Math.random() * 0.3; // Adjusted from 0.4-0.7
            }
             layer.isActuallyFocal = false; 
        });
        // --- End Opacity Assignment --- 
        
        // Sort layers: primarily by actual focal status, then scale
        layers.sort((a, b) => {
            if (a.isActuallyFocal && !b.isActuallyFocal) return 1; // Focal drawn last
            if (!a.isActuallyFocal && b.isActuallyFocal) return -1;
            return a.scale - b.scale; // Smaller scales drawn first (underneath)
        });

        // --- Drawing Layers --- 
        layers.forEach((layer) => {
            const { image, x, y, scale, forceOpacity } = layer;
            this.ctx.save();
            const contrast = 1 + (this.parameters.contrast / 10);
            // Adjusted brightness and saturation
            this.ctx.filter = `contrast(${contrast}) brightness(${isFocalStyle ? 1.02 : 1.04}) saturate(${isFocalStyle ? 1.03 : 1.02})`; 
            
            // Calculate dimensions with aspect ratio preservation
            const imgAspectRatio = image.naturalWidth / image.naturalHeight;
            const canvasAspectRatio = this.canvas.width / this.canvas.height;
            
            let width, height;
            if (imgAspectRatio > canvasAspectRatio) {
                // Image is wider than canvas
                width = this.canvas.width * scale;
                height = width / imgAspectRatio;
            } else {
                // Image is taller than canvas
                height = this.canvas.height * scale;
                width = height * imgAspectRatio;
            }
            
            // Ensure at least 70% of the image is visible
            const minVisibleWidth = image.naturalWidth * 0.7;
            const minVisibleHeight = image.naturalHeight * 0.7;
            width = Math.max(minVisibleWidth, width);
            height = Math.max(minVisibleHeight, height);
            
            // Center the image
            const centerX = x + (this.canvas.width - width) / 2;
            const centerY = y + (this.canvas.height - height) / 2;
            
            this.drawImage(image, centerX, centerY, width, height, false, forceOpacity);
            this.ctx.restore();
        });
    }
    
    save() {
        const link = document.createElement('a');
        link.download = 'assemblage-collage.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Selects a random composition style and template, then calculates focal points.
     */
    selectCompositionStyleAndTemplate() {
        // Select Composition Style (Focal or Field)
        this.selectedCompositionStyle = Math.random() < 0.5 ? 'Focal' : 'Field';
        
        // Select Template (used primarily for Focal, less so for Field)
        this.selectedTemplate = this.compositionTemplates[Math.floor(Math.random() * this.compositionTemplates.length)];
        
        // Calculate focal points based on the template
        this.focalPoints = this.getFocalPoints(this.selectedTemplate);
        
        // Apply Rule of Thirds and Visual Weight Distribution principles
        this.applyVisualWeightPrinciples();
        
        console.log(`Selected Style: ${this.selectedCompositionStyle}, Template: ${this.selectedTemplate}`, this.focalPoints);
    }

    /**
     * Calculates focal points based on the selected template.
     * @param {string} template - The name of the selected composition template.
     * @returns {Array<object>} An array of {x, y} coordinates for focal points.
     */
    /**
     * Applies visual weight principles to enhance composition quality.
     * Aligns with ideal parameters for visual balance.
     */
    applyVisualWeightPrinciples() {
        // 1. Scale Contrast: Ensure focal elements have enough size difference
        this.scaleContrastFactor = this.selectedCompositionStyle === 'Focal' ? 2.5 : 1.5;
        
        // 2. Density Control: Create balanced density gradient
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Create density map (virtual 3x3 grid)
        this.densityMap = [
            [0.7, 0.9, 0.7], // Top row
            [0.9, 1.0, 0.9], // Middle row
            [0.7, 0.9, 0.7]  // Bottom row
        ];
        
        // Apply template-specific density adjustments
        if (this.selectedTemplate === 'diagonalTLBR') {
            // Emphasize top-left to bottom-right diagonal
            this.densityMap[0][0] = 1.0; // Top-left
            this.densityMap[1][1] = 1.1; // Center
            this.densityMap[2][2] = 1.0; // Bottom-right
        } else if (this.selectedTemplate === 'diagonalTRBL') {
            // Emphasize top-right to bottom-left diagonal
            this.densityMap[0][2] = 1.0; // Top-right
            this.densityMap[1][1] = 1.1; // Center
            this.densityMap[2][0] = 1.0; // Bottom-left
        }
    }

    getFocalPoints(template) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const points = [];
        const GR = 1.61803398875; // Golden Ratio

        switch(template) {
            case 'center':
                points.push({ x: w / 2, y: h / 2 });
                break;
            case 'ruleOfThirds':
                const thirdW = w / 3;
                const thirdH = h / 3;
                points.push({ x: thirdW, y: thirdH });      
                points.push({ x: 2 * thirdW, y: thirdH });  
                points.push({ x: thirdW, y: 2 * thirdH });  
                points.push({ x: 2 * thirdW, y: 2 * thirdH });
                break;
            case 'diagonalTLBR': 
                 points.push({ x: w * 0.25, y: h * 0.25 });
                 points.push({ x: w * 0.5, y: h * 0.5 });
                 points.push({ x: w * 0.75, y: h * 0.75 });
                 break;
            case 'diagonalTRBL': 
                 points.push({ x: w * 0.75, y: h * 0.25 });
                 points.push({ x: w * 0.5, y: h * 0.5 });
                 points.push({ x: w * 0.25, y: h * 0.75 });
                 break;
            case 'goldenRatio':
                const grX1 = w / (GR * GR);
                const grX2 = w / GR;
                const grY1 = h / (GR * GR);
                const grY2 = h / GR;
                points.push({ x: grX1, y: grY1 }); // Top-Left Inner
                points.push({ x: grX2, y: grY1 }); // Top-Right Inner
                points.push({ x: grX1, y: grY2 }); // Bottom-Left Inner
                points.push({ x: grX2, y: grY2 }); // Bottom-Right Inner
                // Add outer points as well for more options
                points.push({ x: w - grX2, y: h - grY2 }); // Mirrored Bottom-Right 
                points.push({ x: w - grX1, y: h - grY2 }); // Mirrored Bottom-Left
                points.push({ x: w - grX2, y: h - grY1 }); // Mirrored Top-Right
                points.push({ x: w - grX1, y: h - grY1 }); // Mirrored Top-Left
                break;
            default: 
                 points.push({ x: w / 2, y: h / 2 });
        }
        // Add center point as a fallback if no others exist
        if (points.length === 0) {
             points.push({ x: w / 2, y: h / 2 });
        }
        return points;
    }

    // Helper function to shuffle arrays (used in multiple effects)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    redraw() {
        if (!this.currentEffect || this.images.length === 0) return;
        this.generate();
    }

    addFortuneText(fortuneText) {
        // Fortune text display removed in this version
        return;
    }

    /**
     * Generates a layered collage effect with 2-4 images that have significant overlap
     * and varying opacity levels to create depth.
     * 
     * @param {Array} images - The images to use in the collage
     * @param {string} fortuneText - Optional fortune text to add to the collage
     * @param {Object} parameters - Parameters for the effect
     */
    generateLayered(images, fortuneText, parameters = {}) {
        // Use the class's images property if images parameter is not provided
        const imagesToUse = images || this.images;
        
        // Check if we have valid images
        if (!imagesToUse || !Array.isArray(imagesToUse) || imagesToUse.length === 0) {
            console.error('No valid images provided for layered generation');
            return;
        }
        
        console.log('Generating layered effect');
        console.log(`Layered: Using ${imagesToUse.length} images`);
        
        // Set multiply blend mode for images
        this.ctx.globalCompositeOperation = 'multiply';
        
        // Determine number of layers (2-4)
        const numLayers = 2 + Math.floor(Math.random() * 3); // Random number between 2 and 4
        
        // Shuffle image indices to randomly select images
        const imageIndices = Array.from({length: this.images.length}, (_, i) => i);
        this.shuffleArray(imageIndices);
        
        // Create layers array to store image data
        const layers = [];
        
        // Generate layer data
        for (let i = 0; i < numLayers; i++) {
            const imageIndex = imageIndices[i % imageIndices.length];
            const image = this.images[imageIndex];
            
            if (!image || !image.complete || image.naturalWidth === 0) continue;
            
            // Calculate scale to ensure full bleed across canvas
            // We'll use a scale that's slightly larger than the canvas to ensure full coverage
            const scale = 1.1 + Math.random() * 0.2; // Scale between 1.1 and 1.3
            
            // Calculate dimensions with aspect ratio preservation
            const imgAspectRatio = image.naturalWidth / image.naturalHeight;
            const canvasAspectRatio = this.canvas.width / this.canvas.height;
            
            let width, height;
            if (imgAspectRatio > canvasAspectRatio) {
                // Image is wider than canvas
                width = this.canvas.width * scale;
                height = width / imgAspectRatio;
            } else {
                // Image is taller than canvas
                height = this.canvas.height * scale;
                width = height * imgAspectRatio;
            }
            
            // Calculate position with slight offset for layering effect
            // We want at least 70% overlap between images
            const maxOffset = Math.min(width, height) * 0.3; // 30% of the smaller dimension
            const offsetX = (Math.random() - 0.5) * maxOffset;
            const offsetY = (Math.random() - 0.5) * maxOffset;
            
            // Center the image with the offset
            const x = (this.canvas.width - width) / 2 + offsetX;
            const y = (this.canvas.height - height) / 2 + offsetY;
            
            // Determine opacity - one image should be at least 80% opacity
            // The rest should be lower for the layered effect
            let opacity;
            if (i === 0) {
                // First image gets higher opacity (80-100%)
                opacity = 0.8 + Math.random() * 0.2;
            } else {
                // Other images get lower opacity (30-70%)
                opacity = 0.3 + Math.random() * 0.4;
            }
            
            layers.push({
                image,
                x,
                y,
                width,
                height,
                opacity
            });
        }
        
        // Sort layers by opacity (lower opacity drawn first)
        layers.sort((a, b) => a.opacity - b.opacity);
        
        // Draw layers
        layers.forEach(layer => {
            const { image, x, y, width, height, opacity } = layer;
            
            this.ctx.save();
            
            // Apply contrast enhancement
            const contrastLevel = this.parameters.contrast / 10;
            this.ctx.filter = `contrast(${1 + contrastLevel})`;
            
            // Set opacity
            this.ctx.globalAlpha = opacity;
            
            // Draw the image
            this.ctx.drawImage(image, x, y, width, height);
            
            this.ctx.restore();
        });
    }
}

export default CollageGenerator; 