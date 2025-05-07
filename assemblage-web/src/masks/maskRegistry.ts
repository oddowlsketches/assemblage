// maskRegistry.ts
/**
 * Parameterized SVG mask generators for all collage mask families.
 * Each generator returns an SVG string (viewBox 0 0 100 100, white fill, no stroke).
 * All masks are grouped in the exported maskRegistry object for easy lookup.
 */

export type MaskDescriptor =
  | { kind: 'svg';    getSvg: () => string; description?: string; tags?: string[] }
  | { kind: 'path2d'; getPath: () => Path2D; description?: string; tags?: string[] }
  | { kind: 'bitmap'; getBitmap: () => Promise<ImageBitmap>; description?: string; tags?: string[] };

export type MaskGenerator = () => MaskDescriptor;

export type MaskParams = {
  offset?: number; // percent offset (e.g. 0 to 15)
  rotation?: number; // degrees
  count?: number; // for multi-slice/grouped masks
  spacing?: number; // percent spacing for groups
  align?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  random?: boolean;
  width?: number;
  height?: number;
  legHeight?: number;
  [key: string]: any;
};

export type MaskDefinition = {
  kind: 'svg' | 'path2d' | 'bitmap';
  getSvg?: () => string;
  getPath?: () => Path2D;
  getBitmap?: () => Promise<ImageBitmap>;
  description?: string;
  tags?: string[];
};

// --- SLICED FAMILY ---
function sliceHorizontalWide(params: MaskParams = {}) {
  const y = 40 + (params.offset ?? 0);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${params.rotation ?? 0},50,50)'><rect x='0' y='${y}' width='100' height='20' fill='white'/></g></svg>`;
}
function sliceHorizontalNarrow(params: MaskParams = {}) {
  const y = 60 + (params.offset ?? 0);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${params.rotation ?? 0},50,50)'><rect x='0' y='${y}' width='100' height='8' fill='white'/></g></svg>`;
}
function slice3xHorizontal(params: MaskParams = {}) {
  const spacing = params.spacing ?? 10;
  const random = params.random ?? false;
  const ys = random
    ? [20, 45, 70].map(y => y + (Math.random() - 0.5) * spacing)
    : [20, 45, 70];
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${ys.map(y => `<rect x='0' y='${y}' width='100' height='8' fill='white'/>`).join('')}</svg>`;
}
function sliceVerticalWide(params: MaskParams = {}) {
  const x = 40 + (params.offset ?? 0);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${params.rotation ?? 0},50,50)'><rect x='${x}' y='0' width='20' height='100' fill='white'/></g></svg>`;
}
function sliceVerticalNarrow(params: MaskParams = {}) {
  const x = 70 + (params.offset ?? 0);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${params.rotation ?? 0},50,50)'><rect x='${x}' y='0' width='8' height='100' fill='white'/></g></svg>`;
}
function slice4xMixed(params: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='0' y='25' width='100' height='10' fill='white'/>
    <rect x='0' y='65' width='100' height='10' fill='white'/>
    <rect x='30' y='0' width='10' height='100' fill='white'/>
    <rect x='60' y='0' width='10' height='100' fill='white'/>
  </svg>`;
}
function sliceAngled(params: MaskParams = {}) {
  const angle = params.angle ?? 15;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${angle},50,50)'><rect x='0' y='40' width='100' height='15' fill='white'/></g></svg>`;
}

// --- ARCHITECTURAL FAMILY ---
function archClassical({ width = 60, height = 40, legHeight = 30 }: MaskParams = {}) {
  // Architectural arch: variable width, height, and vertical legs
  // width: total width of arch opening, height: height of arch curve, legHeight: height of vertical sides
  // Center arch horizontally in 100x100 viewBox
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - legHeight - height;
  const legBottom = 100;
  // Move to left leg bottom, up to top of leg, arc to right leg top, down right leg
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='
      M${left},${legBottom}
      L${left},${top + height}
      A${width / 2},${height} 0 0,1 ${right},${top + height}
      L${right},${legBottom}
      Z
    ' fill='white'/>
  </svg>`;
}

function archFlat({}: MaskParams = {}) {
  // Segmental (flatter) arch: base from (20,100) to (80,100), radius 30 (horizontal), 15 (vertical)
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='M20,100 A30,15 0 0,1 80,100 L80,100 L20,100 Z' fill='white'/>
  </svg>`;
}

