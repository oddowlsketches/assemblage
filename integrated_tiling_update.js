/**
 * Integrated Tiling Update for Assemblage
 * 
 * This script provides the necessary code to update the main app with the
 * improved tiling collage functionality that was implemented in test_tiling.html
 */

// 1. First, import the CollageGenerator in your app.js file, right after your other imports:

// Add this line to the top of app.js:
import CollageGenerator from './collage/collageGenerator.js';

// 2. Then, add the collageGenerator as a property in your App class constructor:

// Add this inside the App constructor function:
this.collageGenerator = new CollageGenerator(document.createElement('canvas'));
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

// 3. Create a canvas element for the collage in your HTML (you can add this to index.html):
/*
<div id="collageContainer" class="collage-container">
    <canvas id="collageCanvas" class="collage-canvas"></canvas>
</div>
*/

// 4. Add a method to your App class to initialize the collage generator with the canvas:

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

// 5. Add a method to resize the collage canvas:

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

// 6. Add a method to generate the collage:

generateCollage() {
    if (!this.imageCollection || this.imageCollection.length === 0) {
        console.error('No images available for collage');
        return;
    }
    
    // Randomize some parameters
    const randomParams = {
        ...this.tilingParameters,
        complexity: 5 + Math.floor(Math.random() * 5),    // 5-9
        density: 3 + Math.floor(Math.random() * 5),       // 3-7
        allowImageRepetition: Math.random() > 0.3         // 70% chance to allow repetition
    };
    
    // Generate tiling collage with the current images
    this.collageGenerator.generate(
        this.imageCollection,
        null,  // No fortune text on the canvas
        'tiling',
        randomParams
    );
}

// 7. Modify the displayImages method in your App class to use the collage generator:

displayImages() {
    if (!this.imageCollection || this.imageCollection.length === 0) {
        console.error('No images to display');
        return;
    }

    console.log('Displaying images:', this.imageCollection.map(img => img.id));
    
    // Update background color based on current images
    this.backgroundManager.setBackgroundFromImages(this.imageCollection);
    
    // OPTION 1: Use both traditional layout and collage
    // Display images in row layout
    this.layoutManager.displayImages(this.imageCollection);
    
    // Generate collage
    this.generateCollage();
    
    // OR OPTION 2: Use only collage
    // this.generateCollage();
    // Hide the regular image container
    // document.getElementById('imageContainer').style.display = 'none';
    // Show the collage container
    // document.getElementById('collageContainer').style.display = 'block';
}

// 8. Update the init method to initialize the collage generator:

async init() {
    this.setupEventListeners();
    this.initializeCollageGenerator();  // Add this line
    
    // Rest of your init code...
}

// 9. Update the shuffleImages method to regenerate the collage:

shuffleImages() {
    // Your existing code...
    
    // After updating this.imageCollection:
    
    // Display images
    this.displayImages();
    
    // Generate new collage with new images
    this.generateCollage();
    
    // Rest of your code...
}

/**
 * CSS Additions to add to your styles.css:
 * 
 * .collage-container {
 *     position: relative;
 *     width: 100%;
 *     height: 100vh;
 *     overflow: hidden;
 * }
 * 
 * .collage-canvas {
 *     width: 100%;
 *     height: 100%;
 *     display: block;
 * }
 */

/**
 * HTML Changes for index.html:
 * 
 * 1. Add this inside the main element:
 * <div id="collageContainer" class="collage-container">
 *     <canvas id="collageCanvas" class="collage-canvas"></canvas>
 * </div>
 * 
 * 2. If you want to use ONLY the collage (OPTION 2), you can add this styling:
 * #imageContainer {
 *     display: none;
 * }
 */
