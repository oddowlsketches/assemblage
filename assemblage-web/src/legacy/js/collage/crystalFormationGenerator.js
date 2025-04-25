/**
 * Crystal Formation Generator for Assemblage
 * Creates seamless crystal-like collage structures with interconnected facets
 */

export class CrystalFormationGenerator {
    constructor(ctx, canvas) {
        if (!ctx || !canvas) {
            throw new Error('Both canvas context and canvas element are required');
        }
        
        this.ctx = ctx;
        this.canvas = canvas;
        
        // Validate canvas dimensions
        if (!this.canvas.width || !this.canvas.height) {
            console.warn('Canvas dimensions not set, using window dimensions');
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // Validate context properties
        if (!this.ctx.fillStyle || !this.ctx.globalCompositeOperation) {
            throw new Error('Canvas context missing required properties');
        }

        // Define crystal angles for more realistic formations
        this.crystalAngles = [60, 90, 120];
        
        // Define seed point distribution patterns
        this.seedPatterns = {
            radial: (centerX, centerY, radius, count) => {
                const points = [];
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const distance = radius * (0.5 + Math.random() * 0.5); // More even distribution
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
                const numClusters = Math.max(3, Math.floor(count / 5));
                const pointsPerCluster = Math.ceil(count / numClusters);
                
                for (let c = 0; c < numClusters; c++) {
                    const clusterAngle = (c / numClusters) * Math.PI * 2;
                    const clusterDistance = radius * (0.3 + Math.random() * 0.4);
                    const clusterX = centerX + Math.cos(clusterAngle) * clusterDistance;
                    const clusterY = centerY + Math.sin(clusterAngle) * clusterDistance;
                    
                    const clusterRadius = radius * 0.2;
                    for (let i = 0; i < pointsPerCluster; i++) {
                        if (points.length >= count) break;
                        const angle = Math.random() * Math.PI * 2;
                        const distance = clusterRadius * Math.random();
                        points.push({
                            x: clusterX + Math.cos(angle) * distance,
                            y: clusterY + Math.sin(angle) * distance
                        });
                    }
                }
                return points;
            },
            spiral: (centerX, centerY, radius, count) => {
                const points = [];
                const spiralTightness = 0.3;
                for (let i = 0; i < count; i++) {
                    const t = i / count;
                    const angle = t * Math.PI * 8;
                    const distance = radius * (0.2 + t * 0.8);
                    points.push({
                        x: centerX + Math.cos(angle) * distance * (1 - spiralTightness * t),
                        y: centerY + Math.sin(angle) * distance * (1 - spiralTightness * t)
                    });
                }
                return points;
            }
        };
    }

    generateBackgroundColor() {
        // Rich, vibrant colors that work well with multiply blend mode
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

    async generateCrystal(images, fortuneText, parameters = {}) {
        console.log('Starting crystal generation with parameters:', parameters);
        console.log('Number of input images:', images.length);

        // Store parameters for use in other methods
        this.parameters = parameters;

        // Clear canvas and set background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.generateBackgroundColor();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Filter out invalid images
        const validImages = images.filter(img => {
            const isValid = img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
            if (!isValid) {
                console.warn('Invalid image found:', {
                    complete: img?.complete,
                    naturalWidth: img?.naturalWidth,
                    naturalHeight: img?.naturalHeight
                });
            }
            return isValid;
        });

        console.log('Number of valid images:', validImages.length);

        if (validImages.length === 0) {
            console.error('No valid images provided for crystal generation');
            return false;
        }

        try {
            // Determine complexity and seed pattern
            const complexity = parameters.complexity || 5;
            const seedPattern = parameters.seedPattern || this.getRandomSeedPattern();
            
            console.log('Using complexity:', complexity, 'and seed pattern:', seedPattern);

            // Calculate number of facets based on complexity
            const facetCount = Math.min(
                Math.max(5, Math.floor(complexity * 3)),
                parameters.maxFacets || 25
            );

            console.log('Creating crystal formation with', facetCount, 'facets');

            // Create the crystal formation
            const fragments = this.createCrystalFormation(facetCount, validImages, seedPattern, parameters);
            
            // Set multiply blend mode before drawing fragments
            this.ctx.globalCompositeOperation = 'multiply';
            
            // Draw the fragments
            console.log('Drawing', fragments.length, 'fragments');
            this.drawFragments(fragments);
            
            // Reset blend mode
            this.ctx.globalCompositeOperation = 'source-over';
            
            console.log('Crystal generation completed successfully');
            return true;
        } catch (error) {
            console.error('Error in crystal generation:', error);
            return false;
        }
    }

    getRandomSeedPattern() {
        const patterns = Object.keys(this.seedPatterns);
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    createCrystalFormation(facetCount, images, seedPattern, parameters) {
        const fragments = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Use the full canvas diagonal as the base size to ensure coverage
        const baseSize = Math.sqrt(Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2));
        
        // Generate seed points for Voronoi diagram
        const seedPoints = this.generateSeedPoints(centerX, centerY, baseSize / 2, facetCount, seedPattern);
        
        // Create Voronoi cells
        const cells = this.createVoronoiCells(seedPoints, centerX, centerY, baseSize);
        
        // Process cells to create facets
        cells.forEach((cell, index) => {
            // Skip cells that are too small or degenerate
            if (cell.vertices.length < 3) return;
            
            // Create facet from cell
            const facet = this.createFacetFromCell(cell, images[index % images.length], index);
            fragments.push(facet);
        });
        
        // Refine edges to ensure seamless connections
        this.refineFacetEdges(fragments);
        
        return fragments;
    }

    generateSeedPoints(centerX, centerY, baseSize, count, pattern) {
        // Determine if we should include a center point based on pattern and random chance
        const includeCenter = pattern === 'radial' || (pattern === 'grid' && Math.random() < 0.5);
        
        // Start with center point if needed
        const points = includeCenter ? [{ x: centerX, y: centerY }] : [];
        
        // Generate additional points using the specified pattern
        const radius = baseSize / 2;
        const additionalPoints = this.seedPatterns[pattern](centerX, centerY, radius, count - (includeCenter ? 1 : 0));
        
        return [...points, ...additionalPoints];
    }

    createVoronoiCells(points, centerX, centerY, baseSize) {
        // Simple implementation of Voronoi diagram using Fortune's algorithm
        // For simplicity, we'll use a grid-based approach to approximate Voronoi cells
        
        const cells = [];
        const gridSize = 50; // Resolution of the grid
        const cellSize = baseSize / gridSize;
        
        // Create a grid of points
        const grid = [];
        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const x = centerX - baseSize/2 + i * cellSize;
                const y = centerY - baseSize/2 + j * cellSize;
                grid.push({ x, y });
            }
        }
        
        // Assign each grid point to the nearest seed point
        const assignments = new Map();
        grid.forEach(point => {
            let minDist = Infinity;
            let nearestSeedIndex = 0;
            
            points.forEach((seed, index) => {
                const dist = this.distance(point, seed);
                if (dist < minDist) {
                    minDist = dist;
                    nearestSeedIndex = index;
                }
            });
            
            assignments.set(`${point.x},${point.y}`, nearestSeedIndex);
        });
        
        // Create cells by grouping grid points assigned to the same seed
        points.forEach((seed, seedIndex) => {
            const cellPoints = grid.filter(point => 
                assignments.get(`${point.x},${point.y}`) === seedIndex
            );
            
            if (cellPoints.length > 0) {
                // Find the convex hull of the cell points
                const vertices = this.convexHull(cellPoints);
                cells.push({
                    center: seed,
                    vertices: vertices,
                    seedIndex: seedIndex
                });
            }
        });
        
        return cells;
    }

    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    convexHull(points) {
        // Graham scan algorithm for convex hull
        if (points.length < 3) return points;
        
        // Find the point with the lowest y-coordinate (and leftmost if tied)
        let lowest = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].y < points[lowest].y || 
                (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
                lowest = i;
            }
        }
        
        // Swap the lowest point to the beginning
        const temp = points[0];
        points[0] = points[lowest];
        points[lowest] = temp;
        
        // Sort the rest of the points by polar angle with respect to the lowest point
        const p0 = points[0];
        points.sort((a, b) => {
            const angleA = Math.atan2(a.y - p0.y, a.x - p0.x);
            const angleB = Math.atan2(b.y - p0.y, b.x - p0.x);
            if (angleA === angleB) {
                return this.distance(p0, a) - this.distance(p0, b);
            }
            return angleA - angleB;
        });
        
        // Build the convex hull
        const hull = [points[0], points[1]];
        for (let i = 2; i < points.length; i++) {
            while (hull.length >= 2 && 
                   this.crossProduct(
                       hull[hull.length - 2],
                       hull[hull.length - 1],
                       points[i]
                   ) <= 0) {
                hull.pop();
            }
            hull.push(points[i]);
        }
        
        return hull;
    }

    crossProduct(p1, p2, p3) {
        return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    }

    createFacetFromCell(cell, image, index) {
        // Calculate center of the facet
        const centerX = cell.center.x;
        const centerY = cell.center.y;
        
        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        cell.vertices.forEach(vertex => {
            minX = Math.min(minX, vertex.x);
            minY = Math.min(minY, vertex.y);
            maxX = Math.max(maxX, vertex.x);
            maxY = Math.max(maxY, vertex.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate rotation based on cell position and rotationRange parameter
        const rotationRange = this.parameters?.rotationRange || 15;
        const rotation = Math.random() * rotationRange * 2 - rotationRange; // Random rotation within the specified range
        
        // Calculate opacity based on distance from center
        const centerDistance = this.distance(
            { x: this.canvas.width / 2, y: this.canvas.height / 2 },
            { x: centerX, y: centerY }
        );
        const maxDistance = Math.min(this.canvas.width, this.canvas.height) / 2;
        const opacity = 0.7 + 0.3 * (1 - centerDistance / maxDistance);
        
        return {
            image: image,
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            rotation: rotation,
            opacity: opacity,
            vertices: cell.vertices,
            seedIndex: cell.seedIndex,
            isFacet: true,
            facetIndex: index
        };
    }

    refineFacetEdges(fragments) {
        // Ensure adjacent facets share exact edge coordinates
        // This is a simplified approach - in a full implementation, we would
        // detect shared edges and ensure they have identical coordinates
        
        // For now, we'll just ensure all vertices are properly aligned to the grid
        fragments.forEach(fragment => {
            if (fragment.vertices) {
                fragment.vertices = fragment.vertices.map(vertex => ({
                    x: Math.round(vertex.x),
                    y: Math.round(vertex.y)
                }));
            }
        });
    }

    drawFragments(fragments) {
        // Sort fragments by distance from center for proper layering
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        fragments.sort((a, b) => {
            const distA = this.distance(
                { x: centerX, y: centerY },
                { x: a.x, y: a.y }
            );
            const distB = this.distance(
                { x: centerX, y: centerY },
                { x: b.x, y: b.y }
            );
            return distA - distB;
        });

        // Draw each fragment
        fragments.forEach(fragment => {
            this.drawFragment(fragment);
        });
    }

    drawFragment(fragment) {
        if (!fragment.image || !fragment.image.complete) return;

        this.ctx.save();

        // Use the fragment's opacity or calculate based on global settings
        const baseOpacity = this.parameters?.blendOpacity || 0.45;
        const opacityVariation = 0.15;
        const randomOpacity = baseOpacity + (Math.random() * 2 * opacityVariation) - opacityVariation;
        // If this is the first fragment (index 0), set to full opacity
        const finalOpacity = fragment.facetIndex === 0 ? 1.0 : Math.max(0.3, Math.min(0.6, randomOpacity));
        
        this.ctx.globalAlpha = fragment.opacity || finalOpacity;
        // Don't set blend mode here - use the global setting from CollageGenerator

        // Translate to fragment position
        this.ctx.translate(fragment.x, fragment.y);
        this.ctx.rotate(fragment.rotation * Math.PI / 180);

        // Create clipping path based on vertices
        if (fragment.vertices && fragment.vertices.length >= 3) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                fragment.vertices[0].x - fragment.x,
                fragment.vertices[0].y - fragment.y
            );
            
            for (let i = 1; i < fragment.vertices.length; i++) {
                this.ctx.lineTo(
                    fragment.vertices[i].x - fragment.x,
                    fragment.vertices[i].y - fragment.y
                );
            }
            
            this.ctx.closePath();
            this.ctx.clip();
        }

        // Draw the image
        const imgAspectRatio = fragment.image.naturalWidth / fragment.image.naturalHeight;
        const fragmentAspectRatio = fragment.width / fragment.height;

        let drawWidth, drawHeight;
        if (imgAspectRatio > fragmentAspectRatio) {
            drawHeight = fragment.height;
            drawWidth = drawHeight * imgAspectRatio;
        } else {
            drawWidth = fragment.width;
            drawHeight = drawWidth / imgAspectRatio;
        }

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

export class SafeCrystalFormationGenerator {
    constructor(ctx, canvas) {
        try {
            if (!ctx || !canvas) {
                throw new Error('Both canvas context and canvas element are required');
            }

            // Validate canvas dimensions
            if (!canvas.width || !canvas.height) {
                console.warn('Canvas dimensions not set, using window dimensions');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            // Validate context properties
            if (!ctx.fillStyle || !ctx.globalCompositeOperation) {
                throw new Error('Canvas context missing required properties');
            }

            this.generator = new CrystalFormationGenerator(ctx, canvas);
            this.isValid = true;
            console.log('SafeCrystalFormationGenerator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CrystalFormationGenerator:', error);
            this.isValid = false;
        }
    }

    async generateCrystal(images, fortuneText, parameters = {}) {
        if (!this.isValid) {
            console.warn('CrystalFormationGenerator is not in a valid state');
            return false;
        }

        if (!Array.isArray(images) || images.length === 0) {
            console.error('No images provided to generateCrystal');
            return false;
        }

        try {
            console.log('SafeCrystalFormationGenerator starting crystal generation');
            const result = await this.generator.generateCrystal(images, fortuneText, parameters);
            console.log('SafeCrystalFormationGenerator completed crystal generation:', result);
            return result;
        } catch (error) {
            console.error('Error in crystal generation:', error);
            return false;
        }
    }
} 