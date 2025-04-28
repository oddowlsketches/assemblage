/**
 * Export Module for Oracle Stack
 * 
 * Handles exporting the oracle reading as image or PDF
 */

class ExportManager {
    constructor() {
        this.exportBtn = document.getElementById('exportBtn');
        this.exportOptions = document.querySelectorAll('.export-options button');
        this.imageContainer = document.getElementById('imageContainer');
        this.fortuneOutput = document.getElementById('fortuneOutput');
        
        // Initialize export handlers
        this.initExportHandlers();
    }
    
    /**
     * Set up event listeners for export
     */
    initExportHandlers() {
        // Main export button
        this.exportBtn.addEventListener('click', () => {
            // Default to PNG if no format is selected
            this.exportAs('png');
        });
        
        // Format-specific buttons
        this.exportOptions.forEach(button => {
            button.addEventListener('click', () => {
                const format = button.getAttribute('data-format');
                this.exportAs(format);
            });
        });
    }
    
    /**
     * Export the reading in the specified format
     * @param {string} format - Export format (png, jpg, pdf)
     */
    exportAs(format) {
        // Create a container for the export
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        exportContainer.style.top = '-9999px';
        
        // Add styling for the container
        exportContainer.style.backgroundColor = '#fff';
        exportContainer.style.padding = '40px';
        exportContainer.style.borderRadius = '8px';
        exportContainer.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        exportContainer.style.width = '800px';
        exportContainer.style.fontFamily = "'Playfair Display', serif";
        
        // Create header
        const header = document.createElement('div');
        header.innerHTML = '<h2 style="text-align: center; margin-bottom: 20px; font-size: 24px;">The Oracle Stack</h2>';
        exportContainer.appendChild(header);
        
        // Clone the image container (we'll modify this clone)
        const imagesClone = this.imageContainer.cloneNode(true);
        
        // Fix layout for export
        if (this.imageContainer.classList.contains('layout-stack')) {
            // For stack layout, we'll create a grid layout for the export
            imagesClone.classList.remove('layout-stack');
            imagesClone.style.display = 'grid';
            imagesClone.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
            imagesClone.style.gap = '20px';
            imagesClone.style.position = 'static';
            imagesClone.style.height = 'auto';
            
            // Fix positioning of individual cards
            Array.from(imagesClone.querySelectorAll('.image-card')).forEach(card => {
                card.style.position = 'static';
                card.style.transform = 'none';
                card.style.margin = '0';
                card.style.width = '100%';
                card.style.height = '250px';
            });
        }
        
        exportContainer.appendChild(imagesClone);
        
        // Add the fortune
        const fortuneClone = document.createElement('div');
        fortuneClone.style.marginTop = '30px';
        fortuneClone.style.padding = '20px';
        fortuneClone.style.backgroundColor = '#f5f5f5';
        fortuneClone.style.borderRadius = '8px';
        fortuneClone.style.fontSize = '18px';
        fortuneClone.style.lineHeight = '1.6';
        fortuneClone.textContent = this.fortuneOutput.textContent;
        exportContainer.appendChild(fortuneClone);
        
        // Add footer
        const footer = document.createElement('div');
        footer.style.marginTop = '30px';
        footer.style.fontSize = '14px';
        footer.style.textAlign = 'center';
        footer.style.color = '#666';
        
        // Get current date
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        footer.textContent = `Reading generated on ${formattedDate}`;
        exportContainer.appendChild(footer);
        
        // Add to document temporarily
        document.body.appendChild(exportContainer);
        
        // Use html2canvas to capture the container
        this.captureAndDownload(exportContainer, format);
    }
    
    /**
     * Capture the container and download in specified format
     * @param {HTMLElement} container - Container to capture
     * @param {string} format - Export format
     */
    captureAndDownload(container, format) {
        // For this implementation, we need to include the html2canvas library
        // in the HTML file. Let's assume it's included.
        
        // We'll use a promise-based approach
        const capturePromise = new Promise((resolve, reject) => {
            // Check if html2canvas is available
            if (typeof html2canvas !== 'function') {
                // Library not loaded yet, load it
                const script = document.createElement('script');
                script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
        
        capturePromise
            .then(() => {
                // Capture using html2canvas
                return html2canvas(container, {
                    scale: 2, // Better quality
                    useCORS: true,
                    logging: false
                });
            })
            .then(canvas => {
                let downloadLink;
                
                if (format === 'pdf') {
                    // For PDF, we need jsPDF library
                    if (typeof jsPDF !== 'function') {
                        // Load jsPDF
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                        document.head.appendChild(script);
                        
                        // Alert user to try again after library loads
                        alert('PDF export is being set up. Please try again in a moment.');
                        return;
                    }
                    
                    // Create PDF from canvas
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm'
                    });
                    
                    // Calculate dimensions
                    const imgWidth = 210; // A4 width in mm
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    
                    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                    pdf.save('oracle-reading.pdf');
                } else {
                    // For PNG/JPG
                    const imgType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                    const quality = format === 'jpg' ? 0.95 : undefined;
                    
                    downloadLink = document.createElement('a');
                    downloadLink.href = canvas.toDataURL(imgType, quality);
                    downloadLink.download = `oracle-reading.${format}`;
                    downloadLink.click();
                }
            })
            .catch(error => {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
            })
            .finally(() => {
                // Clean up
                document.body.removeChild(container);
            });
    }
}

// Export the ExportManager class
export { ExportManager };

// This will be initialized in app.js
// const exportManager = new ExportManager();
