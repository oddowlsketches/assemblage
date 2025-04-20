/**
 * LLM Composition Enhancer for Assemblage
 * Provides LLM-powered narrative composition enhancements
 */

export class LLMCompositionEnhancer {
    constructor(parameters = {}) {
        this.parameters = {
            // LLM Settings
            enabled: parameters.enabled !== false,
            endpoint: parameters.endpoint || '/api/llm',
            maxRetries: parameters.maxRetries || 2,
            timeout: parameters.timeout || 10000, // 10 seconds
            
            // Composition Parameters
            narrativeStrength: parameters.narrativeStrength || 0.7,
            elementRelationshipFactor: parameters.elementRelationshipFactor || 0.8,
            semanticGroupingEnabled: parameters.semanticGroupingEnabled !== false,
            visualFlowEnabled: parameters.visualFlowEnabled !== false,
            compositionStyle: parameters.compositionStyle || 'journey',
            
            // Mock Mode for Testing
            useMockResponses: parameters.useMockResponses || false,
            
            // Debug Mode
            debug: parameters.debug || false
        };
        
        // Initialize the service status
        this.serviceAvailable = true;
        this.lastError = null;
        
        // Initialize semantic cache
        this.semanticCache = new Map();
        
        // Mock responses for testing without actual LLM calls
        this.mockResponses = {
            fragmentRelationships: [
                { primary: 0, related: [2, 4], relationshipType: 'contrast' },
                { primary: 1, related: [3], relationshipType: 'complement' },
                { primary: 2, related: [0, 5], relationshipType: 'reinforcement' }
            ],
            compositionSuggestion: {
                style: 'focal-point',
                focalIndices: [0, 3],
                backgroundIndices: [1, 2, 4, 5],
                flowDirection: 'diagonal',
                colorEmphasis: '#f0f5e9',
                narrativeIntent: 'transformation journey'
            }
        };
    }

    /**
     * Enhances a composition using LLM-powered analysis
     * @param {Array} fragments - The fragments to enhance
     * @returns {Object} - Enhanced fragments and metadata
     */
    async enhanceComposition(fragments) {
        if (!this.parameters.enabled || !this.serviceAvailable) {
            this.logDebug('LLM enhancement skipped: service disabled or unavailable');
            return { fragments, metadata: { llmEnhanced: false } };
        }
        
        try {
            // Extract basic visual features from fragments
            const fragmentFeatures = this.extractFragmentFeatures(fragments);
            this.logDebug('Extracted fragment features:', fragmentFeatures);
            
            // Get LLM composition suggestions
            const compositionSuggestion = await this.getCompositionSuggestion(fragmentFeatures);
            this.logDebug('LLM composition suggestion:', compositionSuggestion);
            
            // Apply composition suggestions to fragments
            const enhancedFragments = this.applyCompositionSuggestions(
                fragments, 
                compositionSuggestion
            );
            
            // Return enhanced fragments and metadata
            return {
                fragments: enhancedFragments,
                metadata: {
                    llmEnhanced: true,
                    compositionStyle: compositionSuggestion.style,
                    narrativeIntent: compositionSuggestion.narrativeIntent,
                    colorEmphasis: compositionSuggestion.colorEmphasis
                }
            };
        } catch (error) {
            this.logDebug('LLM enhancement error:', error);
            this.lastError = error;
            
            // If LLM fails, continue without LLM enhancement
            return { 
                fragments, 
                metadata: { 
                    llmEnhanced: false,
                    error: error.message
                } 
            };
        }
    }
    
    /**
     * Extracts basic visual features from fragments
     * @param {Array} fragments - The fragments to analyze
     * @returns {Array} - Fragment features
     */
    extractFragmentFeatures(fragments) {
        return fragments.map((fragment, index) => {
            // Calculate position in normalized coordinates (0-1)
            const normalizedX = fragment.x / 800; // Assuming 800px canvas width
            const normalizedY = fragment.y / 600; // Assuming 600px canvas height
            
            // Calculate relative size as percentage of canvas area
            const fragmentArea = fragment.width * fragment.height;
            const canvasArea = 800 * 600; // Assuming 800x600 canvas
            const relativeSize = fragmentArea / canvasArea;
            
            return {
                index,
                position: { x: normalizedX, y: normalizedY },
                size: relativeSize,
                aspectRatio: fragment.width / fragment.height,
                rotation: fragment.rotation || 0,
                depth: fragment.depth || 0,
                // Note: At this stage we don't have content analysis
                // This would ideally be supplemented by vision model analysis
                contentType: 'unknown'
            };
        });
    }
    
