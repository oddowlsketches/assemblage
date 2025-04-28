/**
 * Main App Mask Integration
 * 
 * A defensive script that adds mask support to the main Assemblage app
 * with randomized parameters and no UI controls.
 */

import { maskImplementations } from './maskImplementations.js';

console.log('Loading main app mask integration...');

// Configuration
const CONFIG = {
    enabled: true,               // Start enabled
    allMasksProbability: 0.6,    // 60% chance of applying masks to all fragments
    noMasksProbability: 0.1,     // 10% chance of no masks
    sameMaskProbability: 0.3,    // 30% chance of using the same mask type for all fragments
    globalNoRotationProbability: 0.3,  // 30% chance that no fragments have rotation at all
    maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'],
    maskWeights: {
        circle: 1.0,
        triangle: 1.0,
        rectangle: 1.0,
        ellipse: 1.0,
        diamond: 1.0,
        hexagon: 1.0,
        star: 0.3,  // Reduced probability for star mask (30% of normal)
        arc: 1.0,
        arch: 1.0
    },
    debugMode: true,            // Enable detailed logging
    initializationDelay: 2000,   // Increased from 500 to 2000ms
    maxRetries: 10,              // Increased from 5 to 10
    retryDelay: 1000            // Increased from 500 to 1000ms
};

// State tracking
let state = {
    initialized: false,
    originalMethods: {},
    retryCount: 0,
    lastError: null,
    config: {...CONFIG},
    recentlyUsedMasks: [] // Track recently used mask types
};

// Debug logging
function log(...args) {
    if (CONFIG.debugMode) {
        console.log('[Mask Integration]', ...args);
    }
}

function error(...args) {
    console.error('[Mask Integration]', ...args);
}

// Safety check for required app components
function checkAppComponents() {
    try {
        // More granular checks
        if (typeof window === 'undefined') {
            throw new Error('Window object not available');
        }

        if (!window.app) {
            throw new Error('App not found in window object');
        }

        if (!window.app.generator) {
            throw new Error('Generator not found in app');
        }

        if (!window.app.generator.fragmentsGenerator) {
            throw new Error('FragmentsGenerator not found');
        }

        // Additional validation
        const generator = window.app.generator;
        if (typeof generator.generate !== 'function') {
            throw new Error('Generator missing generate method');
        }

        if (typeof generator.fragmentsGenerator.generateFragments !== 'function') {
            throw new Error('FragmentsGenerator missing generateFragments method');
        }

        return true;
    } catch (error) {
        state.lastError = error;
        return false;
    }
}

// Store original methods for safe restoration
function storeOriginalMethods() {
    try {
        const app = window.app;
        const generator = app.generator;
        const fragmentsGenerator = generator.fragmentsGenerator;
        
        state.originalMethods = {
            generateFragments: fragmentsGenerator.generateFragments.bind(fragmentsGenerator),
            generate: generator.generate.bind(generator)
        };
        log('Stored original methods');
        return true;
    } catch (error) {
        error('Failed to store original methods:', error);
        return false;
    }
}

