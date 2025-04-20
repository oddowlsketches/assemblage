import { FragmentsGenerator } from './js/collage/fragmentsGenerator.js';
import { NarrativeCompositionManager } from './narrativeCompositionManager.js';

export class NarrativeTest {
    constructor() {
        // Store the instance globally
        window.narrativeTest = this;
        
        // Initialize properties
        this.images = [];
        this.metadata = [];
        this.standardFragments = [];
        this.narrativeFragments = [];
        
        // Initialize parameters with default values
        this.parameters = {
            // Composition parameters
            compositionType: 'multiple-actors',
            flowPattern: 'circular',
            
            // Fragment selection parameters
            fragmentCount: {
                multipleActors: 6,
                journey: 8,
                conflict: 6,
                hierarchy: 4,
                default: 6
            },
            
            // Size distribution parameters
            sizeDistribution: {
                largeRatio: 0.3,
                mediumRatio: 0.5,
                smallRatio: 0.2
            },
            
            // Rotation parameters
            rotation: {
                multipleActors: { min: -45, max: 45 },
                journey: { min: -30, max: 30 },
                conflict: { min: -30, max: 30 },
                hierarchy: { min: -15, max: 15 },
                default: { min: -20, max: 20 }
            },
            
            // Opacity parameters
            opacity: {
                min: 0.4,
                max: 1.0,
                variation: 0.3
            },
            
            // Flow pattern parameters
            flowPatternParams: {
                circular: {
                    radius: 0.35,
                    rotationOffset: Math.PI / 2,
                    spacing: 0.1
                },
                spiral: {
                    startRadius: 0.1,
                    endRadius: 0.35,
                    rotations: 4,
                    spacing: 0.05
                },
                wave: {
                    amplitude: 100,
                    frequency: 4,
                    phase: 0
                },
                linear: {
                    spacing: 0.1
                },
                zigzag: {
                    amplitude: 100,
                    frequency: 1,
                    phase: 0
                }
            },
            
            // Theme parameters for future LLM integration
            theme: {
                mood: 'neutral',
                emphasis: 'balanced',
                complexity: 'moderate',
                style: 'classic'
            }
        };
        
        // Get canvas elements
        this.standardCanvas = document.getElementById('standardCanvas');
        this.narrativeCanvas = document.getElementById('narrativeCanvas');
        
        if (!this.standardCanvas || !this.narrativeCanvas) {
            console.error('Canvas elements not found');
            return;
        }
        
        // Set canvas dimensions
        this.standardCanvas.width = 800;
        this.standardCanvas.height = 600;
        this.narrativeCanvas.width = 800;
        this.narrativeCanvas.height = 600;
        
        // Get contexts
        this.standardCtx = this.standardCanvas.getContext('2d');
        this.narrativeCtx = this.narrativeCanvas.getContext('2d');
        
        // Initialize generators
        this.standardGenerator = new FragmentsGenerator(this.standardCtx, this.standardCanvas);
        this.narrativeManager = new NarrativeCompositionManager();
        
        // Get status message element
        this.statusMessage = document.getElementById('statusMessage');
        
        // Initialize UI controls
        this.initializeControls();
    }
    
    async init() {
        try {
            // Load metadata
            const response = await fetch('/images/metadata.json');
            this.metadata = await response.json();
            
            // Load images
            await this.loadImages();
            
            // Generate initial collages
            await this.generateCollage();
            
            this.updateStatus('Initialization complete', 'success');
        } catch (error) {
            console.error('Error initializing:', error);
            this.updateStatus('Error initializing: ' + error.message, 'error');
        }
    }
    