    /**
     * Gets LLM-powered composition suggestions
     * @param {Array} fragmentFeatures - The fragment features to analyze
     * @returns {Object} - Composition suggestions
     */
    async getCompositionSuggestion(fragmentFeatures) {
        if (this.parameters.useMockResponses) {
            // For testing without actual LLM calls
            return this.mockResponses.compositionSuggestion;
        }
        
        try {
            // Prepare LLM prompt
            const prompt = this.createCompositionPrompt(fragmentFeatures);
            this.logDebug('LLM prompt:', prompt);
            
            // Call LLM service
            const llmResponse = await this.callLLMService({
                prompt,
                temperature: 0.7,
                maxTokens: 500
            });
            
            // Parse LLM response
            return this.parseCompositionResponse(llmResponse);
        } catch (error) {
            this.logDebug('Error getting composition suggestion:', error);
            throw new Error(`LLM composition suggestion failed: ${error.message}`);
        }
    }
    
    /**
     * Creates a prompt for composition suggestions
     * @param {Array} fragmentFeatures - The fragment features
     * @returns {String} - The LLM prompt
     */
    createCompositionPrompt(fragmentFeatures) {
        return `
You are helping create a narrative-driven collage composition.

I have ${fragmentFeatures.length} visual elements with the following characteristics:
${fragmentFeatures.map(f => 
    `Element ${f.index}: position(${f.position.x.toFixed(2)}, ${f.position.y.toFixed(2)}), ` +
    `size: ${(f.size * 100).toFixed(1)}% of canvas, rotation: ${f.rotation.toFixed(1)}°`
).join('\n')}

Please suggest a composition that creates a narrative or conceptual relationship between these elements.
Be specific about:
1. Which elements should be focal points (1-3 elements)
2. How the other elements should relate to the focal points
3. A suggested flow direction (left-to-right, circular, diagonal, etc.)
4. A composition style (journey, contrast, unity, etc.)
5. A subtle background color that would enhance the composition (in hex format)

Format your response as JSON with the following structure:
{
  "style": "style-name",
  "focalIndices": [array of indices],
  "backgroundIndices": [array of indices],
  "flowDirection": "direction",
  "colorEmphasis": "#hexcolor",
  "narrativeIntent": "brief description of the narrative concept"
}
`;
    }
    
    /**
     * Parses LLM response for composition suggestions
     * @param {String} llmResponse - The LLM response
     * @returns {Object} - Parsed composition suggestions
     */
    parseCompositionResponse(llmResponse) {
        try {
            // Try to parse the response as JSON
            return JSON.parse(llmResponse);
        } catch (error) {
            this.logDebug('Error parsing LLM response:', error);
            
            // Fallback to a default suggestion
            return {
                style: 'balanced',
                focalIndices: [0],
                backgroundIndices: Array.from(
                    { length: Math.max(0, fragmentFeatures.length - 1) }, 
                    (_, i) => i + 1
                ),
                flowDirection: 'left-to-right',
                colorEmphasis: '#f5f5f5',
                narrativeIntent: 'visual harmony'
            };
        }
    }
    
    /**
     * Applies composition suggestions to fragments
     * @param {Array} fragments - The fragments to enhance
     * @param {Object} suggestions - The composition suggestions
     * @returns {Array} - Enhanced fragments
     */
    applyCompositionSuggestions(fragments, suggestions) {
        const { 
            style, 
            focalIndices, 
            backgroundIndices,
            flowDirection,
            narrativeIntent
        } = suggestions;
        
        // Split fragments into focal and background
        const focalFragments = focalIndices.map(i => fragments[i]);
        const backgroundFragments = backgroundIndices.map(i => fragments[i]);
        
        // Apply composition style
        switch (style) {
            case 'focal-point':
                this.applyFocalPointStyle(focalFragments, backgroundFragments, flowDirection);
                break;
            case 'journey':
                this.applyJourneyStyle(focalFragments, backgroundFragments, flowDirection);
                break;
            case 'contrast':
                this.applyContrastStyle(focalFragments, backgroundFragments, flowDirection);
                break;
            default:
                this.applyBalancedStyle(focalFragments, backgroundFragments, flowDirection);
        }
        
        // Tag fragments with their narrative role
        focalFragments.forEach(fragment => {
            fragment.narrativeRole = 'focal';
            fragment.narrativeIntent = narrativeIntent;
            
            // Increase size by 10-30%
            const scaleFactor = 1.1 + Math.random() * 0.2;
            fragment.width *= scaleFactor;
            fragment.height *= scaleFactor;
            
            // Ensure focal fragments have higher depth
            fragment.depth = 0.7 + Math.random() * 0.3;
        });
        
        backgroundFragments.forEach(fragment => {
            fragment.narrativeRole = 'supporting';
            fragment.narrativeIntent = narrativeIntent;
            
            // Ensure supporting fragments have lower depth
            fragment.depth = Math.random() * 0.6;
        });
        
        // Merge and return all fragments
        return [...focalFragments, ...backgroundFragments];
    }
    
