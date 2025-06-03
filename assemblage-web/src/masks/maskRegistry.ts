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
  const y = 46 + (params.offset ?? 0);
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
  const x = 46 + (params.offset ?? 0);
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
function archClassical({ width = 80, height = 100, legHeight = 75 }: MaskParams = {}) {
  // CRITICAL FIX: Create a proper classical arch that fills the entire 100x100 viewBox
  // Classical arches should have a width-to-height ratio of approximately 0.8 (4:5 ratio)
  
  // FIXED: Use the full viewBox dimensions and create a proper arch shape
  // The arch should extend to the edges to prevent image scaling issues
  
  console.log(`[archClassical] Creating arch with proper proportions in 100x100 viewBox`);
  
  // Create an arch that spans the full width and height of the viewBox
  // This ensures the mask uses the complete area available
  const archTop = 10;        // Start arch near top of viewBox
  const archBottom = 100;    // Extend to bottom of viewBox
  const archLeft = 5;        // Start near left edge
  const archRight = 95;      // End near right edge
  const archHeight = 60;     // Height of the curved portion
  const legTop = archTop + archHeight; // Where the legs start
  
  // FIXED: Create a proper arch path that fills the viewBox completely
  // The arch spans nearly the full width and height to maximize image coverage
  const svgResult = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='
      M${archLeft},${archBottom}
      L${archLeft},${legTop}
      A45,${archHeight} 0 0,1 ${archRight},${legTop}
      L${archRight},${archBottom}
      Z
    ' fill='white'/>
  </svg>`;
  
  console.log(`[archClassical] Generated FULL arch: spans ${archLeft}-${archRight} horizontally, ${archTop}-${archBottom} vertically`);
  console.log(`[archClassical] Arch covers ${((archRight - archLeft) * (archBottom - archTop)) / 10000 * 100}% of viewBox area`);
  
  return svgResult;
}

function archFlat({}: MaskParams = {}) {
  // Segmental (flatter) arch: edge-to-edge width, larger radius for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='M0,100 A50,30 0 0,1 100,100 L100,100 L0,100 Z' fill='white'/>
  </svg>`;
}

function triptychArch({ archWidth = 28, archHeight = 40, spacing = 8 }: MaskParams = {}) {
  // Three arches side by side, larger for better visibility
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
  // Larger window rectangle for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='10' width='80' height='80' fill='white'/></svg>`;
}

function windowGrid({}: MaskParams = {}) {
  // 3x3 grid with larger windows for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='5' y='5' width='25' height='25' fill='white'/>
    <rect x='37.5' y='5' width='25' height='25' fill='white'/>
    <rect x='70' y='5' width='25' height='25' fill='white'/>
    <rect x='5' y='37.5' width='25' height='25' fill='white'/>
    <rect x='37.5' y='37.5' width='25' height='25' fill='white'/>
    <rect x='70' y='37.5' width='25' height='25' fill='white'/>
    <rect x='5' y='70' width='25' height='25' fill='white'/>
    <rect x='37.5' y='70' width='25' height='25' fill='white'/>
    <rect x='70' y='70' width='25' height='25' fill='white'/>
  </svg>`;
}

function columnPair({}: MaskParams = {}) {
  // Two columns using more of the available width
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='15' y='0' width='20' height='100' fill='white'/><rect x='65' y='0' width='20' height='100' fill='white'/></svg>`;
}

function columnSingle({}: MaskParams = {}) {
  // Single column, larger width for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='35' y='0' width='30' height='100' fill='white'/></svg>`;
}

function columnTriplet({}: MaskParams = {}) {
  // Three columns using full height and more width
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='5' y='0' width='20' height='100' fill='white'/><rect x='40' y='0' width='20' height='100' fill='white'/><rect x='75' y='0' width='20' height='100' fill='white'/></svg>`;
}

function facadeGrid({}: MaskParams = {}) {
  // Composite: 2 columns + 4 windows in a grid - larger for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='10' y='0' width='15' height='100' fill='white'/>
    <rect x='75' y='0' width='15' height='100' fill='white'/>
    <rect x='30' y='15' width='18' height='25' fill='white'/>
    <rect x='52' y='15' width='18' height='25' fill='white'/>
    <rect x='30' y='60' width='18' height='25' fill='white'/>
    <rect x='52' y='60' width='18' height='25' fill='white'/>
  </svg>`;
}

