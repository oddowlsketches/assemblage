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

    calculateRequiredScale(image, targetWidth, targetHeight, minVisibility = 0.7) {
        const imgRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let scale;
        if (imgRatio > targetRatio) {
            // Image is wider than target
            scale = targetHeight / image.naturalHeight;
        } else {
            // Image is taller than target
            scale = targetWidth / image.naturalWidth;
        }
        
        // Account for minimum visibility requirement
        const minScale = Math.max(
            minVisibility / imgRatio,
            minVisibility * imgRatio
        );
        
        return Math.max(scale, minScale);
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

        // Filter out invalid images and check scaling requirements
        const validImages = [];
        const MAX_ATTEMPTS = 5;
        
        for (const image of images) {
            if (!image || !image.complete || image.naturalWidth === 0) continue;
            
            // Calculate fragment dimensions based on variation
            let fragmentWidth, fragmentHeight;
            if (parameters.variation === 'Organic') {
                const size = this.calculateOrganicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else if (parameters.variation === 'Focal') {
                const size = this.calculateFocalSize(this.canvas.width, this.canvas.height, this.canvas.width/2, this.canvas.height/2);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else {
                const size = this.calculateClassicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            }
            
            // Calculate required scale for this image
            const requiredScale = this.calculateRequiredScale(
                image,
                fragmentWidth,
                fragmentHeight
            );
            
            // Check if this scale is within our acceptable range
            const maxAllowedScale = parameters.variation === 'Focal' ? 2.5 : 2.0;
            if (requiredScale <= maxAllowedScale) {
                validImages.push(image);
            }
        }

        if (validImages.length === 0) {
            console.warn('No valid images found that meet scaling requirements');
            return;
        }

        // Calculate number of fragments
        const complexityVariation = 0.75 + Math.random() * 0.3;
        const numFragments = Math.min(
            Math.max(3, Math.floor(validImages.length * parameters.complexity * 0.7 * complexityVariation)),
            parameters.maxFragments || 8
        );

        const fragments = [];
        const margin = 0;

        for (let i = 0; i < numFragments; i++) {
            // Calculate fragment dimensions based on variation
            let fragmentWidth, fragmentHeight;
            if (parameters.variation === 'Organic') {
                const size = this.calculateOrganicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else if (parameters.variation === 'Focal') {
                const size = this.calculateFocalSize(this.canvas.width, this.canvas.height, this.canvas.width/2, this.canvas.height/2);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            } else {
                const size = this.calculateClassicSize(this.canvas.width, this.canvas.height);
                fragmentWidth = size.width;
                fragmentHeight = size.height;
            }

            // Calculate position with margin
            const maxX = this.canvas.width - fragmentWidth;
            const maxY = this.canvas.height - fragmentHeight;
            const x = margin + Math.random() * (maxX - 2 * margin);
            const y = margin + Math.random() * (maxY - 2 * margin);

            // Create fragment with calculated position
            const fragment = {
                image: validImages[i % validImages.length],
                x: x,
                y: y,
                width: fragmentWidth,
                height: fragmentHeight,
                rotation: Math.random() < 0.7 ? 0 : Math.random() * 0.2,
                depth: Math.random(),
                mask: {
                    enabled: Math.random() < 0.30,
                    type: ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'arc', 'arch', 'circle', 'triangle', 'rectangle'][Math.floor(Math.random() * 11)]
                }
            };
            fragments.push(fragment);
        }

        // Sort fragments by depth
        fragments.sort((a, b) => a.depth - b.depth);

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
            
            // ENHANCED: Add back a moderate amount of rotation
            let rotation = 0; // Default to zero rotation
            
            // 75% chance of exactly zero rotation
            if (Math.random() >= 0.75) {
                // Only 25% of fragments get any rotation at all
                const rotationAmount = Math.random() * 0.15; // Maximum of ~8-9 degrees in radians
                rotation = (Math.random() < 0.5 ? -1 : 1) * rotationAmount;
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
            
            // Allow fragments to overflow by up to 95% of their width/height for more dramatic edge bleeding
            const overflowAllowed = Math.random() < 0.4 ? 0.95 : 0.75; // 40% chance of extensive bleeding (95%), otherwise standard (75%)
            
            // Calculate position with significantly reduced overlap
            const minDistance = Math.max(width, height) * 1.1; // Increased from 0.8 to 1.1 for much more spacing between fragments
            let attempts = 0;
            let validPosition = false;
            
            while (!validPosition && attempts < 20) { // Increased attempts from 15 to 20 for better placement
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
                    
                    // Adjust overlap allowance based on fragment sizes
                    // Allow more overlap between very different sized fragments
                    const sizeRatio = Math.max(
                        width / existingFragment.width,
                        existingFragment.width / width
                    );
                    
                    // More overlap allowed when fragments have very different sizes
                    const overlapFactor = sizeRatio > 2.5 ? 0.4 : 0.9; // 0.4 for very disparate sizes, 0.9 for similar sizes
                    
                    // Calculate minimum non-overlapping distance
                    const minRequiredDistance = (width + existingFragment.width) * overlapFactor;
                    
                    // Check if fragments overlap too much
                    if (distance < minRequiredDistance) {
                        overlappingCount++;
                        if (overlappingCount >= 1) { // Reduced from 2 to 1 to allow max 1 overlapping fragment
                            validPosition = false;
                            // Move fragments farther apart with more directed adjustments
                            const moveDirection = {x: dx || 0.1, y: dy || 0.1}; // Avoid zero values
                            const moveDistance = minDistance * 1.8; // Increased from 1.5 to 1.8
                            const magnitude = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.y * moveDirection.y);
                            // Move away from existing fragment in the direction of the vector between them
                            x += (moveDirection.x / magnitude) * moveDistance * (0.8 + Math.random() * 0.4);
                            y += (moveDirection.y / magnitude) * moveDistance * (0.8 + Math.random() * 0.4);
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
                attempts,
                validPosition,
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
        // More dramatic size variation with bias towards extremes
        // Create a bimodal distribution - either quite small or quite large
        const sizeCategory = Math.random();
        let baseSize;
        
        if (sizeCategory < 0.35) { // 35% chance of smaller fragments
            baseSize = 0.15 + Math.random() * 0.1; // 0.15-0.25 range (smaller)
        } else if (sizeCategory < 0.85) { // 50% chance of medium fragments
            baseSize = 0.2 + Math.random() * 0.05; // 0.2-0.25 range (medium)
        } else if (sizeCategory < 0.95) { // 10% chance of larger fragments
            baseSize = 0.35 + Math.random() * 0.15; // 0.35-0.5 range (larger)
        } else { // 5% chance of medium fragments (fallback)
            baseSize = 0.2 + Math.random() * 0.05; // 0.2-0.25 range (medium)
        }
        
        // Add more dramatic variation to width and height
        const widthVariation = 0.5 + Math.random() * 0.5; // 0.5-1.0 range
        const heightVariation = 0.5 + Math.random() * 0.5; // 0.5-1.0 range
        
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
            Math.pow(x/width - centerX, 2) + Math.pow(y/height - centerY, 2)
        );
        
        // More dramatic size difference between center and edges
        // Central elements can be up to 2x the size of edge elements
        const sizeCategory = Math.random();
        let baseSize;
        
        if (distanceFromCenter < 0.3) { // Near center - bigger elements
            if (sizeCategory < 0.6) { // 60% chance of medium focal elements
                baseSize = 0.2 + (1 - distanceFromCenter) * 0.05; // 0.2-0.25 range
            } else if (sizeCategory < 0.9) { // 30% chance of very large focal elements
                baseSize = 0.35 + (1 - distanceFromCenter) * 0.15; // 0.35-0.5 range
            } else { // 10% chance of medium focal elements (fallback)
                baseSize = 0.2 + (1 - distanceFromCenter) * 0.05; // 0.2-0.25 range
            }
        } else { // Away from center - smaller elements
            if (sizeCategory < 0.7) { // 70% chance of small peripheral elements
                baseSize = 0.15 + (1 - distanceFromCenter) * 0.1; // 0.15-0.25 range
            } else { // 30% chance of medium peripheral elements
                baseSize = 0.2 + (1 - distanceFromCenter) * 0.05; // 0.2-0.25 range
            }
        }
        
        // Add variation with more range
        const variation = 0.6 + Math.random() * 0.4; // 0.6-1.0 range
        
        return {
            width: width * baseSize * variation,
            height: height * baseSize * variation
        };
    }

    calculateClassicSize(width, height) {
        // Create more dramatic size variations for classic layout
        const sizeCategory = Math.random();
        let baseSize;
        
        if (sizeCategory < 0.3) { // 30% chance of smaller fragments
            baseSize = 0.15 + Math.random() * 0.1; // 0.15-0.25 range (smaller)
        } else if (sizeCategory < 0.8) { // 50% chance of medium fragments
            baseSize = 0.2 + Math.random() * 0.05; // 0.2-0.25 range (medium)
        } else if (sizeCategory < 0.9) { // 10% chance of larger fragments
            baseSize = 0.35 + Math.random() * 0.15; // 0.35-0.5 range (larger)
        } else { // 10% chance of medium fragments (fallback)
            baseSize = 0.2 + Math.random() * 0.05; // 0.2-0.25 range (medium)
        }
        
        // Add more dramatic variation
        const variation = 0.6 + Math.random() * 0.4; // 0.6-1.0 range
        
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
            
            // Force moderate rotation for some fragments
            if (Math.random() < 0.75) { // 75% chance to have moderate rotation
                fragment.rotation = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.12); // Up to ~7 degrees
            } else { // 25% chance to have zero rotation
                fragment.rotation = 0;
            }
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
            
            // Key fragments (highest opacity) often have minimal rotation for stability
            if (Math.random() < 0.7) {
                maxDepthFragment.rotation = 0;
            }
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
                    
                    // Larger focal elements have minimal rotation for visual stability
                    if (Math.random() < 0.7) { // 70% chance of minimal rotation
                        fragment.rotation = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.05); // Max ~3 degrees
                    } else {
                        // 30% chance of slightly more rotation, but still limited
                        fragment.rotation = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.1); // Max ~6 degrees
                    }
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
        const { x, y, width, height, image, rotation, mask } = fragment;
        
        // Validate fragment properties
        if (!image || typeof image === 'undefined') {
            console.warn('Invalid image for fragment:', fragment);
            return;
        }
        
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
            console.warn('Invalid fragment dimensions or position:', { x, y, width, height });
            return;
        }
        
        // Vary scale based on fragment size for more visual interest
        // Smaller fragments get slightly larger scale, larger fragments get normal scale
        const canvasArea = this.canvas.width * this.canvas.height;
        const fragmentArea = width * height;
        const fragmentSizeRatio = fragmentArea / canvasArea;
        
        // Scale inversely proportional to fragment size
        // Small fragments get scale up to 1.3, large fragments get scale around 1.0-1.1
        const drawScale = 1.0 + Math.max(0, 0.3 - fragmentSizeRatio * 20);
        
        // Force zero rotation when drawing to ensure stable presentation
        const effectiveRotation = Math.abs(rotation) < 0.01 ? 0 : rotation; // Treat tiny rotations as zero
        
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(effectiveRotation);
        ctx.scale(drawScale, drawScale);
        
        // Apply masking if enabled
        if (mask && mask.enabled) {
            // Create clipping path based on mask type
            this.applyMask(ctx, mask.type, width, height);
            ctx.clip();
        }
        
        // Draw image
        ctx.drawImage(image, -width/2, -height/2, width, height);
        ctx.restore();
        
        console.log('Fragment drawn at position:', x, y, 'with dimensions:', width, height, 'scale:', drawScale);
    }
    
    applyMask(ctx, maskType, width, height) {
        const centerX = 0;
        const centerY = 0;
        const size = Math.min(width, height) * 0.9; // Scale to 90% of the smaller dimension
        
        ctx.beginPath();
        
        switch (maskType) {
            case 'circle':
                ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
                break;
                
            case 'triangle':
                ctx.moveTo(centerX, centerY - size/2); // Top
                ctx.lineTo(centerX + size/2, centerY + size/2); // Bottom right
                ctx.lineTo(centerX - size/2, centerY + size/2); // Bottom left
                break;
                
            case 'rectangle':
                ctx.rect(centerX - size/2, centerY - size/2, size, size);
                break;
                
            case 'ellipse':
                ctx.ellipse(centerX, centerY, size/2, size/3, 0, 0, Math.PI * 2);
                break;
                
            case 'diamond':
                ctx.moveTo(centerX, centerY - size/2); // Top
                ctx.lineTo(centerX + size/2, centerY); // Right
                ctx.lineTo(centerX, centerY + size/2); // Bottom
                ctx.lineTo(centerX - size/2, centerY); // Left
                break;
                
            case 'hexagon':
                const hexAngle = (Math.PI * 2) / 6;
                for (let i = 0; i < 6; i++) {
                    const x = centerX + size/2 * Math.cos(hexAngle * i);
                    const y = centerY + size/2 * Math.sin(hexAngle * i);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;
                
            case 'arc':
                ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
                break;
                
            case 'arch':
                ctx.arc(centerX, centerY, size/2, Math.PI * 0.2, Math.PI * 1.8);
                break;
                
            default:
                // Default to rectangle if mask type is unknown
                ctx.rect(centerX - size/2, centerY - size/2, size, size);
                break;
        }
        
        ctx.closePath();
    }
} 