/**
 * Integration of improved tiling collage features into main app
 * 
 * This script shows what changes to make to integrate the fixed
 * tiling collage functionality from test_tiling.html into the main app.
 */

// 1. In app.js, update the collage generation parameters

// Find the generateCollage function (or where collage parameters are set)
// Add these parameters to enable the improved tiling behavior:

const improvedTilingParameters = {
    // Base parameters
    complexity: 6,       // Controls number of images (5-10 recommended)
    density: 5,          // Controls spacing between images (3-8 recommended)
    contrast: 6,         // Controls image contrast (5-7 recommended)
    
    // Tiling specific parameters
    cleanTiling: false,  // Set to false for more artistic layouts
    blendOpacity: 0.6,   // Increased from default 0.3 for better visibility
    
    // Image repetition - this is the key new feature
    allowImageRepetition: true  // Set to true to allow some images to repeat
};

// 2. Update the collage generation call in your main app code:

// Find where you call generateCollage or similar function and update to:
collageGenerator.generate(
    images,              // Your loaded images array
    null,                // Fortune text (null if not used yet)
    'tiling',            // Use tiling effect 
    improvedTilingParameters
);

// 3. If you have a "Shift Perspective" button, update its handler:

document.getElementById('shiftPerspectiveBtn').addEventListener('click', () => {
    // Randomize some parameters for variety
    const randomParams = {
        ...improvedTilingParameters,
        complexity: 5 + Math.floor(Math.random() * 5),    // 5-9
        density: 3 + Math.floor(Math.random() * 5),       // 3-7
        allowImageRepetition: Math.random() > 0.3         // 70% chance to allow repetition
    };
    
    // Generate new collage
    collageGenerator.generate(
        images,
        null,
        'tiling',
        randomParams
    );
});