function triptychArch({ archWidth = 18, archHeight = 24, spacing = 5 }: MaskParams = {}) {
  // Three arches side by side, variable width, height, and spacing
  // Center group in 100x100 viewBox
  const totalWidth = archWidth * 3 + spacing * 2;
  const leftStart = 50 - totalWidth / 2;
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>`;
  for (let i = 0; i < 3; i++) {
    const left = leftStart + i * (archWidth + spacing);
    const right = left + archWidth;
    const top = 100 - archHeight;
    svg += `<path d='M${left},100 L${left},${top + archHeight} A${archWidth / 2},${archHeight} 0 0,1 ${right},${top + archHeight} L${right},100 Z' fill='white'/>`;
  }
  svg += `</svg>`;
  return svg;
}

function windowRect({}: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='25' y='20' width='50' height='60' fill='white'/></svg>`;
}

function windowGrid({}: MaskParams = {}) {
  // 2x3 grid
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='15' y='15' width='20' height='20' fill='white'/>
    <rect x='40' y='15' width='20' height='20' fill='white'/>
    <rect x='65' y='15' width='20' height='20' fill='white'/>
    <rect x='15' y='40' width='20' height='20' fill='white'/>
    <rect x='40' y='40' width='20' height='20' fill='white'/>
    <rect x='65' y='40' width='20' height='20' fill='white'/>
  </svg>`;
}

function columnPair({}: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='20' y='10' width='15' height='80' fill='white'/><rect x='65' y='10' width='15' height='80' fill='white'/></svg>`;
}

function columnSingle({}: MaskParams = {}) {
  // Single column
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='42' y='10' width='16' height='80' fill='white'/></svg>`;
}

function columnTriplet({}: MaskParams = {}) {
  // Three columns
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='10' width='15' height='80' fill='white'/><rect x='42' y='10' width='16' height='80' fill='white'/><rect x='75' y='10' width='15' height='80' fill='white'/></svg>`;
}

function facadeGrid({}: MaskParams = {}) {
  // Composite: 2 columns + 4 windows in a grid
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='20' y='10' width='10' height='80' fill='white'/>
    <rect x='70' y='10' width='10' height='80' fill='white'/>
    <rect x='35' y='20' width='12' height='18' fill='white'/>
    <rect x='53' y='20' width='12' height='18' fill='white'/>
    <rect x='35' y='50' width='12' height='18' fill='white'/>
    <rect x='53' y='50' width='12' height='18' fill='white'/>
  </svg>`;
}

function houseGable({ width = 30, baseHeight = 40, roofHeight = 20 }: MaskParams = {}) {
  // House shape: rectangle with triangle roof
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const baseTop = 100 - baseHeight;
  const roofPeakY = baseTop - roofHeight;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='${left}' y='${baseTop}' width='${width}' height='${baseHeight}' fill='white'/>
    <polygon points='${left},${baseTop} ${right},${baseTop} 50,${roofPeakY}' fill='white'/>
  </svg>`;
}

// --- ABSTRACT FAMILY ---
function blobIrregular({ rotation = 0 }: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><path d='M30,60 Q10,40 30,30 Q50,10 70,30 Q90,50 70,70 Q50,90 30,60 Z' fill='white'/></g></svg>`;
}

function blobCrescent({}: MaskParams = {}) {
  // Two overlapping circles
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='30' fill='white'/><circle cx='65' cy='50' r='25' fill='gray'/></svg>`;
}

function polygonSoft({ rotation = 0 }: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='20,60 40,20 80,30 70,80 30,90' fill='white'/></g></svg>`;
}

function cloudLike({ count = 3, minR = 12, maxR = 22, seed = 1 }: MaskParams = {}) {
  // More random cloud: 3-5 overlapping blobs, random positions and radii
  function seededRandom(s: number) {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }
  const blobs: string[] = [];
  const cx = 50, cy = 60;
  const n = count + Math.floor((seededRandom(seed) * 3)); // 3-5 blobs
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (seededRandom(seed + i) - 0.5) * 0.5;
    const r = minR + seededRandom(seed * (i + 1)) * (maxR - minR);
    const x = cx + Math.cos(angle) * 18 + (seededRandom(seed * (i + 2)) - 0.5) * 8;
    const y = cy + Math.sin(angle) * 10 + (seededRandom(seed * (i + 3)) - 0.5) * 8;
    blobs.push(`<ellipse cx='${x}' cy='${y}' rx='${r}' ry='${r * (0.7 + seededRandom(seed * (i + 4)) * 0.6)}' fill='white'/>`);
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${blobs.join('')}</svg>`;
}

