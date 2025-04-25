import backgroundManager from './backgroundManager.js';

// ... existing code ...

// Add background toggle functionality
const backgroundToggleBtn = document.getElementById('backgroundToggleBtn');
if (backgroundToggleBtn) {
    backgroundToggleBtn.addEventListener('click', () => {
        backgroundManager.toggle();
        backgroundToggleBtn.classList.toggle('active');
    });
}

// Function to update background based on fortune and images
function updateBackground(fortuneText, selectedImages) {
    // Update background based on fortune text
    if (fortuneText) {
        backgroundManager.updateFromFortune(fortuneText);
    }
    
    // Update background based on selected images
    if (selectedImages && selectedImages.length > 0) {
        backgroundManager.updateFromImages(selectedImages);
    }
}

// Export the updateBackground function
export { updateBackground };

// Modify the generateFortune function to update background
async function generateFortune() {
    // ... existing fortune generation code ...
    
    // Update background based on fortune text
    backgroundManager.updateFromFortune(fortuneText);
    
    // Update background based on selected images
    backgroundManager.updateFromImages(selectedImages);
}

// Modify the shuffleImages function to update background
function shuffleImages() {
    // ... existing shuffle code ...
    
    // Update background based on selected images
    backgroundManager.updateFromImages(selectedImages);
}

// ... existing code ... 