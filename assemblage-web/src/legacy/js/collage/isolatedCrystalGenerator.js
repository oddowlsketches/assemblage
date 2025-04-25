/**
 * Isolated Crystal Generator for Assemblage
 * Creates crystal formations with negative space around them
 */

import { SafeCrystalFormationGenerator } from './crystalFormationGenerator.js';

export class IsolatedCrystalGenerator {
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
                const numClusters = Math.ceil(count / 5);
                const pointsPerCluster = Math.ceil(count / numClusters);
                
                for (let i = 0; i < numClusters; i++) {
                    const clusterCenter = {
                        x: centerX + (Math.random() - 0.5) * radius,
                        y: centerY + (Math.random() - 0.5) * radius
                    };
                    const clusterRadius = radius * 0.2;
                    
                    for (let j = 0; j < pointsPerCluster; j++) {
                        if (points.length >= count) break;
                        const angle = Math.random() * Math.PI * 2;
                        const distance = clusterRadius * Math.random();
                        points.push({
                            x: clusterCenter.x + Math.cos(angle) * distance,
                            y: clusterCenter.y + Math.sin(angle) * distance
                        });
                    }
                }
                return points;
            },
            spiral: (centerX, centerY, radius, count) => {
                const points = [];
                const spiralTightness = 0.3;
                const spiralGrowth = radius / count;
                
                for (let i = 0; i < count; i++) {
                    const angle = i * spiralTightness;
                    const distance = spiralGrowth * i;
                    points.push({
                        x: centerX + Math.cos(angle) * distance,
                        y: centerY + Math.sin(angle) * distance
                    });
                }
                return points;
            }
        };

        // Set default parameters
        this.parameters = {
            complexity: 5,
            maxFacets: 25,
            blendOpacity: 0.7,
            addGlow: false, // Disabled by default
            template: 'hexagonal',
            crystalSize: 0.6, // Changed from 0.8 to 0.6 (60% of canvas)
            crystalCount: 1, // Number of crystals to generate in a field
            preventOverlap: true, // Prevent crystals from overlapping
            imageMode: null, // Set to null by default to allow proper parameter passing
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

    async generateIsolatedCrystal(image, parameters = {}) {
        console.log('[DEBUG] generateIsolatedCrystal starting with incoming params:', parameters);
        
        // Process parameters with direct assignment of incoming parameters
        // Use parameters directly without fallbacks to ensure randomization
        this.parameters = {
            ...this.parameters, // Keep defaults for missing parameters
            complexity: parameters.complexity,
            maxFacets: parameters.maxFacets,
            blendOpacity: parameters.blendOpacity,
            addGlow: parameters.addGlow,
            imageMode: parameters.imageMode,
            seedPattern: parameters.seedPattern,
            crystalSize: parameters.crystalSize,
            crystalCount: parameters.crystalCount,
            preventOverlap: parameters.preventOverlap,
            facetBorders: parameters.facetBorders,
            enableVisualEffects: parameters.enableVisualEffects,
            template: parameters.template
        };

        // Force randomization of critical parameters if they're missing
        if (this.parameters.complexity === undefined) {
            this.parameters.complexity = 0.3 + Math.random() * 0.4; // 0.3-0.7
            console.log('[DEBUG] Forced random complexity:', this.parameters.complexity);
        }
        
        if (!this.parameters.imageMode) {
            this.parameters.imageMode = Math.random() < 0.5 ? 'unique' : 'single';
            console.log('[DEBUG] Forced random imageMode:', this.parameters.imageMode);
        }
        
        if (!this.parameters.maxFacets) {
            this.parameters.maxFacets = 6 + Math.floor(Math.random() * 19); // 6-24
            console.log('[DEBUG] Forced random maxFacets:', this.parameters.maxFacets);
        }
        
        if (!this.parameters.seedPattern) {
            const patterns = Object.keys(this.seedPatterns);
            this.parameters.seedPattern = patterns[Math.floor(Math.random() * patterns.length)];
            console.log('[DEBUG] Forced random seedPattern:', this.parameters.seedPattern);
        }

        console.log('[DEBUG] Processed parameters:', this.parameters);

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = image.filter(img => {
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
                await this.generateCrystalField(validImages);
            } else {
                // Generate a single crystal
                console.log('Generating single crystal');
                await this.generateSingleCrystal(validImages);
            }

            return true;
        } catch (error) {
            console.error('Error generating crystal:', error);
            return false;
        }
    }
    
    // Generate a single crystal
    async generateSingleCrystal(images) {
        // Calculate crystal center (use canvas center)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate maximum size that ensures crystal stays within canvas with margins
        const margin = 30; // Fixed 30px margin
        const maxWidth = this.canvas.width - 2 * margin;
        const maxHeight = this.canvas.height - 2 * margin;
        
        // Calculate the maximum size that would fit within the canvas
        const maxCanvasSize = Math.min(maxWidth, maxHeight);
        
        // Force crystal size to 45% of canvas size
        const maxParamSize = Math.min(this.canvas.width, this.canvas.height) * 0.45;
        
        // Use the smaller of the two to ensure it fits
        const maxSize = Math.min(maxCanvasSize, maxParamSize);
        
        // Ensure the crystal center is within the safe area
        const safeCenterX = Math.max(margin + maxSize/2, Math.min(this.canvas.width - margin - maxSize/2, centerX));
        const safeCenterY = Math.max(margin + maxSize/2, Math.min(this.canvas.height - margin - maxSize/2, centerY));
        
        console.log(`Crystal size calculation: maxCanvasSize=${maxCanvasSize}, maxParamSize=${maxParamSize}, final maxSize=${maxSize}`);
        console.log(`Adjusted center position: (${safeCenterX}, ${safeCenterY})`);
        
        // Get crystal outline using the selected template
        // Force random template selection to ensure variety
        const templateName = this.getRandomTemplate();
        console.log(`[DEBUG] FORCED random template selected: ${templateName}`);
        
        const templateFunc = this.crystalTemplates[templateName];
        if (!templateFunc) {
            console.error(`Template ${templateName} not found`);
            return false;
        }
        
        // Generate the crystal outline points
        const crystalOutline = templateFunc(safeCenterX, safeCenterY, maxSize);
        
        if (!crystalOutline || crystalOutline.length < 3) {
            console.error('Invalid crystal outline generated');
            return false;
        }
        
        console.log(`Created crystal outline with ${crystalOutline.length} points`);
        
        // Calculate number of facets based on complexity - ensure wide range of facets
        // Make calculation more randomized to ensure variety
        const baseCount = Math.max(6, Math.floor(this.parameters.maxFacets * this.parameters.complexity));
        const facetCount = baseCount + Math.floor(Math.random() * 10); // Add additional randomization
        console.log(`[DEBUG] Generating crystal with ${facetCount} facets (complexity: ${this.parameters.complexity}, maxFacets: ${this.parameters.maxFacets})`);
        
        
        // Generate facets within the crystal boundary
        const fragments = await this.generateFacetsWithinBoundary(
            facetCount,
            images,
            crystalOutline
        );
        
        console.log(`Generated ${fragments.length} facets`);

        // Handle image selection based on imageMode
        console.log('Handling image selection with mode:', this.parameters.imageMode);

        if (this.parameters.imageMode === 'single' && images.length > 0) {
            // Select one random image for all facets
            const selectedImageIndex = Math.floor(Math.random() * images.length);
            const selectedImage = images[selectedImageIndex];
            
            console.log(`Single image mode: Using image ${selectedImageIndex} for all facets`);
            
            fragments.forEach(fragment => {
                fragment.image = selectedImage;
                fragment.imageIndex = selectedImageIndex;
            });
        } else {
            // In unique mode, assign random images to each facet
            console.log('Unique mode: Assigning random images to each facet');
            fragments.forEach(fragment => {
                const imageIndex = Math.floor(Math.random() * images.length);
                fragment.image = images[imageIndex];
                fragment.imageIndex = imageIndex;
            });
        }

        // Set blend mode and draw fragments
        this.ctx.globalCompositeOperation = 'multiply';
        this.drawFragments(fragments);
        this.ctx.globalCompositeOperation = 'source-over';
        
        return true;
    }
    
    // Generate a field of crystals
    async generateCrystalField(images) {
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
            await this.generateSingleCrystal(images, {
                centerX: position.x,
                centerY: position.y,
                crystalSize: position.size,
                template: template,
                imageMode: this.parameters.imageMode // Pass through the imageMode parameter
            });
        }
        
        return true;
    }
    
    // Generate positions for multiple crystals
    generateCrystalPositions(count, preventOverlap) {
        const positions = [];
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculate base size based on count and ensure 30px margin
        const margin = 30; // Fixed 30px margin
        const maxWidth = canvasWidth - 2 * margin;
        const maxHeight = canvasHeight - 2 * margin;
        
        // Calculate the maximum size that would fit within the canvas
        const maxCanvasSize = Math.min(maxWidth, maxHeight);
        
        // Calculate the maximum size based on the crystalSize parameter
        const maxParamSize = Math.min(canvasWidth, canvasHeight) * this.parameters.crystalSize;
        
        // Use the smaller of the two to ensure it fits
        const maxSize = Math.min(maxCanvasSize, maxParamSize);
        
        // Calculate base size for multiple crystals
        const baseSize = Math.max(0.1, Math.min(maxSize / Math.min(canvasWidth, canvasHeight), 0.6 / Math.sqrt(count)));
        
        console.log(`Multiple crystal size calculation: maxCanvasSize=${maxCanvasSize}, maxParamSize=${maxParamSize}, maxSize=${maxSize}, baseSize=${baseSize}`);
        
        const minDistanceBetween = Math.min(canvasWidth, canvasHeight) * baseSize * (preventOverlap ? 1.2 : 0.8);
        
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
        if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
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
        
        // Add safety margin to ensure facets stay within bounds
        const safetyMargin = 20; // Increased from 15px to 20px for better safety
        const adjustedBounds = {
            x: bounds.x + safetyMargin,
            y: bounds.y + safetyMargin,
            width: bounds.width - 2 * safetyMargin,
            height: bounds.height - 2 * safetyMargin
        };
        
        console.log(`Creating facets within boundary - center: (${centerX}, ${centerY}), radius: ${radius}`);
        console.log('Adjusted bounds with safety margin:', adjustedBounds);

        // Generate seed points within the crystal boundary
        const seedPattern = this.parameters.seedPattern || 'random';
        
        // Generate more seed points than needed to ensure we have enough after filtering
        const extraFacetCount = Math.min(facetCount * 2, 80); // Cap at 80 to avoid performance issues
        
        // Use the appropriate seed pattern function to generate points
        const initialPoints = this.seedPatterns[seedPattern](centerX, centerY, radius * 0.75, extraFacetCount); // Reduced from 0.85 to 0.75 for more compact facets
        
        // Add center point for more balanced facets
        initialPoints.push({x: centerX, y: centerY});
        
        // Filter points to ensure they're inside the crystal boundary with safety margin
        const seedPoints = initialPoints.filter(point => {
            // First check if point is within the adjusted bounds
            const withinBounds = point.x >= adjustedBounds.x && 
                               point.x <= adjustedBounds.x + adjustedBounds.width &&
                               point.y >= adjustedBounds.y && 
                               point.y <= adjustedBounds.y + adjustedBounds.height;
            
            // Then check if it's within the crystal outline
            return withinBounds && this.isPointInPolygon(point, crystalOutline);
        });
        
        // Ensure we have enough points (at least 80% of target)
        if (seedPoints.length < Math.max(5, facetCount * 0.8)) {
            console.warn(`Not enough seed points after filtering: ${seedPoints.length}/${facetCount}. Adding more points.`);
            
            // Add random points within the polygon boundary
            for (let i = seedPoints.length; i < facetCount; i++) {
                // Attempt to add a point up to 10 times
                for (let attempt = 0; attempt < 10; attempt++) {
                    // Generate random point within adjusted bounds
                    const rx = adjustedBounds.x + Math.random() * adjustedBounds.width;
                    const ry = adjustedBounds.y + Math.random() * adjustedBounds.height;
                    
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
            
            // Ensure all vertices are within the crystal outline
            const validVertices = cell.vertices.filter(vertex => 
                this.isPointInPolygon(vertex, crystalOutline)
            );
            
            // Skip if we lost too many vertices
            if (validVertices.length < 3) continue;
            
            // Calculate distance from center for visual effects
            const dx = cell.center.x - centerX;
            const dy = cell.center.y - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const normalizedDistance = Math.min(1, distanceFromCenter / radius);
            
            // Calculate opacity based on distance from center (inner facets more opaque)
            const opacity = 0.4 + 0.6 * (1 - normalizedDistance * 0.8);
            
            // Small random rotation for natural look
            const rotation = (Math.random() * 20 - 10) * (1 - normalizedDistance * 0.7);
            
            // Get bounding box of vertices for sizing
            const vertexBounds = this.getBounds(validVertices);
            const facetSize = Math.max(vertexBounds.width, vertexBounds.height);
            
            fragments.push({
                vertices: validVertices,
                x: cell.center.x,
                y: cell.center.y,
                opacity: opacity,
                rotation: rotation,
                size: facetSize
            });
        }
        
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
        
        // Apply rotation - convert degrees to radians
        if (fragment.rotation) {
            this.ctx.rotate((fragment.rotation * Math.PI) / 180);
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
        let facetWidth = fragment.size;
        let facetHeight = fragment.size;
        
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