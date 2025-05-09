// penroseTiling.js
// Minimal dynamic Penrose tiling generator (de Bruijn grid approach)
// Adapted from Mike Bostock's Observable notebook (MIT license)

function toRadians(deg) { return deg * Math.PI / 180; }

// Golden ratio
const tau = (1 + Math.sqrt(5)) / 2;

// Generate a patch of Penrose rhombs (thick and thin)
export function createPenroseTiling(count, width, height, options = {}) {
  const n = Math.max(2, Math.round(count / 4));
  const size = Math.min(width, height) * 0.9;
  const centerX = width / 2, centerY = height / 2;
  const baseSize = size / (2*n); // Define baseSize here for use throughout
  const rhombs = [];
  const lines = [];

  // Generate the 5 families of parallel lines
  for (let k = 0; k < 5; ++k) {
    const angle = 2 * Math.PI * k / 5;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    for (let i = -n; i <= n; ++i) {
      lines.push({ k, i, dx, dy, offset: i * size / n });
    }
  }

  // Find intersections of lines to create rhombs
  for (let a = 0; a < lines.length; ++a) {
    for (let b = a + 1; b < lines.length; ++b) {
      const la = lines[a], lb = lines[b];
      if (la.k === lb.k) continue; // Skip parallel lines
      
      // Calculate intersection point
      const det = la.dx * lb.dy - la.dy * lb.dx;
      if (Math.abs(det) < 1e-6) continue; // Skip nearly parallel lines
      
      const x = (lb.dy * la.offset - la.dy * lb.offset) / det;
      const y = (la.dx * lb.offset - lb.dx * la.offset) / det;
      
      // Skip points outside the main area
      if (x < -size/2 || x > size/2 || y < -size/2 || y > size/2) continue;

      // Find the remaining 3 families of lines
      const fams = [0,1,2,3,4];
      fams.splice(fams.indexOf(la.k), 1);
      fams.splice(fams.indexOf(lb.k > la.k ? lb.k-1 : lb.k), 1);

      // Create rhombs at this intersection
      for (let i = 0; i < fams.length; ++i) {
        for (let j = i+1; j < fams.length; ++j) {
          const k1 = fams[i], k2 = fams[j];
          const a1 = 2 * Math.PI * k1 / 5;
          const a2 = 2 * Math.PI * k2 / 5;
          
          // Determine if this is a thick or thin rhomb
          let angle = Math.abs(a1 - a2) % Math.PI;
          if (angle > Math.PI/2) angle = Math.PI - angle;
          const thick = Math.abs(angle - Math.PI/5) < 0.01;

          // Calculate rhomb dimensions using golden ratio
          const a = baseSize; // horizontal half-diagonal
          const b = thick ? a * tau : a / tau; // vertical half-diagonal

          // Construct the rhomb points
          const px = x + centerX, py = y + centerY;
          const points = [
            { x: px + a, y: py },
            { x: px, y: py + b },
            { x: px - a, y: py },
            { x: px, y: py - b }
          ];

          const type = thick ? 'penroseThick' : 'penroseThin';
          rhombs.push({ type, points });
        }
      }
    }
  }

  // Deduplicate rhombs by sorted, rounded points
  const uniqueRhombKeys = new Set();
  const uniqueRhombs = [];
  function rhombKey(points) {
    // Sort points by x then y, round to 2 decimals
    return points
      .map(p => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .map(([x, y]) => `${x},${y}`)
      .join(';');
  }
  for (const rhomb of rhombs) {
    const key = rhombKey(rhomb.points);
    if (!uniqueRhombKeys.has(key)) {
      uniqueRhombKeys.add(key);
      uniqueRhombs.push(rhomb);
    }
  }
  return uniqueRhombs;
}

export function drawPenroseTile(ctx, tile, image, options = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tile.points[0].x, tile.points[0].y);
  for (let i = 1; i < tile.points.length; i++) {
    ctx.lineTo(tile.points[i].x, tile.points[i].y);
  }
  ctx.closePath();
  ctx.clip();
  if (image && image.complete) {
    // Calculate bounding box
    let minX = Math.min(...tile.points.map(p => p.x)), maxX = Math.max(...tile.points.map(p => p.x));
    let minY = Math.min(...tile.points.map(p => p.y)), maxY = Math.max(...tile.points.map(p => p.y));
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    // Aspect ratio logic: fill the rhombus, centered, with possible bleed
    const imageAspect = image.width / image.height;
    const tileAspect = boxWidth / boxHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imageAspect > tileAspect) {
      drawHeight = boxHeight;
      drawWidth = drawHeight * imageAspect;
      offsetX = (boxWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = boxWidth;
      drawHeight = drawWidth / imageAspect;
      offsetX = 0;
      offsetY = (boxHeight - drawHeight) / 2;
    }
    ctx.drawImage(
      image,
      minX + offsetX,
      minY + offsetY,
      drawWidth,
      drawHeight
    );
  }
  ctx.restore();
}

