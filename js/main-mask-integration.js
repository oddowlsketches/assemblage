/**
 * Main App Mask Integration
 * 
 * A defensive script that adds mask support to the main Assemblage app
 * with randomized parameters and no UI controls.
 */

console.log('Loading main app mask integration...');

// Configuration
const CONFIG = {
    enabled: true,               // Start enabled
    allMasksProbability: 0.4,    // 40% chance of applying masks to all fragments
    noMasksProbability: 0.2,     // 20% chance of no masks
    sameMaskProbability: 0.5,    // 50% chance of using the same mask type for all fragments
    noRotationProbability: 0.4,  // 40% chance of having no rotation on fragments
    maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'],
    debugMode: true,            // Enable detailed logging
    initializationDelay: 2000,   // Wait 2 seconds for app to initialize
    maxRetries: 3,              // Number of times to retry initialization
    retryDelay: 1000           // Delay between retries in milliseconds
};

// State tracking
let state = {
    initialized: false,
    originalMethods: {},
    retryCount: 0,
    lastError: null,
    config: {...CONFIG}
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
        // Check if window.app exists
        if (!window.app) {
            throw new Error('App not found in window object');
        }

        // Check if generator exists
        if (!window.app.generator) {
            throw new Error('generator not found in app');
        }

        // Check if fragmentsGenerator exists
        if (!window.app.generator.fragmentsGenerator) {
            throw new Error('fragmentsGenerator not found in generator');
        }

        return true;
    } catch (error) {
        state.lastError = error;
        return false;
    }
}

// Store original methods for safe restoration
function storeOriginalMethods() {
    const app = window.app;
    const generator = app.generator;
    const fragmentsGenerator = generator.fragmentsGenerator;
    
    state.originalMethods = {
        generateFragments: fragmentsGenerator.generateFragments.bind(fragmentsGenerator),
        generate: generator.generate.bind(generator)
    };
    log('Stored original methods');
}

// Initialize mask support
function initializeMaskSupport() {
    if (state.initialized) {
        log('Already initialized');
        return;
    }

    if (!checkAppComponents()) {
        if (state.retryCount < CONFIG.maxRetries) {
            state.retryCount++;
            log(`Retrying initialization (${state.retryCount}/${CONFIG.maxRetries})...`);
            setTimeout(initializeMaskSupport, CONFIG.retryDelay);
            return;
        } else {
            error('Failed to initialize after maximum retries:', state.lastError);
            return;
        }
    }

    storeOriginalMethods();

    // Override fragmentsGenerator to add mask support
    const app = window.app;
    const generator = app.generator;
    const fragmentsGenerator = generator.fragmentsGenerator;
    
    const originalGenerateFragments = fragmentsGenerator.generateFragments;
    fragmentsGenerator.generateFragments = function(images) {
        // Call original method
        const fragments = originalGenerateFragments.call(this, images);
        
        // Determine masking mode
        const random = Math.random();
        let maskingMode;
        
        if (random < CONFIG.allMasksProbability) {
            maskingMode = 'all';
            log('Using ALL fragments masked mode (40% chance)');
        } else if (random < CONFIG.allMasksProbability + CONFIG.noMasksProbability) {
            maskingMode = 'none';
            log('Using NO masks mode (20% chance)');
        } else {
            maskingMode = 'random';
            log('Using RANDOM masking mode (40% chance)');
        }
        
        // Determine rotation mode
        const noRotation = Math.random() < CONFIG.noRotationProbability;
        if (noRotation) {
            log('Using NO ROTATION mode (40% chance)');
        } else {
            log('Using RANDOM ROTATION mode (60% chance)');
        }
        
        // Select mask types
        const randomMaskTypes = [...CONFIG.maskTypes];
        
        // Randomly select 3-7 mask types
        const numTypes = 3 + Math.floor(Math.random() * 5);
        while (randomMaskTypes.length > numTypes) {
            randomMaskTypes.splice(Math.floor(Math.random() * randomMaskTypes.length), 1);
        }
        
        // Apply masks based on mode
        if (maskingMode === 'all') {
            // Decide whether to use the same mask type for all fragments (50% chance)
            const useSameMask = Math.random() < CONFIG.sameMaskProbability;
            
            // If using the same mask, select one type
            const singleMaskType = useSameMask ? 
                randomMaskTypes[Math.floor(Math.random() * randomMaskTypes.length)] : 
                null;
            
            log(`Using ${useSameMask ? 'same' : 'different'} mask types: ${useSameMask ? singleMaskType : randomMaskTypes.join(', ')}`);
            
            // Apply masks to all fragments
            fragments.forEach((fragment, index) => {
                const maskType = useSameMask ? 
                    singleMaskType : 
                    randomMaskTypes[Math.floor(Math.random() * randomMaskTypes.length)];
                
                log(`Applying ${maskType} mask to fragment ${index}`);
                
                // Add mask to fragment
                fragment.mask = {
                    type: maskType,
                    enabled: true
                };
                
                // Apply rotation based on mode
                if (noRotation) {
                    fragment.rotation = 0;
                    log(`Setting fragment ${index} rotation to 0`);
                }
            });
        } else if (maskingMode === 'random') {
            // Random percentage of fragments get masks (between 30% and 80%)
            const maskPercentage = 0.3 + Math.random() * 0.5;
            log(`Random masking mode: ${(maskPercentage * 100).toFixed(0)}% of fragments will get masks`);
            
            // Apply masks to random fragments
            fragments.forEach((fragment, index) => {
                if (Math.random() < maskPercentage) {
                    const maskType = randomMaskTypes[Math.floor(Math.random() * randomMaskTypes.length)];
                    log(`Applying ${maskType} mask to fragment ${index}`);
                    
                    // Add mask to fragment
                    fragment.mask = {
                        type: maskType,
                        enabled: true
                    };
                }
                
                // Apply rotation based on mode
                if (noRotation) {
                    fragment.rotation = 0;
                    log(`Setting fragment ${index} rotation to 0`);
                }
            });
        } else {
            // No masks mode
            log('No masks applied to any fragments');
            
            // Apply rotation based on mode
            if (noRotation) {
                fragments.forEach((fragment, index) => {
                    fragment.rotation = 0;
                    log(`Setting fragment ${index} rotation to 0`);
                });
            }
        }
        
        return fragments;
    };
    
    log('Overrode fragmentsGenerator.generateFragments method');

    state.initialized = true;
    log('Mask support initialized successfully with randomized parameters');
}

// Start initialization after delay
setTimeout(initializeMaskSupport, CONFIG.initializationDelay);

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
            const app = window.app;
            const generator = app.generator;
            const fragmentsGenerator = generator.fragmentsGenerator;
            
            fragmentsGenerator.generateFragments = state.originalMethods.generateFragments;
            log('Restored original methods');
        }
    },
    getState: () => ({ ...state }),
    getConfig: () => ({ ...CONFIG })
}; 