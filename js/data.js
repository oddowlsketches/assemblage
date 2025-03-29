/**
 * Data Management for Oracle Stack
 * 
 * Handles loading and managing the image collection
 */

let imageCollection = [];

async function loadImageCollection() {
    try {
        const response = await fetch('images/metadata.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        
        // Transform metadata into image collection format
        imageCollection = metadata.map(img => ({
            id: img.id,
            originalFilename: img.source_file,
            src: `images/collages/${img.id}.jpg`,
            tags: img.tags || [],
            description: img.description || "",
            originalFormat: "JPEG",
            processedFormat: "JPEG",
            quality: 90,
            dimensions: {
                width: 450,
                height: 600
            },
            originalDimensions: {
                width: 3024,
                height: 4032
            }
        }));
        
        console.log('Loaded image collection:', imageCollection.length, 'images');
        return imageCollection;
    } catch (error) {
        console.error('Error loading image collection:', error);
        return [];
    }
}

// Initialize the image collection
loadImageCollection().then(collection => {
    console.log('Image collection initialized with', collection.length, 'images');
    // Trigger initial display if app is already initialized
    if (window.app) {
        window.app.displayImages();
    }
});

export { imageCollection };