    /**
     * Applies focal point composition style
     * @param {Array} focalFragments - The focal fragments
     * @param {Array} backgroundFragments - The background fragments
     * @param {String} flowDirection - The flow direction
     */
    applyFocalPointStyle(focalFragments, backgroundFragments, flowDirection) {
        // Position focal fragments near the center with slight offset
        const centerX = 400; // Assuming 800px canvas width
        const centerY = 300; // Assuming 600px canvas height
        
        focalFragments.forEach((fragment, index) => {
            const angle = (index / focalFragments.length) * Math.PI * 2;
            const distance = 50 + Math.random() * 50; // 50-100px from center
            
            fragment.x = centerX + Math.cos(angle) * distance - fragment.width / 2;
            fragment.y = centerY + Math.sin(angle) * distance - fragment.height / 2;
            
            // Slight rotation toward center
            fragment.rotation = Math.atan2(
                centerY - (fragment.y + fragment.height/2),
                centerX - (fragment.x + fragment.width/2)
            ) * 180 / Math.PI;
            
            // Add slight random variation
            fragment.rotation += (Math.random() - 0.5) * 20;
        });
        
        // Position background fragments around focal fragments
        backgroundFragments.forEach((fragment, index) => {
            const angle = (index / backgroundFragments.length) * Math.PI * 2;
            const distance = 150 + Math.random() * 150; // 150-300px from center
            
            fragment.x = centerX + Math.cos(angle) * distance - fragment.width / 2;
            fragment.y = centerY + Math.sin(angle) * distance - fragment.height / 2;
            
            // Random rotation for background elements
            fragment.rotation = (Math.random() - 0.5) * 45;
        });
    }
    
    /**
     * Applies journey composition style
     * @param {Array} focalFragments - The focal fragments
     * @param {Array} backgroundFragments - The background fragments
     * @param {String} flowDirection - The flow direction
     */
    applyJourneyStyle(focalFragments, backgroundFragments, flowDirection) {
        let startX = 100;
        let startY = 300;
        let endX = 700;
        let endY = 300;
        
        // Adjust flow direction
        if (flowDirection === 'diagonal') {
            startY = 450;
            endY = 150;
        } else if (flowDirection === 'vertical') {
            startX = 400;
            startY = 100;
            endX = 400;
            endY = 500;
        }
        
        // Position focal fragments along the journey path
        focalFragments.forEach((fragment, index) => {
            const progress = index / Math.max(1, focalFragments.length - 1);
            
            fragment.x = startX + (endX - startX) * progress - fragment.width / 2;
            fragment.y = startY + (endY - startY) * progress - fragment.height / 2;
            
            // Rotation follows the path direction
            const pathAngle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            fragment.rotation = pathAngle + (Math.random() - 0.5) * 30;
        });
        
        // Position background fragments around the journey path
        backgroundFragments.forEach((fragment, index) => {
            const progress = index / Math.max(1, backgroundFragments.length - 1);
            const perpDistance = 100 * (Math.random() > 0.5 ? 1 : -1);
            
            // Position perpendicular to the journey path
            const pathX = startX + (endX - startX) * progress;
            const pathY = startY + (endY - startY) * progress;
            
            // Calculate perpendicular direction
            const pathAngle = Math.atan2(endY - startY, endX - startX);
            const perpAngle = pathAngle + Math.PI / 2;
            
            fragment.x = pathX + Math.cos(perpAngle) * perpDistance - fragment.width / 2;
            fragment.y = pathY + Math.sin(perpAngle) * perpDistance - fragment.height / 2;
            
            // Random rotation for background elements
            fragment.rotation = (Math.random() - 0.5) * 45;
        });
    }
    