// Initialize mask support
function initializeMaskSupport() {
    if (state.initialized) {
        log('Already initialized');
        return;
    }

    // Wait for app to be available
    const waitForApp = () => {
        if (checkAppComponents()) {
            try {
                if (!storeOriginalMethods()) {
                    throw new Error('Failed to store original methods');
                }

                // Override fragmentsGenerator to add mask support
                const app = window.app;
                const generator = app.generator;
                const fragmentsGenerator = generator.fragmentsGenerator;
                
                const originalGenerateFragments = fragmentsGenerator.generateFragments;
                fragmentsGenerator.generateFragments = async function(images, fortuneText, parameters = {}) {
                    // Skip mask integration if this is part of the initial app load
                    if (window.app._initializing) {
                        return originalGenerateFragments.call(this, images, fortuneText, parameters);
                    }

                    // Skip if we're still initializing the mask integration
                    if (!state.initialized) {
                        return originalGenerateFragments.call(this, images, fortuneText, parameters);
                    }

                    console.log('Starting fragment generation in main integration:', {
                        numImages: images.length,
                        hasFortuneText: !!fortuneText,
                        parameters: parameters
                    });

                    // Generate fragments using the fragments generator
                    const fragments = await originalGenerateFragments.call(this, images, fortuneText, parameters);
                    console.log('Generated fragments:', fragments ? fragments.length : 0);

                    if (!fragments || fragments.length === 0) {
                        console.warn('No fragments generated');
                        return;
                    }

                    // Determine mask application strategy
                    const useSameMask = Math.random() < CONFIG.sameMaskProbability;
                    const applyMasks = Math.random() > CONFIG.noMasksProbability;
                    const selectedMaskType = useSameMask ? CONFIG.maskTypes[Math.floor(Math.random() * CONFIG.maskTypes.length)] : null;

                    console.log('Mask strategy:', {
                        useSameMask,
                        applyMasks,
                        selectedMaskType
                    });

                    // Helper function to select a mask type with weighted probabilities
                    function selectMaskType() {
                        // Calculate total weight
                        const totalWeight = Object.values(CONFIG.maskWeights).reduce((sum, weight) => sum + weight, 0);
                        
                        // Generate a random value between 0 and total weight
                        let random = Math.random() * totalWeight;
                        
                        // Select a mask type based on weight
                        for (const [type, weight] of Object.entries(CONFIG.maskWeights)) {
                            random -= weight;
                            if (random <= 0) {
                                return type;
                            }
                        }
                        
                        // Fallback to a random mask type
                        return CONFIG.maskTypes[Math.floor(Math.random() * CONFIG.maskTypes.length)];
                    }

                    // Apply masks to fragments
                    if (applyMasks) {
                        fragments.forEach(fragment => {
                            // Skip fragments with invalid dimensions
                            if (!isValidFragmentDimensions(fragment)) {
                                return;
                            }
                            
                            // Select a mask type
                            const maskType = selectedMaskType || selectMaskType();
                            
                            // Create the mask object
                            const mask = createMaskObject(maskType, fragment);
                            
                            // Apply the mask to the fragment
                            fragment.mask = mask;
                        });
                    }
                    
                    return fragments;
                };
                
                // Helper function to validate fragment dimensions
                function isValidFragmentDimensions(fragment) {
                    return (
                        fragment &&
                        typeof fragment.width === 'number' &&
                        typeof fragment.height === 'number' &&
                        !isNaN(fragment.width) &&
                        !isNaN(fragment.height) &&
                        fragment.width > 0 &&
                        fragment.height > 0
                    );
                }
                
                // Helper function to create a valid mask object
                function createMaskObject(maskType, fragment) {
                    // Use the same global rotation setting for the mask
                    const rotation = fragment.rotation || 0;

                    console.log('Creating mask object:', {
                        maskType,
                        rotation,
                        fragmentRotation: fragment.rotation
                    });

                    return {
                        type: maskType,
                        enabled: true,
                        scale: Math.max(0.5, Math.min(1.5, 1.0 + (Math.random() * 0.5 - 0.25))), // Scale between 0.5 and 1.5
                        rotation: rotation,
                        // Add additional properties for specific mask types
                        ...(maskType === 'star' && { spikes: 5 }),
                        ...(maskType === 'hexagon' && { sides: 6 }),
                        ...(maskType === 'arc' && { arcWidth: fragment.width / 4 }),
                        ...(maskType === 'arch' && { 
                            startAngle: Math.PI * 0.1,
                            endAngle: Math.PI * 1.9
                        })
                    };
                }
                
                // Helper function to ensure fragments are within canvas bounds
                function ensureFragmentInBounds(fragment, canvasWidth, canvasHeight) {
                    console.log('Ensuring fragment in bounds:', fragment);
                    const margin = 20; // Minimum margin from canvas edge
                    
                    // Ensure fragment dimensions are within canvas bounds
                    fragment.width = Math.min(fragment.width, canvasWidth * 0.8);
                    fragment.height = Math.min(fragment.height, canvasHeight * 0.8);
                    
                    // Ensure fragment position is within canvas bounds
                    fragment.x = Math.max(margin, Math.min(fragment.x, canvasWidth - fragment.width - margin));
                    fragment.y = Math.max(margin, Math.min(fragment.y, canvasHeight - fragment.height - margin));
                    
                    // Ensure x and y are valid numbers
                    if (isNaN(fragment.x) || isNaN(fragment.y)) {
                        log('Invalid fragment position detected, using fallback values');
                        fragment.x = margin;
                        fragment.y = margin;
                    }
                    
                    console.log('Fragment after bounds check:', fragment);
                }
                
                log('Mask support initialized successfully');
                state.initialized = true;
            } catch (error) {
                error('Error initializing mask support:', error);
                state.lastError = error;
                
                // Retry if we haven't exceeded max retries
                if (state.retryCount < CONFIG.maxRetries) {
                    state.retryCount++;
                    log(`Retrying initialization (${state.retryCount}/${CONFIG.maxRetries})...`);
                    setTimeout(waitForApp, CONFIG.retryDelay);
                } else {
                    error('Max retries exceeded, giving up on mask integration');
                }
            }
        } else {
            // Retry if we haven't exceeded max retries
            if (state.retryCount < CONFIG.maxRetries) {
                state.retryCount++;
                log(`Waiting for app components (${state.retryCount}/${CONFIG.maxRetries})...`);
                setTimeout(waitForApp, CONFIG.retryDelay);
            } else {
                error('Max retries exceeded, giving up on mask integration');
            }
        }
    };
    
    // Start the initialization process with a longer delay
    setTimeout(waitForApp, CONFIG.initializationDelay);
}

// Start initialization after page load
if (document.readyState === 'complete') {
    setTimeout(initializeMaskSupport, CONFIG.initializationDelay);
} else {
    window.addEventListener('load', () => {
        setTimeout(initializeMaskSupport, CONFIG.initializationDelay);
    });
}

// Export public API
window.maskIntegration = {
    enable: () => {
        if (!state.initialized) {
            log('Initializing mask support...');
            initializeMaskSupport();
        }
        log('Mask support enabled');
    },
    disable: () => {
        log('Mask support disabled');
    },
    reset: () => {
        if (state.originalMethods && window.app) {
            try {
                const app = window.app;
                const generator = app.generator;
                const fragmentsGenerator = generator.fragmentsGenerator;
                
                fragmentsGenerator.generateFragments = state.originalMethods.generateFragments;
                log('Restored original methods');
            } catch (error) {
                error('Failed to reset mask integration:', error);
            }
        }
    },
    getState: () => ({ ...state }),
    getConfig: () => ({ ...CONFIG })
}; 