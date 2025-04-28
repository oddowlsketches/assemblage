/**
 * Isolated Crystal Generator for Assemblage
 * Creates crystal formations with negative space around them
 */

import { SafeCrystalFormationGenerator } from './crystalFormationGenerator.js';

class IsolatedCrystalGenerator {
    constructor(ctx, canvas) {
        // Store context and canvas
        this.ctx = ctx;
        this.canvas = canvas;
        
        // Initialize canvas dimensions if not set
        if (!this.canvas.width || !this.canvas.height) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // For accessing the high-quality facet creation methods
        this.crystalGenerator = new SafeCrystalFormationGenerator(ctx, canvas);
        
        // Define crystal outline templates
        this.crystalTemplates = {
            hexagonal: (centerX, centerY, size) => {
                const points = [];
                const sides = 6;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
                    points.push({
                        x: centerX + size * Math.cos(angle),
                        y: centerY + size * Math.sin(angle)
                    });
                }
                return points;
            },
            irregular: (centerX, centerY, size) => {
                const points = [];
                const sides = 5 + Math.floor(Math.random() * 3); // 5-7 sides
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
                    const variance = 0.8 + Math.random() * 0.4; // 80-120% of size
                    points.push({
                        x: centerX + size * variance * Math.cos(angle),
                        y: centerY + size * variance * Math.sin(angle)
                    });
                }
                return points;
            },
            angular: (centerX, centerY, size) => {
                const points = [];
                const sides = 4;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI / sides) - (Math.PI / 4);
                    const variance = 0.9 + Math.random() * 0.2; // 90-110% of size
                    points.push({
                        x: centerX + size * variance * Math.cos(angle),
                        y: centerY + size * variance * Math.sin(angle)
                    });
                    // Add intermediate point for more angular look
                    const midAngle = angle + (Math.PI / sides);
                    const midVariance = 0.4 + Math.random() * 0.3; // 40-70% of size
                    points.push({
                        x: centerX + size * midVariance * Math.cos(midAngle),
                        y: centerY + size * midVariance * Math.sin(midAngle)
                    });
                }
                return points;
            },
            elongated: (centerX, centerY, size) => {
                const points = [];
                const verticalStretch = 1.5;
                const sides = 6;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
                    points.push({
                        x: centerX + size * Math.cos(angle),
                        y: centerY + size * verticalStretch * Math.sin(angle)
                    });
                }
                return points;
            }
        };

        this.seedPatterns = {
            radial: (centerX, centerY, radius, count) => {
                const points = [];
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const distance = radius * (0.3 + Math.random() * 0.7);
                    points.push({
                        x: centerX + Math.cos(angle) * distance,
                        y: centerY + Math.sin(angle) * distance
                    });
                }
                return points;
            },
            grid: (centerX, centerY, radius, count) => {
                const points = [];
                const gridSize = Math.ceil(Math.sqrt(count));
                const cellSize = (radius * 2) / gridSize;
                
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        if (points.length >= count) break;
                        
                        const x = centerX - radius + (i + 0.5) * cellSize;
                        const y = centerY - radius + (j + 0.5) * cellSize;
                        
                        // Add some randomness to avoid perfect grid
                        const offsetX = (Math.random() - 0.5) * cellSize * 0.5;
                        const offsetY = (Math.random() - 0.5) * cellSize * 0.5;
                        
                        points.push({
                            x: x + offsetX,
                            y: y + offsetY
                        });
                    }
                }
                return points;
            },
            random: (centerX, centerY, radius, count) => {
                const points = [];
                for (let i = 0; i < count; i++) {
                    // Use polar coordinates with random angle and distance
                    const angle = Math.random() * Math.PI * 2;
                    const distance = radius * Math.random();
                    points.push({
                        x: centerX + Math.cos(angle) * distance,
                        y: centerY + Math.sin(angle) * distance
                    });
                }
                return points;
            },
            clusters: (centerX, centerY, radius, count) => {
                const points = [];
                const clusterCount = Math.max(2, Math.floor(count / 5));
                const pointsPerCluster = Math.ceil(count / clusterCount);
                
                // Create clusters
                for (let c = 0; c < clusterCount; c++) {
                    // Position of cluster center
                    const clusterAngle = (c / clusterCount) * Math.PI * 2;
                    const clusterDistance = radius * (0.3 + Math.random() * 0.4);
                    const clusterX = centerX + Math.cos(clusterAngle) * clusterDistance;
                    const clusterY = centerY + Math.sin(clusterAngle) * clusterDistance;
                    
                    // Add points around cluster center
                    for (let i = 0; i < pointsPerCluster; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = (radius * 0.2) * Math.random();
                        points.push({
                            x: clusterX + Math.cos(angle) * distance,
                            y: clusterY + Math.sin(angle) * distance
                        });
                    }
                }
                return points;
            }
        };

        // Set default parameters
        this.parameters = {
            complexity: 5,
            maxFacets: 25,
            blendOpacity: 0.45,
            addGlow: true,
            template: 'hexagonal',
            crystalSize: 0.4, // Size relative to canvas (0-1)
            crystalCount: 1, // Number of crystals to generate in a field
            preventOverlap: true, // Prevent crystals from overlapping
            imageMode: 'unique', // 'unique' (different images per facet) or 'single' (same image for all facets) or 'reflections' (same image but reflected/rotated)
            facetBorders: true, // Whether to draw subtle borders around facets
            enableVisualEffects: true, // Add subtle visual effects to enhance quality
            fullscreen: false // Whether to fill the entire screen (no UI elements)
        };

        console.log('IsolatedCrystalGenerator initialized with canvas dimensions:', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }

    generateBackgroundColor() {
        // Generate a vibrant background color
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

    async generateIsolatedCrystal(images, fortuneText, parameters = {}) {
        console.log('Starting isolated crystal generation with parameters:', parameters);
        console.log('Number of input images:', images?.length || 0);

        // Store parameters for use in other methods
        this.parameters = {
            ...this.parameters,
            ...parameters,
            complexity: parameters.complexity / 10 || 0.5, // Convert to 0-1 scale
            maxFacets: parameters.maxFacets || 25,
            blendOpacity: parameters.blendOpacity || 0.8,
            addGlow: parameters.addGlow !== undefined ? parameters.addGlow : true,
            seedPattern: parameters.seedPattern || 'random',
            template: parameters.template || this.getRandomTemplate(),
            crystalSize: parameters.crystalSize || 0.4,
            crystalCount: parameters.crystalCount || 1,
            preventOverlap: parameters.preventOverlap !== undefined ? parameters.preventOverlap : true,
            imageMode: parameters.imageMode || 'unique',
            fullscreen: parameters.fullscreen || false
        };

        console.log('Processed parameters:', this.parameters);

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => {
            if (!img) {
                console.warn('Null or undefined image found');
                return false;
            }
            return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
        });

        console.log('Number of valid images:', validImages.length);

        if (validImages.length === 0) {
            console.error('No valid images provided for crystal generation');
            return false;
        }

        try {
            // Determine if we're generating a single crystal or a field
            if (this.parameters.crystalCount > 1) {
                // Generate a field of crystals
                console.log(`Generating crystal field with ${this.parameters.crystalCount} crystals`);
                await this.generateCrystalField(validImages, fortuneText);
            } else {
                // Generate a single crystal
                console.log('Generating single crystal');
                await this.generateSingleCrystal(validImages, fortuneText);
            }

            return true;
        } catch (error) {
            console.error('Error generating crystal:', error);
            return false;
        }
    }
    
    // Generate a single crystal
    async generateSingleCrystal(images, fortuneText, overrideParams = {}) {
        // Combine parameters with any position overrides
        const params = { ...this.parameters, ...overrideParams };
        
        // Calculate crystal center (use override or canvas center)
        const centerX = params.centerX || this.canvas.width / 2;
        const centerY = params.centerY || this.canvas.height / 2;
        const maxSize = Math.min(this.canvas.width, this.canvas.height) * params.crystalSize;
        
        // Get crystal outline using the selected template
        const templateName = params.template || this.getRandomTemplate();
        console.log(`Using crystal template: ${templateName}`);
        
        const templateFunc = this.crystalTemplates[templateName];
        if (!templateFunc) {
            console.error(`Template ${templateName} not found`);
            return false;
        }
        
        // Generate the crystal outline points
        const crystalOutline = templateFunc(centerX, centerY, maxSize);
        
        if (!crystalOutline || crystalOutline.length < 3) {
            console.error('Invalid crystal outline generated');
            return false;
        }
        
        console.log(`Created crystal outline with ${crystalOutline.length} points`);
        
        // Calculate number of facets based on complexity
        const facetCount = Math.max(6, Math.floor(params.maxFacets * params.complexity));
        console.log(`Generating crystal with ${facetCount} facets`);
        
        // Generate facets within the crystal boundary
        const fragments = await this.generateFacetsWithinBoundary(
            facetCount,
            images,
            crystalOutline
        );
        
        console.log(`Generated ${fragments.length} facets`);

        // Handle different image modes
        if (params.imageMode !== 'unique' && images.length > 0) {
            // Select one random image
            const selectedImage = images[Math.floor(Math.random() * images.length)];
            
            if (params.imageMode === 'single') {
                // Use the same image for all facets
                fragments.forEach(fragment => {
                    fragment.image = selectedImage;
                });
                
                console.log('Applied single image mode with:', selectedImage.src);
            }
            else if (params.imageMode === 'reflections') {
                // Use the same image but with different transformations
                fragments.forEach((fragment, index) => {
                    fragment.image = selectedImage;
                    
                    // Apply different rotation/reflection for each facet
                    // Override the rotation based on position to create symmetrical effects
                    const angleFromCenter = Math.atan2(
                        fragment.y - centerY,
                        fragment.x - centerX
                    );
                    
                    // Convert to degrees and normalize
                    const degrees = (angleFromCenter * 180 / Math.PI + 360) % 360;
                    
                    // Add reflection logic based on position
                    fragment.flipX = degrees > 90 && degrees < 270;
                    fragment.flipY = degrees > 180 && degrees < 360;
                    
                    // Angle-based rotation for coherent look
                    fragment.rotation = degrees / 2;
                });
                
                console.log('Applied reflection image mode with:', selectedImage.src);
            }
        }

        // Set blend mode and draw fragments
        this.ctx.globalCompositeOperation = 'multiply';
        this.drawFragments(fragments);
        this.ctx.globalCompositeOperation = 'source-over';

        // Add glow effect if enabled
        if (params.addGlow) {
            this.addGlowEffect(crystalOutline);
        }
        
        return true;
    }
    
    // Generate a field of crystals
    async generateCrystalField(images, fortuneText) {
        // Calculate crystal positions based on count
        const positions = this.generateCrystalPositions(
            this.parameters.crystalCount,
            this.parameters.preventOverlap
        );
        
        console.log(`Generated ${positions.length} crystal positions`);
        
        // Generate each crystal
        for (const position of positions) {
            // Select template for this crystal
            const template = this.getRandomTemplate();
            
            // Generate crystal at this position
            await this.generateSingleCrystal(images, fortuneText, {
                centerX: position.x,
                centerY: position.y,
                crystalSize: position.size,
                template: template
            });
        }
        
        return true;
    }
    
    // Generate positions for multiple crystals
    generateCrystalPositions(count, preventOverlap) {
        const positions = [];
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculate base size based on count
        // More crystals = smaller size
        const baseSize = Math.max(0.1, Math.min(0.4, 0.5 / Math.sqrt(count)));
        
        const margin = Math.min(canvasWidth, canvasHeight) * baseSize * 1.25;
        const minDistanceBetween = margin * (preventOverlap ? 1.2 : 0.8);
        
        // First crystal is always centered for consistency
        if (count > 0) {
            positions.push({
                x: canvasWidth / 2,
                y: canvasHeight / 2,
                size: baseSize * (0.8 + Math.random() * 0.4)
            });
        }
        
        // Try to place remaining crystals
        let attempts = 0;
        const maxAttempts = count * 100;
        
        while (positions.length < count && attempts < maxAttempts) {
            // Generate random position with margin from edges
            const x = margin + Math.random() * (canvasWidth - 2 * margin);
            const y = margin + Math.random() * (canvasHeight - 2 * margin);
            
            // Random size variation (80-120% of base size)
            const size = baseSize * (0.8 + Math.random() * 0.4);
            
            // Check if this position is valid
            let isValid = true;
            
            if (preventOverlap) {
                // Check distance from all existing crystals
                for (const pos of positions) {
                    const dx = pos.x - x;
                    const dy = pos.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Calculate minimum required distance (sum of radii with safety margin)
                    const minDistance = (pos.size + size) * minDistanceBetween;
                    
                    if (distance < minDistance) {
                        isValid = false;
                        break;
                    }
                }
            }
            
            if (isValid) {
                positions.push({ x, y, size });
            }
            
            attempts++;
        }
        
        console.log(`Created ${positions.length} crystal positions after ${attempts} attempts`);
        
        return positions;
    }

    getRandomTemplate() {
        const templates = Object.keys(this.crystalTemplates);
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    // Add glow effect to the crystal
    addGlowEffect(crystalOutline) {
        if (!crystalOutline || crystalOutline.length < 3) return;
        
        // Calculate center and size of crystal
        const bounds = this.getBounds(crystalOutline);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const size = Math.max(bounds.width, bounds.height) / 2;
        
        // Draw outer glow
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Create radial gradient for glow
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, size * 0.8,
            centerX, centerY, size * 1.2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // Helper: Check if a point is inside a polygon
    isPointInPolygon(point, polygon) {
        if (!polygon || polygon.length < 3) return false;
        
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
                
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    // Helper: Get bounding box of a polygon
    getBounds(points) {
        if (!points || points.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const point of points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // Generate seed points within the crystal boundary 
    generateSeedPointsWithinBoundary(centerX, centerY, radius, count, patternType) {
        console.log(`Generating ${count} seed points with pattern: ${patternType}`);
        
        // Start with an empty array for seed points
        let seedPoints = [];
        
        // Get the pattern function
        const patternFunc = this.seedPatterns[patternType];
        if (!patternFunc) {
            console.error(`Pattern function for '${patternType}' not found`);
            return seedPoints;
        }
        
        // Generate more points than we need, we'll filter them later
        const extraPoints = patternFunc(centerX, centerY, radius, count * 2);
        console.log(`Generated ${extraPoints.length} candidate seed points`);
        
        // Filter points to only include those within the crystal outline
        for (let point of extraPoints) {
            if (seedPoints.length >= count) break; // Stop once we have enough points
            
            // Add this point if it's within the boundary
            seedPoints.push(point);
        }
        
        console.log(`Returning ${seedPoints.length} filtered seed points`);
        return seedPoints;
    }
    
    // Generate crystal facets within a specified boundary using Voronoi diagram principles
    async generateFacetsWithinBoundary(facetCount, images, crystalOutline) {
        if (!crystalOutline || crystalOutline.length < 3) {
            console.error('Invalid crystal outline provided');
            return [];
        }
        
        // Get bounds of the crystal outline
        const bounds = this.getBounds(crystalOutline);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radius = Math.max(bounds.width, bounds.height) / 2;
        
        console.log(`Creating facets within boundary - center: (${centerX}, ${centerY}), radius: ${radius}`);

        // Generate seed points within the crystal boundary
        const seedPattern = this.parameters.seedPattern || 'random';
        
        // Generate more seed points than needed to ensure we have enough after filtering
        const extraFacetCount = Math.min(facetCount * 2, 80); // Cap at 80 to avoid performance issues
        
        // Use the appropriate seed pattern function to generate points
        const initialPoints = this.seedPatterns[seedPattern](centerX, centerY, radius * 0.9, extraFacetCount);
        
        // Add center point for more balanced facets
        initialPoints.push({x: centerX, y: centerY});
        
        // Filter points to ensure they're inside the crystal boundary
        const seedPoints = initialPoints.filter(point => this.isPointInPolygon(point, crystalOutline));
        
        // Ensure we have enough points (at least 80% of target)
        if (seedPoints.length < Math.max(5, facetCount * 0.8)) {
            console.warn(`Not enough seed points after filtering: ${seedPoints.length}/${facetCount}. Adding more points.`);
            
            // Add random points within the polygon boundary
            for (let i = seedPoints.length; i < facetCount; i++) {
                // Attempt to add a point up to 10 times
                for (let attempt = 0; attempt < 10; attempt++) {
                    // Generate random point within bounds
                    const rx = bounds.x + Math.random() * bounds.width;
                    const ry = bounds.y + Math.random() * bounds.height;
                    
                    if (this.isPointInPolygon({x: rx, y: ry}, crystalOutline)) {
                        seedPoints.push({x: rx, y: ry});
                        break;
                    }
                }
            }
        }
        
        console.log(`Using ${seedPoints.length} seed points for Voronoi generation`);
        
        // Create a grid to approximate Voronoi cells
        const gridResolution = Math.max(30, Math.min(100, facetCount * 2)); // Higher resolution for smoother facets
        const cells = this.createVoronoiCellsFromGrid(seedPoints, crystalOutline, gridResolution);
        
        console.log(`Created ${cells.length} Voronoi cells`);
        
        // Create fragments from Voronoi cells
        const fragments = [];
        
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            
            // Skip cells with too few vertices
            if (!cell.vertices || cell.vertices.length < 3) continue;
            
            // Calculate distance from center for visual effects
            const dx = cell.center.x - centerX;
            const dy = cell.center.y - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const normalizedDistance = Math.min(1, distanceFromCenter / radius);
            
            // Calculate opacity based on distance from center (inner facets more opaque)
            const opacity = 0.2 + 0.7 * (1 - normalizedDistance * 0.8);
            
            // Small random rotation for natural look
            const rotation = (Math.random() * 20 - 10) * (1 - normalizedDistance * 0.7);
            
            // Get bounding box of vertices for sizing
            const vertexBounds = this.getBounds(cell.vertices);
            const facetSize = Math.max(vertexBounds.width, vertexBounds.height);
            
            // Select an image for this facet
            const imageIndex = Math.floor(Math.random() * images.length);
            
            fragments.push({
                vertices: cell.vertices,
                x: cell.center.x,
                y: cell.center.y,
                image: images[imageIndex],
                opacity: opacity,
                rotation: rotation,
                width: facetSize * 1.4, // Scale up slightly to ensure coverage
                height: facetSize * 1.4
            });
        }
        
        console.log(`Generated ${fragments.length} crystal facet fragments`);
        return fragments;
    }
    
    // Create Voronoi cells from a grid-based approach
    createVoronoiCellsFromGrid(seedPoints, crystalOutline, resolution = 50) {
        if (!seedPoints || seedPoints.length === 0) {
            return [];
        }
        
        // Get bounds of the crystal outline
        const bounds = this.getBounds(crystalOutline);
        
        // Create a grid within the bounds
        const cellWidth = bounds.width / resolution;
        const cellHeight = bounds.height / resolution;
        
        // Initialize grid with empty point assignments
        const grid = [];
        
        // Assign each grid point to the nearest seed point
        for (let x = 0; x < resolution; x++) {
            for (let y = 0; y < resolution; y++) {
                // Calculate actual position
                const px = bounds.x + x * cellWidth + cellWidth / 2;
                const py = bounds.y + y * cellHeight + cellHeight / 2;
                
                // Only process points within the crystal outline
                if (!this.isPointInPolygon({x: px, y: py}, crystalOutline)) {
                    continue;
                }
                
                // Find the nearest seed point
                let minDist = Infinity;
                let nearestSeed = -1;
                
                for (let i = 0; i < seedPoints.length; i++) {
                    const seed = seedPoints[i];
                    const dx = px - seed.x;
                    const dy = py - seed.y;
                    const dist = dx * dx + dy * dy; // No need for square root for comparison
                    
                    if (dist < minDist) {
                        minDist = dist;
                        nearestSeed = i;
                    }
                }
                
                if (nearestSeed >= 0) {
                    grid.push({x: px, y: py, seedIndex: nearestSeed});
                }
            }
        }
        
        // Group grid points by seed index
        const pointsBySeed = {};
        
        for (const point of grid) {
            if (!pointsBySeed[point.seedIndex]) {
                pointsBySeed[point.seedIndex] = [];
            }
            pointsBySeed[point.seedIndex].push({x: point.x, y: point.y});
        }
        
        // Create cells from grouped points
        const cells = [];
        
        for (let i = 0; i < seedPoints.length; i++) {
            const points = pointsBySeed[i];
            
            if (!points || points.length < 5) { // Need enough points for a meaningful shape
                continue;
            }
            
            // Create convex hull for cell boundary
            const hull = this.getConvexHull(points);
            
            if (hull.length >= 3) { // Valid polygon
                cells.push({
                    center: seedPoints[i],
                    vertices: hull,
                    seedIndex: i
                });
            }
        }
        
        return cells;
    }
    
    // Get convex hull of points (Graham scan algorithm)
    getConvexHull(points) {
        // Need at least 3 points to form a polygon
        if (!points || points.length < 3) {
            return points || [];
        }
        
        // Find point with lowest y-coordinate (leftmost if tied)
        let lowestPoint = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].y < points[lowestPoint].y || 
               (points[i].y === points[lowestPoint].y && points[i].x < points[lowestPoint].x)) {
                lowestPoint = i;
            }
        }
        
        // Swap the lowest point to position 0
        [points[0], points[lowestPoint]] = [points[lowestPoint], points[0]];
        
        // Sort points by polar angle with respect to lowest point
        const p0 = points[0];
        
        points.sort((a, b) => {
            if (a === p0) return -1;
            if (b === p0) return 1;
            
            // Calculate polar angles
            const theta1 = Math.atan2(a.y - p0.y, a.x - p0.x);
            const theta2 = Math.atan2(b.y - p0.y, b.x - p0.x);
            
            if (theta1 === theta2) {
                // If angles are the same, sort by distance
                const dist1 = Math.pow(a.x - p0.x, 2) + Math.pow(a.y - p0.y, 2);
                const dist2 = Math.pow(b.x - p0.x, 2) + Math.pow(b.y - p0.y, 2);
                return dist1 - dist2;
            }
            
            return theta1 - theta2;
        });
        
        // Build the hull
        const hull = [points[0], points[1]];
        
        for (let i = 2; i < points.length; i++) {
            while (hull.length >= 2 && !this.isLeftTurn(hull[hull.length - 2], hull[hull.length - 1], points[i])) {
                hull.pop();
            }
            hull.push(points[i]);
        }
        
        return hull;
    }
    
    // Check if three points make a left turn
    isLeftTurn(p1, p2, p3) {
        // Cross product to determine turn direction
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0;
    }
    
    // Draw the fragments
    drawFragments(fragments) {
        if (!fragments || fragments.length === 0) return;
        
        console.log(`Drawing ${fragments.length} fragments`);
        
        // Sort fragments by distance from center for proper layering
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        fragments.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2));
            const distB = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2));
            return distA - distB; // Draw from center outward
        });
        
        // Draw each fragment
        fragments.forEach(fragment => {
            this.drawFragment(fragment);
        });
    }
    
    // Draw a single fragment with improved visual quality
    drawFragment(fragment) {
        if (!fragment.image || !fragment.image.complete) {
            console.warn('Attempted to draw fragment with invalid image');
            return;
        }
        
        this.ctx.save();
        
        // Set opacity with slight variation for visual depth
        const baseOpacity = fragment.opacity || this.parameters.blendOpacity;
        // Add tiny random variation for more natural look
        const finalOpacity = baseOpacity * (0.9 + Math.random() * 0.2); 
        this.ctx.globalAlpha = finalOpacity;
        
        // Move to the fragment position
        this.ctx.translate(fragment.x, fragment.y);
        
        // Apply transformations (rotation, scaling, reflection)
        
        // Apply rotation - convert degrees to radians
        if (fragment.rotation) {
            this.ctx.rotate((fragment.rotation * Math.PI) / 180);
        }
        
        // Apply reflections for mirror effects
        if (fragment.flipX || fragment.flipY) {
            this.ctx.scale(
                fragment.flipX ? -1 : 1, 
                fragment.flipY ? -1 : 1
            );
        }
        
        // Create clipping path using the fragment's vertices
        if (fragment.vertices && fragment.vertices.length >= 3) {
            this.ctx.beginPath();
            
            // Move to the first vertex
            this.ctx.moveTo(
                fragment.vertices[0].x - fragment.x,
                fragment.vertices[0].y - fragment.y
            );
            
            // Draw lines to the remaining vertices
            for (let i = 1; i < fragment.vertices.length; i++) {
                this.ctx.lineTo(
                    fragment.vertices[i].x - fragment.x,
                    fragment.vertices[i].y - fragment.y
                );
            }
            
            this.ctx.closePath();
            
            // Create a subtle border around each facet for definition
            if (this.parameters.facetBorders !== false) {
                // Draw a very subtle stroke around the facet
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            }
            
            // Apply the clipping path
            this.ctx.clip();
        }
        
        // Calculate how to draw the image with improved sizing
        const imgWidth = fragment.image.naturalWidth;
        const imgHeight = fragment.image.naturalHeight;
        const imgRatio = imgWidth / imgHeight;
        
        // Calculate the size of the fragment
        let facetWidth = fragment.width;
        let facetHeight = fragment.height;
        
        if (!facetWidth || !facetHeight) {
            // If width/height not explicitly set, calculate from bounding box
            if (fragment.vertices && fragment.vertices.length >= 3) {
                // Find the bounding box of vertices
                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;
                
                for (const vertex of fragment.vertices) {
                    const vx = vertex.x - fragment.x;
                    const vy = vertex.y - fragment.y;
                    minX = Math.min(minX, vx);
                    minY = Math.min(minY, vy);
                    maxX = Math.max(maxX, vx);
                    maxY = Math.max(maxY, vy);
                }
                
                facetWidth = maxX - minX;
                facetHeight = maxY - minY;
            } else {
                // Fallback to default size
                facetWidth = facetHeight = 100;
            }
        }
        
        // Scale the image to cover the facet completely
        let drawWidth, drawHeight;
        
        if (imgRatio > 1) {
            // Image is wider than tall
            drawHeight = Math.max(facetWidth, facetHeight) * 1.2;
            drawWidth = drawHeight * imgRatio;
        } else {
            // Image is taller than wide
            drawWidth = Math.max(facetWidth, facetHeight) * 1.2;
            drawHeight = drawWidth / imgRatio;
        }
        
        // Draw the image centered on the fragment position
        this.ctx.drawImage(
            fragment.image,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        
        this.ctx.restore();
    }
}

export default IsolatedCrystalGenerator;