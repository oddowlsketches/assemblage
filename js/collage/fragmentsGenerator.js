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
        // console.log('Starting fragment generation with parameters:', {
        //     variation: parameters.variation,
        //     complexity: parameters.complexity,
        //     maxFragments: parameters.maxFragments,
        //     canvasWidth: this.canvas.width,
        //     canvasHeight: this.canvas.height
        // });

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
        // console.log('Valid images found:', validImages.length, 'out of', images.length);

        if (validImages.length === 0) {
            console.warn('No valid images provided for fragment generation');
            return;
        }

        // Calculate number of fragments based on complexity
        const numFragments = Math.min(
            Math.max(3, Math.floor(validImages.length * parameters.complexity)),
            parameters.maxFragments || 12
        );
        // console.log('Calculated number of fragments:', numFragments);

        // Calculate fragment dimensions
        const fragmentWidth = this.canvas.width / 4;
        const fragmentHeight = this.canvas.height / 4;
        // console.log('Fragment dimensions:', { width: fragmentWidth, height: fragmentHeight });

        // Calculate maximum valid positions
        const maxX = this.canvas.width - fragmentWidth;
        const maxY = this.canvas.height - fragmentHeight;
        // console.log('Maximum valid positions:', { maxX, maxY });

        const fragments = [];
        const margin = 0; // Temporarily removed margin to test edge bleeding

        for (let i = 0; i < numFragments; i++) {
            // Calculate position with margin
            const x = margin + Math.random() * (maxX - 2 * margin);
            const y = margin + Math.random() * (maxY - 2 * margin);
            // console.log(`Fragment ${i} position:`, { x, y });

            // Create fragment with calculated position
            const fragment = {
                image: validImages[i % validImages.length],
                x: x,
                y: y,
                width: fragmentWidth,
                height: fragmentHeight,
                rotation: Math.random() * 90, // Reduced from 360 to 90 degrees
                depth: Math.random(),
                mask: {
                    enabled: Math.random() < 0.30,
                    type: ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'arc', 'arch', 'circle', 'triangle', 'rectangle' /* 'star' */][Math.floor(Math.random() * 11)]
                }
            };
            // console.log(`Created fragment ${i}:`, {
            //     position: { x: fragment.x, y: fragment.y },
            //     dimensions: { width: fragment.width, height: fragment.height },
            //     rotation: fragment.rotation,
            //     depth: fragment.depth,
            //     mask: fragment.mask
            // });
            fragments.push(fragment);
        }

        // Sort fragments by depth
        fragments.sort((a, b) => a.depth - b.depth);
        // console.log('Final fragments array:', fragments.length, 'fragments');

        return fragments;
    }

    generateFragmentsByVariation(fragments, count, sizeTiers, variation, images, imageIndices, allowImageRepetition) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Track image usage for non-repetition mode
        let currentIndex = 0;
        
        for (let i = 0; i < count; i++) {
            // Reduced position bias for more even distribution
            const positionBias = Math.random() < 0.3 ? 0.05 : 0; // Reduced from 0.1 to 0.05
            let x = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.width;
            let y = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.height;
            
            // Add slight bias towards center for better composition
            const centerBias = 0.05; // Reduced from 0.1 to allow more edge bleeding
            x = x * (1 - centerBias) + centerX * centerBias;
            y = y * (1 - centerBias) + centerY * centerBias;
            
            // ENHANCED: More varied rotation with balanced distribution
            let rotation = 0;
            const randomValue = Math.random();
            if (randomValue < 0.3) { // 30% chance of no rotation
                rotation = 0;
            } else if (randomValue < 0.93) { // 63% chance of small rotation
                // Invert the direction to match canvas rotation
                const direction = Math.random() < 0.5 ? -1 : 1;
                rotation = (direction * (Math.random() * 8)) * (Math.PI / 180); // Reduced from 15 to 8 degrees
            } else { // 7% chance of moderate rotation
                // Invert the direction to match canvas rotation
                const direction = Math.random() < 0.5 ? -1 : 1;
                rotation = (direction * (8 + Math.random() * 7)) * (Math.PI / 180); // Reduced from 15-30 to 8-15 degrees
            }
            
            let baseSize;
            if (variation === 'Organic') {
                baseSize = this.calculateOrganicSize(this.canvas.width, this.canvas.height);
            } else if (variation === 'Focal') {
                baseSize = this.calculateFocalSize(this.canvas.width, this.canvas.height, x, y);
            } else {
                baseSize = this.calculateClassicSize(this.canvas.width, this.canvas.height);
            }
            
            // ENHANCED: More varied aspect ratios
            const aspectVariation = Math.random() * 0.6 + 0.7; // Wider range (0.7-1.3)
            const width = baseSize.width;
            const height = baseSize.height;
            
            // Allow fragments to overflow by up to 75% of their width/height (increased from 50%)
            const overflowAllowed = 0.75; // Keep the same edge bleeding
            
            // Calculate position with reduced overlap
            const minDistance = Math.max(width, height) * 0.5; // Increased from 0.4 to 0.5 for more spacing between fragments
            let attempts = 0;
            let validPosition = false;
            
            while (!validPosition && attempts < 10) {
                // Calculate new position
                x = Math.max(-width * overflowAllowed, Math.min(x, this.canvas.width - width * (1 - overflowAllowed)));
                y = Math.max(-height * overflowAllowed, Math.min(y, this.canvas.height - height * (1 - overflowAllowed)));
                
                // Check distance from other fragments
                validPosition = true;
                let overlappingCount = 0;
                for (const existingFragment of fragments) {
                    const dx = x - existingFragment.x;
                    const dy = y - existingFragment.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if fragments overlap
                    if (distance < (width + existingFragment.width) / 2) {
                        overlappingCount++;
                        if (overlappingCount >= 2) { // Allow max 2 overlapping fragments
                            validPosition = false;
                            // Adjust position to increase distance
                            x += (Math.random() - 0.5) * minDistance * 1.5; // Increased adjustment
                            y += (Math.random() - 0.5) * minDistance * 1.5; // Increased adjustment
                            break;
                        }
                    }
                }
                attempts++;
            }
            
            // Log fragment position and overflow
            console.log(`Fragment ${i} position:`, {
                x, y,
                width, height,
                overflowAllowed,
                canvasBounds: {
                    minX: -width * overflowAllowed,
                    maxX: this.canvas.width - width * (1 - overflowAllowed),
                    minY: -height * overflowAllowed,
                    maxY: this.canvas.height - height * (1 - overflowAllowed)
                }
            });
            
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

    calculateOrganicSize(width, height) {
        // Select a base size with bias towards smaller sizes
        const baseSize = Math.random() < 0.6 ? 0.6 : 0.8; // Increased range from 0.7-0.9 to 0.6-0.8
        
        // Add organic variation to width and height
        const widthVariation = 0.6 + Math.random() * 0.8; // Increased range from 0.7-1.3 to 0.6-1.4
        const heightVariation = 0.6 + Math.random() * 0.8; // Increased range from 0.7-1.3 to 0.6-1.4
        
        return {
            width: width * baseSize * widthVariation,
            height: height * baseSize * heightVariation
        };
    }

    calculateFocalSize(width, height, x, y) {
        // Calculate distance from center (0 to 1)
        const centerX = 0.5;
        const centerY = 0.5;
        const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        
        // Adjust base size based on distance from center
        const baseSize = 0.5 + (1 - distanceFromCenter) * 0.7; // Increased range from 0.6-1.2 to 0.5-1.2
        
        // Add some variation
        const variation = 0.7 + Math.random() * 0.6; // Increased range from 0.8-1.2 to 0.7-1.3
        
        return {
            width: width * baseSize * variation,
            height: height * baseSize * variation
        };
    }

    calculateClassicSize(width, height) {
        // Select a base size
        const baseSize = 0.6 + Math.random() * 0.4; // Increased range from 0.7-0.9 to 0.6-1.0
        
        // Add some variation
        const variation = 0.7 + Math.random() * 0.6; // Increased range from 0.8-1.2 to 0.7-1.3
        
        return {
            width: width * baseSize * variation,
            height: height * baseSize * variation
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