function archBlob({ width = 60, height = 30, baseHeight = 15, archiness = 0.5 }: MaskParams = {}) {
  // Organic arch/bridge: variable width, height, and base height
  // archiness: 0 (flat) to 1 (pointy)
  // Center arch horizontally in 100x100 viewBox
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - baseHeight - height;
  const baseY = 100 - baseHeight;
  const mid = 50;
  const archPeak = top - archiness * 10;
  // Use a smooth curve for the arch span, and a wavy base
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='
      M${left},${baseY}
      L${left},${top + height}
      Q${mid},${archPeak} ${right},${top + height}
      L${right},${baseY}
      Q${mid},${baseY + 8} ${left},${baseY}
      Z
    ' fill='white'/>
  </svg>`;
}

function abstractRotated({ mask = 'blobIrregular', rotation }: MaskParams = {}): MaskDescriptor {
  // Randomly rotate any abstract mask by a multiple of 30°
  const masks = ['blobIrregular', 'blobCrescent', 'polygonSoft', 'cloudLike', 'archBlob'];
  const chosen = mask && masks.includes(mask) ? mask : masks[Math.floor(Math.random() * masks.length)];
  const angle = typeof rotation === 'number' ? rotation : Math.floor(Math.random() * 12) * 30;
  // Call the chosen mask function with rotation param
  if (chosen === 'blobCrescent' || chosen === 'cloudLike' || chosen === 'archBlob') {
    // These masks don't use rotation param
    const desc = registry.abstract[chosen as keyof typeof registry.abstract]() as MaskDescriptor;
    if (desc.kind === 'svg') {
      return { kind: 'svg', getSvg: desc.getSvg, description: desc.description, tags: desc.tags };
    }
    // fallback: return a default svg mask
    return { kind: 'svg', getSvg: () => '' };
  }
  // For rotation, wrap the SVG string in a MaskDescriptor
  return { kind: 'svg', getSvg: () => polygonSoft({ rotation: angle }) };
}

// --- ALTAR FAMILY ---
function nicheArch({ width = 28, height = 44, legHeight = 30 }: MaskParams = {}) {
  // Tall niche: vertical sides, rounded top
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - legHeight - height;
  const legBottom = 100;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='
      M${left},${legBottom}
      L${left},${top + height}
      A${width / 2},${height} 0 0,1 ${right},${top + height}
      L${right},${legBottom}
      Z
    ' fill='white'/>
  </svg>`;
}

function nicheCluster({ width = 12, height = 20, legHeight = 12, spacing = 6 }: MaskParams = {}) {
  // Three tall niches side by side
  const totalWidth = width * 3 + spacing * 2;
  const leftStart = 50 - totalWidth / 2;
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>`;
  for (let i = 0; i < 3; i++) {
    const left = leftStart + i * (width + spacing);
    const right = left + width;
    const top = 100 - legHeight - height;
    const legBottom = 100;
    svg += `<path d='M${left},${legBottom} L${left},${top + height} A${width / 2},${height} 0 0,1 ${right},${top + height} L${right},${legBottom} Z' fill='white'/>`;
  }
  svg += `</svg>`;
  return svg;
}

function circleInset({}: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='60' r='20' fill='white'/></svg>`;
}

function nicheStack({ width = 36, height = 28, legHeight = 18, smallWidth = 10, smallHeight = 10, smallLeg = 6, spacing = 2 }: MaskParams = {}) {
  // Large arch + row of three small niches, all with vertical sides and rounded tops
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - legHeight - height;
  const legBottom = 100 - (smallHeight + smallLeg + spacing);
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>`;
  // Large arch
  svg += `<path d='M${left},${legBottom} L${left},${top + height} A${width / 2},${height} 0 0,1 ${right},${top + height} L${right},${legBottom} Z' fill='white'/>`;
  // Three small niches
  const totalWidth = smallWidth * 3 + spacing * 2;
  const leftStart = 50 - totalWidth / 2;
  for (let i = 0; i < 3; i++) {
    const l = leftStart + i * (smallWidth + spacing);
    const r = l + smallWidth;
    const t = 100 - smallLeg - smallHeight;
    const b = 100 - smallLeg;
    svg += `<path d='M${l},${b} L${l},${t + smallHeight} A${smallWidth / 2},${smallHeight} 0 0,1 ${r},${t + smallHeight} L${r},${b} Z' fill='white'/>`;
  }
  svg += `</svg>`;
  return svg;
}

function circleAboveArch({ width = 28, height = 44, legHeight = 30, circleY = 30, circleR = 10 }: MaskParams = {}) {
  // Circle above a tall niche arch
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - legHeight - height;
  const legBottom = 100;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <circle cx='50' cy='${circleY}' r='${circleR}' fill='white'/>
    <path d='
      M${left},${legBottom}
      L${left},${top + height}
      A${width / 2},${height} 0 0,1 ${right},${top + height}
      L${right},${legBottom}
      Z
    ' fill='white'/>
  </svg>`;
}