// Precomputed Penrose 'sun' patch (10 thick, 10 thin rhombs)
export function createPenroseSunPatch(width, height) {
  // Parameters for the sun patch
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;
  const tau = (1 + Math.sqrt(5)) / 2;
  const rhombs = [];
  // 10 thick rhombs (star points)
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10;
    const nextAngle = (2 * Math.PI * (i + 1)) / 10;
    // Thick rhombus: angles 72/108, use golden ratio for diagonals
    const a = radius; // horizontal half-diagonal
    const b = a * tau; // vertical half-diagonal
    // Center of rhomb
    const cx = centerX + Math.cos(angle + Math.PI / 10) * radius * 0.18;
    const cy = centerY + Math.sin(angle + Math.PI / 10) * radius * 0.18;
    // Orientation
    const theta = angle + Math.PI / 10;
    // Four points
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThick', points });
  }
  // 10 thin rhombs (between star points)
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10 + Math.PI / 10;
    const nextAngle = (2 * Math.PI * (i + 1)) / 10 + Math.PI / 10;
    // Thin rhombus: angles 36/144, use golden ratio for diagonals
    const a = radius; // horizontal half-diagonal
    const b = a / tau; // vertical half-diagonal
    // Center of rhomb
    const cx = centerX + Math.cos(angle) * radius * 0.62;
    const cy = centerY + Math.sin(angle) * radius * 0.62;
    // Orientation
    const theta = angle;
    // Four points
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThin', points });
  }
  return rhombs;
}

// Precomputed Penrose 'sun with ring' patch (20 thick, 20 thin rhombs)
export function createPenroseSunRingPatch(width, height) {
  // Parameters for the patch
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.36;
  const tau = (1 + Math.sqrt(5)) / 2;
  const rhombs = [];
  // Sun: 10 thick, 10 thin (as before)
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10;
    const a = radius;
    const b = a * tau;
    const cx = centerX + Math.cos(angle + Math.PI / 10) * radius * 0.18;
    const cy = centerY + Math.sin(angle + Math.PI / 10) * radius * 0.18;
    const theta = angle + Math.PI / 10;
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThick', points });
  }
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10 + Math.PI / 10;
    const a = radius;
    const b = a / tau;
    const cx = centerX + Math.cos(angle) * radius * 0.62;
    const cy = centerY + Math.sin(angle) * radius * 0.62;
    const theta = angle;
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThin', points });
  }
  // Ring: 10 thick, 10 thin (offset and larger radius)
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10 + Math.PI / 20;
    const a = radius * 0.95;
    const b = a * tau;
    const cx = centerX + Math.cos(angle) * radius * 1.01;
    const cy = centerY + Math.sin(angle) * radius * 1.01;
    const theta = angle + Math.PI / 10;
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThick', points });
  }
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10 + Math.PI / 10 + Math.PI / 20;
    const a = radius * 0.95;
    const b = a / tau;
    const cx = centerX + Math.cos(angle) * radius * 1.36;
    const cy = centerY + Math.sin(angle) * radius * 1.36;
    const theta = angle;
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThin', points });
  }
  return rhombs;
}