    /**
     * Applies contrast composition style
     * @param {Array} focalFragments - The focal fragments
     * @param {Array} backgroundFragments - The background fragments
     * @param {String} flowDirection - The flow direction
     */
    applyContrastStyle(focalFragments, backgroundFragments, flowDirection) {
        // Split the canvas into two contrasting areas
        const splitPoint = 450; // Assuming 800px canvas width
        
        // Position focal fragments on opposite sides
        focalFragments.forEach((fragment, index) => {
            if (index % 2 === 0) {
                // Left side
                fragment.x = Math.random() * (splitPoint - fragment.width);
                fragment.y = 100 + Math.random() * 400;
                fragment.rotation = -10 - Math.random() * 20; // Rotate left
            } else {
                // Right side
                fragment.x = splitPoint + Math.random() * (800 - splitPoint - fragment.width);
                fragment.y = 100 + Math.random() * 400;
                fragment.rotation = 10 + Math.random() * 20; // Rotate right
            }
        });
        
        // Distribute background fragments with balanced distribution
        backgroundFragments.forEach((fragment, index) => {
            if (index % 2 === 0) {
                // Left side
                fragment.x = Math.random() * (splitPoint - fragment.width);
                fragment.y = 50 + Math.random() * 500;
            } else {
                // Right side
                fragment.x = splitPoint + Math.random() * (800 - splitPoint - fragment.width);
                fragment.y = 50 + Math.random() * 500;
            }
            
            // Random rotation
            fragment.rotation = (Math.random() - 0.5) * 60;
        });
    }
    
    /**
     * Applies balanced composition style
     * @param {Array} focalFragments - The focal fragments
     * @param {Array} backgroundFragments - The background fragments
     * @param {String} flowDirection - The flow direction
     */
    applyBalancedStyle(focalFragments, backgroundFragments, flowDirection) {
        // Balance focal fragments using rule of thirds
        const thirdX = 800 / 3;
        const thirdY = 600 / 3;
        
        // Position focal fragments at power points
        const powerPoints = [
            { x: thirdX, y: thirdY },         // Top-left third
            { x: thirdX * 2, y: thirdY },     // Top-right third
            { x: thirdX, y: thirdY * 2 },     // Bottom-left third
            { x: thirdX * 2, y: thirdY * 2 }  // Bottom-right third
        ];
        
        focalFragments.forEach((fragment, index) => {
            const pointIndex = index % powerPoints.length;
            const point = powerPoints[pointIndex];
            
            fragment.x = point.x - fragment.width / 2 + (Math.random() - 0.5) * 50;
            fragment.y = point.y - fragment.height / 2 + (Math.random() - 0.5) * 50;
            
            // Subtle rotation
            fragment.rotation = (Math.random() - 0.5) * 30;
        });
        
        // Distribute background fragments evenly
        backgroundFragments.forEach((fragment, index) => {
            // Avoid power points to prevent clutter
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            while (!validPosition && attempts < 10) {
                x = 50 + Math.random() * 700;
                y = 50 + Math.random() * 500;
                
                // Check distance from all power points
                validPosition = powerPoints.every(point => {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance > 100; // Minimum 100px from power points
                });
                
                attempts++;
            }
            
            fragment.x = x - fragment.width / 2;
            fragment.y = y - fragment.height / 2;
            
            // Random rotation
            fragment.rotation = (Math.random() - 0.5) * 45;
        });
    }
    
    /**
     * Calls the LLM service with the given parameters
     * @param {Object} params - The parameters for the LLM call
     * @returns {Promise<String>} - The LLM response
     */
    async callLLMService(params) {
        if (this.parameters.useMockResponses) {
            // For testing without actual LLM calls
            return JSON.stringify(this.mockResponses.compositionSuggestion);
        }
        
        // In the real implementation, this would make an API call to an LLM service
        // For now, we'll simulate the call with a timeout
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate an LLM response with a mock suggestion
                const mockResponse = JSON.stringify({
                    style: 'focal-point',
                    focalIndices: [0, Math.floor(Math.random() * params.fragmentFeatures?.length || 3)],
                    backgroundIndices: [1, 2, 3, 4].filter(
                        i => i < (params.fragmentFeatures?.length || 5) && i !== 0
                    ),
                    flowDirection: ['diagonal', 'left-to-right', 'circular'][Math.floor(Math.random() * 3)],
                    colorEmphasis: ['#f0f5e9', '#f5efed', '#e9f0f5'][Math.floor(Math.random() * 3)],
                    narrativeIntent: 'visual exploration'
                });
                
                resolve(mockResponse);
            }, 500); // Simulate 500ms response time
        });
    }
    
    /**
     * Logs debug messages if debug mode is enabled
     * @param {String} message - The message to log
     * @param {*} data - Optional data to log
     */
    logDebug(message, data) {
        if (this.parameters.debug) {
            console.log(`[LLMEnhancer] ${message}`, data || '');
        }
    }
}