function nicheOffset({ offset = 10, width = 28, height = 44, legHeight = 30, smallWidth = 14, smallHeight = 20, smallLeg = 16 }: MaskParams = {}) {
  // Main arch and two small offset arches, all with vertical sides and rounded tops
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - legHeight - height;
  const legBottom = 100;
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>`;
  // Main arch
  svg += `<path d='M${left},${legBottom} L${left},${top + height} A${width / 2},${height} 0 0,1 ${right},${top + height} L${right},${legBottom} Z' fill='white'/>`;
  // Left offset niche
  const l2 = left + offset;
  const r2 = l2 + smallWidth;
  const t2 = 100 - smallLeg - smallHeight;
  const b2 = 100 - smallLeg;
  svg += `<path d='M${l2},${b2} L${l2},${t2 + smallHeight} A${smallWidth / 2},${smallHeight} 0 0,1 ${r2},${t2 + smallHeight} L${r2},${b2} Z' fill='white'/>`;
  // Right offset niche
  const l3 = right - offset - smallWidth;
  const r3 = l3 + smallWidth;
  const t3 = 100 - smallLeg - smallHeight;
  const b3 = 100 - smallLeg;
  svg += `<path d='M${l3},${b3} L${l3},${t3 + smallHeight} A${smallWidth / 2},${smallHeight} 0 0,1 ${r3},${t3 + smallHeight} L${r3},${b3} Z' fill='white'/>`;
  svg += `</svg>`;
  return svg;
}

function gableAltar({ width = 40, baseHeight = 40, gableHeight = 30 }: MaskParams = {}) {
  // Altar with rectangular base and triangular gable top
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const baseTop = 100 - baseHeight;
  const gablePeakY = baseTop - gableHeight;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='${left}' y='${baseTop}' width='${width}' height='${baseHeight}' fill='white'/>
    <polygon points='${left},${baseTop} ${right},${baseTop} 50,${gablePeakY}' fill='white'/>
  </svg>`;
}

// --- NARRATIVE FAMILY ---
function panelRectWide({ align = 'center' }: MaskParams = {}) {
  const y = align === 'top' ? 10 : align === 'bottom' ? 60 : 35;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='${y}' width='80' height='30' fill='white'/></svg>`;
}

function panelRectTall({ align = 'left' }: MaskParams = {}) {
  const x = align === 'right' ? 70 : align === 'center' ? 40 : 10;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${x}' y='10' width='20' height='80' fill='white'/></svg>`;
}

function panelSquare({ align = 'center' }: MaskParams = {}) {
  const x = align === 'right' ? 60 : align === 'left' ? 10 : 20;
  const y = align === 'bottom' ? 60 : align === 'top' ? 10 : 20;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${x}' y='${y}' width='60' height='60' fill='white'/></svg>`;
}

function panelOverlap({ angle = 10 }: MaskParams = {}) {
  // Two overlapping panels
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='30' width='60' height='40' fill='white'/><g transform='rotate(${angle},60,70)'><rect x='30' y='50' width='60' height='40' fill='white'/></g></svg>`;
}

function panelLShape({}: MaskParams = {}) {
  // L-shaped panel (two rectangles)
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='10' width='60' height='20' fill='white'/><rect x='10' y='30' width='20' height='60' fill='white'/></svg>`;
}

function panelGutter({ margin = 10 }: MaskParams = {}) {
  // Panel inset by margin
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${margin}' y='${margin}' width='${100 - 2 * margin}' height='${100 - 2 * margin}' fill='white'/></svg>`;
}