// Edge-to-edge houseGable
function houseGable() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='0' y='40' width='100' height='60' fill='white'/>
    <polygon points='0,40 100,40 50,0' fill='white'/>
  </svg>`;
}

// --- ABSTRACT FAMILY ---
function blobIrregular({ rotation = 0 }: MaskParams = {}) {
  // Larger irregular blob for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><path d='M15,70 Q5,35 25,20 Q50,0 75,25 Q95,50 80,75 Q50,95 15,70 Z' fill='white'/></g></svg>`;
}

function blobCrescent({}: MaskParams = {}) {
  // Two overlapping circles - larger for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='white'/><circle cx='70' cy='50' r='35' fill='gray'/></svg>`;
}

function polygonSoft({ rotation = 0 }: MaskParams = {}) {
  // Larger soft polygon for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='10,70 25,10 85,20 90,85 20,95' fill='white'/></g></svg>`;
}

function polygonSoftWide({ rotation = 0 }: MaskParams = {}) {
  // Wide irregular polygon - good for horizontal emphasis
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='5,65 10,25 95,30 90,75 15,80' fill='white'/></g></svg>`;
}

function polygonSoftTall({ rotation = 0 }: MaskParams = {}) {
  // Tall irregular polygon - good for vertical emphasis
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='25,5 75,10 80,95 20,90 15,15' fill='white'/></g></svg>`;
}

function polygonSoftAsymmetric({ rotation = 0 }: MaskParams = {}) {
  // Asymmetric polygon with more dramatic angles
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='5,85 40,5 92,25 88,90 30,95' fill='white'/></g></svg>`;
}

function polygonSoftCompact({ rotation = 0 }: MaskParams = {}) {
  // Compact polygon - good for small elements
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(${rotation},50,50)'><polygon points='20,60 30,20 70,25 75,70 25,75' fill='white'/></g></svg>`;
}

function cloudLike({ count = 3, minR = 18, maxR = 35, seed = 1 }: MaskParams = {}) {
  // More random cloud: 3-5 overlapping blobs, larger for better visibility
  function seededRandom(s: number) {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }
  const blobs: string[] = [];
  const cx = 50, cy = 50;
  const n = count + Math.floor((seededRandom(seed) * 3)); // 3-5 blobs
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (seededRandom(seed + i) - 0.5) * 0.5;
    const r = minR + seededRandom(seed * (i + 1)) * (maxR - minR);
    const x = cx + Math.cos(angle) * 25 + (seededRandom(seed * (i + 2)) - 0.5) * 15;
    const y = cy + Math.sin(angle) * 15 + (seededRandom(seed * (i + 3)) - 0.5) * 12;
    blobs.push(`<ellipse cx='${x}' cy='${y}' rx='${r}' ry='${r * (0.6 + seededRandom(seed * (i + 4)) * 0.8)}' fill='white'/>`);
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${blobs.join('')}</svg>`;
}

function archBlob({ width = 80, height = 40, baseHeight = 20, archiness = 0.5 }: MaskParams = {}) {
  // Organic arch/bridge: larger for better visibility
  // archiness: 0 (flat) to 1 (pointy)
  // Center arch horizontally in 100x100 viewBox
  const left = 50 - width / 2;
  const right = 50 + width / 2;
  const top = 100 - baseHeight - height;
  const baseY = 100 - baseHeight;
  const mid = 50;
  const archPeak = top - archiness * 15;
  // Use a smooth curve for the arch span, and a wavy base
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <path d='
      M${left},${baseY}
      L${left},${top + height}
      Q${mid},${archPeak} ${right},${top + height}
      L${right},${baseY}
      Q${mid},${baseY + 12} ${left},${baseY}
      Z
    ' fill='white'/>
  </svg>`;
}

