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

export const templates = [
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
        key: 'scrambled-mosaic',
        name: 'Scrambled Mosaic',
        defaultBG: '#FFFFFF',
        placements: [
            {
                maskName: 'architectural/windowRect',
                x: 0.167,
                y: 0.25,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.333,
                y: 0.25,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.25,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.7,
                y: 0.15,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.167,
                y: 0.5,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.4,
                y: 0.45,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.5,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.667,
                y: 0.5,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.2,
                y: 0.8,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.333,
                y: 0.75,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.5,
                y: 0.75,
                width: 0.167,
                height: 0.25,
                rotation: 0
            },
            {
                maskName: 'architectural/windowRect',
                x: 0.65,
                y: 0.85,
                width: 0.167,
                height: 0.25,
                rotation: 0
            }
        ]
    },
    {
        key: 'paired-crop-abstraction',
        name: 'Paired Crop Abstraction',
        defaultBG: '#F0F5FA',
        placements: [
            {
                maskName: 'abstract/blobIrregular',
                x: 0.4,
                y: 0.45,
                width: 0.5,
                height: 0.5,
                rotation: 0
            },
            {
                maskName: 'abstract/archBlob',
                x: 0.6,
                y: 0.55,
                width: 0.25,
                height: 0.25,
                rotation: 12
            },
            {
                maskName: 'abstract/polygonSoft',
                x: 0.35,
                y: 0.3,
                width: 0.12,
                height: 0.12,
                rotation: 8
            }
        ]
    },
    {
        key: 'floating-forms',
        name: 'Floating Forms',
        defaultBG: '#F7F7F7',
        placements: [
            {
                maskName: 'abstract/blobIrregular',
                x: 0.35,
                y: 0.4,
                width: 0.35,
                height: 0.35,
                rotation: 45
            },
            {
                maskName: 'abstract/cloudLike',
                x: 0.55,
                y: 0.5,
                width: 0.2,
                height: 0.2,
                rotation: 180
            },
            {
                maskName: 'abstract/archBlob',
                x: 0.25,
                y: 0.6,
                width: 0.2,
                height: 0.2,
                rotation: 270
            },
            {
                maskName: 'abstract/polygonSoft',
                x: 0.45,
                y: 0.25,
                width: 0.1,
                height: 0.1,
                rotation: 90
            },
            {
                maskName: 'abstract/circleInset',
                x: 0.7,
                y: 0.3,
                width: 0.1,
                height: 0.1,
                rotation: 135
            }
        ]
    }
]; 