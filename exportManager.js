class ExportManager {
    constructor() {
        this.isExportMode = false;
        this.exportControls = null;
        this.initializeControls();
    }

    initializeControls() {
        // Create export controls container
        this.exportControls = document.createElement('div');
        this.exportControls.className = 'export-controls';
        
        // Create export buttons
        const colorBtn = this.createButton('Export Colored', () => this.exportColored());
        const bwBtn = this.createButton('Export B&W', () => this.exportBlackAndWhite());
        
        this.exportControls.appendChild(colorBtn);
        this.exportControls.appendChild(bwBtn);
        document.body.appendChild(this.exportControls);
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.className = 'export-btn';
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    async exportColored() {
        // Create a canvas with the current view
        const canvas = await this.captureCurrentView();
        
        // Convert to blob and download
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        this.downloadBlob(blob, 'oracle-stack-colored.png');
    }

    async exportBlackAndWhite() {
        // Create a canvas with the current view
        const canvas = await this.captureCurrentView();
        const ctx = canvas.getContext('2d');
        
        // Convert to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob and download
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        this.downloadBlob(blob, 'oracle-stack-bw.png');
    }

    async captureCurrentView() {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Draw the current view
        ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw all image cards
        const imageCards = document.querySelectorAll('.image-card');
        for (const card of imageCards) {
            const rect = card.getBoundingClientRect();
            const img = card.querySelector('img');
            
            if (img) {
                ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height);
            }
        }
        
        return canvas;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggle() {
        this.isExportMode = !this.isExportMode;
        this.exportControls.style.display = this.isExportMode ? 'flex' : 'none';
    }
}

// Create and export singleton instance
const exportManager = new ExportManager();
export default exportManager; 