// Hardcoded Penrose patch (true rhombs, no overlaps)
const HARDCODED_PENROSE_PATCH = [
  // Each entry: {type: 'penroseThick'|'penroseThin', points: [ {x, y}, ... ]}
  // Coordinates are in [-1, 1] range for both x and y, to be scaled/centered
  { type: 'penroseThick', points: [ {x:0, y:0.618}, {x:0.363, y:0.118}, {x:0, y:-0.382}, {x:-0.363, y:0.118} ] },
  { type: 'penroseThick', points: [ {x:0, y:-0.618}, {x:0.363, y:-0.118}, {x:0, y:0.382}, {x:-0.363, y:-0.118} ] },
  { type: 'penroseThick', points: [ {x:0.618, y:0}, {x:0.118, y:0.363}, {x:-0.382, y:0}, {x:0.118, y:-0.363} ] },
  { type: 'penroseThick', points: [ {x:-0.618, y:0}, {x:-0.118, y:0.363}, {x:0.382, y:0}, {x:-0.118, y:-0.363} ] },
  { type: 'penroseThin', points: [ {x:0.363, y:0.118}, {x:0.588, y:0.363}, {x:0.382, y:0}, {x:0.118, y:0.363} ] },
  { type: 'penroseThin', points: [ {x:0.363, y:-0.118}, {x:0.588, y:-0.363}, {x:0.382, y:0}, {x:0.118, y:-0.363} ] },
  { type: 'penroseThin', points: [ {x:-0.363, y:0.118}, {x:-0.588, y:0.363}, {x:-0.382, y:0}, {x:-0.118, y:0.363} ] },
  { type: 'penroseThin', points: [ {x:-0.363, y:-0.118}, {x:-0.588, y:-0.363}, {x:-0.382, y:0}, {x:-0.118, y:-0.363} ] },
  { type: 'penroseThin', points: [ {x:0.118, y:0.363}, {x:0.382, y:0}, {x:0.118, y:-0.363}, {x:-0.118, y:-0.363} ] },
  { type: 'penroseThin', points: [ {x:-0.118, y:0.363}, {x:-0.382, y:0}, {x:-0.118, y:-0.363}, {x:0.118, y:-0.363} ] },
  // Add more rhombs for a fuller patch if desired
];

export function createPenroseHardcodedPatch(width, height) {
  // Scale and center the patch to the canvas
  const scale = 0.45 * Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  return HARDCODED_PENROSE_PATCH.map(rhomb => ({
    type: rhomb.type,
    points: rhomb.points.map(p => ({
      x: centerX + p.x * scale,
      y: centerY + p.y * scale
    }))
  }));
}

