/**
 * CrystalGenerator - Creates crystal-like effects with rotated and overlapping images
 */

export class CrystalGenerator {
    constructor(canvas, parameters = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parameters = parameters;
        this.imageUsageCount = new Map();
        
        // Initialize parameters with defaults
        this.crystalComplexity = parameters.crystalComplexity || 0.5;
        this.crystalDensity = parameters.crystalDensity || 0.5;
        this.crystalOpacity = parameters.crystalOpacity || 0.7;
        this.isolatedMode = parameters.isolatedMode || false;
        this.addGlow = parameters.addGlow || false;
        this.rotationRange = parameters.rotationRange || Math.PI / 4;
        
        console.log('CrystalGenerator initialized with parameters:', this.parameters);
    }

    async generateCrystalCollage(images) {
        if (!images || images.length === 0) {
            console.warn('No images provided for crystal collage');
            return;
        }
        
        // Reset image usage tracking
        this.imageUsageCount.clear();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background color
        this.setBackgroundColor();
        
        // Calculate base size based on complexity
        const baseSize = Math.max(50, Math.min(200, 100 + this.crystalComplexity * 150));
        
        // Calculate number of pieces based on density
        const numPieces = Math.max(5, Math.min(20, 10 + this.crystalDensity * 15));
        
        const pieces = [];
        
        // Generate crystal pieces
        for (let i = 0; i < numPieces; i++) {
            const width = baseSize * (0.8 + Math.random() * 0.4);
            const height = width * (0.8 + Math.random() * 0.4);
            
            // Random position within canvas bounds
            const x = Math.random() * (this.canvas.width - width);
            const y = Math.random() * (this.canvas.height - height);
            
            // Random rotation within range
            const rotation = (Math.random() - 0.5) * this.rotationRange;
            
            // Random opacity based on crystalOpacity parameter
            const opacity = 0.3 + Math.random() * this.crystalOpacity;
            
            // Determine crystal facet type
            const facetType = this.getRandomFacetType();
            
            // Random image from the provided set
            const imageIndex = Math.floor(Math.random() * images.length);
            const image = images[imageIndex];
            
            // Update usage count
            const currentCount = this.imageUsageCount.get(imageIndex) || 0;
            this.imageUsageCount.set(imageIndex, currentCount + 1);
            
            pieces.push({
                x, y, width, height, rotation, opacity, image, facetType
            });
        }
        
        // Sort pieces by opacity for proper layering
        pieces.sort((a, b) => a.opacity - b.opacity);
        
        // Draw pieces
        pieces.forEach(piece => {
            this.ctx.save();
            this.ctx.globalAlpha = piece.opacity;
            
            // Move to piece center for rotation
            this.ctx.translate(piece.x + piece.width/2, piece.y + piece.height/2);
            this.ctx.rotate(piece.rotation);
            
            // Create clipping path for crystal facet
            this.drawCrystalFacet(piece.facetType, piece.width, piece.height);
            this.ctx.clip();
            
            // Draw image
            this.ctx.drawImage(piece.image, -piece.width/2, -piece.height/2, piece.width, piece.height);
            
            this.ctx.restore();
        });
        
        // Add glow effect if enabled
        if (this.addGlow) {
            this.addGlowEffect();
        }
        
        console.log('[DEBUG] Crystal collage generation completed');
    }
    
    getRandomFacetType() {
        const facetTypes = ['diamond', 'hexagon', 'triangle', 'rectangle', 'pentagon', 'octagon', 'star', 'circle'];
        return facetTypes[Math.floor(Math.random() * facetTypes.length)];
    }
    
    drawCrystalFacet(type, width, height) {
        const centerX = 0;
        const centerY = 0;
        const size = Math.min(width, height) * 0.9; // Scale to 90% of the smaller dimension
        
        this.ctx.beginPath();
        
        switch (type) {
            case 'diamond':
                this.ctx.moveTo(centerX, centerY - size/2); // Top
                this.ctx.lineTo(centerX + size/2, centerY); // Right
                this.ctx.lineTo(centerX, centerY + size/2); // Bottom
                this.ctx.lineTo(centerX - size/2, centerY); // Left
                break;
                
            case 'hexagon':
                const hexAngle = (Math.PI * 2) / 6;
                for (let i = 0; i < 6; i++) {
                    const x = centerX + size/2 * Math.cos(hexAngle * i);
                    const y = centerY + size/2 * Math.sin(hexAngle * i);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                break;
                
            case 'triangle':
                this.ctx.moveTo(centerX, centerY - size/2); // Top
                this.ctx.lineTo(centerX + size/2, centerY + size/2); // Bottom right
                this.ctx.lineTo(centerX - size/2, centerY + size/2); // Bottom left
                break;
                
            case 'rectangle':
                this.ctx.rect(centerX - size/2, centerY - size/2, size, size);
                break;
                
            case 'pentagon':
                const pentAngle = (Math.PI * 2) / 5;
                for (let i = 0; i < 5; i++) {
                    const x = centerX + size/2 * Math.cos(pentAngle * i - Math.PI/2);
                    const y = centerY + size/2 * Math.sin(pentAngle * i - Math.PI/2);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                break;
                
            case 'octagon':
                const octAngle = (Math.PI * 2) / 8;
                for (let i = 0; i < 8; i++) {
                    const x = centerX + size/2 * Math.cos(octAngle * i);
                    const y = centerY + size/2 * Math.sin(octAngle * i);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                break;
                
            case 'star':
                const outerRadius = size/2;
                const innerRadius = size/4;
                const numPoints = 5;
                const angleStep = (Math.PI * 2) / numPoints;
                
                for (let i = 0; i < numPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = angleStep * i;
                    const x = centerX + radius * Math.cos(angle - Math.PI/2);
                    const y = centerY + radius * Math.sin(angle - Math.PI/2);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                break;
                
            case 'circle':
                this.ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
                break;
                
            default:
                // Default to diamond if type is unknown
                this.ctx.moveTo(centerX, centerY - size/2);
                this.ctx.lineTo(centerX + size/2, centerY);
                this.ctx.lineTo(centerX, centerY + size/2);
                this.ctx.lineTo(centerX - size/2, centerY);
                break;
        }
        
        this.ctx.closePath();
    }
    
    setBackgroundColor() {
        // Generate a subtle background color
        const hue = Math.random() * 360;
        this.ctx.fillStyle = `hsla(${hue}, 20%, 95%, 0.3)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    addGlowEffect() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
} 