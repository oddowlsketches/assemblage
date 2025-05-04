import { generateMosaic } from './scrambledMosaic.js';

// List of available collage images
const COLLAGE_IMAGES = [
    'imgfffd72f0.jpg',
    'imgffe16d35.jpg',
    'imgfeb5027a.jpg',
    'imgff3b21b1.jpg',
    'imgffbc438c.jpg',
    'imgfd68a30c.jpg',
    'imgfa93fdc7.jpg',
    'imgfb3af322.jpg',
    'imgfcd0a7cb.jpg',
    'imgf944368f.jpg'
];

let imageList = [];

// Function to update the slider label based on the selected operation
function updateSliderLabel() {
    const operation = document.getElementById('mosaic-operation').value;
    const percentageLabel = document.getElementById('percentageLabel');
    const value = Math.round(parseFloat(document.getElementById('mosaic-revealPct').value) * 100);
    
    if (percentageLabel) {
        // Change the label text based on the operation
        switch (operation) {
            case 'reveal':
                percentageLabel.firstChild.textContent = 'Reveal %: ';
                break;
            case 'rotate':
                percentageLabel.firstChild.textContent = 'Rotate %: ';
                break;
            case 'swap':
                percentageLabel.firstChild.textContent = 'Swap %: ';
                break;
        }
    }
}

async function loadImages() {
    // Load all images from the collage list
    const loadedImages = await Promise.all(
        COLLAGE_IMAGES.map(filename => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load image: ${filename}`);
                    resolve(null); // Resolve with null instead of rejecting
                };
                img.src = `/images/collages/${filename}`;
            });
        })
    );
    
    // Filter out any failed image loads
    imageList = loadedImages.filter(img => img !== null);
    console.log(`Loaded ${imageList.length} images`);
    
    return imageList;
}

// Create canvas elements for the gallery
function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    return canvas;
}

function generateSample(config) {
    const canvas = createCanvas();
    if (imageList.length === 0) return canvas;
    
    // Generate a scrambled mosaic with slightly randomized parameters
    const randomizedConfig = {
        ...config,
        // Add slight variation to each sample
        gridSize: Math.max(4, Math.min(16, config.gridSize + Math.floor((Math.random() - 0.5) * 2))),
        revealPercentage: Math.max(40, Math.min(90, config.revealPercentage + Math.floor((Math.random() - 0.5) * 10))),
    };
    
    // Generate the mosaic
    generateMosaic(canvas, imageList, randomizedConfig);
    
    return canvas;
}

async function updateGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    gallery.innerHTML = '';
    
    // Make sure images are loaded
    if (imageList.length === 0) {
        try {
            await loadImages();
        } catch (error) {
            console.error('Failed to load images:', error);
            gallery.innerHTML = '<p>Error: Failed to load images</p>';
            return;
        }
    }

    // Get control values
    const gridSize = parseInt(document.getElementById('mosaic-gridSize').value);
    const revealPct = parseFloat(document.getElementById('mosaic-revealPct').value) * 100; // Convert from 0-1 to 0-100
    const patternType = document.getElementById('mosaic-patternType').value;
    const shapeType = document.getElementById('mosaic-shapeType').value;
    const operation = document.getElementById('mosaic-operation').value;
    const bgColor = document.getElementById('mosaic-bgColor').value;
    const useMultiply = document.getElementById('mosaic-multiply').checked;

    // Update the slider label based on the operation
    updateSliderLabel();

    // Configure the mosaic
    const config = {
        gridSize: gridSize,
        revealPercentage: revealPct,
        gridPatternType: patternType,
        shapeType: shapeType,
        operation: operation,
        useMultiplyBlend: useMultiply,
        backgroundColor: bgColor
    };

    // Generate 5 samples
    for (let i = 0; i < 5; i++) {
        const sample = document.createElement('div');
        sample.className = 'sample';
        const canvas = generateSample(config);
        sample.appendChild(canvas);
        gallery.appendChild(sample);
    }
}

export function initGallery() {
    // Load images and generate initial gallery
    loadImages()
        .then(() => {
            // Initial gallery generation
            updateGallery();
            
            // Add event listeners
            document.getElementById('generate')?.addEventListener('click', updateGallery);
            document.getElementById('generate-mosaic')?.addEventListener('click', updateGallery);
            
            // Add change listeners for controls
            const controls = ['mosaic-gridSize', 'mosaic-revealPct', 'mosaic-patternType', 'mosaic-shapeType', 'mosaic-operation', 'mosaic-bgColor', 'mosaic-multiply'];
            controls.forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    // If the operation changes, update the slider label
                    if (id === 'mosaic-operation') {
                        updateSliderLabel();
                    }
                    updateGallery();
                });
                
                // Also add input listener for sliders to update in real-time
                if (id === 'mosaic-gridSize' || id === 'mosaic-revealPct') {
                    document.getElementById(id)?.addEventListener('input', (e) => {
                        // Update the display value for reveal percentage
                        if (id === 'mosaic-revealPct') {
                            const value = Math.round(parseFloat(e.target.value) * 100);
                            document.getElementById('revealPctValue').textContent = `${value}%`;
                        }
                        updateGallery();
                    });
                }
            });
        })
        .catch(err => {
            console.error('Failed to initialize gallery:', err);
        });
}