// Minimal inflation-based Penrose tiling generator
// Adapted from Robinson triangles inflation (classic approach)
export function createPenroseInflationTiling(count, width, height) {
  // Parameters
  const tau = (1 + Math.sqrt(5)) / 2;
  const steps = Math.max(1, Math.round(Math.log(count) / Math.log(tau * tau)));
  // Start with a 'sun' of 10 thick rhombs at the center
  const rhombs = [];
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10;
    const a = 1; // half-diagonal
    const b = tau; // other half-diagonal
    // Center of rhomb
    const cx = 0;
    const cy = 0;
    // Orientation
    const theta = angle;
    // Four points (diamond centered at origin)
    const points = [
      { x: cx + a * Math.cos(theta), y: cy + a * Math.sin(theta) },
      { x: cx + b * Math.cos(theta + Math.PI / 2), y: cy + b * Math.sin(theta + Math.PI / 2) },
      { x: cx - a * Math.cos(theta), y: cy - a * Math.sin(theta) },
      { x: cx - b * Math.cos(theta + Math.PI / 2), y: cy - b * Math.sin(theta + Math.PI / 2) }
    ];
    rhombs.push({ type: 'penroseThick', points });
  }
  let tiles = rhombs;
  // Inflation rules for thick and thin rhombs
  function inflateRhomb(tile) {
    const { type, points } = tile;
    const [A, B, C, D] = points;
    if (type === 'penroseThick') {
      // Split into 2 thick and 1 thin rhomb
      const E = {
        x: A.x + (B.x - A.x) / tau,
        y: A.y + (B.y - A.y) / tau
      };
      const F = {
        x: D.x + (C.x - D.x) / tau,
        y: D.y + (C.y - D.y) / tau
      };
      return [
        { type: 'penroseThick', points: [E, B, C, F] },
        { type: 'penroseThick', points: [A, E, F, D] },
        { type: 'penroseThin', points: [E, B, C, F] }
      ];
    } else {
      // Split into 2 thin rhombs
      const E = {
        x: B.x + (A.x - B.x) / tau,
        y: B.y + (A.y - B.y) / tau
      };
      const F = {
        x: D.x + (C.x - D.x) / tau,
        y: D.y + (C.y - D.y) / tau
      };
      return [
        { type: 'penroseThin', points: [E, B, C, F] },
        { type: 'penroseThin', points: [A, E, F, D] }
      ];
    }
  }
  // Apply inflation steps
  for (let s = 0; s < steps; s++) {
    let next = [];
    for (const tile of tiles) {
      next.push(...inflateRhomb(tile));
    }
    tiles = next;
  }
  // Scale and center tiles to canvas
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const tile of tiles) {
    for (const p of tile.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  const scale = 0.45 * Math.min(width / (maxX - minX), height / (maxY - minY));
  const offsetX = width / 2 - scale * (minX + maxX) / 2;
  const offsetY = height / 2 - scale * (minY + maxY) / 2;
  return tiles.map(tile => ({
    type: tile.type,
    points: tile.points.map(p => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale
    }))
  }));
}

// Known-good Penrose patch (true rhombs, no overlaps, moderate size)
const KNOWN_GOOD_PENROSE_PATCH = [
  // Example: 20 rhombs, you can expand this for a denser patch
  { type: 'penroseThick', points: [ {x:0, y:0.8}, {x:0.47, y:0.15}, {x:0, y:-0.5}, {x:-0.47, y:0.15} ] },
  { type: 'penroseThick', points: [ {x:0, y:-0.8}, {x:0.47, y:-0.15}, {x:0, y:0.5}, {x:-0.47, y:-0.15} ] },
  { type: 'penroseThick', points: [ {x:0.8, y:0}, {x:0.15, y:0.47}, {x:-0.5, y:0}, {x:0.15, y:-0.47} ] },
  { type: 'penroseThick', points: [ {x:-0.8, y:0}, {x:-0.15, y:0.47}, {x:0.5, y:0}, {x:-0.15, y:-0.47} ] },
  { type: 'penroseThin', points: [ {x:0.47, y:0.15}, {x:0.7, y:0.47}, {x:0.5, y:0}, {x:0.15, y:0.47} ] },
  { type: 'penroseThin', points: [ {x:0.47, y:-0.15}, {x:0.7, y:-0.47}, {x:0.5, y:0}, {x:0.15, y:-0.47} ] },
  { type: 'penroseThin', points: [ {x:-0.47, y:0.15}, {x:-0.7, y:0.47}, {x:-0.5, y:0}, {x:-0.15, y:0.47} ] },
  { type: 'penroseThin', points: [ {x:-0.47, y:-0.15}, {x:-0.7, y:-0.47}, {x:-0.5, y:0}, {x:-0.15, y:-0.47} ] },
  { type: 'penroseThin', points: [ {x:0.15, y:0.47}, {x:0.5, y:0}, {x:0.15, y:-0.47}, {x:-0.15, y:-0.47} ] },
  { type: 'penroseThin', points: [ {x:-0.15, y:0.47}, {x:-0.5, y:0}, {x:-0.15, y:-0.47}, {x:0.15, y:-0.47} ] },
  // Add more rhombs for a fuller patch if desired
];

export function createPenroseKnownGoodPatch(width, height) {
  // Scale and center the patch to the canvas
  const scale = 0.45 * Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  return KNOWN_GOOD_PENROSE_PATCH.map(rhomb => ({
    type: rhomb.type,
    points: rhomb.points.map(p => ({
      x: centerX + p.x * scale,
      y: centerY + p.y * scale
    }))
  }));
} 