// --- BASIC FAMILY ---
function circleMask({ cx = 50, cy = 50, r = 30 }: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='${cx}' cy='${cy}' r='${r}' fill='white'/></svg>`;
}

function ovalMask({ cx = 50, cy = 50, rx = 32, ry = 20 }: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='white'/></svg>`;
}

function diamondMask({ cx = 50, cy = 50, w = 40, h = 40 }: MaskParams = {}) {
  const points = `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='${points}' fill='white'/></svg>`;
}

function hexagonMask() {
  // Hexagon that fills the 100x100 box
  const points = [
    '100,50',
    '75,93.301',
    '25,93.301',
    '0,50',
    '25,6.699',
    '75,6.699'
  ].join(' ');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='${points}' fill='white'/></svg>`;
}

function semiCircleMask({ orientation = 'up' }: MaskParams = {}) {
  // orientation: 'up', 'down', 'left', 'right'
  let d = '';
  if (orientation === 'up') {
    // Flat edge at bottom, arc at top, fills bounding box
    d = 'M0,100 A50,50 0 0,1 100,100 L100,100 L0,100 Z';
  } else if (orientation === 'down') {
    // Flat edge at top, arc at bottom
    d = 'M0,0 A50,50 0 0,0 100,0 L100,0 L0,0 Z';
  } else if (orientation === 'left') {
    // Flat edge at right, arc at left
    d = 'M100,0 A50,50 0 0,1 100,100 L100,100 L100,0 Z';
  } else if (orientation === 'right') {
    // Flat edge at left, arc at right
    d = 'M0,0 A50,50 0 0,0 0,100 L0,100 L0,0 Z';
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='${d}' fill='white'/></svg>`;
}

function triangleMask({ orientation = 'up' }: MaskParams = {}) {
  let points = '';
  if (orientation === 'up') {
    points = '50,0 100,100 0,100';
  } else if (orientation === 'down') {
    points = '50,100 100,0 0,0';
  } else if (orientation === 'left') {
    points = '0,50 100,0 100,100';
  } else if (orientation === 'right') {
    points = '100,50 0,0 0,100';
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='${points}' fill='white'/></svg>`;
}

function beamMask({ widthTop = 80, widthBottom = 40, height = 80, angle = 0, offsetX = 50, offsetY = 60 }: MaskParams = {}) {
  // Quadrilateral beam/path, can be a parallelogram, trapezoid, or wedge
  // Centered by default, angle in degrees
  const rad = (angle * Math.PI) / 180;
  // Top left and right
  const tlx = offsetX - widthTop / 2 * Math.cos(rad);
  const tly = offsetY - height / 2;
  const trx = offsetX + widthTop / 2 * Math.cos(rad);
  const try_ = offsetY - height / 2;
  // Bottom left and right
  const blx = offsetX - widthBottom / 2 * Math.cos(rad);
  const bly = offsetY + height / 2;
  const brx = offsetX + widthBottom / 2 * Math.cos(rad);
  const bry = offsetY + height / 2;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <polygon points='
      ${tlx},${tly}
      ${trx},${try_}
      ${brx},${bry}
      ${blx},${bly}
    ' fill='white'/>
  </svg>`;
}

function donutMask() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path
        fill="white"
        fill-rule="evenodd"
        d="
          M50,10
          A40,40 0 1,1 49.99,10
          Z
          M50,20
          A30,30 0 1,0 50.01,20
          Z
        "
      />
    </svg>
  `;
}

function arcMask() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path
        fill="white"
        fill-rule="evenodd"
        d="
          M10,60
          L10,50
          A40,40 0 0,1 90,50
          L90,60
          Z
          M80,60
          L80,50
          A30,30 0 0,0 20,50
          L20,60
          Z
        "
      />
    </svg>
  `;
}