    async loadImages() {
        try {
            this.updateStatus('Loading images...', 'info');
            
            // Load a subset of images for testing
            const imagePromises = this.metadata.slice(0, 20).map(meta => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Failed to load image: ${meta.src}`));
                    img.src = `/images/collages/${meta.src}`;
                });
            });
            
            this.images = await Promise.all(imagePromises);
            this.updateStatus(`Loaded ${this.images.length} images`, 'success');
        } catch (error) {
            console.error('Error loading images:', error);
            this.updateStatus('Error loading images: ' + error.message, 'error');
        }
    }
    
    initializeControls() {
        // Add event listeners for controls
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateCollage();
        });
        
        // Add event listeners for composition type and flow pattern
        const compositionTypeSelect = document.getElementById('compositionType');
        const flowPatternSelect = document.getElementById('flowPattern');
        
        if (compositionTypeSelect) {
            compositionTypeSelect.addEventListener('change', (e) => {
                this.parameters.compositionType = e.target.value;
                this.generateCollage();
            });
        }
        
        if (flowPatternSelect) {
            flowPatternSelect.addEventListener('change', (e) => {
                this.parameters.flowPattern = e.target.value;
                this.generateCollage();
            });
        }
    }
    
    async generateCollage() {
        try {
            this.updateStatus('Generating collages...', 'info');
            
            // Generate standard fragments
            this.standardFragments = this.standardGenerator.generateFragments(this.images, {
                variation: 'Classic',
                complexity: 5,
                maxFragments: 20
            });
            
            // Draw standard fragments
            this.drawFragments(this.standardCtx, this.standardFragments, false);
            
            // Create narrative fragments
            const compositionType = document.getElementById('compositionType').value;
            const flowPattern = document.getElementById('flowPattern').value;
            
            console.log(`Using composition type: ${compositionType}, flow pattern: ${flowPattern}`);
            
            // Select fragments for narrative composition
            const selectedFragments = this.selectFragmentsForNarrative(this.standardFragments);
            
            // Use our own enhanceComposition method instead of the one from NarrativeCompositionManager
            this.narrativeFragments = this.enhanceComposition(selectedFragments, compositionType, flowPattern);
            
            // Draw narrative fragments
            this.drawFragments(this.narrativeCtx, this.narrativeFragments, true);
            
            this.updateStatus(`Generated collages with ${this.standardFragments.length} standard fragments and ${this.narrativeFragments.length} narrative fragments`, 'success');
        } catch (error) {
            console.error('Error generating collages:', error);
            this.updateStatus('Error generating collages: ' + error.message, 'error');
        }
    }
    
    selectFragmentsForNarrative(fragments) {
        // Get composition type
        const compositionType = document.getElementById('compositionType').value;
        
        // Sort fragments by size
        const sortedFragments = [...fragments].sort((a, b) => {
                    const areaA = a.width * a.height;
                    const areaB = b.width * b.height;
            return areaB - areaA;
        });
        
        // Calculate size distribution
                const areas = sortedFragments.map(f => f.width * f.height);
                const maxArea = Math.max(...areas);
                const minArea = Math.min(...areas);
                const sizeRange = maxArea - minArea;
                
        // Define size categories
        const largeCutoff = minArea + sizeRange * 0.6;
                const smallCutoff = minArea + sizeRange * 0.3;
                
        // Group fragments by size
                const largeFragments = sortedFragments.filter(f => (f.width * f.height) >= largeCutoff);
                const mediumFragments = sortedFragments.filter(f => {
                    const area = f.width * f.height;
                    return area < largeCutoff && area > smallCutoff;
                });
                const smallFragments = sortedFragments.filter(f => (f.width * f.height) <= smallCutoff);
                
        // Get target fragment count from parameters
        const targetFragmentCount = this.parameters.fragmentCount[compositionType] || 
                                   this.parameters.fragmentCount.default;
        
        console.log(`[DEBUG] Target fragment count for ${compositionType}: ${targetFragmentCount}`);
        
        // Get size distribution ratios from parameters
        const { largeRatio, mediumRatio, smallRatio } = this.parameters.sizeDistribution;
        
        // Select fragments based on composition type
        let selectedFragments = [];
        
        switch (compositionType) {
            case 'multiple-actors':
                // Multiple actors: balanced mix of sizes
                const largeCount = Math.min(2, Math.ceil(targetFragmentCount * largeRatio));
                const mediumCount = Math.min(3, Math.ceil(targetFragmentCount * mediumRatio));
                const smallCount = targetFragmentCount - largeCount - mediumCount;
                    
                    selectedFragments = [
                    ...largeFragments.slice(0, largeCount),
                    ...mediumFragments.slice(0, mediumCount),
                    ...smallFragments.slice(0, smallCount)
                ];
                break;
                
            case 'journey':
                // Journey: more medium fragments for flow
                selectedFragments = [
                    ...largeFragments.slice(0, 1),
                    ...mediumFragments.slice(0, Math.ceil(targetFragmentCount * 0.6)),
                    ...smallFragments.slice(0, Math.floor(targetFragmentCount * 0.3))
                ];
                break;
                
            case 'conflict':
                // Conflict: equal number of large fragments on each side
                const halfCount = Math.floor(targetFragmentCount / 2);
                selectedFragments = [
                    ...largeFragments.slice(0, halfCount),
                    ...mediumFragments.slice(0, targetFragmentCount - halfCount)
                ];
                break;
                
            case 'hierarchy':
                // Hierarchy: one large, one medium, rest small
                selectedFragments = [
                    ...largeFragments.slice(0, 1),
                    ...mediumFragments.slice(0, 1),
                    ...smallFragments.slice(0, targetFragmentCount - 2)
                ];
                        break;
                
            default:
                // Default: balanced mix
                const defaultLargeCount = Math.min(2, Math.ceil(targetFragmentCount * largeRatio));
                const defaultMediumCount = Math.min(3, Math.ceil(targetFragmentCount * mediumRatio));
                const defaultSmallCount = targetFragmentCount - defaultLargeCount - defaultMediumCount;
                
                selectedFragments = [
                    ...largeFragments.slice(0, defaultLargeCount),
                    ...mediumFragments.slice(0, defaultMediumCount),
                    ...smallFragments.slice(0, defaultSmallCount)
                ];
        }
        
        console.log(`Selected ${selectedFragments.length} fragments for ${compositionType} composition`);
        
        return selectedFragments;
    }
    
    drawFragments(ctx, fragments, isNarrative) {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Set background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Sort fragments by depth
        const sortedFragments = [...fragments].sort((a, b) => a.depth - b.depth);
        
        // Get composition type for narrative fragments
        let compositionType = 'multiple-actors';
        if (isNarrative) {
            compositionType = document.getElementById('compositionType').value;
            console.log(`[DEBUG] Drawing narrative fragments with composition type: ${compositionType}`);
        }
        
        // Draw each fragment
        sortedFragments.forEach((fragment, index) => {
            const img = this.images[fragment.img];
            if (!img || !img.complete) {
                console.warn('Skipping incomplete image:', fragment.img);
                return;
            }

            ctx.save();

            // Set opacity based on composition type
            if (isNarrative) {
                // Use the fragment's opacity property directly
                ctx.globalAlpha = fragment.opacity || 0.8;
                console.log(`[DEBUG] Fragment ${index} opacity: ${fragment.opacity || 0.8}`);
            } else {
                ctx.globalAlpha = 0.9;
            }
            
            // Set blend mode to multiply
            ctx.globalCompositeOperation = 'multiply';
            
            // Apply rotation
            if (fragment.rotation) {
                const centerX = fragment.x + fragment.width / 2;
                const centerY = fragment.y + fragment.height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(fragment.rotation * Math.PI / 180);
                ctx.translate(-centerX, -centerY);
                console.log(`[DEBUG] Fragment ${index} rotation: ${fragment.rotation}`);
            }
            
            // Draw the image
                ctx.drawImage(
                img,
                fragment.x,
                fragment.y,
                fragment.width,
                fragment.height
            );

            ctx.restore();
        });
        
        // Log fragment details
        console.log(`Drew ${sortedFragments.length} fragments for ${isNarrative ? 'narrative' : 'standard'} composition`);
        sortedFragments.forEach((f, i) => {
            console.log(`Fragment ${i + 1}:`, {
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height,
                rotation: f.rotation,
                opacity: f.opacity,
                depth: f.depth
            });
        });
    }
    
    updateStatus(message, type = 'info') {
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = type;
        }
        console.log(`[${type}] ${message}`);
    }
    
    // Helper method to get specific parameters for each composition type
    getCompositionTypeParams(compositionType) {
        switch (compositionType) {
            case 'multiple-actors':
                return {
                    focalScale: 1.8,
                    depthOpacity: true,
                    depthOpacityRange: 0.3,
                    relationshipStrength: 0.9
                };
            case 'journey':
                return {
                    focalScale: 1.5,
                    depthOpacity: true,
                    depthOpacityRange: 0.4,
                    flowIntensity: 0.8,
                    movementDirection: 'horizontal'
                };
            case 'conflict':
                return {
                    focalScale: 1.6,
                    depthOpacity: true,
                    depthOpacityRange: 0.5,
                    tensionPoints: 2,
                    negativeSpaceRatio: 0.4
                };
            case 'hierarchy':
                return {
                    focalScale: 2.0,
                    depthOpacity: true,
                    depthOpacityRange: 0.6,
                    foregroundEmphasis: 1.8,
                    backgroundBlur: 0.4
                };
            default:
                return {};
        }
    }
    
    // Helper method to get specific parameters for each flow pattern
    getFlowPatternParams(flowPattern) {
        // Get base parameters from our parameter system
        const baseParams = this.parameters.flowPatternParams[flowPattern] || this.parameters.flowPatternParams.linear;
        
        // Create a deep copy of the parameters
        const params = JSON.parse(JSON.stringify(baseParams));
        
        // Scale parameters based on canvas dimensions
        const minDimension = Math.min(this.narrativeCanvas.width, this.narrativeCanvas.height);
        
        // Apply scaling to parameters that need it
        if (flowPattern === 'circular') {
            params.radius = minDimension * params.radius;
        } else if (flowPattern === 'spiral') {
            params.startRadius = minDimension * params.startRadius;
            params.endRadius = minDimension * params.endRadius;
        } else if (flowPattern === 'wave' || flowPattern === 'zigzag') {
            params.amplitude = minDimension * 0.2;
            params.verticalOffset = this.narrativeCanvas.height / 2;
        } else if (flowPattern === 'linear') {
            params.startX = 0;
            params.endX = this.narrativeCanvas.width;
            params.y = this.narrativeCanvas.height / 2;
        }
        
        return params;
    }
    
    enhanceComposition(fragments, compositionType, flowPattern) {
        console.log(`[DEBUG] Enhancing composition with type: ${compositionType}, flow pattern: ${flowPattern}, fragments: ${fragments.length}`);
        
        // Get canvas dimensions
        const centerX = this.narrativeCanvas.width / 2;
        const centerY = this.narrativeCanvas.height / 2;
        
        // Get flow pattern parameters
        const flowParams = this.getFlowPatternParams(flowPattern);
        console.log(`[DEBUG] Flow pattern parameters:`, flowParams);
        
        // Clear any existing transformations
        fragments.forEach(fragment => {
            // Reset any existing transformations
            fragment.originalWidth = fragment.width;
            fragment.originalHeight = fragment.height;
            fragment.originalX = fragment.x;
            fragment.originalY = fragment.y;
            fragment.originalRotation = fragment.rotation || 0;
            fragment.originalOpacity = fragment.opacity || 0.8;
        });
        
        // Get rotation parameters for this composition type
        const rotationParams = this.parameters.rotation[compositionType] || this.parameters.rotation.default;
        const { min: rotationMin, max: rotationMax } = rotationParams;
        
        // Get opacity parameters
        const { min: opacityMin, max: opacityMax, variation: opacityVariation } = this.parameters.opacity;
        
        // First, apply composition type specific adjustments
        switch (compositionType) {
            case 'multiple-actors':
                console.log('[DEBUG] Applying multiple-actors composition');
                // Multiple actors: arrange in a dynamic group with varying sizes and rotations
                fragments.forEach((fragment, index) => {
                    // Create a circular arrangement with random variations
                    const angle = (index / fragments.length) * Math.PI * 2;
                    const radius = Math.min(this.narrativeCanvas.width, this.narrativeCanvas.height) * 0.3;
                    const randomOffset = (Math.random() - 0.5) * 150;
                    
                    // Position in a circle with random variations
                    fragment.x = centerX + Math.cos(angle) * radius + randomOffset - fragment.width / 2;
                    fragment.y = centerY + Math.sin(angle) * radius + randomOffset - fragment.height / 2;
                    
                    // Random rotation for dynamic feel, but keep it moderate
                    fragment.rotation = rotationMin + Math.random() * (rotationMax - rotationMin);
                    
                    // Vary opacity slightly
                    fragment.opacity = opacityMin + Math.random() * opacityVariation;
                    
                    // Vary size slightly
                    const sizeVariation = 0.7 + Math.random() * 0.6;
                    fragment.width = fragment.originalWidth * sizeVariation;
                    fragment.height = fragment.originalHeight * sizeVariation;
                });
                break;
                
            case 'journey':
                console.log('[DEBUG] Applying journey composition');
                // Journey: arrange in a path with progression
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    
                    // Position along a path from left to right with a wave
                    fragment.x = progress * this.narrativeCanvas.width * 0.8 - fragment.width / 2;
                    fragment.y = centerY + Math.sin(progress * Math.PI * 4) * 200 - fragment.height / 2;
                    
                    // Rotation follows the path, but keep it subtle
                    fragment.rotation = Math.sin(progress * Math.PI * 4) * (rotationMax - rotationMin) / 2;
                    
                    // Size and opacity increase along the journey
                    const scale = 0.5 + progress * 1.0;
                    fragment.width = fragment.originalWidth * scale;
                    fragment.height = fragment.originalHeight * scale;
                    fragment.opacity = opacityMin + progress * (opacityMax - opacityMin);
                });
                break;
                
            case 'conflict':
                console.log('[DEBUG] Applying conflict composition');
                // Conflict: arrange in opposing groups
                fragments.forEach((fragment, index) => {
                    const isLeftSide = index < fragments.length / 2;
                    const sideProgress = isLeftSide ? 
                        index / (fragments.length / 2) : 
                        (index - fragments.length / 2) / (fragments.length / 2);
                    
                    // Position on left or right side
                    const baseX = isLeftSide ? 
                        centerX - this.narrativeCanvas.width * 0.35 : 
                        centerX + this.narrativeCanvas.width * 0.35;
                    
                    fragment.x = baseX - fragment.width / 2;
                    fragment.y = centerY + (sideProgress - 0.5) * 500 - fragment.height / 2;
                    
                    // Rotation tilts toward or away from center, but keep it moderate
                    fragment.rotation = isLeftSide ? rotationMax / 2 : -rotationMax / 2;
                    
                    // Higher contrast opacity
                    fragment.opacity = opacityMin + Math.random() * (opacityMax - opacityMin);
                    
                    // Slightly larger fragments for impact
                    const sizeVariation = 1.0 + Math.random() * 0.5;
                    fragment.width = fragment.originalWidth * sizeVariation;
                    fragment.height = fragment.originalHeight * sizeVariation;
                });
                break;
                
            case 'hierarchy':
                console.log('[DEBUG] Applying hierarchy composition');
                // Hierarchy: stack with size and position indicating importance
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    
                    // Center position with vertical stacking
                    fragment.x = centerX - fragment.width / 2;
                    fragment.y = centerY + (progress - 0.5) * 600 - fragment.height / 2;
                    
                    // Minimal rotation for stability
                    fragment.rotation = rotationMin + Math.random() * (rotationMax - rotationMin) * 0.5;
                    
                    // Size and opacity indicate importance
                    const scale = 1.8 - progress * 1.2;
                    fragment.width = fragment.originalWidth * scale;
                    fragment.height = fragment.originalHeight * scale;
                    fragment.opacity = opacityMin + progress * (opacityMax - opacityMin);
                });
                break;
                
            default:
                console.log('[DEBUG] Applying default composition');
                // Default: simple grid arrangement
                fragments.forEach((fragment, index) => {
                    const cols = Math.ceil(Math.sqrt(fragments.length));
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    
                    fragment.x = (col / cols) * this.narrativeCanvas.width - fragment.width / 2;
                    fragment.y = (row / cols) * this.narrativeCanvas.height - fragment.height / 2;
                    fragment.rotation = 0;
                    fragment.opacity = opacityMax;
                });
        }
        
        // Then, apply flow pattern adjustments
        console.log(`[DEBUG] Applying flow pattern: ${flowPattern}`);
        switch (flowPattern) {
            case 'circular':
                // Apply circular flow pattern
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    const angle = progress * Math.PI * 2 + flowParams.rotationOffset;
                    const radius = flowParams.radius;
                    
                    // Calculate new position based on circular pattern
                    const newX = centerX + Math.cos(angle) * radius;
                    const newY = centerY + Math.sin(angle) * radius;
                    
                    // Blend with existing position (70% flow pattern, 30% original)
                    fragment.x = fragment.x * 0.3 + newX * 0.7 - fragment.width / 2;
                    fragment.y = fragment.y * 0.3 + newY * 0.7 - fragment.height / 2;
                    
                    // Adjust rotation to follow the circle, but keep it moderate
                    fragment.rotation = fragment.rotation * 0.7 + (angle * 180 / Math.PI) * 0.3;
                    
                    console.log(`[DEBUG] Fragment ${index} circular flow:`, {
                        x: fragment.x,
                        y: fragment.y,
                        rotation: fragment.rotation
                    });
                });
                break;
                
            case 'spiral':
                // Apply spiral flow pattern
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    const angle = progress * Math.PI * 2 * flowParams.rotations;
                    const radius = flowParams.startRadius + (flowParams.endRadius - flowParams.startRadius) * progress;
                    
                    // Calculate new position based on spiral pattern
                    const newX = centerX + Math.cos(angle) * radius;
                    const newY = centerY + Math.sin(angle) * radius;
                    
                    // Blend with existing position (70% flow pattern, 30% original)
                    fragment.x = fragment.x * 0.3 + newX * 0.7 - fragment.width / 2;
                    fragment.y = fragment.y * 0.3 + newY * 0.7 - fragment.height / 2;
                    
                    // Adjust rotation to follow the spiral, but keep it moderate
                    fragment.rotation = fragment.rotation * 0.7 + (angle * 180 / Math.PI) * 0.3;
                    
                    console.log(`[DEBUG] Fragment ${index} spiral flow:`, {
                        x: fragment.x,
                        y: fragment.y,
                        rotation: fragment.rotation
                    });
                });
                break;
                
            case 'wave':
                // Apply wave flow pattern
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    const wave = Math.sin(progress * Math.PI * 2 * flowParams.frequency + flowParams.phase);
                    
                    // Calculate new position based on wave pattern
                    const newX = progress * this.narrativeCanvas.width;
                    const newY = flowParams.verticalOffset + wave * flowParams.amplitude;
                    
                    // Blend with existing position (70% flow pattern, 30% original)
                    fragment.x = fragment.x * 0.3 + newX * 0.7 - fragment.width / 2;
                    fragment.y = fragment.y * 0.3 + newY * 0.7 - fragment.height / 2;
                    
                    // Adjust rotation to follow the wave, but keep it moderate
                    fragment.rotation = fragment.rotation * 0.7 + (wave * 20) * 0.3;
                    
                    console.log(`[DEBUG] Fragment ${index} wave flow:`, {
                        x: fragment.x,
                        y: fragment.y,
                        rotation: fragment.rotation
                    });
                });
                break;
                
            case 'linear':
                // Apply linear flow pattern
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    
                    // Calculate new position based on linear pattern
                    const newX = flowParams.startX + (flowParams.endX - flowParams.startX) * progress;
                    const newY = flowParams.y;
                    
                    // Blend with existing position (70% flow pattern, 30% original)
                    fragment.x = fragment.x * 0.3 + newX * 0.7 - fragment.width / 2;
                    fragment.y = fragment.y * 0.3 + newY * 0.7 - fragment.height / 2;
                    
                    // Minimal rotation adjustment
                    fragment.rotation = fragment.rotation * 0.9;
                    
                    console.log(`[DEBUG] Fragment ${index} linear flow:`, {
                        x: fragment.x,
                        y: fragment.y,
                        rotation: fragment.rotation
                    });
                });
                break;
                
            case 'zigzag':
                // Apply zigzag flow pattern
                fragments.forEach((fragment, index) => {
                    const progress = index / (fragments.length - 1);
                    const zigzag = Math.sin(progress * Math.PI * 2 * flowParams.frequency + flowParams.phase);
                    
                    // Calculate new position based on zigzag pattern
                    const newX = progress * this.narrativeCanvas.width;
                    const newY = flowParams.verticalOffset + zigzag * flowParams.amplitude;
                    
                    // Blend with existing position (70% flow pattern, 30% original)
                    fragment.x = fragment.x * 0.3 + newX * 0.7 - fragment.width / 2;
                    fragment.y = fragment.y * 0.3 + newY * 0.7 - fragment.height / 2;
                    
                    // Adjust rotation to follow the zigzag, but keep it moderate
                    fragment.rotation = fragment.rotation * 0.7 + (zigzag * 15) * 0.3;
                    
                    console.log(`[DEBUG] Fragment ${index} zigzag flow:`, {
                        x: fragment.x,
                        y: fragment.y,
                        rotation: fragment.rotation
                    });
                });
                break;
        }
        
        return fragments;
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.narrativeTest = new NarrativeTest();
    window.narrativeTest.init();
});
