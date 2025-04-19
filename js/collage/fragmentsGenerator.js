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

    generateFragments(images) {
        // Validate images array
        if (!Array.isArray(images) || images.length === 0) {
            console.warn('Invalid or empty images array provided to generateFragments');
            return [];
        }

        // Find valid images (complete and loaded)
        const validImages = [];
        const validImageIndices = [];
        
        images.forEach((img, index) => {
            if (img && img.complete) {
                validImages.push(img);
                validImageIndices.push(index);
            }
        });

        if (validImages.length === 0) {
            console.warn('No valid images found for fragment generation');
            return [];
        }

        const fragments = [];
        const canvasArea = this.canvas.width * this.canvas.height;
        const targetCoverage = 0.8; // Target 80% canvas coverage
        const avgFragmentArea = 40000; // Target average fragment area
        const numFragments = Math.min(
            Math.ceil((canvasArea * targetCoverage) / avgFragmentArea),
            validImages.length * 2 // Allow up to 2 fragments per image
        );

        // Create size tiers for better distribution
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
        const sizeTiers = [
            minDimension * 0.15, // Small fragments (15% of canvas)
            minDimension * 0.25, // Medium fragments (25% of canvas)
            minDimension * 0.35  // Large fragments (35% of canvas)
        ];

        // Define mask types and probability
        const maskTypes = ['circle', 'triangle', 'rectangle', 'ellipse'];
        const maskProbability = 0.2; // 20% chance of applying a mask

        // Create fragments with validated image indices
        for (let i = 0; i < numFragments; i++) {
            // Use modulo to cycle through available images
            const validImageIndex = i % validImages.length;
            const originalImageIndex = validImageIndices[validImageIndex];

            // Select size tier with weighted distribution
            const tierRand = Math.random();
            let baseSize;
            if (tierRand < 0.4) { // 40% small fragments
                baseSize = sizeTiers[0];
            } else if (tierRand < 0.8) { // 40% medium fragments
                baseSize = sizeTiers[1];
            } else { // 20% large fragments
                baseSize = sizeTiers[2];
            }

            // Add size variation
            const sizeVariation = 0.3; // 30% variation
            const size = baseSize * (1 + (Math.random() - 0.5) * sizeVariation);

            // Calculate position with overlap allowance
            const overlap = 0.2; // Allow 20% overlap
            const maxX = this.canvas.width + size * overlap;
            const maxY = this.canvas.height + size * overlap;
            const x = Math.max(-size * overlap, Math.min(Math.random() * maxX, maxX));
            const y = Math.max(-size * overlap, Math.min(Math.random() * maxY, maxY));

            // Create fragment with validated properties
            const fragment = {
                x,
                y,
                width: size,
                height: size,
                img: originalImageIndex,
                rotation: Math.random() * 360,
                opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0 range
                blendMode: ['multiply', 'screen', 'overlay', 'soft-light'][Math.floor(Math.random() * 4)],
                depth: Math.random(),
                metadata: {
                    originalIndex: originalImageIndex,
                    validationStatus: 'valid',
                    sizeTier: tierRand < 0.4 ? 'small' : tierRand < 0.8 ? 'medium' : 'large'
                }
            };

            // Randomly apply mask
            if (Math.random() < maskProbability) {
                fragment.mask = {
                    type: maskTypes[Math.floor(Math.random() * maskTypes.length)],
                    enabled: true
                };
            }

            fragments.push(fragment);
        }

        console.log(`Generated ${fragments.length} fragments from ${validImages.length} valid images`);
        return fragments;
    }

    generateFragmentsByVariation(fragments, count, sizeTiers, variation, images, imageIndices, allowImageRepetition) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Track image usage for non-repetition mode
        let currentIndex = 0;
        
        for (let i = 0; i < count; i++) {
            // ENHANCED: More varied positioning
            const positionBias = Math.random() < 0.7 ? 0.2 : 0; // Increased bias probability
            let x = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.width;
            let y = (Math.random() * (1 - 2 * positionBias) + positionBias) * this.canvas.height;
            
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
            const width = baseSize;
            const height = baseSize * aspectVariation;
            
            // ENHANCED: Allow more overflow for more dynamic composition
            const overflowAllowed = 0.3; // Increased from 0.2
            x = Math.max(-width * overflowAllowed, Math.min(x, this.canvas.width - width * (1 - overflowAllowed)));
            y = Math.max(-height * overflowAllowed, Math.min(y, this.canvas.height - height * (1 - overflowAllowed)));
            
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
        const tierRand = Math.random();
        let baseSize;
        if (tierRand < 0.3) { // More small fragments
            baseSize = sizeTiers[0];
        } else if (tierRand < 0.7) { // Fewer medium fragments
            baseSize = sizeTiers[1];
        } else {
            baseSize = sizeTiers[2];
        }
        return baseSize * (1 + (Math.random() - 0.5) * 0.6); // Increased variation
    }

    calculateFocalSize(sizeTiers, x, y, centerX, centerY) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distanceFromCenter = Math.sqrt(
            (dx * dx) / (this.canvas.width * this.canvas.width / 4) + 
            (dy * dy) / (this.canvas.height * this.canvas.height / 4)
        );
        
        let baseSize;
        if (distanceFromCenter < 0.3) {
            baseSize = Math.random() < 0.8 ? sizeTiers[2] : sizeTiers[1]; // More large fragments in center
        } else if (distanceFromCenter < 0.6) {
            baseSize = Math.random() < 0.6 ? sizeTiers[1] : 
                      (Math.random() < 0.4 ? sizeTiers[0] : sizeTiers[2]); // More medium fragments
        } else {
            baseSize = Math.random() < 0.8 ? sizeTiers[0] : sizeTiers[1]; // More small fragments at edges
        }
        
        return baseSize * (1 + (Math.random() - 0.5) * 0.5); // Increased variation
    }

    calculateClassicSize(sizeTiers) {
        const tierRand = Math.random();
        let baseSize;
        if (tierRand < 0.25) { // More small fragments
            baseSize = sizeTiers[0];
        } else if (tierRand < 0.65) { // Fewer medium fragments
            baseSize = sizeTiers[1];
        } else {
            baseSize = sizeTiers[2];
        }
        return baseSize * (1 + (Math.random() - 0.5) * 0.5); // Increased variation
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
} 