/**
 * Rotation Debug Script
 * 
 * This script adds debugging for the global rotation probability in the main application.
 * It will log when the global no-rotation setting is triggered and count how many fragments have rotation.
 */

console.log('Loading rotation debug script...');

// Track statistics
let stats = {
    totalCollages: 0,
    noRotationCollages: 0,
    totalFragments: 0,
    noRotationFragments: 0
};

// Function to log statistics
function logStats() {
    console.log('Rotation Statistics:');
    console.log(`Total Collages: ${stats.totalCollages}`);
    console.log(`Collages with No Rotation: ${stats.noRotationCollages} (${(stats.noRotationCollages / stats.totalCollages * 100).toFixed(1)}%)`);
    console.log(`Expected No Rotation: 30%`);
    console.log(`Difference from Expected: ${((stats.noRotationCollages / stats.totalCollages * 100) - 30).toFixed(1)}%`);
    console.log(`Total Fragments: ${stats.totalFragments}`);
    console.log(`Fragments with No Rotation: ${stats.noRotationFragments} (${(stats.noRotationFragments / stats.totalFragments * 100).toFixed(1)}%)`);
}

// Function to check if a fragment has rotation
function hasRotation(fragment) {
    return fragment.rotation !== undefined && fragment.rotation !== 0;
}

// Function to check if all fragments in a collage have no rotation
function allFragmentsHaveNoRotation(fragments) {
    return fragments.every(fragment => !hasRotation(fragment));
}

// Function to patch the fragmentsGenerator.generateFragments method
function patchFragmentsGenerator() {
    if (!window.app || !window.app.generator || !window.app.generator.fragmentsGenerator) {
        console.error('App components not found, cannot patch fragmentsGenerator');
        return;
    }

    const fragmentsGenerator = window.app.generator.fragmentsGenerator;
    const originalGenerateFragments = fragmentsGenerator.generateFragments;

    // Override the generateFragments method
    fragmentsGenerator.generateFragments = async function(...args) {
        // Call the original method
        const fragments = await originalGenerateFragments.apply(this, args);
        
        if (!fragments || fragments.length === 0) {
            return fragments;
        }

        // Update statistics
        stats.totalCollages++;
        stats.totalFragments += fragments.length;
        
        // Count fragments with no rotation
        const noRotationCount = fragments.filter(fragment => !hasRotation(fragment)).length;
        stats.noRotationFragments += noRotationCount;
        
        // Check if all fragments have no rotation
        if (allFragmentsHaveNoRotation(fragments)) {
            stats.noRotationCollages++;
            console.log('COLLAGE WITH NO ROTATION DETECTED!', {
                collageNumber: stats.totalCollages,
                fragmentCount: fragments.length
            });
        }
        
        // Log statistics every 5 collages
        if (stats.totalCollages % 5 === 0) {
            logStats();
        }
        
        return fragments;
    };
    
    console.log('Successfully patched fragmentsGenerator.generateFragments method');
}

// Function to patch the main-mask-integration.js file
function patchMainMaskIntegration() {
    // Check if the CONFIG object exists in the global scope
    if (window.CONFIG && window.CONFIG.globalNoRotationProbability !== undefined) {
        console.log('Found CONFIG.globalNoRotationProbability:', window.CONFIG.globalNoRotationProbability);
    } else {
        console.warn('CONFIG.globalNoRotationProbability not found in global scope');
        
        // Try to find it in the main-mask-integration.js file
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.src && script.src.includes('main-mask-integration.js')) {
                console.log('Found main-mask-integration.js script:', script.src);
                break;
            }
        }
    }
}

// Initialize the debug script
function init() {
    console.log('Initializing rotation debug script...');
    
    // Wait for the app to be available
    const waitForApp = () => {
        if (window.app && window.app.generator && window.app.generator.fragmentsGenerator) {
            patchFragmentsGenerator();
            patchMainMaskIntegration();
            console.log('Rotation debug script initialized successfully');
        } else {
            console.log('App not ready, retrying in 500ms...');
            setTimeout(waitForApp, 500);
        }
    };
    
    // Start waiting for the app
    setTimeout(waitForApp, 1000);
}

// Start initialization
init(); 