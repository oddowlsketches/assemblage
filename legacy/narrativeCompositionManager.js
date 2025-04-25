/**
 * Narrative Composition Manager
 * Enhances collage compositions with narrative-focused layout and depth
 */

import { LLMCompositionEnhancer } from './js/llmCompositionEnhancer.js';

export class NarrativeCompositionManager {
    constructor(parameters = {}) {
        this.parameters = {
            // Visual Style
            backgroundColor: parameters.backgroundColor || null,
            blendMode: parameters.blendMode || 'multiply',
            backgroundColors: [
                '#f5e6e8', '#e6f5f0', '#f0e6f5', '#f5f0e6', '#e6e6f5',
                '#f5e6f0', '#e6f5f5', '#f5f5e6', '#e6e6e6', '#f5f5f5'
            ],
            
            // Composition Structure
            compositionType: parameters.compositionType || 'multiple-actors',
            flowPattern: parameters.flowPattern || 'left-to-right',
            rotationStrategy: parameters.rotationStrategy || 'relationship',
            maxRotation: parameters.maxRotation || 45,
            allowEdgeOverflow: parameters.allowEdgeOverflow !== false,
            
            // Element Management
            elementCount: parameters.elementCount || 7,
            overlapRatio: parameters.overlapRatio || 0.2,
            sizeVariation: parameters.sizeVariation || 3.5,
            focalScale: parameters.focalScale || 1.8,
            
            // Depth and Layering
            depthOpacity: parameters.depthOpacity !== false,
            depthOpacityRange: parameters.depthOpacityRange || 0.2,
            depthLayers: parameters.depthLayers || 3,
            
            // Narrative Focus
            foregroundEmphasis: parameters.foregroundEmphasis || 1.5,
            backgroundBlur: parameters.backgroundBlur || 0.3,
            narrativeFocus: parameters.narrativeFocus || 'protagonist',
            
            // Composition Style
            compositionStyle: parameters.compositionStyle || 'journey',
            negativeSpaceRatio: parameters.negativeSpaceRatio || 0.3,
            relationshipStrength: parameters.relationshipStrength || 0.8,
            
            // Flow and Movement
            flowIntensity: parameters.flowIntensity || 0.7,
            movementDirection: parameters.movementDirection || 'horizontal',
            tensionPoints: parameters.tensionPoints || 3,
            
            // LLM Integration
            useLLM: parameters.useLLM !== false,
            llmParameters: parameters.llmParameters || {}
        };

        // Initialize canvas dimensions from parameters or use defaults
        this.canvas = {
            width: parameters.canvasWidth || window.innerWidth || 1200,
            height: parameters.canvasHeight || window.innerHeight || 800
        };
        
        // Initialize LLM enhancer if enabled
        if (this.parameters.useLLM) {
            this.llmEnhancer = new LLMCompositionEnhancer(this.parameters.llmParameters);
        }
    }

