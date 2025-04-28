/**
 * Data Management for Oracle Stack
 * 
 * Handles loading and managing the image collection
 */

let imageCollection = [];
let lastCheckTime = 0;
const CHECK_INTERVAL = 5000; // Check for new images every 5 seconds

// Helper function to get the base URL for assets
function getBaseUrl() {
    // Check if we're on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        return '/assemblage';
    }
    return '';
}

export async function loadImageCollection() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/images/metadata.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        
        // Transform metadata into image collection format
        imageCollection = metadata.map(img => ({
            id: img.id,
            originalFilename: img.source_file || img.src,
            src: img.path ? `${baseUrl}/${img.path}` : `${baseUrl}/images/collages/${img.src}`,
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
        
        console.log('Loaded image paths:', imageCollection.map(img => ({ id: img.id, src: img.src })).slice(0, 5), '...');
        
        console.log('Loaded image collection:', imageCollection.length, 'images');
        return imageCollection;
    } catch (error) {
        console.error('Error loading image collection:', error);
        return [];
    }
}

export async function checkForNewImages() {
    const currentTime = Date.now();
    if (currentTime - lastCheckTime < CHECK_INTERVAL) {
        return; // Don't check too frequently
    }
    lastCheckTime = currentTime;

    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/images/metadata.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        
        // Get current image IDs
        const currentIds = new Set(imageCollection.map(img => img.id));
        
        // Find new images
        const newImages = metadata.filter(img => !currentIds.has(img.id));
        
        if (newImages.length > 0) {
            console.log('Found', newImages.length, 'new images');
            
            // Transform new images into collection format
            const newCollectionItems = newImages.map(img => ({
                id: img.id,
                originalFilename: img.source_file || img.src,
                src: `${baseUrl}/images/collages/${img.src}`,
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
            
            // Add new images to collection
            imageCollection = [...imageCollection, ...newCollectionItems];
            
            // No need to call displayImages() as it doesn't exist in the current implementation
        }
    } catch (error) {
        console.error('Error checking for new images:', error);
    }
}

// Initialize the image collection
loadImageCollection().then(collection => {
    console.log('Image collection initialized with', collection.length, 'images');
    // Start periodic check for new images
    setInterval(checkForNewImages, CHECK_INTERVAL);
    // No need to call displayImages() as it doesn't exist in the current implementation
});

export { imageCollection };