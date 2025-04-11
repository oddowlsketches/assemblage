/**
 * Fragments Generator for Assemblage
 * Handles fragments-specific collage generation with enhanced parameters
 */

export class FragmentsGenerator {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    generateFragments(images, parameters = {}) {
        // Check if we have valid images
        if (!images || !Array.isArray(images) || images.length === 0) {
            console.error('No valid images provided for fragments generation');
            return [];
        }
        
        console.log('Generating fragments with variation:', parameters.variation || 'Classic');
        console.log(`Fragments: Using ${images.length} images`);
        
        // Default to Classic if no variation specified
        const variation = parameters.variation || 'Classic';
        console.log(`Using fragments variation: ${variation}`);
        
        // Initialize fragments array and shuffle image indices
        const fragments = [];
        const imageIndices = Array.from({ length: images.length }, (_, i) => i);
        this.shuffleArray(imageIndices);
        
        // Calculate number of fragments based on complexity and image count
        const complexity = parameters.complexity || 5;
        
        // ENHANCED: Adjust fragment count and size based on variation
        let baseFragmentCount;
        let sizeTierFactor = 1.0; // Default size tier factor
        
        // NEW: Randomize fragment count between 5-50 based on variation
        if (variation === 'Uniform') {
            // Uniform variation has more fragments with less size variation
            baseFragmentCount = 15 + Math.floor(Math.random() * 35); // 15-50 fragments
            sizeTierFactor = 0.5; // Reduced size variation (fragments more similar in size)
        } else if (variation === 'Organic') {
            // Organic variation uses more fragments with more size variation
            baseFragmentCount = 20 + Math.floor(Math.random() * 30); // 20-50 fragments
            sizeTierFactor = 1.5; // Increased size variation
        } else if (variation === 'Focal') {
            // Focal variation uses fewer, larger fragments
            baseFragmentCount = 5 + Math.floor(Math.random() * 15); // 5-20 fragments
            sizeTierFactor = 2.0; // Dramatic size variation
        } else {
            // Classic variation - balanced approach
            baseFragmentCount = 10 + Math.floor(Math.random() * 25); // 10-35 fragments
            sizeTierFactor = 1.2; // Moderate size variation
        }
        
        console.log(`Fragments: Base fragment count: ${baseFragmentCount} (complexity: ${complexity})`);
        
        // Adjust fragment count based on variation
        let fragmentCount = baseFragmentCount;
        
        // Calculate base fragment size
        const canvasArea = this.canvas.width * this.canvas.height;
        const idealCoverage = 0.9; // Target 90% coverage
        const fragmentArea = (canvasArea * idealCoverage) / fragmentCount;
        const baseFragmentSize = Math.sqrt(fragmentArea) * 0.75;
        
        // Create three size categories for more variation
        const sizeDelta = 0.6 * sizeTierFactor; // Increased from 0.4 to 0.6 for more dramatic size differences
        const sizeTiers = [
            baseFragmentSize * (1.0 - sizeDelta),  // Small fragments
            baseFragmentSize,                      // Medium fragments
            baseFragmentSize * (1.0 + sizeDelta)   // Large fragments
        ];
        
        // Generate fragments based on variation
        this.generateFragmentsByVariation(
            fragments,
            fragmentCount,
            sizeTiers,
            variation,
            images,
            imageIndices,
            parameters.allowImageRepetition
        );
        
        // Sort and adjust fragments
        this.postProcessFragments(fragments, variation);
        
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