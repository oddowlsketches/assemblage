/**
 * Fragments Generator for Assemblage
 * Handles fragments-specific collage generation with enhanced parameters
 */

export class FragmentsGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        
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
        // Array of vibrant background colors
        const colors = [
            '#FF6B6B', // Coral Red
            '#4ECDC4', // Turquoise
            '#45B7D1', // Sky Blue
            '#96CEB4', // Sage Green
            '#FFEEAD', // Cream
            '#D4A5A5', // Dusty Rose
            '#9B59B6', // Purple
            '#3498DB', // Blue
            '#E67E22', // Orange
            '#2ECC71'  // Green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async generateFragments(images, fortuneText, parameters = {}) {
        console.log('Starting fragment generation with parameters:', {
            variation: parameters.variation,
            complexity: parameters.complexity,
            maxFragments: parameters.maxFragments,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        });

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
        console.log('Valid images found:', validImages.length, 'out of', images.length);

        if (validImages.length === 0) {
            console.warn('No valid images provided for fragment generation');
            return;
        }

        // Calculate number of fragments based on complexity
        const numFragments = Math.min(
            Math.max(3, Math.floor(validImages.length * parameters.complexity)),
            parameters.maxFragments || 12
        );
        console.log('Calculated number of fragments:', numFragments);

        // Calculate fragment dimensions
        const fragmentWidth = this.canvas.width / 4;
        const fragmentHeight = this.canvas.height / 4;
        console.log('Fragment dimensions:', { width: fragmentWidth, height: fragmentHeight });

        // Calculate maximum valid positions
        const maxX = this.canvas.width - fragmentWidth;
        const maxY = this.canvas.height - fragmentHeight;
        console.log('Maximum valid positions:', { maxX, maxY });

        const fragments = [];
        const margin = 20; // Minimum distance from edges

        for (let i = 0; i < numFragments; i++) {
            // Calculate position with margin
            const x = margin + Math.random() * (maxX - 2 * margin);
            const y = margin + Math.random() * (maxY - 2 * margin);
            console.log(`Fragment ${i} position:`, { x, y });

            // Create fragment with calculated position
            const fragment = {
                image: validImages[i % validImages.length],
                x: x,
                y: y,
                width: fragmentWidth,
                height: fragmentHeight,
                rotation: Math.random() * 360,
                depth: Math.random(),
                mask: {
                    enabled: Math.random() < 0.3,
                    type: ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'][Math.floor(Math.random() * 9)]
                }
            };
            console.log(`Created fragment ${i}:`, {
                position: { x: fragment.x, y: fragment.y },
                dimensions: { width: fragment.width, height: fragment.height },
                rotation: fragment.rotation,
                depth: fragment.depth,
                mask: fragment.mask
            });
            fragments.push(fragment);
        }

        // Sort fragments by depth
        fragments.sort((a, b) => a.depth - b.depth);
        console.log('Final fragments array:', fragments.length, 'fragments');

        return fragments;
    }

    generateFragmentsByVariation(fragments, count, sizeTiers, variation, images, imageIndices, allowImageRepetition) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Track image usage for non-repetition mode
        let currentIndex = 0;
        
        for (let i = 0; i < count; i++) {
            // Reduced position bias for more even distribution
            const positionBias = Math.random() < 0.3 ? 0.1 : 0;
            let x = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.width;
            let y = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.height;
            
            // Add slight bias towards center for better composition
            const centerBias = 0.1;
            x = x * (1 - centerBias) + centerX * centerBias;
            y = y * (1 - centerBias) + centerY * centerBias;
            
            // ENHANCED: More varied rotation
            let rotation = 0;
            if (Math.random() < 0.9) { // Increased rotation probability
                rotation = (Math.random() - 0.5) * 90; // Increased rotation range
                if (Math.random() < 0.5) { // Increased chance of extreme rotation
                    rotation *= 2.0; // More dramatic rotation
                }
            }
            
            let baseSize;
            if (variation === 'Organic') {
                baseSize = this.calculateOrganicSize(sizeTiers);
            } else if (variation === 'Focal') {
                baseSize = this.calculateFocalSize(sizeTiers, x, y, centerX, centerY);
            } else {
                baseSize = this.calculateClassicSize(sizeTiers);
            }
            
            // ENHANCED: More varied aspect ratios
            const aspectVariation = Math.random() * 0.6 + 0.7; // Wider range (0.7-1.3)
            const width = baseSize.width;
            const height = baseSize.height;
            
            // ENHANCED: More controlled overflow
            const overflowAllowed = 0.15; // Reduced from 0.2
            x = Math.max(-width * overflowAllowed, Math.min(x, this.canvas.width - width * (1 - overflowAllowed)));
            y = Math.max(-height * overflowAllowed, Math.min(y, this.canvas.height - height * (1 - overflowAllowed)));
            
            // ENHANCED: More controlled rotation
            rotation = (Math.random() - 0.5) * 0.5; // Reduced rotation range
            
            // Select image based on repetition setting
            let imgIndex;
            if (allowImageRepetition) {
                imgIndex = Math.floor(Math.random() * images.length);
            } else {
                imgIndex = imageIndices[currentIndex % imageIndices.length];
                currentIndex++;
            }
            
            fragments.push({
                img: imgIndex,
                x, y, width, height,
                rotation,
                depth: Math.random()
            });
        }
    }

    calculateOrganicSize(sizeTiers) {
        // Select a base size from the tiers with bias towards smaller sizes
        const tierRand = Math.random();
        let baseSize;
        if (tierRand < 0.4) { // 40% chance for small
            baseSize = sizeTiers[0];
        } else if (tierRand < 0.8) { // 40% chance for medium
            baseSize = sizeTiers[1];
        } else { // 20% chance for large
            baseSize = sizeTiers[2];
        }
        
        // Add organic variation to width and height
        const widthVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        const heightVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        
        return {
            width: baseSize * widthVariation,
            height: baseSize * heightVariation
        };
    }

    calculateFocalSize(sizeTiers, x, y, centerX, centerY) {
        // Calculate distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const normalizedDistance = distance / maxDistance;
        
        // Select base size based on distance from center
        let baseSize;
        if (normalizedDistance < 0.3) { // Close to center
            baseSize = sizeTiers[2]; // Large
        } else if (normalizedDistance < 0.6) { // Medium distance
            baseSize = sizeTiers[1]; // Medium
        } else { // Far from center
            baseSize = sizeTiers[0]; // Small
        }
        
        // Add variation based on distance
        const variation = 0.8 + (1 - normalizedDistance) * 0.4; // More variation near center
        
        return {
            width: baseSize * variation,
            height: baseSize * variation
        };
    }

    calculateClassicSize(sizeTiers) {
        // Select a base size from the tiers
        const tierIndex = Math.floor(Math.random() * sizeTiers.length);
        const baseSize = sizeTiers[tierIndex];
        
        // Add some variation to width and height independently
        const widthVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const heightVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        return {
            width: baseSize * widthVariation,
            height: baseSize * heightVariation
        };
    }

    postProcessFragments(fragments, variation) {
        // Create more distinct layering with grouped depth values
        const layerCount = 5; // Increased from 4 to 5 for more depth variation
        fragments.forEach(fragment => {
            const layerIndex = Math.floor(fragment.depth * layerCount);
            fragment.depth = (layerIndex + Math.random() * 0.8) / layerCount; // Increased random factor
        });
        
        // Ensure at least one fragment has 100% opacity
        if (fragments.length > 0) {
            let maxDepthFragment = fragments[0];
            fragments.forEach(fragment => {
                if (fragment.depth > maxDepthFragment.depth) {
                    maxDepthFragment = fragment;
                }
            });
            maxDepthFragment.forceFullOpacity = true;
        }
        
        // Sort fragments by depth
        fragments.sort((a, b) => a.depth - b.depth);
        
        // Special handling for Focal variation
        if (variation === 'Focal') {
            const fragmentsCopy = [...fragments];
            fragmentsCopy.sort((a, b) => (b.width * b.height) - (a.width * a.height));
            const largeFragmentThreshold = fragmentsCopy[Math.floor(fragments.length * 0.3)].width * 
                                        fragmentsCopy[Math.floor(fragments.length * 0.3)].height;
            
            fragments.forEach(fragment => {
                if (fragment.width * fragment.height >= largeFragmentThreshold && Math.random() < 0.8) {
                    fragment.depth = 0.7 + Math.random() * 0.3;
                }
            });
            
            fragments.sort((a, b) => a.depth - b.depth);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    drawFragment(fragment, ctx) {
        console.log('Drawing fragment:', fragment);
        const { x, y, width, height, image, rotation } = fragment;
        
        // Validate fragment properties
        if (!image || typeof image === 'undefined') {
            console.warn('Invalid image for fragment:', fragment);
            return;
        }
        
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
            console.warn('Invalid fragment dimensions or position:', { x, y, width, height });
            return;
        }
        
        // ENHANCED: Draw fragment with controlled size
        const drawScale = 1.2; // Reduced from 1.5
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(rotation);
        ctx.scale(drawScale, drawScale);
        ctx.drawImage(image, -width/2, -height/2, width, height);
        ctx.restore();
        
        console.log('Fragment drawn at position:', x, y, 'with dimensions:', width, height);
    }
} 