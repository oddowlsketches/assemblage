/**
 * Voronoi tiling pattern generator
 * Creates a simplified Voronoi cell pattern for use in the tiling template
 */

/**
 * Generate a simple approximation of Voronoi cells
 * Note: This is a simplified version, not a mathematically perfect Voronoi diagram
 * 
 * @param {number} count - Number of cells to generate
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Additional options
 * @returns {Array} Array of cell objects
 */
export function createVoronoiTiling(count, width, height, options = {}) {
  const { spacing = 0, fillStyle = 'fullBleed' } = options;
  
  // Determine how much of the canvas to use
  let canvasWidth = width;
  let canvasHeight = height;
  let offsetX = 0;
  let offsetY = 0;
  let bleed = 0;
  
  if (fillStyle === 'centeredForm') {
    const scale = 0.8;
    canvasWidth = width * scale;
    canvasHeight = height * scale;
    offsetX = (width - canvasWidth) / 2;
    offsetY = (height - canvasHeight) / 2;
  } else {
    // For fullBleed, allow edge bleed: add extra margin for seed points
    bleed = Math.max(width, height) * 0.1;
    canvasWidth = width + 2 * bleed;
    canvasHeight = height + 2 * bleed;
    offsetX = -bleed;
    offsetY = -bleed;
  }
  
  // Generate random seed points for cells
  const seedPoints = [];
  const adjustedCount = Math.max(5, count); // Ensure at least 5 cells
  
  for (let i = 0; i < adjustedCount; i++) {
    seedPoints.push({
      x: offsetX + Math.random() * canvasWidth,
      y: offsetY + Math.random() * canvasHeight
    });
  }
  
  // For a simple voronoi approximation, we'll create polygons around each seed point
  // by dividing the canvas into regions based on closest seed point
  const cells = [];
  
  // Creating a grid to sample points
  const gridSize = Math.ceil(Math.sqrt(adjustedCount * 4)); // 4x more sample points than cells
  const cellWidth = canvasWidth / gridSize;
  const cellHeight = canvasHeight / gridSize;
  
  // For each seed point, find the nearby points that are closest to it
  for (let i = 0; i < seedPoints.length; i++) {
    const seed = seedPoints[i];
    const cellPoints = [];
    
    // Sample grid points around the seed
    const sampleRadius = Math.max(canvasWidth, canvasHeight) / Math.sqrt(adjustedCount);
    
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const gridX = offsetX + gx * cellWidth;
        const gridY = offsetY + gy * cellHeight;
        
        // Check if this grid point is within sample radius of the seed
        const dx = gridX - seed.x;
        const dy = gridY - seed.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance <= sampleRadius) {
          // Check if this seed is the closest to the grid point
          let closest = true;
          for (let j = 0; j < seedPoints.length; j++) {
            if (j !== i) {
              const otherSeed = seedPoints[j];
              const dxOther = gridX - otherSeed.x;
              const dyOther = gridY - otherSeed.y;
              const distanceOther = Math.sqrt(dxOther*dxOther + dyOther*dyOther);
              
              if (distanceOther < distance) {
                closest = false;
                break;
              }
            }
          }
          
          if (closest) {
            cellPoints.push({ x: gridX, y: gridY });
          }
        }
      }
    }
    
    // If we have enough points, create a convex hull approximation
    if (cellPoints.length >= 3) {
      // Simple approach: find centroid and sort points by angle
      const centroid = findCentroid(cellPoints);
      const sortedPoints = sortPointsByAngle(cellPoints, centroid);
      
      // Apply spacing between cells if needed
      if (spacing > 0.5) {
        for (let i = 0; i < sortedPoints.length; i++) {
          const point = sortedPoints[i];
          const dx = point.x - centroid.x;
          const dy = point.y - centroid.y;
          const distance = Math.sqrt(dx*dx + dy*dy);
          
          // Move point closer to centroid by spacing amount
          if (distance > spacing) {
            const ratio = (distance - spacing/2) / distance;
            point.x = centroid.x + dx * ratio;
            point.y = centroid.y + dy * ratio;
          }
        }
      }
      
      cells.push({
        x: centroid.x,
        y: centroid.y,
        type: 'voronoi',
        points: sortedPoints
      });
    }
  }
  
  return cells;
}

/**
 * Find the centroid (average point) of a set of points
 * @param {Array} points - Array of {x, y} points
 * @returns {Object} Centroid {x, y}
 */
function findCentroid(points) {
  let sumX = 0;
  let sumY = 0;
  
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

/**
 * Sort points by angle relative to centroid
 * @param {Array} points - Array of {x, y} points
 * @param {Object} centroid - Center point {x, y}
 * @returns {Array} Sorted points
 */
function sortPointsByAngle(points, centroid) {
  // Clone the points array to avoid modifying the original
  const sortedPoints = [...points];
  
  sortedPoints.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
  
  return sortedPoints;
}

/**
 * Draw a Voronoi cell on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cell - Cell data
 * @param {Image} image - Image to use for the cell
 * @param {Object} options - Additional options
 */
export function drawVoronoiCell(ctx, cell, image, options = {}) {
  const { randomRotation = false, debug = false } = options;
  
  // Save context state
  ctx.save();
  
  // Move to the cell's center
  ctx.translate(cell.x, cell.y);
  
  if (randomRotation) {
    // Random rotation (Voronoi cells look interesting with any rotation)
    const rotation = Math.random() * Math.PI * 2;
    ctx.rotate(rotation);
  }
  
  // Create clipping path for the cell
  ctx.beginPath();
  
  // Draw the polygon path
  const points = cell.points;
  if (points.length > 0) {
    // Move to the first point (relative to the translated origin)
    ctx.moveTo(points[0].x - cell.x, points[0].y - cell.y);
    
    // Connect to all other points
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x - cell.x, points[i].y - cell.y);
    }
    ctx.closePath();
  }
  
  // Apply clipping and draw the image
  ctx.clip();
  
  if (image && image.complete) {
    // Calculate cell bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(point => {
      minX = Math.min(minX, point.x - cell.x);
      minY = Math.min(minY, point.y - cell.y);
      maxX = Math.max(maxX, point.x - cell.x);
      maxY = Math.max(maxY, point.y - cell.y);
    });
    
    const cellWidth = maxX - minX;
    const cellHeight = maxY - minY;
    
    // Calculate dimensions to ensure full coverage while preserving aspect ratio
    const imageAspect = image.width / image.height;
    const cellAspect = cellWidth / cellHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspect > cellAspect) {
      // Image is wider than cell - fit to height
      drawHeight = cellHeight;
      drawWidth = drawHeight * imageAspect;
      offsetX = (cellWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than cell - fit to width
      drawWidth = cellWidth;
      drawHeight = drawWidth / imageAspect;
      offsetX = 0;
      offsetY = (cellHeight - drawHeight) / 2;
    }
    
    // Draw the image centered in the cell
    ctx.drawImage(
      image,
      minX + offsetX,
      minY + offsetY,
      drawWidth,
      drawHeight
    );
  }
  
  // Debug outline
  if (debug) {
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Restore context state
  ctx.restore();
}