const registry: Record<string, Record<string, MaskGenerator>> = {
  sliced: {
    sliceHorizontalWide: () => ({ kind: 'svg', getSvg: () => sliceHorizontalWide(), description: "A wide horizontal slice", tags: ["slice","horizontal","wide","legacy"] }),
    sliceHorizontalNarrow: () => ({ kind: 'svg', getSvg: () => sliceHorizontalNarrow(), description: "A narrow horizontal slice", tags: ["slice","horizontal","narrow","legacy"] }),
    slice3xHorizontal: () => ({ kind: 'svg', getSvg: () => slice3xHorizontal(), description: "Three evenly spaced horizontal slices", tags: ["slice","horizontal","triplet","legacy"] }),
    sliceVerticalWide: () => ({ kind: 'svg', getSvg: () => sliceVerticalWide(), description: "A wide vertical slice", tags: ["slice","vertical","wide","legacy"] }),
    sliceVerticalNarrow: () => ({ kind: 'svg', getSvg: () => sliceVerticalNarrow(), description: "A narrow vertical slice", tags: ["slice","vertical","narrow","legacy"] }),
    slice4xMixed: () => ({ kind: 'svg', getSvg: () => slice4xMixed(), description: "Four mixed horizontal & vertical slices", tags: ["slice","mixed","legacy"] }),
    sliceAngled: () => ({ kind: 'svg', getSvg: () => sliceAngled(), description: "A single diagonal/angled slice", tags: ["slice","angled","diagonal","legacy"] }),
  },
  architectural: {
    archClassical: () => ({ kind: 'svg', getSvg: () => archClassical(), description: "A classical Roman-style arch", tags: ["arch","classical","architecture"] }),
    archFlat: () => ({ kind: 'svg', getSvg: () => archFlat(), description: "A flat-topped arch", tags: ["arch","flat","architecture"] }),
    triptychArch: () => ({ kind: 'svg', getSvg: () => triptychArch(), description: "Three small arches side by side", tags: ["arch","triptych","architecture"] }),
    windowRect: () => ({ kind: 'svg', getSvg: () => windowRect(), description: "A single rectangular window", tags: ["window","rectangular","architecture"] }),
    windowGrid: () => ({ kind: 'svg', getSvg: () => windowGrid(), description: "A grid of small rectangular windows", tags: ["window","grid","architecture"] }),
    columnPair: () => ({ kind: 'svg', getSvg: () => columnPair(), description: "Two parallel columns", tags: ["column","pair","architecture"] }),
    columnSingle: () => ({ kind: 'svg', getSvg: () => columnSingle(), description: "A single column", tags: ["column","architecture"] }),
    columnTriplet: () => ({ kind: 'svg', getSvg: () => columnTriplet(), description: "Three columns in a row", tags: ["column","triplet","architecture"] }),
    facadeGrid: () => ({ kind: 'svg', getSvg: () => facadeGrid(), description: "A building facade grid (columns & windows)", tags: ["facade","grid","architecture"] }),
    houseGable: () => ({ kind: 'svg', getSvg: () => houseGable(), description: "A simple house with gable roof", tags: ["house","gable","architecture"] }),
  },
  abstract: {
    blobIrregular: () => ({ kind: 'svg', getSvg: () => blobIrregular(), description: "An organic, irregular blob shape", tags: ["blob","organic","abstract"] }),
    blobCrescent: () => ({ kind: 'svg', getSvg: () => blobCrescent(), description: "A crescent-shaped organic form", tags: ["crescent","moon","blob","abstract"] }),
    polygonSoft: () => ({ kind: 'svg', getSvg: () => polygonSoft(), description: "A soft-edged polygon", tags: ["polygon","soft","organic","abstract"] }),
    cloudLike: () => ({ kind: 'svg', getSvg: () => cloudLike(), description: "A cluster of overlapping ellipses (cloud-like)", tags: ["cloud","cluster","organic","abstract"] }),
    archBlob: () => ({ kind: 'svg', getSvg: () => archBlob(), description: "An arch-inspired blob form", tags: ["arch","blob","organic","abstract"] }),
    abstractRotated: () => abstractRotated(),
  },
  altar: {
    nicheArch: () => ({ kind: 'svg', getSvg: () => nicheArch(), description: "An arch-shaped niche (mini-shrine)", tags: ["niche","arch","altar"] }),
    nicheCluster: () => ({ kind: 'svg', getSvg: () => nicheCluster(), description: "A cluster of small niches", tags: ["niche","cluster","altar"] }),
    circleInset: () => ({ kind: 'svg', getSvg: () => circleInset(), description: "A centered circle inset", tags: ["circle","inset","altar"] }),
    nicheStack: () => ({ kind: 'svg', getSvg: () => nicheStack(), description: "Stacked niche forms", tags: ["niche","stack","altar"] }),
    circleAboveArch: () => ({ kind: 'svg', getSvg: () => circleAboveArch(), description: "A circle above an arch", tags: ["circle","arch","altar"] }),
    nicheOffset: () => ({ kind: 'svg', getSvg: () => nicheOffset(), description: "Offset smaller niche in larger niche", tags: ["niche","offset","altar"] }),
    gableAltar: () => ({ kind: 'svg', getSvg: () => gableAltar(), description: "A gabled house-shrine silhouette", tags: ["gable","altar","architecture"] }),
  },
  basic: {
    circleMask: () => ({ kind: 'svg', getSvg: () => circleMask(), description: "A perfect circular mask for round crops", tags: ["circle","round","geometry","basic"] }),
    ovalMask: () => ({ kind: 'svg', getSvg: () => ovalMask(), description: "An oval (ellipse) mask for soft framing", tags: ["oval","ellipse","geometry","basic"] }),
    diamondMask: () => ({ kind: 'svg', getSvg: () => diamondMask(), description: "A diamond (rotated square) mask", tags: ["diamond","rhombus","geometry","basic"] }),
    hexagonMask: () => ({ kind: 'svg', getSvg: () => hexagonMask(), description: "A regular hexagon mask", tags: ["hexagon","geometry","basic"] }),
    semiCircleMask: () => ({ kind: 'svg', getSvg: () => semiCircleMask(), description: "A half-circle mask", tags: ["semi-circle","half-circle","arc","geometry","basic"] }),
    triangleMask: () => ({ kind: 'svg', getSvg: () => triangleMask(), description: "A triangular mask", tags: ["triangle","geometry","basic"] }),
    beamMask: () => ({ kind: 'svg', getSvg: () => beamMask(), description: "A trapezoidal beam shape", tags: ["beam","trapezoid","geometry","basic"] }),
    donutMask: () => ({ kind: 'svg', getSvg: () => donutMask(), description: "A ring (donut) mask with a hollow center", tags: ["donut","ring","circle","geometry","basic"] }),
    arcMask: () => ({ kind: 'svg', getSvg: () => arcMask(), description: "A half-donut (arc) mask with a flat bottom", tags: ["arc","half-donut","ring","geometry","basic"] }),
  },
  narrative: {
    panelRectWide: () => ({ kind: 'svg', getSvg: () => panelRectWide(), description: "A wide rectangular narrative panel", tags: ["panel","wide","rectangle","narrative"] }),
    panelRectTall: () => ({ kind: 'svg', getSvg: () => panelRectTall(), description: "A tall rectangular narrative panel", tags: ["panel","tall","rectangle","narrative"] }),
    panelSquare: () => ({ kind: 'svg', getSvg: () => panelSquare(), description: "A square narrative panel", tags: ["panel","square","narrative"] }),
    panelOverlap: () => ({ kind: 'svg', getSvg: () => panelOverlap(), description: "Two overlapping narrative panels", tags: ["panel","overlap","narrative"] }),
    panelLShape: () => ({ kind: 'svg', getSvg: () => panelLShape(), description: "An L-shaped panel layout", tags: ["panel","L-shape","narrative"] }),
    panelGutter: () => ({ kind: 'svg', getSvg: () => panelGutter(), description: "A panel with framing gutter", tags: ["panel","gutter","frame","narrative"] }),
  },
};

// --- Mask Metadata ---
export type MaskFamily = keyof typeof registry;
export const maskMetadata: Record<string, { description: string; tags: string[] }> = {};

export const maskRegistry = registry;

export function registerMask(
  key: string,
  svg: string,
  family: MaskFamily,
  metadata: { description: string; tags: string[] }
) {
  // 1) Add to the registry
  if (!maskRegistry[family]) maskRegistry[family] = {};
  maskRegistry[family][key] = () => ({ kind: 'svg', getSvg: () => svg });

  // 2) Add or overwrite its metadata
  maskMetadata[key] = metadata;
}

export function getMaskDescriptor(
  nameOrFamily: string,
  name?: string
): MaskDescriptor | undefined {
  // If only one parameter is provided, treat it as a full mask name
  if (!name) {
    // Try to find the mask in any family
    for (const family of Object.keys(registry)) {
      if (registry[family][nameOrFamily]) {
        return registry[family][nameOrFamily]();
      }
    }
    return undefined;
  }
  
  // If two parameters are provided, treat them as family and name
  if (!registry[nameOrFamily] || !registry[nameOrFamily][name]) {
    return undefined;
  }
  return registry[nameOrFamily][name]();
}

export default registry; 