/**
 * Fragments Generator for Assemblage
 * Handles fragments-specific collage generation with enhanced parameters
 */

export class FragmentsGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.backgroundColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C'
        ];
        
        // Set default canvas dimensions if not provided
        if (!this.canvas) {
            this.canvas = {
                width: 1200,
                height: 800
            };
        }
        
        // Ensure canvas has dimensions
        if (!this.canvas.width || !this.canvas.height) {
            this.canvas.width = 1200;
            this.canvas.height = 800;
        }
    }

    generateBackgroundColor() {
        return this.backgroundColors[Math.floor(Math.random() * this.backgroundColors.length)];
    }

    calculateScale(variation) {
        switch (variation) {
            case 'Organic':
                return 0.8 + Math.random() * 0.4;
            case 'Focal':
                return 1.2 + Math.random() * 0.3;
            case 'Classic':
            default:
                return 1 + Math.random() * 0.2;
        }
    }

    async generateFragments(images, maskType = '', options = {}) {
        if (!images || images.length === 0) {
            console.error('No images provided to generate fragments');
            return [];
        }

        console.log('Generating fragments with:', {
            numImages: images.length,
            maskType,
            options,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        });

        const fragments = [];
        const { variation = 'Classic', complexity = 0.5, maxFragments = 8 } = options;
        
        // Set background color
        const backgroundColor = this.generateBackgroundColor();
        console.log('Using background color:', backgroundColor);
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set global composite operation to source-over for better visibility
        this.ctx.globalCompositeOperation = 'source-over';

        // Calculate number of fragments based on complexity
        const numFragments = Math.max(3, Math.floor(maxFragments * complexity));
        console.log('Creating', numFragments, 'fragments');
        
        for (let i = 0; i < numFragments; i++) {
            const img = images[Math.floor(Math.random() * images.length)];
            const scale = this.calculateScale(variation);
            
            // Calculate fragment size
            const size = Math.min(this.canvas.width, this.canvas.height) * 0.3 * scale;
            
            // Calculate position
            const x = Math.random() * (this.canvas.width - size);
            const y = Math.random() * (this.canvas.height - size);
            
            // Generate mask
            const mask = this.generateMask(size, maskType);
            
            console.log('Creating fragment', i + 1, 'of', numFragments, {
                size,
                x,
                y,
                scale,
                maskType: mask.type,
                maskSize: mask.size,
                imageValid: !!(img && img.complete && img.naturalWidth !== 0)
            });

            // Create fragment
            const fragment = {
                image: img,
                x,
                y,
                size,
                mask,
                rotation: Math.random() * 360
            };
            
            fragments.push(fragment);
            this.drawFragment(fragment);
        }
        
        // Reset global composite operation
        this.ctx.globalCompositeOperation = 'source-over';
        
        console.log('Generated', fragments.length, 'fragments');
        return fragments;
    }

    generateMask(size, type) {
        // Always generate a mask
        const maskTypes = ['circle', 'ellipse', 'rectangle', 'triangle', 'diamond', 'hexagon', 'organic', 'wave', 'spiral'];
        const maskType = type || maskTypes[Math.floor(Math.random() * maskTypes.length)];
        
        // Add more variation to mask sizes
        const sizeVariation = 0.6 + Math.random() * 0.8; // This gives us a range of 0.6 to 1.4
        
        return {
            type: maskType,
            size: size * sizeVariation
        };
    }

    drawFragment(fragment) {
        console.log('Drawing fragment:', {
            x: fragment.x,
            y: fragment.y,
            size: fragment.size,
            rotation: fragment.rotation,
            maskType: fragment.mask.type,
            maskSize: fragment.mask.size,
            imageValid: !!(fragment.image && fragment.image.complete && fragment.image.naturalWidth !== 0),
            imageSize: fragment.image ? {
                width: fragment.image.width,
                height: fragment.image.height,
                naturalWidth: fragment.image.naturalWidth,
                naturalHeight: fragment.image.naturalHeight
            } : null
        });

        this.ctx.save();
        
        // Move to fragment position
        this.ctx.translate(fragment.x + fragment.size / 2, fragment.y + fragment.size / 2);
        this.ctx.rotate((fragment.rotation * Math.PI) / 180);
        
        // Create the path for the mask
        const createMaskPath = () => {
            this.ctx.beginPath();
            switch (fragment.mask.type) {
                case 'circle':
                    this.ctx.arc(0, 0, fragment.mask.size / 2, 0, Math.PI * 2);
                    break;
                case 'ellipse':
                    this.ctx.ellipse(0, 0, fragment.mask.size / 2, fragment.mask.size / 3, 0, 0, Math.PI * 2);
                    break;
                case 'rectangle':
                    this.ctx.rect(-fragment.mask.size / 2, -fragment.mask.size / 2, fragment.mask.size, fragment.mask.size);
                    break;
                case 'triangle':
                    this.ctx.moveTo(0, -fragment.mask.size / 2);
                    this.ctx.lineTo(fragment.mask.size / 2, fragment.mask.size / 2);
                    this.ctx.lineTo(-fragment.mask.size / 2, fragment.mask.size / 2);
                    this.ctx.closePath();
                    break;
                case 'diamond':
                    this.ctx.moveTo(0, -fragment.mask.size / 2);
                    this.ctx.lineTo(fragment.mask.size / 2, 0);
                    this.ctx.lineTo(0, fragment.mask.size / 2);
                    this.ctx.lineTo(-fragment.mask.size / 2, 0);
                    this.ctx.closePath();
                    break;
                case 'hexagon':
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        const x = Math.cos(angle) * fragment.mask.size / 2;
                        const y = Math.sin(angle) * fragment.mask.size / 2;
                        if (i === 0) this.ctx.moveTo(x, y);
                        else this.ctx.lineTo(x, y);
                    }
                    this.ctx.closePath();
                    break;
                case 'organic':
                case 'wave':
                case 'spiral':
                default:
                    this.ctx.arc(0, 0, fragment.mask.size / 2, 0, Math.PI * 2);
            }
        };

        // Draw the image first
        if (fragment.image && fragment.image.complete && fragment.image.naturalWidth !== 0) {
            // Draw the full image first
            this.ctx.drawImage(
                fragment.image,
                -fragment.size / 2,
                -fragment.size / 2,
                fragment.size,
                fragment.size
            );

            // Then create and apply the mask
            createMaskPath();
            this.ctx.clip();
            
            // Draw the image again within the mask
            this.ctx.drawImage(
                fragment.image,
                -fragment.size / 2,
                -fragment.size / 2,
                fragment.size,
                fragment.size
            );
        } else {
            console.error('Invalid or incomplete image in fragment:', fragment);
        }

        // Create the path again for the stroke
        createMaskPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
} 