function abstractRotated({ mask = 'blobIrregular', rotation }: MaskParams = {}): MaskDescriptor {
  // Randomly rotate any abstract mask by a multiple of 30°
  const masks = ['blobIrregular', 'blobCrescent', 'polygonSoft', 'archBlob'];
  const chosen = mask && masks.includes(mask) ? mask : masks[Math.floor(Math.random() * masks.length)];
  const angle = typeof rotation === 'number' ? rotation : Math.floor(Math.random() * 12) * 30;
  // Call the chosen mask function with rotation param
  if (chosen === 'blobCrescent' || chosen === 'archBlob') {
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
function nicheArch({ width = 50, height = 60, legHeight = 40 }: MaskParams = {}) {
  // Tall niche: vertical sides, rounded top - larger for better visibility
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

function nicheCluster({ width = 20, height = 35, legHeight = 25, spacing = 10 }: MaskParams = {}) {
  // Three tall niches side by side - larger for better visibility
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
  // Larger circle for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='35' fill='white'/></svg>`;
}

function nicheStack({ width = 60, height = 40, legHeight = 30, smallWidth = 18, smallHeight = 18, smallLeg = 12, spacing = 4 }: MaskParams = {}) {
  // Large arch + row of three small niches, larger for better visibility
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

function circleAboveArch({ width = 50, height = 60, legHeight = 40, circleY = 25, circleR = 20 }: MaskParams = {}) {
  // Circle above a tall niche arch - larger for better visibility
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

function nicheOffset({ offset = 15, width = 50, height = 60, legHeight = 40, smallWidth = 20, smallHeight = 30, smallLeg = 25 }: MaskParams = {}) {
  // Main arch and two small offset arches, larger for better visibility
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

// Edge-to-edge gableAltar
function gableAltar() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='0' y='50' width='100' height='50' fill='white'/>
    <polygon points='0,50 100,50 50,0' fill='white'/>
  </svg>`;
}

// --- NARRATIVE FAMILY ---
function panelRectWide({ align = 'center' }: MaskParams = {}) {
  // Larger wide panel for better visibility
  const y = align === 'top' ? 5 : align === 'bottom' ? 65 : 35;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='5' y='${y}' width='90' height='30' fill='white'/></svg>`;
}

function panelRectTall({ align = 'left' }: MaskParams = {}) {
  // Larger tall panel for better visibility
  const x = align === 'right' ? 65 : align === 'center' ? 35 : 5;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${x}' y='5' width='30' height='90' fill='white'/></svg>`;
}

function panelSquare({ align = 'center' }: MaskParams = {}) {
  // Larger square panel for better visibility
  const x = align === 'right' ? 30 : align === 'left' ? 5 : 15;
  const y = align === 'bottom' ? 30 : align === 'top' ? 5 : 15;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${x}' y='${y}' width='70' height='70' fill='white'/></svg>`;
}

function panelOverlap({ angle = 10 }: MaskParams = {}) {
  // Two overlapping panels - larger for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='5' y='20' width='70' height='50' fill='white'/><g transform='rotate(${angle},65,75)'><rect x='25' y='40' width='70' height='50' fill='white'/></g></svg>`;
}

function panelLShape({}: MaskParams = {}) {
  // L-shaped panel - larger for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='5' y='5' width='70' height='25' fill='white'/><rect x='5' y='30' width='25' height='65' fill='white'/></svg>`;
}

function panelGutter({ margin = 5 }: MaskParams = {}) {
  // Panel inset by margin - smaller default margin for better visibility
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='${margin}' y='${margin}' width='${100 - 2 * margin}' height='${100 - 2 * margin}' fill='white'/></svg>`;
}

// --- BASIC FAMILY ---
// Edge-to-edge circle
function circleMask() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='white'/></svg>`;
}
// Edge-to-edge oval (fills more of the box)
function ovalMask({ cx = 50, cy = 50, rx = 45, ry = 35 }: MaskParams = {}) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='white'/></svg>`;
}
// Edge-to-edge diamond
function diamondMask() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,0 100,50 50,100 0,50' fill='white'/></svg>`;
}

// Hexagon mask with tight bounding box: width = 100 (flat-to-flat), height = 86.6025 (point-to-point)
function hexagonMask() {
  // Height from point to point
  const height = 86.6025; // 2 * 50 * sin(60deg)
  // Points for a flat-topped hexagon, centered in the viewBox
  const points = [
    `0,${height / 2}`,
    `25,0`,
    `75,0`,
    `100,${height / 2}`,
    `75,${height}`,
    `25,${height}`
  ].join(' ');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${height}'><polygon points='${points}' fill='white'/></svg>`;
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

// Edge-to-edge beam (horizontal, fills box better)
function beamMask({ widthTop = 90, widthBottom = 60, height = 90, orientation = 'horizontal' }: MaskParams = {}) {
  // Beam shape with tight viewBox and orientation support - larger for better visibility
  // orientation: 'horizontal', 'vertical', 'horizontal-flipped', 'vertical-flipped'
  
  // Calculate the tight viewBox dimensions
  const maxWidth = Math.max(widthTop, widthBottom);
  const viewBoxWidth = maxWidth;
  const viewBoxHeight = height;
  
  // Calculate points based on orientation
  let points;
  if (orientation === 'horizontal') {
    // Horizontal beam (wider at top)
    points = `
      ${(maxWidth - widthTop) / 2},0
      ${(maxWidth + widthTop) / 2},0
      ${(maxWidth + widthBottom) / 2},${height}
      ${(maxWidth - widthBottom) / 2},${height}
    `;
  } else if (orientation === 'horizontal-flipped') {
    // Horizontal beam (wider at bottom)
    points = `
      ${(maxWidth - widthBottom) / 2},0
      ${(maxWidth + widthBottom) / 2},0
      ${(maxWidth + widthTop) / 2},${height}
      ${(maxWidth - widthTop) / 2},${height}
    `;
  } else if (orientation === 'vertical') {
    // Vertical beam (wider at right)
    points = `
      0,${(height - widthTop) / 2}
      0,${(height + widthTop) / 2}
      ${height},${(height + widthBottom) / 2}
      ${height},${(height - widthBottom) / 2}
    `;
  } else {
    // Vertical beam (wider at left)
    points = `
      0,${(height - widthBottom) / 2}
      0,${(height + widthBottom) / 2}
      ${height},${(height + widthTop) / 2}
      ${height},${(height - widthTop) / 2}
    `;
  }
  
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${viewBoxWidth} ${viewBoxHeight}'>
    <polygon points='${points}' fill='white'/>
  </svg>`;
}

// Edge-to-edge donut (outer circle fills box, inner circle larger for better visibility)
function donutMask() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path
        fill="white"
        fill-rule="evenodd"
        d="
          M50,5
          A45,45 0 1,1 49.99,5
          Z
          M50,25
          A25,25 0 1,0 50.01,25
          Z
        "
      />
    </svg>
  `;
}

// Edge-to-edge arc (larger for better visibility)
function arcMask() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path
        fill="white"
        fill-rule="evenodd"
        d="
          M5,70
          L5,40
          A47.5,47.5 0 0,1 95,40
          L95,70
          Z
          M85,70
          L85,40
          A35,35 0 0,0 15,40
          L15,70
          Z
        "
      />
    </svg>
  `;
}

function rectangleMask({}: MaskParams = {}) {
  // Edge-to-edge rectangle
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='0' y='0' width='100' height='100' fill='white'/></svg>`;
}

const registry: Record<string, Record<string, MaskGenerator>> = {
  sliced: {
    sliceHorizontalWide: () => ({ kind: 'svg', getSvg: () => sliceHorizontalWide() }),
    sliceHorizontalNarrow: () => ({ kind: 'svg', getSvg: () => sliceHorizontalNarrow() }),
    slice3xHorizontal: () => ({ kind: 'svg', getSvg: () => slice3xHorizontal() }),
    sliceVerticalWide: () => ({ kind: 'svg', getSvg: () => sliceVerticalWide() }),
    sliceVerticalNarrow: () => ({ kind: 'svg', getSvg: () => sliceVerticalNarrow() }),
    slice4xMixed: () => ({ kind: 'svg', getSvg: () => slice4xMixed() }),
    sliceAngled: () => ({ kind: 'svg', getSvg: () => sliceAngled() }),
  },
  architectural: {
    archClassical: (params?: MaskParams) => ({ kind: 'svg', getSvg: () => archClassical(params) }),
    archFlat: () => ({ kind: 'svg', getSvg: () => archFlat() }),
    triptychArch: () => ({ kind: 'svg', getSvg: () => triptychArch() }),
    windowRect: () => ({ kind: 'svg', getSvg: () => windowRect() }),
    windowGrid: () => ({ kind: 'svg', getSvg: () => windowGrid() }),
    columnPair: () => ({ kind: 'svg', getSvg: () => columnPair() }),
    columnSingle: () => ({ kind: 'svg', getSvg: () => columnSingle() }),
    columnTriplet: () => ({ kind: 'svg', getSvg: () => columnTriplet() }),
    facadeGrid: () => ({ kind: 'svg', getSvg: () => facadeGrid() }),
    houseGable: () => ({ kind: 'svg', getSvg: () => houseGable() }),
  },
  abstract: {
    blobIrregular: () => ({ kind: 'svg', getSvg: () => blobIrregular() }),
    blobCrescent: () => ({ kind: 'svg', getSvg: () => blobCrescent() }),
    polygonSoft: () => ({ kind: 'svg', getSvg: () => polygonSoft() }),
    polygonSoftWide: () => ({ kind: 'svg', getSvg: () => polygonSoftWide() }),
    polygonSoftTall: () => ({ kind: 'svg', getSvg: () => polygonSoftTall() }),
    polygonSoftAsymmetric: () => ({ kind: 'svg', getSvg: () => polygonSoftAsymmetric() }),
    polygonSoftCompact: () => ({ kind: 'svg', getSvg: () => polygonSoftCompact() }),
    cloudLike: () => ({ kind: 'svg', getSvg: () => cloudLike() }),
    archBlob: () => ({ kind: 'svg', getSvg: () => archBlob() }),
    abstractRotated: () => abstractRotated(),
  },
  altar: {
    nicheArch: () => ({ kind: 'svg', getSvg: () => nicheArch() }),
    nicheCluster: () => ({ kind: 'svg', getSvg: () => nicheCluster() }),
    circleInset: () => ({ kind: 'svg', getSvg: () => circleInset() }),
    nicheStack: () => ({ kind: 'svg', getSvg: () => nicheStack() }),
    circleAboveArch: () => ({ kind: 'svg', getSvg: () => circleAboveArch() }),
    nicheOffset: () => ({ kind: 'svg', getSvg: () => nicheOffset() }),
    gableAltar: () => ({ kind: 'svg', getSvg: () => gableAltar() }),
  },
  basic: {
    circleMask: () => ({ kind: 'svg', getSvg: () => circleMask() }),
    ovalMask: () => ({ kind: 'svg', getSvg: () => ovalMask() }),
    diamondMask: () => ({ kind: 'svg', getSvg: () => diamondMask() }),
    hexagonMask: () => ({ kind: 'svg', getSvg: () => hexagonMask() }),
    semiCircleMask: () => ({ kind: 'svg', getSvg: () => semiCircleMask() }),
    triangleMask: () => ({ kind: 'svg', getSvg: () => triangleMask() }),
    beamMask: () => ({ kind: 'svg', getSvg: () => beamMask() }),
    donutMask: () => ({ kind: 'svg', getSvg: () => donutMask() }),
    arcMask: () => ({ kind: 'svg', getSvg: () => arcMask() }),
    rectangleMask: () => ({ kind: 'svg', getSvg: () => rectangleMask() }),
  },
  narrative: {
    panelRectWide: () => ({ kind: 'svg', getSvg: () => panelRectWide() }),
    panelRectTall: () => ({ kind: 'svg', getSvg: () => panelRectTall() }),
    panelSquare: () => ({ kind: 'svg', getSvg: () => panelSquare() }),
    panelOverlap: () => ({ kind: 'svg', getSvg: () => panelOverlap() }),
    panelLShape: () => ({ kind: 'svg', getSvg: () => panelLShape() }),
    panelGutter: () => ({ kind: 'svg', getSvg: () => panelGutter() }),
  },
};

// --- Mask Metadata ---
export type MaskFamily = keyof typeof registry;
export const maskMetadata: Record<string, { description: string; tags: string[] }> = {
  rectangleMask: { description: 'Edge-to-edge rectangle mask', tags: ['rectangle', 'basic', 'edge-to-edge'] },
};

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