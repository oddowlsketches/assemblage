import backgroundManager from './backgroundManager.js';
import exportManager from './exportManager.js';

// ... existing code ...

// Add background toggle functionality
const backgroundToggleBtn = document.getElementById('backgroundToggleBtn');
backgroundToggleBtn.addEventListener('click', () => {
    backgroundManager.toggle();
    backgroundToggleBtn.classList.toggle('active');
});

// Add export toggle button to controls
const controlsSection = document.querySelector('.controls');
const exportToggleBtn = document.createElement('button');
exportToggleBtn.className = 'toggle-btn';
exportToggleBtn.innerHTML = `
    <span class="toggle-icon">💾</span>
    <span class="toggle-text">Export Mode</span>
`;
controlsSection.appendChild(exportToggleBtn);

// Handle export toggle
exportToggleBtn.addEventListener('click', () => {
    exportManager.toggle();
    exportToggleBtn.classList.toggle('active');
});

// Modify the generateFortune function to update background
async function generateFortune() {
    // ... existing fortune generation code ...
    
    // Update background based on fortune text
    backgroundManager.updateFromFortune(fortuneText);
    
    // Update background based on selected images
    backgroundManager.updateFromImages(selectedImages);
    
    // If in export mode, ensure images are properly positioned
    if (exportManager.isExportMode) {
        // Wait for any layout changes to complete
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Modify the shuffleImages function to update background
function shuffleImages() {
    // ... existing shuffle code ...
    
    // Update background based on selected images
    backgroundManager.updateFromImages(selectedImages);
    
    // If in export mode, ensure images are properly positioned
    if (exportManager.isExportMode) {
        // Wait for any layout changes to complete
        setTimeout(() => {
            // Force a reflow to ensure proper positioning
            document.body.offsetHeight;
        }, 100);
    }
}

// ... existing code ... 