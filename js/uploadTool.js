/**
 * Image Upload Tool for Assemblage
 * 
 * Handles uploading new images, generating metadata, and adding them to the collection
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.querySelector('.browse-btn');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const imageCount = document.querySelector('.image-count');
    
    // State variables
    let uploadedFiles = [];
    let isProcessing = false;
    
    // Initialize event listeners
    initEventListeners();
    
    function initEventListeners() {
        // Upload area click to trigger file input
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File input change to handle selected files
        fileInput.addEventListener('change', handleFiles);
        
        // Upload area drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('active');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('active');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('active');
            const files = e.dataTransfer.files;
            handleFiles({ target: { files } });
        });
        
        // Submit button
        submitBtn.addEventListener('click', processAndUploadImages);
    }
    
    // Handle files selected by user
    function handleFiles(e) {
        const files = e.target.files;
        
        if (!files || files.length === 0) {
            return;
        }
        
        // Filter to include only image files
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showStatus('Please select valid image files.', 'error');
            return;
        }
        
        // Reset the state
        uploadedFiles = imageFiles;
        
        // Update image count
        updateImageCount();
        
        // Clear preview
        imagePreview.innerHTML = '';
        
        // Create preview images
        createImagePreviews();
        
        // Enable submit button
        submitBtn.disabled = false;
    }
    
    // Update image count display
    function updateImageCount() {
        imageCount.textContent = `${uploadedFiles.length} image${uploadedFiles.length !== 1 ? 's' : ''} selected`;
    }
    
    // Create preview images
    function createImagePreviews() {
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = () => removeImage(index);
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Remove an image
    function removeImage(index) {
        uploadedFiles.splice(index, 1);
        
        // Update image count
        updateImageCount();
        
        // Update preview
        imagePreview.innerHTML = '';
        createImagePreviews();
        
        // Disable submit button if no images left
        submitBtn.disabled = uploadedFiles.length === 0;
    }
    
    // Process and upload images
    async function processAndUploadImages() {
        if (isProcessing) return;
        
        try {
            isProcessing = true;
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Show initial status
            showStatus('Processing images...', 'info');
            
            // Prepare image data
            const formData = new FormData();
            uploadedFiles.forEach(file => {
                formData.append('files[]', file);
            });
            
            // Upload to server
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                if (response.status === 0) {
                    throw new Error('Could not connect to the server. Please make sure the image processor is running.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showStatus(`Successfully processed and added ${result.images.length} images!`, 'success');
                resetForm();
            } else {
                throw new Error(result.message || 'Failed to process images');
            }
        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'An error occurred while processing images.';
            
            if (error.message.includes('Could not connect to the server')) {
                errorMessage = 'Could not connect to the image processor. Please make sure it is running and try again.';
            } else if (error.message.includes('Server error')) {
                errorMessage = 'The server encountered an error. Please try again later.';
            } else {
                errorMessage = error.message;
            }
            
            showStatus(errorMessage, 'error');
        } finally {
            isProcessing = false;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        
        // Scroll to status message
        statusMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    // Reset form after successful upload
    function resetForm() {
        uploadedFiles = [];
        
        imagePreview.innerHTML = '';
        submitBtn.disabled = true;
        
        // Update image count
        updateImageCount();
    }
});
