// Template definitions for the collage system

// Background colors - refined palette that works well with multiply blend mode
const backgroundColors = [
    '#F6E6E4', // Soft Pink
    '#E8F3F1', // Mint White
    '#F0F5FA', // Cool White
    '#F5F5F0', // Warm White
    '#F2EBE5', // Cream
    '#E6E9F0', // Lavender White
    '#F4F1F7', // Lilac White
    '#E5EEF5', // Sky White
    '#F5EFE7', // Peach White
    '#EFF5EC'  // Sage White
];

function getRandomBackgroundColor() {
    return backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
}

// New tiling templates for different pattern types
const squareGridTemplate = {
    key: 'squareGridTiling',
    name: 'Square Grid Tiling',
    description: 'A grid of square tiles with images',
    defaultBG: '#F0F5FA',
    placements: Array.from({ length: 16 }, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return {
            maskName: 'basic/squareMask',
            x: 0.125 + col * 0.25,
            y: 0.125 + row * 0.25,
            width: 0.22,
            height: 0.22,
            rotation: 0
        };
    })
};

const triangleGridTemplate = {
    key: 'triangleGridTiling',
    name: 'Triangle Grid Tiling',
    description: 'A grid of triangular tiles with images',
    defaultBG: '#F6E6E4',
    placements: [
        // Row 1
        { maskName: 'basic/triangleMask', x: 0.125, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.375, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.625, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.875, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        // Row 1 inverted
        { maskName: 'basic/triangleMask', x: 0.125, y: 0.125, width: 0.25, height: 0.25, rotation: 180 },
        { maskName: 'basic/triangleMask', x: 0.375, y: 0.125, width: 0.25, height: 0.25, rotation: 180 },
        { maskName: 'basic/triangleMask', x: 0.625, y: 0.125, width: 0.25, height: 0.25, rotation: 180 },
        { maskName: 'basic/triangleMask', x: 0.875, y: 0.125, width: 0.25, height: 0.25, rotation: 180 },
        // Row 2
        { maskName: 'basic/triangleMask', x: 0.125, y: 0.375, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.375, y: 0.375, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.625, y: 0.375, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/triangleMask', x: 0.875, y: 0.375, width: 0.25, height: 0.25, rotation: 0 }
    ]
};

const hexagonGridTemplate = {
    key: 'hexagonGridTiling',
    name: 'Hexagon Grid Tiling',
    description: 'A honeycomb pattern of hexagonal tiles',
    defaultBG: '#F5F5F0',
    placements: [
        // Center row
        { maskName: 'basic/hexagonMask', x: 0.25, y: 0.5, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.5, y: 0.5, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.75, y: 0.5, width: 0.2, height: 0.2, rotation: 0 },
        // Upper row (offset)
        { maskName: 'basic/hexagonMask', x: 0.125, y: 0.3, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.375, y: 0.3, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.625, y: 0.3, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.875, y: 0.3, width: 0.2, height: 0.2, rotation: 0 },
        // Lower row (offset)
        { maskName: 'basic/hexagonMask', x: 0.125, y: 0.7, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.375, y: 0.7, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.625, y: 0.7, width: 0.2, height: 0.2, rotation: 0 },
        { maskName: 'basic/hexagonMask', x: 0.875, y: 0.7, width: 0.2, height: 0.2, rotation: 0 }
    ]
};

const modularGridTemplate = {
    key: 'modularGridTiling',
    name: 'Modular Grid Tiling',
    description: 'A grid with varying cell sizes based on golden ratio',
    defaultBG: '#E8F3F1',
    placements: [
        // Large cells
        { maskName: 'basic/squareMask', x: 0.25, y: 0.25, width: 0.5, height: 0.5, rotation: 0 },
        // Medium cells
        { maskName: 'basic/squareMask', x: 0.125, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.75, y: 0.125, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.125, y: 0.625, width: 0.25, height: 0.25, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.75, y: 0.625, width: 0.25, height: 0.25, rotation: 0 },
        // Small cells
        { maskName: 'basic/squareMask', x: 0.875, y: 0.375, width: 0.125, height: 0.125, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.875, y: 0.5, width: 0.125, height: 0.125, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.375, y: 0.875, width: 0.125, height: 0.125, rotation: 0 },
        { maskName: 'basic/squareMask', x: 0.5, y: 0.875, width: 0.125, height: 0.125, rotation: 0 },
    ]
};

export const templates = [
    // Original templates
    {
        key: 'archesRow',
        name: 'Row of Three Arches',
        placements: [
            {
                maskName: 'architectural/archClassical',
                x: 0.2,
                y: 0.45,
                width: 0.25,
                height: 0.65,
                rotation: 0
            },
            {
                maskName: 'architectural/archClassical',
                x: 0.5,
                y: 0.45,
                width: 0.25,
                height: 0.65,
                rotation: 0
            },
            {
                maskName: 'architectural/archClassical',
                x: 0.8,
                y: 0.45,
                width: 0.25,
                height: 0.65,
                rotation: 0
            }
        ],
        defaultBG: '#F0F5FA' // Cool white for architectural elements
    },
    {
        key: 'windowsGrid',
        name: 'Grid of Windows',
        placements: [
            {
                maskName: 'architectural/windowRect',
                x: 0.25,
                y: 0.25,
                width: 0.22,
                height: 0.22,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.25,
                width: 0.22,
                height: 0.22,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.75,
                y: 0.25,
                width: 0.22,
                height: 0.22,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.25,
                y: 0.52,
                width: 0.22,
                height: 0.22,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.52,
                width: 0.22,
                height: 0.22,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.75,
                y: 0.52,
                width: 0.22,
                height: 0.22,
                rotation: 0
            }
        ],
        defaultBG: '#E5EEF5' // Sky white for windows
    },
    {
        key: 'slicedLegacy',
        name: 'Sliced Legacy',
        placements: [
            {
                maskName: 'sliced/sliceHorizontalWide',
                x: 0.1,
                y: 0.15,
                width: 0.8,
                height: 0.12,
                rotation: 0
            },
            {
                maskName: 'sliced/sliceHorizontalWide',
                x: 0.1,
                y: 0.32,
                width: 0.8,
                height: 0.12,
                rotation: 0
            },
            {
                maskName: 'sliced/sliceHorizontalWide',
                x: 0.1,
                y: 0.49,
                width: 0.8,
                height: 0.12,
                rotation: 0
            },
            {
                maskName: 'sliced/sliceHorizontalWide',
                x: 0.1,
                y: 0.66,
                width: 0.8,
                height: 0.12,
                rotation: 0
            },
            {
                maskName: 'sliced/sliceHorizontalWide',
                x: 0.1,
                y: 0.83,
                width: 0.8,
                height: 0.12,
                rotation: 0
            }
        ],
        defaultBG: '#F5F5F0' // Warm white for sliced compositions
    },
    {
        key: 'altarComposition',
        name: 'Altar Composition',
        placements: [
            {
                maskName: 'altar/gableAltar',
                x: 0.5,
                y: 0.42,
                width: 0.45,
                height: 0.65,
                rotation: 0
            },
            {
                maskName: 'altar/nicheArch',
                x: 0.22,
                y: 0.48,
                width: 0.22,
                height: 0.45,
                rotation: 0
            },
            {
                maskName: 'altar/nicheArch',
                x: 0.78,
                y: 0.48,
                width: 0.22,
                height: 0.45,
                rotation: 0
            },
            {
                maskName: 'altar/circleInset',
                x: 0.5,
                y: 0.22,
                width: 0.18,
                height: 0.18,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.82,
                width: 0.45,
                height: 0.16,
                rotation: 0
            }
        ],
        defaultBG: '#F2EBE5' // Cream for altar compositions
    },
    {
        key: "fragmentedGrid",
        name: "Fragmented Grid",
        placements: [
            // Top row fragments
            {
                maskName: "architectural/windowRect",
                x: 0.2,
                y: 0.2,
                width: 0.15,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.4,
                y: 0.15,
                width: 0.12,
                height: 0.18,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.65,
                y: 0.25,
                width: 0.15,
                height: 0.12,
                rotation: 0
            },
            // Middle row fragments
            {
                maskName: "architectural/windowRect",
                x: 0.15,
                y: 0.45,
                width: 0.18,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.45,
                y: 0.4,
                width: 0.15,
                height: 0.2,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.7,
                y: 0.5,
                width: 0.12,
                height: 0.15,
                rotation: 0
            },
            // Bottom row fragments
            {
                maskName: "architectural/windowRect",
                x: 0.25,
                y: 0.7,
                width: 0.15,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.5,
                y: 0.75,
                width: 0.2,
                height: 0.12,
                rotation: 0
            }
        ],
        defaultBG: "#f5f5f5"
    },
    {
        key: "floatingForms",
        name: "Floating Forms",
        placements: [
            // Larger central arch
            {
                maskName: "architectural/archClassical",
                x: 0.4,
                y: 0.3,
                width: 0.3,
                height: 0.4,
                rotation: 0
            },
            // Smaller geometric elements
            {
                maskName: "altar/circleInset",
                x: 0.2,
                y: 0.2,
                width: 0.15,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "altar/circleInset",
                x: 0.7,
                y: 0.6,
                width: 0.12,
                height: 0.12,
                rotation: 0
            },
            {
                maskName: "architectural/windowRect",
                x: 0.15,
                y: 0.65,
                width: 0.2,
                height: 0.15,
                rotation: 45
            },
            {
                maskName: "architectural/windowRect",
                x: 0.75,
                y: 0.25,
                width: 0.15,
                height: 0.2,
                rotation: -30
            }
        ],
        defaultBG: "#e6e6fa"
    },
    {
        key: "layeredAbstract",
        name: "Layered Abstract",
        placements: [
            // Base layer - large shapes
            {
                maskName: "altar/gableAltar",
                x: 0.3,
                y: 0.2,
                width: 0.4,
                height: 0.5,
                rotation: 0
            },
            // Middle layer - overlapping elements
            {
                maskName: "architectural/archClassical",
                x: 0.2,
                y: 0.4,
                width: 0.25,
                height: 0.35,
                rotation: 0
            },
            {
                maskName: "architectural/archClassical",
                x: 0.6,
                y: 0.35,
                width: 0.25,
                height: 0.4,
                rotation: 0
            },
            // Top layer - small accent shapes
            {
                maskName: "altar/circleInset",
                x: 0.45,
                y: 0.3,
                width: 0.15,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "altar/circleInset",
                x: 0.35,
                y: 0.6,
                width: 0.12,
                height: 0.12,
                rotation: 0
            }
        ],
        defaultBG: "#f0f8ff"
    },
    {
        key: 'scrambledMosaic',
        name: 'Scrambled Mosaic',
        defaultBG: '#FFFFFF',
        placements: [
            { maskName: 'architectural/windowRect', x: 0.167, y: 0.125, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'architectural/windowRect', x: 0.333, y: 0.125, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'basic/diamondMask',       x: 0.500, y: 0.125, width: 0.167, height: 0.25, rotation: 15 },
            { maskName: 'architectural/windowRect', x: 0.667, y: 0.125, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'basic/circleMask',        x: 0.833, y: 0.125, width: 0.167, height: 0.25, rotation: 0 },

            { maskName: 'architectural/windowRect', x: 0.167, y: 0.375, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'basic/hexagonMask',       x: 0.333, y: 0.375, width: 0.167, height: 0.25, rotation: 30 },
            { maskName: 'architectural/windowRect', x: 0.500, y: 0.375, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'basic/triangleMask',      x: 0.667, y: 0.375, width: 0.167, height: 0.25, rotation: -15 },
            // blank at 0.833,0.375

            { maskName: 'basic/circleMask',        x: 0.167, y: 0.625, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'architectural/windowRect', x: 0.333, y: 0.625, width: 0.167, height: 0.25, rotation: 0 },
            { maskName: 'basic/diamondMask',       x: 0.500, y: 0.625, width: 0.167, height: 0.25, rotation: 20 },
            // blank at 0.667,0.625
            { maskName: 'architectural/windowRect', x: 0.833, y: 0.625, width: 0.167, height: 0.25, rotation: 0 },

            { maskName: 'architectural/windowRect', x: 0.167, y: 0.875, width: 0.167, height: 0.25, rotation: 0 },
            // blank at 0.333,0.875
            { maskName: 'basic/hexagonMask',       x: 0.500, y: 0.875, width: 0.167, height: 0.25, rotation: 40 },
            { maskName: 'basic/triangleMask',      x: 0.667, y: 0.875, width: 0.167, height: 0.25, rotation: 10 },
            { maskName: 'architectural/windowRect', x: 0.833, y: 0.875, width: 0.167, height: 0.25, rotation: 0 }
        ]
    },
    {
        key: 'pairedCropAbstraction',
        name: 'Paired Crop Abstraction',
        defaultBG: '#F0F5FA',
        placements: [
            { maskName: 'abstract/blobIrregular', x: 0.40, y: 0.45, width: 0.50, height: 0.50, rotation: 0 },
            { maskName: 'abstract/archBlob',      x: 0.60, y: 0.55, width: 0.25, height: 0.25, rotation: 12 },
            { maskName: 'abstract/polygonSoft',   x: 0.35, y: 0.30, width: 0.12, height: 0.12, rotation: 8 }
        ]
    },
    {
        key: 'floatingFormsTemplate',
        name: 'Floating Forms Template',
        defaultBG: '#F7F7F7',
        placements: [
            { maskName: 'abstract/blobIrregular', x: 0.35, y: 0.40, width: 0.35, height: 0.35, rotation: 45 },
            { maskName: 'abstract/cloudLike',     x: 0.55, y: 0.50, width: 0.20, height: 0.20, rotation: 180 },
            { maskName: 'abstract/archBlob',      x: 0.25, y: 0.60, width: 0.20, height: 0.20, rotation: 270 },
            { maskName: 'abstract/polygonSoft',   x: 0.70, y: 0.20, width: 0.10, height: 0.10, rotation: 90 },
            { maskName: 'basic/circleMask',       x: 0.80, y: 0.30, width: 0.10, height: 0.10, rotation: 135 }
        ]
    },
    
    // New tiling templates
    squareGridTemplate,
    triangleGridTemplate,
    hexagonGridTemplate,
    modularGridTemplate
];