    /**
     * Enhances a set of fragments with narrative composition
     * @param {Array} fragments - The fragments to enhance
     * @param {Object} parameters - Optional parameters to override defaults
     * @returns {Object} - Enhanced fragments and metadata
     */
    enhanceComposition(fragments, parameters = {}) {
        try {
            // Validate input
            if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
                throw new Error('Invalid fragments array');
            }

            // Create a deep copy of fragments to avoid modifying the original
            let enhancedFragments = JSON.parse(JSON.stringify(fragments));

            // Randomly select a subset of fragments if maxFragments is specified
            if (parameters.maxFragments && enhancedFragments.length > parameters.maxFragments) {
                const shuffled = [...enhancedFragments].sort(() => Math.random() - 0.5);
                enhancedFragments = shuffled.slice(0, parameters.maxFragments);
            }

            // Identify foreground and background elements
            const { foreground, background } = this.identifyForegroundBackground(enhancedFragments);

            // Select a protagonist from foreground elements
            const protagonist = foreground[Math.floor(Math.random() * foreground.length)];

            // Determine composition type - default to 'multiple-actors' if not specified
            const compositionType = parameters.compositionType || 'multiple-actors';
            console.log('Applying composition type:', compositionType);
            
            // Apply narrative composition based on type
            switch (compositionType) {
                case 'multiple-actors':
                    // Position protagonist near the center
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    
                    // Position protagonist with controlled variation
                    protagonist.x = centerX - protagonist.width/2 + (Math.random() - 0.5) * 30;
                    protagonist.y = centerY - protagonist.height/2 + (Math.random() - 0.5) * 30;
                    protagonist.scale = 1.6;
                    protagonist.opacity = 1.0;
                    
                    // Position other fragments across the canvas
                    const otherFragments = enhancedFragments.filter(f => f !== protagonist);
                    
                    // Define canvas regions for better distribution
                    const regions = [
                        { x: 0, y: 0, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width/3, y: 0, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width*2/3, y: 0, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: 0, y: this.canvas.height/3, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width/3, y: this.canvas.height/3, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width*2/3, y: this.canvas.height/3, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: 0, y: this.canvas.height*2/3, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width/3, y: this.canvas.height*2/3, width: this.canvas.width/3, height: this.canvas.height/3 },
                        { x: this.canvas.width*2/3, y: this.canvas.height*2/3, width: this.canvas.width/3, height: this.canvas.height/3 }
                    ];
                    
                    // Shuffle regions to avoid predictable patterns
                    const shuffledRegions = [...regions].sort(() => Math.random() - 0.5);
                    
                    // Distribute fragments across regions with improved positioning
                    otherFragments.forEach((fragment, index) => {
                        const region = shuffledRegions[index % shuffledRegions.length];
                        const padding = 20; // Increased padding for better spacing
                        
                        // Calculate base position within region
                        let baseX = region.x + padding + Math.random() * (region.width - fragment.width - padding * 2);
                        let baseY = region.y + padding + Math.random() * (region.height - fragment.height - padding * 2);
                        
                        // Add controlled randomization to position
                        const randomOffset = 15; // Reduced random offset for more controlled placement
                        fragment.x = baseX + (Math.random() - 0.5) * randomOffset;
                        fragment.y = baseY + (Math.random() - 0.5) * randomOffset;
                        
                        // Ensure fragments stay within canvas bounds
                        fragment.x = Math.max(padding, Math.min(this.canvas.width - fragment.width - padding, fragment.x));
                        fragment.y = Math.max(padding, Math.min(this.canvas.height - fragment.height - padding, fragment.y));
                        
                        // Adjust scale based on distance from center with more balanced scaling
                        const distanceFromCenter = Math.sqrt(
                            Math.pow(fragment.x - centerX, 2) + 
                            Math.pow(fragment.y - centerY, 2)
                        );
                        const distanceRatio = distanceFromCenter / (Math.min(this.canvas.width, this.canvas.height) / 2);
                        fragment.scale = 0.9 + (distanceRatio * 0.2); // More balanced scale range
                        
                        // Set opacity and rotation with controlled variation
                        fragment.opacity = 0.85 + (Math.random() * 0.15);
                        // Temporarily comment out rotation to test bias
                        // fragment.rotation = (Math.random() - 0.5) * 20; // Reduced rotation range
                    });
                    break;

                case 'journey':
                    // Create a dynamic journey composition with strong visual flow
                    const journeyStartX = this.canvas.width * 0.08;
                    const journeyEndX = this.canvas.width * 0.92;
                    const spacing = (journeyEndX - journeyStartX) / (enhancedFragments.length - 1);
                    
                    // Define multiple paths with overlapping segments for visual continuity
                    const paths = [
                        { startY: this.canvas.height * 0.12, amplitude: this.canvas.height * 0.25, phase: 0 }, // Upper primary path
                        { startY: this.canvas.height * 0.38, amplitude: this.canvas.height * 0.18, phase: Math.PI/4 }, // Middle-upper path, offset phase
                        { startY: this.canvas.height * 0.62, amplitude: this.canvas.height * 0.18, phase: Math.PI/2 }, // Middle-lower path, offset phase
                        { startY: this.canvas.height * 0.88, amplitude: this.canvas.height * 0.25, phase: Math.PI/1.5 }  // Lower path, offset phase
                    ];
                    
                    // Distribute fragments with more intentional relationships
                    const fragmentsPerPath = Math.ceil(enhancedFragments.length / paths.length);
                    
                    // First, sort fragments by size to create more meaningful progression
                    const sortedFragments = [...enhancedFragments].sort((a, b) => {
                        // Random sort with 70% size influence, 30% random
                        const sizeA = a.width * a.height;
                        const sizeB = b.width * b.height;
                        return 0.7 * (sizeA - sizeB) + 0.3 * (Math.random() - 0.5);
                    });
                    
                    // Then map sorted fragments to positions
                    sortedFragments.forEach((fragment, index) => {
                        const progress = index / (sortedFragments.length - 1);
                        
                        // Alternate between paths with smooth transitions
                        const pathIndex = Math.floor(index / fragmentsPerPath);
                        const primaryPath = paths[pathIndex % paths.length];
                        
                        // For smoother transitions, blend between paths
                        const secondaryPathIdx = (pathIndex + 1) % paths.length;
                        const secondaryPath = paths[secondaryPathIdx];
                        const pathBlendFactor = (index % fragmentsPerPath) / fragmentsPerPath;
                        
                        // Create dynamic flow pattern with phase offset for visual interest
                        const primaryVerticalOffset = Math.sin(progress * Math.PI * 2 + primaryPath.phase) * primaryPath.amplitude;
                        const secondaryVerticalOffset = Math.sin(progress * Math.PI * 2 + secondaryPath.phase) * secondaryPath.amplitude;
                        
                        // Blend between paths for smoother transitions
                        const blendedY = primaryPath.startY * (1 - pathBlendFactor) + secondaryPath.startY * pathBlendFactor;
                        const blendedOffset = primaryVerticalOffset * (1 - pathBlendFactor) + secondaryVerticalOffset * pathBlendFactor;
                        
                        // Calculate base position
                        fragment.x = journeyStartX + spacing * index - fragment.width/2;
                        fragment.y = blendedY + blendedOffset - fragment.height/2;
                        
                        // Add progressive size change along the journey
                        const sizeProgression = Math.sin(progress * Math.PI) * 0.3 + 0.9; // Size crescendos in middle
                        fragment.scale = sizeProgression;
                        
                        // Ensure fragments stay within canvas bounds with minor overflow allowed
                        const journeyPadding = 5; // Allow more edge engagement
                        fragment.x = Math.max(-fragment.width*0.1, Math.min(this.canvas.width - fragment.width*0.9, fragment.x));
                        fragment.y = Math.max(-fragment.height*0.1, Math.min(this.canvas.height - fragment.height*0.9, fragment.y));
                        
                        // Create relationships with nearby fragments through rotation
                        // Temporarily comment out rotation to test bias
                        // const flowAngle = Math.atan2(
                        //     Math.cos(progress * Math.PI * 2 + primaryPath.phase), // Flow derivative Y
                        //     1 / spacing // Flow derivative X (constant spacing)
                        // );
                        // fragment.rotation = (flowAngle * 180 / Math.PI) + (Math.random() - 0.5) * 15;
                        
                        // Progressive opacity creates depth and focus
                        fragment.opacity = 0.7 + (Math.sin(progress * Math.PI) * 0.3); // Opacity peaks in middle
                        
                        // Create overlapping relationships with adjacent fragments
                        if (index > 0) {
                            const prevFragment = sortedFragments[index - 1];
                            const overlapX = Math.min(30, fragment.width * 0.15); // Overlap by up to 15% or 30px
                            fragment.x -= overlapX * Math.random();
                        }
                    });
                    break;

                case 'conflict':
                    // Create a structured conflict composition
                    const conflictCenterX = this.canvas.width / 2;
                    const conflictCenterY = this.canvas.height / 2;
                    
                    // Split fragments into two balanced groups
                    const leftSide = enhancedFragments.slice(0, Math.ceil(enhancedFragments.length / 2));
                    const rightSide = enhancedFragments.slice(Math.ceil(enhancedFragments.length / 2));
                    
                    // Position left side in a structured grid
                    leftSide.forEach((fragment, index) => {
                        const row = Math.floor(index / 2);
                        const col = index % 2;
                        const gridWidth = this.canvas.width * 0.3;
                        const gridHeight = this.canvas.height * 0.6;
                        const cellWidth = gridWidth / 2;
                        const cellHeight = gridHeight / Math.ceil(leftSide.length / 2);
                        
                        // Calculate base position
                        fragment.x = this.canvas.width * 0.15 + col * cellWidth;
                        fragment.y = this.canvas.height * 0.2 + row * cellHeight;
                        
                        // Add minimal variation
                        fragment.x += (Math.random() - 0.5) * 20;
                        fragment.y += (Math.random() - 0.5) * 20;
                        
                        // Consistent scale and high opacity
                        fragment.scale = 0.9 + Math.random() * 0.2;
                        fragment.opacity = 0.9 + Math.random() * 0.1;
                        // Temporarily comment out rotation to test bias
                        // fragment.rotation = -15 + Math.random() * 10; // Slight leftward tilt
                    });
                    
                    // Position right side in a mirrored grid
                    rightSide.forEach((fragment, index) => {
                        const row = Math.floor(index / 2);
                        const col = index % 2;
                        const gridWidth = this.canvas.width * 0.3;
                        const gridHeight = this.canvas.height * 0.6;
                        const cellWidth = gridWidth / 2;
                        const cellHeight = gridHeight / Math.ceil(rightSide.length / 2);
                        
                        // Calculate base position (mirrored)
                        fragment.x = this.canvas.width * 0.55 + col * cellWidth;
                        fragment.y = this.canvas.height * 0.2 + row * cellHeight;
                        
                        // Add minimal variation
                        fragment.x += (Math.random() - 0.5) * 20;
                        fragment.y += (Math.random() - 0.5) * 20;
                        
                        // Consistent scale and high opacity
                        fragment.scale = 0.9 + Math.random() * 0.2;
                        fragment.opacity = 0.9 + Math.random() * 0.1;
                        // Temporarily comment out rotation to test bias
                        // fragment.rotation = 15 - Math.random() * 10; // Slight rightward tilt
                    });
                    break;

                case 'hierarchy':
                    // Create a more balanced hierarchical composition using the full canvas
                    const hierarchyCenterX = this.canvas.width / 2;
                    const hierarchyCenterY = this.canvas.height * 0.3; // Move center up for better vertical distribution
                    
                    // Position the protagonist prominently at the top
                    protagonist.x = hierarchyCenterX - protagonist.width/2;
                    protagonist.y = this.canvas.height * 0.15 - protagonist.height/2;
                    protagonist.scale = parameters.focalScale || 1.4;
                    protagonist.opacity = 1.0;
                    // Temporarily comment out rotation to test bias
                    // protagonist.rotation = 0;
                    
                    // Position supporting elements in a balanced arrangement
                    const supportingElements = enhancedFragments.filter(f => f !== protagonist);
                    const hierarchyLevels = Math.min(4, Math.ceil(supportingElements.length / 3));
                    
                    // Define regions for each level to ensure better distribution
                    const levelRegions = [];
                    for (let i = 0; i < hierarchyLevels; i++) {
                        const levelHeight = this.canvas.height * 0.15;
                        const levelY = hierarchyCenterY + (i * levelHeight);
                        
                        // Create wider regions for better horizontal distribution
                        levelRegions.push({
                            y: levelY,
                            height: levelHeight,
                            width: this.canvas.width * (0.4 + (i * 0.1)) // Wider for lower levels
                        });
                    }
                    
                    // Ensure fragments are distributed across all levels
                    const fragmentsPerLevel = Math.ceil(supportingElements.length / hierarchyLevels);
                    
                    supportingElements.forEach((fragment, index) => {
                        const level = Math.floor(index / fragmentsPerLevel);
                        const levelRegion = levelRegions[level % levelRegions.length];
                        const positionInLevel = index % fragmentsPerLevel;
                        const elementsInLevel = fragmentsPerLevel;
                        
                        // Calculate position within the level region
                        const angleStep = Math.PI / (elementsInLevel + 1);
                        const angle = angleStep * (positionInLevel + 1);
                        
                        // Calculate position using parametric equations for an arc
                        const arcWidth = levelRegion.width;
                        const arcHeight = levelRegion.height * 0.5;
                        const x = hierarchyCenterX + (arcWidth * 0.5) * Math.cos(angle);
                        const y = levelRegion.y + (arcHeight * 0.5) * Math.sin(angle);
                        
                        fragment.x = x - fragment.width/2;
                        fragment.y = y - fragment.height/2;
                        
                        // Add minimal variation
                        fragment.x += (Math.random() - 0.5) * 20;
                        fragment.y += (Math.random() - 0.5) * 20;
                        
                        // Ensure fragments stay within canvas bounds
                        const hierarchyPadding = 20;
                        fragment.x = Math.max(hierarchyPadding, Math.min(this.canvas.width - fragment.width - hierarchyPadding, fragment.x));
                        fragment.y = Math.max(hierarchyPadding, Math.min(this.canvas.height - fragment.height - hierarchyPadding, fragment.y));
                        
                        // Scale and opacity decrease with level but maintain visibility
                        fragment.scale = 1.1 - (level * 0.1);
                        fragment.opacity = 0.95 - (level * 0.05);
                        
                        // Rotation follows the arc but with reduced intensity
                        fragment.rotation = (Math.atan2(y - levelRegion.y, x - hierarchyCenterX) * 180 / Math.PI) * 0.2;
                    });
                    break;

                default:
                    console.warn('Unknown composition type:', compositionType, 'falling back to multiple-actors');
                    // Fall back to multiple-actors composition
                    this.enhanceComposition(enhancedFragments, { ...parameters, compositionType: 'multiple-actors' });
                    return;
            }

            // Apply compositional patterns if specified
            if (parameters.useGoldenRatio) {
                const phi = (1 + Math.sqrt(5)) / 2;
                const goldenPoints = [
                    { x: this.canvas.width / phi, y: this.canvas.height / phi },
                    { x: this.canvas.width - (this.canvas.width / phi), y: this.canvas.height / phi },
                    { x: this.canvas.width / phi, y: this.canvas.height - (this.canvas.height / phi) },
                    { x: this.canvas.width - (this.canvas.width / phi), y: this.canvas.height - (this.canvas.height / phi) }
                ];

                // Adjust fragment positions to align with golden ratio points
                enhancedFragments.forEach((fragment, index) => {
                    const pointIndex = index % goldenPoints.length;
                    const point = goldenPoints[pointIndex];
                    const offset = 30; // Random offset from golden ratio point
                    
                    fragment.x += (point.x - fragment.x) * 0.3 + (Math.random() - 0.5) * offset;
                    fragment.y += (point.y - fragment.y) * 0.3 + (Math.random() - 0.5) * offset;
                });
            }

            // Apply rule of thirds if specified
            if (parameters.useRuleOfThirds) {
                const thirdX = this.canvas.width / 3;
                const thirdY = this.canvas.height / 3;
                const powerPoints = [
                    { x: thirdX, y: thirdY },
                    { x: thirdX * 2, y: thirdY },
                    { x: thirdX, y: thirdY * 2 },
                    { x: thirdX * 2, y: thirdY * 2 }
                ];

                // Adjust fragment positions to align with rule of thirds points
                enhancedFragments.forEach((fragment, index) => {
                    const pointIndex = index % powerPoints.length;
                    const point = powerPoints[pointIndex];
                    const offset = 40; // Random offset from power point
                    
                    fragment.x += (point.x - fragment.x) * 0.4 + (Math.random() - 0.5) * offset;
                    fragment.y += (point.y - fragment.y) * 0.4 + (Math.random() - 0.5) * offset;
                });
            }

            // Enhance depth perception
            if (parameters.depthOpacity) {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                enhancedFragments.forEach(fragment => {
                    const dx = fragment.x - centerX;
                    const dy = fragment.y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
                    const depthFactor = 1 - (distance / maxDistance);
                    
                    fragment.opacity = 0.4 + (depthFactor * 0.6);
                });
            }

            // Sort fragments by depth
            enhancedFragments.sort((a, b) => {
                const depthA = a.depth || 0;
                const depthB = b.depth || 0;
                return depthA - depthB;
            });

            // Create metadata about the enhancement
            const metadata = {
                compositionType,
                fragmentCount: enhancedFragments.length,
                foregroundCount: foreground.length,
                backgroundCount: background.length,
                effectsApplied: {
                    goldenRatio: parameters.useGoldenRatio || false,
                    ruleOfThirds: parameters.useRuleOfThirds || false,
                    depthOpacity: parameters.depthOpacity || false
                }
            };

            return {
                fragments: enhancedFragments,
                metadata
            };
        } catch (error) {
            console.error('Error enhancing composition:', error);
            throw error;
        }
    }
    
    /**
     * Applies the Golden Ratio composition pattern
     * @param {Array} fragments - Array of fragments
     */
    applyGoldenRatio(fragments) {
        if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
            console.warn('No valid fragments provided for golden ratio application');
            return fragments;
        }

        const phi = (1 + Math.sqrt(5)) / 2;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculate golden ratio points
        const goldenPoints = [
            { x: canvasWidth / phi, y: canvasHeight / phi },
            { x: canvasWidth - (canvasWidth / phi), y: canvasHeight / phi },
            { x: canvasWidth / phi, y: canvasHeight - (canvasHeight / phi) },
            { x: canvasWidth - (canvasWidth / phi), y: canvasHeight - (canvasHeight / phi) }
        ];

        // Create a deep copy of fragments to avoid modifying the original
        const enhancedFragments = fragments.map(fragment => ({...fragment}));

        // Position fragments near golden ratio points
        enhancedFragments.forEach((fragment, index) => {
            if (!fragment) return;

            const pointIndex = index % goldenPoints.length;
            const point = goldenPoints[pointIndex];
            
            // Calculate new position with some randomness
            const randomOffset = 50; // Maximum pixels to offset from golden point
            fragment.x = Math.max(0, Math.min(canvasWidth - fragment.width, 
                point.x - fragment.width/2 + (Math.random() - 0.5) * randomOffset));
            fragment.y = Math.max(0, Math.min(canvasHeight - fragment.height, 
                point.y - fragment.height/2 + (Math.random() - 0.5) * randomOffset));
            
            // Adjust size based on golden ratio
            const sizeFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            fragment.width *= sizeFactor;
            fragment.height *= sizeFactor;
            
            // Add metadata about golden ratio application
            fragment.metadata = fragment.metadata || {};
            fragment.metadata.goldenRatio = {
                applied: true,
                pointIndex,
                originalSize: {
                    width: fragment.width / sizeFactor,
                    height: fragment.height / sizeFactor
                }
            };
        });

        return enhancedFragments;
    }
    
    /**
     * Applies the Rule of Thirds composition pattern
     * @param {Array} fragments - Array of fragments
     */
    applyRuleOfThirds(fragments) {
        if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
            console.warn('No valid fragments provided for rule of thirds application');
            return fragments;
        }

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Define third points
        const thirdPoints = [
            { x: canvasWidth / 3, y: canvasHeight / 3 },
            { x: (canvasWidth / 3) * 2, y: canvasHeight / 3 },
            { x: canvasWidth / 3, y: (canvasHeight / 3) * 2 },
            { x: (canvasWidth / 3) * 2, y: (canvasHeight / 3) * 2 }
        ];
        
        // Create a deep copy of fragments to avoid modifying the original
        const enhancedFragments = fragments.map(fragment => ({...fragment}));
        
        // Position fragments at third points
        enhancedFragments.forEach((fragment, index) => {
            if (!fragment) return;

            const pointIndex = index % thirdPoints.length;
            const point = thirdPoints[pointIndex];
            
            // Calculate new position with some randomness
            const randomOffset = 50; // Maximum pixels to offset from third point
            fragment.x = Math.max(0, Math.min(canvasWidth - fragment.width, 
                point.x - fragment.width/2 + (Math.random() - 0.5) * randomOffset));
            fragment.y = Math.max(0, Math.min(canvasHeight - fragment.height, 
                point.y - fragment.height/2 + (Math.random() - 0.5) * randomOffset));
            
            // Add metadata about rule of thirds application
            fragment.metadata = fragment.metadata || {};
            fragment.metadata.ruleOfThirds = {
                applied: true,
                pointIndex,
                originalPosition: {
                    x: fragment.x - (point.x - fragment.width/2),
                    y: fragment.y - (point.y - fragment.height/2)
                }
            };
        });

        return enhancedFragments;
    }
    
    /**
     * Applies a dynamic composition pattern
     * @param {Array} fragments - Array of fragments
     * @param {Object} protagonist - The protagonist element
     */
    applyDynamicComposition(fragments, protagonist) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Position protagonist at center
        protagonist.x = canvasWidth / 2;
        protagonist.y = canvasHeight / 2;
        
        // Create dynamic arrangement around protagonist
        fragments.forEach(fragment => {
            if (fragment !== protagonist) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * Math.min(canvasWidth, canvasHeight) / 3;
                fragment.x = protagonist.x + Math.cos(angle) * distance;
                fragment.y = protagonist.y + Math.sin(angle) * distance;
                
                // Add some randomness to rotation
                fragment.rotation = (Math.random() - 0.5) * 30;
            }
        });
    }
    
    /**
     * Creates visual flow in the composition
     * @param {Array} foregroundElements - The foreground elements
     * @param {Array} backgroundElements - The background elements
     * @param {string} flowPattern - The desired flow pattern
     */
    createVisualFlow(foregroundElements, backgroundElements, flowPattern, params) {
        // Create visual flow based on pattern
        switch (flowPattern) {
            case 'left-to-right':
                this.createLeftToRightFlow(foregroundElements, backgroundElements, params);
                break;
            case 'circular':
                this.createCircularFlow(foregroundElements, backgroundElements, params);
                break;
            case 'diagonal':
                this.createDiagonalFlow(foregroundElements, backgroundElements, params);
                break;
            case 'radial':
                this.createRadialFlow(foregroundElements, backgroundElements, params);
                break;
            default:
                this.createLeftToRightFlow(foregroundElements, backgroundElements, params);
        }
        
        // Position background elements to support flow
        this.positionBackgroundElements(backgroundElements, foregroundElements, params);
        
        return [...foregroundElements, ...backgroundElements];
    }
    
    /**
     * Creates a Z-pattern flow
     * @param {Array} elements - The elements to position
     * @param {Object} canvas - The canvas dimensions
     */
    createZPattern(elements, canvas) {
        const points = [
            { x: canvas.width * 0.2, y: canvas.height * 0.2 },
            { x: canvas.width * 0.8, y: canvas.height * 0.2 },
            { x: canvas.width * 0.2, y: canvas.height * 0.8 },
            { x: canvas.width * 0.8, y: canvas.height * 0.8 }
        ];
        
        elements.forEach((element, index) => {
            const point = points[index % points.length];
            element.x = point.x - element.width / 2;
            element.y = point.y - element.height / 2;
            
            // Rotate elements to follow Z flow
            element.rotation = (index % 2 === 0) ? -15 : 15;
        });
    }
    
    /**
     * Creates a circular flow pattern
     * @param {Array} elements - The elements to position
     * @param {Object} canvas - The canvas dimensions
     */
    createCircularPattern(elements, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        
        elements.forEach((element, index) => {
            const angle = (index / elements.length) * Math.PI * 2;
            element.x = centerX + Math.cos(angle) * radius - element.width / 2;
            element.y = centerY + Math.sin(angle) * radius - element.height / 2;
            
            // Rotate elements to face center
            element.rotation = (angle * 180 / Math.PI) + 90;
        });
    }
    
    /**
     * Creates a triangular flow pattern
     * @param {Array} elements - The elements to position
     * @param {Object} canvas - The canvas dimensions
     */
    createTriangularPattern(elements, canvas) {
        const points = [
            { x: canvas.width / 2, y: canvas.height * 0.2 },
            { x: canvas.width * 0.2, y: canvas.height * 0.8 },
            { x: canvas.width * 0.8, y: canvas.height * 0.8 }
        ];
        
        elements.forEach((element, index) => {
            const point = points[index % points.length];
            element.x = point.x - element.width / 2;
            element.y = point.y - element.height / 2;
            
            // Rotate elements to face center
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = Math.atan2(centerY - point.y, centerX - point.x);
            element.rotation = angle * 180 / Math.PI;
        });
    }
    
    /**
     * Creates a left-to-right flow pattern
     * @param {Array} elements - The elements to position
     * @param {Object} canvas - The canvas dimensions
     */
    createLeftToRightPattern(elements, canvas) {
        const startX = canvas.width * 0.1;
        const spacing = (canvas.width * 0.8) / (elements.length - 1);
        
        elements.forEach((element, index) => {
            element.x = startX + spacing * index - element.width / 2;
            element.y = canvas.height / 2 - element.height / 2;
            
            // Alternate vertical position slightly
            element.y += (index % 2 === 0) ? -50 : 50;
            
            // Rotate slightly to create flow
            element.rotation = (index % 2 === 0) ? -10 : 10;
        });
    }

    /**
     * Applies narrative composition rules to the fragments
     * @param {Array} fragments - The fragments to enhance
     * @param {Object} protagonist - The protagonist element
     */
    applyNarrativeRules(fragments, protagonist) {
        // Use existing implementation...
        // (Keeping this method unchanged for brevity)
    }
    
    /**
     * Apply rotation strategy to fragments
     * @private
     */
    applyRotationStrategy(fragments, strategy = 'random', maxRotation = 45) {
        switch (strategy) {
            case 'random':
                fragments.forEach(fragment => {
                    fragment.rotation = (Math.random() - 0.5) * maxRotation * 2;
                });
                break;
            case 'flow':
                // Rotate fragments based on their position relative to the center
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                fragments.forEach(fragment => {
                    const dx = fragment.x - centerX;
                    const dy = fragment.y - centerY;
                    fragment.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
                });
                break;
            case 'radial':
                // Rotate fragments radially from the center
                const radialCenterX = this.canvas.width / 2;
                const radialCenterY = this.canvas.height / 2;
                fragments.forEach(fragment => {
                    const dx = fragment.x - radialCenterX;
                    const dy = fragment.y - radialCenterY;
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    fragment.rotation = angle + 90; // Perpendicular to radius
                });
                break;
            case 'none':
                // No rotation
                fragments.forEach(fragment => {
                    fragment.rotation = 0;
                });
                break;
        }
    }
    
    applyCompositionType(fragments, type = 'balanced', allowEdgeOverflow = false) {
        // Reduce padding to allow more edge overflow while maintaining some structure
        const padding = allowEdgeOverflow ? -50 : 20;
        const width = this.canvas.width - (padding * 2);
        const height = this.canvas.height - (padding * 2);

        switch (type) {
            case 'balanced':
                // Distribute fragments evenly across the canvas
                fragments.forEach((fragment, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    fragment.x = padding + (width * (col + 0.5) / 3);
                    fragment.y = padding + (height * (row + 0.5) / 3);
                });
                break;
            case 'centered':
                // Arrange fragments in a circular pattern
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const radius = Math.min(width, height) * 0.3;
                fragments.forEach((fragment, index) => {
                    const angle = (index / fragments.length) * Math.PI * 2;
                    fragment.x = centerX + Math.cos(angle) * radius;
                    fragment.y = centerY + Math.sin(angle) * radius;
                });
                break;
            case 'asymmetric':
                // Create an asymmetric composition with weighted distribution
                fragments.forEach((fragment, index) => {
                    const weight = fragment.importance || 0.5;
                    fragment.x = padding + (width * (0.2 + weight * 0.6));
                    fragment.y = padding + (height * (0.3 + Math.random() * 0.4));
                });
                break;
            case 'grid':
                // Arrange fragments in a grid pattern
                const cols = Math.ceil(Math.sqrt(fragments.length));
                const rows = Math.ceil(fragments.length / cols);
                const cellWidth = width / cols;
                const cellHeight = height / rows;
                fragments.forEach((fragment, index) => {
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    fragment.x = padding + (col * cellWidth) + (cellWidth / 2);
                    fragment.y = padding + (row * cellHeight) + (cellHeight / 2);
                });
                break;
        }
    }
    
    enhanceDepth(fragments, depthOpacity) {
        if (!Array.isArray(fragments) || fragments.length === 0) {
            return fragments;
        }

        // Create a deep copy of fragments to avoid modifying the original
        const enhancedFragments = fragments.map(fragment => ({...fragment}));
        
        // Identify key elements (focal points) that should be in foreground
        // Focal elements are proportionally mid-sized and closer to center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Find size distribution
        const sizes = enhancedFragments.map(f => f.width * f.height);
        const maxSize = Math.max(...sizes);
        const minSize = Math.min(...sizes);
        const sizeRange = maxSize - minSize;
        
        // Calculate ideal focal size (middle third of size range)
        const idealFocalSizeMin = minSize + (sizeRange * 0.33);
        const idealFocalSizeMax = minSize + (sizeRange * 0.66);
        
        // First calculate preliminary depth scores based on multiple factors
        enhancedFragments.forEach(fragment => {
            // Size-based depth (larger objects tend to be in background)
            const fragmentSize = fragment.width * fragment.height;
            const sizeRatio = (fragmentSize - minSize) / sizeRange;
            
            // Distance from center (focal point)
            const fragmentCenterX = fragment.x + fragment.width / 2;
            const fragmentCenterY = fragment.y + fragment.height / 2;
            
            const distanceFromCenter = Math.sqrt(
                Math.pow(fragmentCenterX - centerX, 2) + 
                Math.pow(fragmentCenterY - centerY, 2)
            );
            
            const maxDistance = Math.sqrt(
                Math.pow(this.canvas.width / 2, 2) + 
                Math.pow(this.canvas.height / 2, 2)
            );
            
            const distanceRatio = distanceFromCenter / maxDistance;
            
            // Is this a potential focal element?
            const isFocalSize = fragmentSize >= idealFocalSizeMin && fragmentSize <= idealFocalSizeMax;
            const isNearCenter = distanceRatio < 0.4; // Within 40% of max distance from center
            const focalBonus = (isFocalSize && isNearCenter) ? -0.3 : 0; // Lower depth = more foreground
            
            // Calculate overlap with other elements (more overlap = more likely foreground)
            let overlapScore = 0;
            enhancedFragments.forEach(other => {
                if (other === fragment) return;
                
                // Check if fragments overlap
                const overlapX = Math.max(0, Math.min(fragment.x + fragment.width, other.x + other.width) - Math.max(fragment.x, other.x));
                const overlapY = Math.max(0, Math.min(fragment.y + fragment.height, other.y + other.height) - Math.max(fragment.y, other.y));
                const overlapArea = overlapX * overlapY;
                
                if (overlapArea > 0) {
                    // If this fragment is smaller, it's more likely to be in foreground
                    const otherSize = other.width * other.height;
                    if (fragmentSize < otherSize) {
                        overlapScore -= 0.05; // More foreground
                    } else {
                        overlapScore += 0.05; // More background
                    }
                }
            });
            
            // Combine all factors with weighted importance
            fragment.depth = (sizeRatio * 0.5) + (distanceRatio * 0.3) + (overlapScore * 0.2) + focalBonus;
            
            // Ensure depth is within valid range (0-1)
            fragment.depth = Math.max(0, Math.min(1, fragment.depth));
        });
        
        // Distribute depth more evenly across the range 0-1 to ensure clear layering
        enhancedFragments.sort((a, b) => a.depth - b.depth);
        enhancedFragments.forEach((fragment, index) => {
            // Redistribute depth values evenly from 0 to 1
            fragment.depth = index / (enhancedFragments.length - 1 || 1);
            
            // Apply depth-based opacity if enabled
            if (depthOpacity) {
                // Higher contrast between foreground and background
                const minOpacity = 0.3;
                const maxOpacity = 1.0;
                fragment.opacity = minOpacity + ((maxOpacity - minOpacity) * (1 - fragment.depth));
                
                // Also apply subtle scale adjustment based on depth
                const minScale = 0.9;
                const maxScale = 1.1;
                fragment.scale = (fragment.scale || 1) * (minScale + (maxScale - minScale) * (1 - fragment.depth));
            }
        });
        
        return enhancedFragments;
    }
    
    positionBackgroundElements(fragments, foregroundElements, params) {
        // Create a map of occupied areas based on foreground elements
        const occupiedAreas = foregroundElements.map(element => ({
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        }));
        
        // Add padding around foreground elements
        const padding = 100; // 100px breathing room
        occupiedAreas.forEach(area => {
            area.x -= padding;
            area.y -= padding;
            area.width += padding * 2;
            area.height += padding * 2;
        });
        
        // Position background elements
        fragments.forEach(fragment => {
            if (!foregroundElements.includes(fragment)) {
                // Try to find a non-overlapping position
                let attempts = 0;
                const maxAttempts = 10;
                let positionFound = false;
                
                while (!positionFound && attempts < maxAttempts) {
                    // Try different positions
                    const positions = [
                        { x: Math.random() * (this.canvas.width - fragment.width), 
                          y: Math.random() * (this.canvas.height - fragment.height) },
                        { x: 0, y: Math.random() * (this.canvas.height - fragment.height) }, // Left edge
                        { x: this.canvas.width - fragment.width, y: Math.random() * (this.canvas.height - fragment.height) }, // Right edge
                        { x: Math.random() * (this.canvas.width - fragment.width), y: 0 }, // Top edge
                        { x: Math.random() * (this.canvas.width - fragment.width), y: this.canvas.height - fragment.height } // Bottom edge
                    ];
                    
                    for (const pos of positions) {
                        // Check if position overlaps with any occupied area
                        const overlaps = occupiedAreas.some(area => 
                            pos.x < area.x + area.width &&
                            pos.x + fragment.width > area.x &&
                            pos.y < area.y + area.height &&
                            pos.y + fragment.height > area.y
                        );
                        
                        if (!overlaps) {
                            fragment.x = pos.x;
                            fragment.y = pos.y;
                            positionFound = true;
                            break;
                        }
                    }
                    
                    attempts++;
                }
                
                // If no position found, place at a random edge
                if (!positionFound) {
                    const edge = Math.floor(Math.random() * 4); // 0: left, 1: right, 2: top, 3: bottom
                    switch (edge) {
                        case 0: // Left edge
                            fragment.x = 0;
                            fragment.y = Math.random() * (this.canvas.height - fragment.height);
                            break;
                        case 1: // Right edge
                            fragment.x = this.canvas.width - fragment.width;
                            fragment.y = Math.random() * (this.canvas.height - fragment.height);
                            break;
                        case 2: // Top edge
                            fragment.x = Math.random() * (this.canvas.width - fragment.width);
                            fragment.y = 0;
                            break;
                        case 3: // Bottom edge
                            fragment.x = Math.random() * (this.canvas.width - fragment.width);
                            fragment.y = this.canvas.height - fragment.height;
                            break;
                    }
                }
                
                // Apply background-specific properties
                fragment.scale = params.backgroundScale || 0.8;
                fragment.opacity = params.backgroundOpacity || 0.8;
                fragment.depth = 0.8 + Math.random() * 0.2; // Ensure background elements are behind foreground
            }
        });
        
        return fragments;
    }
    
    createLeftToRightFlow(foregroundElements, backgroundElements, params) {
        // Calculate spacing based on canvas width and number of elements
        const spacing = this.canvas.width / (foregroundElements.length + 1);
        
        // Position foreground elements from left to right with better vertical distribution
        foregroundElements.forEach((element, index) => {
            // Calculate x position with some randomness
            const baseX = spacing * (index + 1);
            const randomOffset = (Math.random() - 0.5) * spacing * 0.4; // Increased randomness
            element.x = baseX + randomOffset - element.width / 2;
            
            // Calculate y position with more variation to use the full canvas height
            // Use a sine wave pattern to create a more natural flow
            const waveAmplitude = this.canvas.height * 0.25; // Increased amplitude
            const waveFrequency = Math.PI / foregroundElements.length;
            const baseY = this.canvas.height / 2 + Math.sin(index * waveFrequency) * waveAmplitude;
            const verticalOffset = (Math.random() - 0.5) * this.canvas.height * 0.2;
            element.y = baseY + verticalOffset - element.height / 2;
            
            // Ensure elements stay within canvas bounds with some overflow allowed
            const overflow = 0.1; // Allow 10% overflow
            element.x = Math.max(-element.width * overflow, Math.min(this.canvas.width - element.width * (1 - overflow), element.x));
            element.y = Math.max(-element.height * overflow, Math.min(this.canvas.height - element.height * (1 - overflow), element.y));
            
            // Apply rotation based on position with more variation
            element.rotation = (Math.random() - 0.5) * 40; // -20 to 20 degrees
        });
        
        // Position background elements in a more scattered pattern
        if (backgroundElements && backgroundElements.length > 0) {
            backgroundElements.forEach((element, index) => {
                // More random x position for background elements
                const xPercent = 0.1 + Math.random() * 0.8; // Use 10-90% of canvas width
                element.x = this.canvas.width * xPercent - element.width / 2;
                
                // More random y position for background elements
                const yPercent = 0.1 + Math.random() * 0.8; // Use 10-90% of canvas height
                element.y = this.canvas.height * yPercent - element.height / 2;
                
                // Ensure elements stay within canvas bounds with some overflow allowed
                const overflow = 0.15; // Allow 15% overflow for background elements
                element.x = Math.max(-element.width * overflow, Math.min(this.canvas.width - element.width * (1 - overflow), element.x));
                element.y = Math.max(-element.height * overflow, Math.min(this.canvas.height - element.height * (1 - overflow), element.y));
                
                // More random rotation for background elements
                element.rotation = (Math.random() - 0.5) * 60;
            });
        }
    }
    
    createCircularFlow(foregroundElements, backgroundElements, params) {
        // Calculate center and radius
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        // Position foreground elements in a circle
        foregroundElements.forEach((element, index) => {
            // Calculate angle based on element index
            const angle = (index / foregroundElements.length) * Math.PI * 2;
            
            // Calculate position on circle with some randomness
            const randomRadius = radius * (0.8 + Math.random() * 0.4);
            element.x = centerX + Math.cos(angle) * randomRadius - element.width / 2;
            element.y = centerY + Math.sin(angle) * randomRadius - element.height / 2;
            
            // Rotate elements to face center
            element.rotation = (angle * 180 / Math.PI) + 90;
        });
    }
    
    createDiagonalFlow(foregroundElements, backgroundElements, params) {
        // Calculate diagonal line parameters
        const startX = this.canvas.width * 0.2;
        const startY = this.canvas.height * 0.2;
        const endX = this.canvas.width * 0.8;
        const endY = this.canvas.height * 0.8;
        
        // Position foreground elements along diagonal
        foregroundElements.forEach((element, index) => {
            // Calculate position along diagonal with some randomness
            const t = index / (foregroundElements.length - 1);
            const baseX = startX + (endX - startX) * t;
            const baseY = startY + (endY - startY) * t;
            
            // Add random offset perpendicular to diagonal
            const perpX = -(endY - startY) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const perpY = (endX - startX) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const offset = (Math.random() - 0.5) * 100;
            
            element.x = baseX + perpX * offset - element.width / 2;
            element.y = baseY + perpY * offset - element.height / 2;
            
            // Rotate elements to follow diagonal
            element.rotation = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI + (Math.random() - 0.5) * 30;
        });
    }
    
    createRadialFlow(foregroundElements, backgroundElements, params) {
        // Calculate center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Position foreground elements in radial pattern
        foregroundElements.forEach((element, index) => {
            // Calculate angle and distance with more variation
            const angle = (index / foregroundElements.length) * Math.PI * 2;
            
            // Use a more varied distance calculation to spread elements across the canvas
            // This ensures elements are distributed from near the center to the edges
            const minDistance = Math.min(this.canvas.width, this.canvas.height) * 0.1;
            const maxDistance = Math.min(this.canvas.width, this.canvas.height) * 0.45;
            const distance = minDistance + (Math.random() * (maxDistance - minDistance));
            
            // Add some randomness to the angle to avoid perfect radial alignment
            const angleVariation = (Math.random() - 0.5) * 0.5;
            const finalAngle = angle + angleVariation;
            
            // Calculate position
            element.x = centerX + Math.cos(finalAngle) * distance - element.width / 2;
            element.y = centerY + Math.sin(finalAngle) * distance - element.height / 2;
            
            // Ensure elements stay within canvas bounds with some overflow allowed
            const overflow = 0.1; // Allow 10% overflow
            element.x = Math.max(-element.width * overflow, Math.min(this.canvas.width - element.width * (1 - overflow), element.x));
            element.y = Math.max(-element.height * overflow, Math.min(this.canvas.height - element.height * (1 - overflow), element.y));
            
            // Rotate elements to face outward with more variation
            element.rotation = (finalAngle * 180 / Math.PI) + 90 + (Math.random() - 0.5) * 45;
        });
        
        // Position background elements in a wider, more scattered pattern
        if (backgroundElements && backgroundElements.length > 0) {
            backgroundElements.forEach((element, index) => {
                // Use a wider range of distances for background elements
                const minDistance = Math.min(this.canvas.width, this.canvas.height) * 0.3;
                const maxDistance = Math.min(this.canvas.width, this.canvas.height) * 0.6;
                const distance = minDistance + (Math.random() * (maxDistance - minDistance));
                
                // More random angle for background elements
                const angle = Math.random() * Math.PI * 2;
                
                // Calculate position
                element.x = centerX + Math.cos(angle) * distance - element.width / 2;
                element.y = centerY + Math.sin(angle) * distance - element.height / 2;
                
                // Ensure elements stay within canvas bounds with some overflow allowed
                const overflow = 0.15; // Allow 15% overflow for background elements
                element.x = Math.max(-element.width * overflow, Math.min(this.canvas.width - element.width * (1 - overflow), element.x));
                element.y = Math.max(-element.height * overflow, Math.min(this.canvas.height - element.height * (1 - overflow), element.y));
                
                // More random rotation for background elements
                element.rotation = (Math.random() - 0.5) * 60;
            });
        }
    }

    /**
     * Splits an element into multiple fragments
     * @param {Object} element - The element to split
     * @param {string} type - The type of split ('vertical', 'horizontal', 'two-way')
     * @param {number} count - Number of fragments to create (2-4)
     * @param {number} spacing - Distance between fragments
     * @returns {Array} - Array of fragment objects
     */
    splitElement(element, type, count, spacing, imgObj) {
        if (!element || !type || !count || count < 2) {
            console.error('Invalid parameters for splitElement');
            return null;
        }

        // Check if this element has already been split
        if (element.hasBeenSplit) {
            console.warn('Element has already been split. Only one split per element is allowed.');
            return [element];
        }

        // Create a deep copy of the element to avoid modifying the original
        const originalElement = JSON.parse(JSON.stringify(element));
        
        // Ensure we have the image object
        if (!imgObj || !imgObj.img) {
            console.error('Image object is required for splitting');
            return null;
        }
        
        const fragments = [];
        const spacingValue = spacing || 0;

        // Store original dimensions for proper scaling
        const originalWidth = element.width;
        const originalHeight = element.height;
        const sourceWidth = imgObj.img.naturalWidth;
        const sourceHeight = imgObj.img.naturalHeight;

        if (type === 'vertical') {
            // Calculate new widths maintaining aspect ratio
            const newWidth = (originalWidth - spacingValue * (count - 1)) / count;
            const scale = newWidth / (sourceWidth / count);
            const newHeight = sourceHeight * scale;

            for (let i = 0; i < count; i++) {
                const fragment = {
                    ...originalElement,
                    x: originalElement.x + (i * (newWidth + spacingValue)),
                    width: newWidth,
                    height: newHeight,
                    clipX: i * (sourceWidth / count),
                    clipY: 0,
                    clipWidth: sourceWidth / count,
                    clipHeight: sourceHeight,
                    hasBeenSplit: true
                };
                fragments.push(fragment);
            }
        } else if (type === 'horizontal') {
            // Calculate new heights maintaining aspect ratio
            const newHeight = (originalHeight - spacingValue * (count - 1)) / count;
            const scale = newHeight / (sourceHeight / count);
            const newWidth = sourceWidth * scale;

            for (let i = 0; i < count; i++) {
                const fragment = {
                    ...originalElement,
                    x: originalElement.x,
                    y: originalElement.y + (i * (newHeight + spacingValue)),
                    width: newWidth,
                    height: newHeight,
                    clipX: 0,
                    clipY: i * (sourceHeight / count),
                    clipWidth: sourceWidth,
                    clipHeight: sourceHeight / count,
                    hasBeenSplit: true
                };
                fragments.push(fragment);
            }
        } else if (type === 'two-way') {
            // For two-way split, we'll create a grid of fragments
            const rows = Math.ceil(Math.sqrt(count));
            const cols = Math.ceil(count / rows);
            
            // Calculate dimensions for each fragment
            const newWidth = (originalWidth - (spacingValue * (cols - 1))) / cols;
            const newHeight = (originalHeight - (spacingValue * (rows - 1))) / rows;
            
            // Calculate scaling factors
            const scaleX = newWidth / (sourceWidth / cols);
            const scaleY = newHeight / (sourceHeight / rows);
            
            let fragmentIndex = 0;
            for (let row = 0; row < rows && fragmentIndex < count; row++) {
                for (let col = 0; col < cols && fragmentIndex < count; col++) {
                    const fragment = {
                        ...originalElement,
                        x: originalElement.x + (col * (newWidth + spacingValue)),
                        y: originalElement.y + (row * (newHeight + spacingValue)),
                        width: newWidth,
                        height: newHeight,
                        clipX: col * (sourceWidth / cols),
                        clipY: row * (sourceHeight / rows),
                        clipWidth: sourceWidth / cols,
                        clipHeight: sourceHeight / rows,
                        hasBeenSplit: true
                    };
                    fragments.push(fragment);
                    fragmentIndex++;
                }
            }
        }

        return fragments;
    }
    
    /**
     * Applies a shape-based mask to an element
     * @param {Object} element - The element to mask
     * @param {string} maskType - The type of mask ('circle', 'rectangle', 'triangle', 'ellipse', 'diamond', 'hexagon', 'star', 'wave')
     * @param {Object} maskParams - Parameters for the mask
     * @returns {Object} - The masked element
     */
    maskElement(element, maskType = 'rectangle', maskParams = {}) {
        if (!element) return element;
        
        const maskedElement = { ...element };
        maskedElement.maskType = maskType;
        
        switch (maskType) {
            case 'circle':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    radius: Math.min(element.width, element.height) / 2,
                    ...maskParams
                };
                break;
                
            case 'rectangle':
                maskedElement.maskParams = {
                    x: 0,
                    y: 0,
                    width: element.width,
                    height: element.height,
                    cornerRadius: 0,
                    ...maskParams
                };
                break;
                
            case 'triangle':
                maskedElement.maskParams = {
                    points: [
                        { x: element.width / 2, y: 0 },
                        { x: 0, y: element.height },
                        { x: element.width, y: element.height }
                    ],
                    ...maskParams
                };
                break;
                
            case 'ellipse':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    radiusX: element.width / 2,
                    radiusY: element.height / 2,
                    ...maskParams
                };
                break;
                
            case 'diamond':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    width: element.width,
                    height: element.height,
                    ...maskParams
                };
                break;
                
            case 'hexagon':
                // Create regular hexagon points with improved precision
                const hexPoints = [];
                const hexRadius = Math.min(element.width, element.height) / 2;
                const hexCenterX = element.width / 2;
                const hexCenterY = element.height / 2;
                
                // Ensure minimum size for hexagon
                if (hexRadius < 20) {
                    console.warn('Fragment too small for hexagon mask, using minimum size');
                    hexRadius = 20;
                }
                
                // Generate points with proper angle calculation
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3) - (Math.PI / 6); // Start at top
                    const x = hexCenterX + hexRadius * Math.cos(angle);
                    const y = hexCenterY + hexRadius * Math.sin(angle);
                    hexPoints.push({ x, y });
                }
                
                // Ensure the shape is closed by adding the first point again
                hexPoints.push(hexPoints[0]);
                
                maskedElement.maskParams = {
                    points: hexPoints,
                    centerX: hexCenterX,
                    centerY: hexCenterY,
                    radius: hexRadius,
                    ...maskParams
                };
                break;
                
            case 'star':
                // Create five-pointed star
                const starPoints = [];
                const outerRadius = Math.min(element.width, element.height) / 2;
                const innerRadius = outerRadius / 2.5;
                const starCenterX = element.width / 2;
                const starCenterY = element.height / 2;
                
                for (let i = 0; i < 10; i++) {
                    const angle = (i * Math.PI / 5) - (Math.PI / 2); // Start at top
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    starPoints.push({
                        x: starCenterX + radius * Math.cos(angle),
                        y: starCenterY + radius * Math.sin(angle)
                    });
                }
                
                maskedElement.maskParams = {
                    points: starPoints,
                    ...maskParams
                };
                break;
                
            // Wave mask has been removed as requested
                break;
                
            case 'arc':
                // Create arc mask with improved width calculation
                const arcRadius = Math.min(element.width, element.height) / 2;
                const arcWidth = Math.max(arcRadius * 0.4, 30); // Ensure minimum width of 30px
                
                // Ensure minimum size for arc
                if (arcRadius < 40) {
                    console.warn('Fragment too small for arc mask, using minimum size');
                    arcRadius = 40;
                }
                
                maskedElement.maskParams = {
                    outerRadius: arcRadius,
                    innerRadius: arcRadius - arcWidth,
                    startAngle: 0,
                    endAngle: Math.PI,
                    centerX: element.width / 2,
                    centerY: element.height / 2,
                    ...maskParams
                };
                break;

            case 'arch':
                maskedElement.maskParams = {
                    centerX: element.width / 2,
                    topY: 0,
                    bottomY: element.height,
                    archWidth: element.width,
                    archRadius: element.width / 2,
                    ...maskParams
                };
                break;
        }
        
        return maskedElement;
    }

    /**
     * Original enhancement method without LLM integration
     * @private
     */
    enhanceCompositionOriginal(fragments, params) {
        // Apply blend mode to all fragments
        fragments.forEach(fragment => {
            fragment.blendMode = params.blendMode || 'multiply';
        });
        
        // Reduce fragment count to target range
        const targetCount = Math.floor(Math.random() * 4) + 5; // 5-8 elements
        fragments.sort((a, b) => b.importance - a.importance);
        fragments = fragments.slice(0, targetCount);
        
        // Identify foreground and background elements
        const foregroundElements = fragments.filter(f => f.importance > 0.7);
        const backgroundElements = fragments.filter(f => f.importance <= 0.7);
        
        // Identify protagonist - use first fragment if no foreground elements
        const protagonist = foregroundElements.length > 0 
            ? foregroundElements.reduce((prev, current) => 
                (current.importance > prev.importance) ? current : prev
            )
            : fragments[0];
        
        // Apply narrative composition rules
        this.applyNarrativeRules(fragments, protagonist);
        
        // Apply rotation strategy
        this.applyRotationStrategy(fragments, params.rotationStrategy, params.maxRotation);
        
        // Apply composition type
        this.applyCompositionType(fragments, params.compositionType, params.allowEdgeOverflow);
        
        // Apply advanced compositional patterns
        if (params.compositionPattern) {
            switch (params.compositionPattern) {
                case 'goldenRatio':
                    this.applyGoldenRatio(fragments, protagonist);
                    break;
                case 'ruleOfThirds':
                    this.applyRuleOfThirds(fragments, protagonist);
                    break;
                case 'dynamic':
                    this.applyDynamicComposition(fragments, protagonist);
                    break;
            }
        }
        
        // Apply element splitting if specified
        if (params.splitElements) {
            const elementsToSplit = foregroundElements.length > 0 
                ? foregroundElements.filter(f => f.importance > 0.8)
                : fragments.slice(0, 2);
            
            elementsToSplit.forEach(element => {
                const splitFragments = this.splitElement(
                    element,
                    params.splitType || 'vertical',
                    params.fragmentCount || 2,
                    params.spacing || 10,
                    params.imgObj
                );
                fragments = fragments.filter(f => f !== element).concat(splitFragments);
            });
        }
        
        // Apply masking if specified
        if (params.maskElements) {
            fragments = fragments.map(fragment => {
                if (fragment.importance > 0.6 || foregroundElements.length === 0) {
                    return this.maskElement(
                        fragment,
                        params.maskType || 'circle',
                        params.maskParams || {}
                    );
                }
                return fragment;
            });
        }
        
        // Enhance depth perception
        this.enhanceDepth(fragments, params.depthOpacity);
        
        // Sort fragments by depth for proper layering
        fragments.sort((a, b) => a.depth - b.depth);
        
        // Create composition metadata
        const composition = {
            fragments,
            backgroundColor: params.backgroundColor,
            blendMode: params.blendMode,
            compositionType: params.compositionType,
            compositionPattern: params.compositionPattern,
            flowPattern: params.flowPattern,
            rotationStrategy: params.rotationStrategy,
            fragmentCount: fragments.length,
            foregroundCount: foregroundElements.length,
            backgroundCount: backgroundElements.length
        };
        
        console.log('Enhanced composition:', composition);
        return composition;
    }

    /**
     * Post-processes fragments enhanced by LLM
     * @param {Array} fragments - LLM enhanced fragments
     * @param {Object} params - Enhancement parameters
     * @returns {Array} - Final processed fragments
     */
    postProcessLLMFragments(fragments, params) {
        if (!Array.isArray(fragments)) {
            console.warn('Invalid fragments provided to postProcessLLMFragments');
            return [];
        }

        return fragments.map(fragment => {
            // Ensure all required properties exist
            const processedFragment = {
                ...fragment,
                x: fragment.x || 0,
                y: fragment.y || 0,
                width: fragment.width || 100,
                height: fragment.height || 100,
                rotation: fragment.rotation || 0,
                opacity: fragment.opacity || 1.0,
                depth: fragment.depth || Math.random(),
                blendMode: fragment.blendMode || params.blendMode || 'multiply',
                maskType: fragment.maskType || 'rectangle'
            };

            // Apply depth-based opacity if enabled
            if (params.depthOpacity) {
                const opacityRange = params.depthOpacityRange || 0.2;
                processedFragment.opacity *= (1 - (opacityRange * processedFragment.depth));
            }

            // Validate and adjust size
            const maxSize = Math.min(params.canvas?.width || 1200, params.canvas?.height || 800) * 0.8;
            processedFragment.width = Math.min(processedFragment.width, maxSize);
            processedFragment.height = Math.min(processedFragment.height, maxSize);

            // Ensure position is within canvas bounds
            if (params.canvas) {
                processedFragment.x = Math.max(0, Math.min(processedFragment.x, params.canvas.width - processedFragment.width));
                processedFragment.y = Math.max(0, Math.min(processedFragment.y, params.canvas.height - processedFragment.height));
            }

            // Add metadata
            processedFragment.metadata = {
                ...fragment.metadata,
                llmProcessed: true,
                processingTimestamp: new Date().toISOString()
            };

            return processedFragment;
        });
    }

    splitElements(fragments) {
        try {
            const splitFragments = [];
            
            fragments.forEach(fragment => {
                // Skip if fragment is invalid
                if (!fragment || typeof fragment !== 'object') {
                    console.warn('Invalid fragment:', fragment);
                    return;
                }
                
                // Determine split type (horizontal or vertical)
                const splitType = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                if (splitType === 'horizontal') {
                    // Split horizontally into left and right halves
                    const leftFragment = {
                        ...fragment,
                        width: fragment.width / 2,
                        x: fragment.x,
                        splitInfo: {
                            type: 'horizontal',
                            position: 'left',
                            originalWidth: fragment.width,
                            originalHeight: fragment.height
                        }
                    };
                    
                    const rightFragment = {
                        ...fragment,
                        width: fragment.width / 2,
                        x: fragment.x + fragment.width / 2,
                        splitInfo: {
                            type: 'horizontal',
                            position: 'right',
                            originalWidth: fragment.width,
                            originalHeight: fragment.height
                        }
                    };
                    
                    splitFragments.push(leftFragment, rightFragment);
                } else {
                    // Split vertically into top and bottom halves
                    const topFragment = {
                        ...fragment,
                        height: fragment.height / 2,
                        y: fragment.y,
                        splitInfo: {
                            type: 'vertical',
                            position: 'top',
                            originalWidth: fragment.width,
                            originalHeight: fragment.height
                        }
                    };
                    
                    const bottomFragment = {
                        ...fragment,
                        height: fragment.height / 2,
                        y: fragment.y + fragment.height / 2,
                        splitInfo: {
                            type: 'vertical',
                            position: 'bottom',
                            originalWidth: fragment.width,
                            originalHeight: fragment.height
                        }
                    };
                    
                    splitFragments.push(topFragment, bottomFragment);
                }
            });
            
            return splitFragments;
        } catch (error) {
            console.error('Error splitting elements:', error);
            return fragments;
        }
    }

    identifyForegroundBackground(fragments) {
        if (!Array.isArray(fragments) || fragments.length === 0) {
            return { foreground: [], background: [] };
        }

        // Sort fragments by size (larger fragments tend to be background)
        const sortedBySize = [...fragments].sort((a, b) => 
            (b.width * b.height) - (a.width * a.height)
        );

        // Calculate average size
        const totalArea = fragments.reduce((sum, f) => sum + (f.width * f.height), 0);
        const avgArea = totalArea / fragments.length;

        // Identify foreground and background based on size and position
        const foreground = [];
        const background = [];

        fragments.forEach(fragment => {
            if (!fragment) return;
            
            const area = fragment.width * fragment.height;
            const isLarge = area > avgArea * 1.5;
            const isCentered = this.isInCenter(fragment);

            if (isLarge && !isCentered) {
                background.push(fragment);
            } else {
                foreground.push(fragment);
            }
        });

        // Ensure at least one fragment in each category
        if (foreground.length === 0 && fragments.length > 0) {
            foreground.push(fragments[0]);
        }
        if (background.length === 0 && fragments.length > 1) {
            background.push(fragments[1]);
        }

        return { foreground, background };
    }

    isInCenter(fragment) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const fragmentCenterX = fragment.x + fragment.width / 2;
        const fragmentCenterY = fragment.y + fragment.height / 2;
        
        const distanceFromCenter = Math.sqrt(
            Math.pow(fragmentCenterX - centerX, 2) + 
            Math.pow(fragmentCenterY - centerY, 2)
        );
        
        const maxDistance = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        return distanceFromCenter < maxDistance;
    }

    calculateDistance(fragment1, fragment2) {
        const center1 = {
            x: fragment1.x + fragment1.width / 2,
            y: fragment1.y + fragment1.height / 2
        };
        const center2 = {
            x: fragment2.x + fragment2.width / 2,
            y: fragment2.y + fragment2.height / 2
        };
        
        const dx = center1.x - center2.x;
        const dy = center1.y - center2.y;
        return Math.sqrt(dx * dx + dy * dy) / Math.min(this.canvas.width, this.canvas.height);
    }

    /**
     * Applies masking to fragments
     * @param {Array} fragments - Array of fragments to mask
     * @returns {Array} - Array of masked fragments
     */
    maskElements(fragments) {
        if (!fragments || !Array.isArray(fragments) || fragments.length === 0) {
            console.warn('No valid fragments provided for masking');
            return fragments;
        }

        // Create a deep copy of fragments to avoid modifying the original
        const maskedFragments = fragments.map(fragment => ({...fragment}));
        
        // Apply masking to each fragment
        maskedFragments.forEach(fragment => {
            if (!fragment) return;
            
            // Randomly select a mask type
            const maskTypes = ['circle', 'triangle', 'rectangle'];
            fragment.maskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
            
            // Add metadata about masking
            fragment.metadata = fragment.metadata || {};
            fragment.metadata.masking = {
                applied: true,
                maskType: fragment.maskType
            };
        });

        return maskedFragments;
    }
}
