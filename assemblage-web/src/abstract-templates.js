/**
 * Abstract template definitions for the Assemblage system
 * These templates are designed specifically to map to the types
 * of compositions seen in the abstract collage examples
 */

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

/**
 * Returns a random background color from the palette
 */
export function getRandomBackgroundColor() {
    return backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
}

/**
 * Abstract template definitions
 * Each template defines a different abstract composition style
 */
export const abstractTemplates = [
    {
        key: 'scrambledMosaic',
        name: 'Scrambled Mosaic',
        description: 'A grid of cells with various geometric shapes, like a fragmented mosaic with occasional blanks',
        defaultBG: '#FFFFFF',
        // Each placement has parameter ranges that define randomization boundaries
        placements: [
            { 
                maskName: 'basic/circleMask', 
                x: 0.167, 
                y: 0.125, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0,
                // Optional parameter ranges define min/max values for randomization
                parameterRanges: {
                    x: { min: 0.15, max: 0.18 },
                    y: { min: 0.10, max: 0.15 },
                    width: { min: 0.15, max: 0.18 },
                    height: { min: 0.22, max: 0.28 },
                    rotation: { min: -10, max: 10 }
                }
            },
            { 
                maskName: 'basic/diamondMask', 
                x: 0.333, 
                y: 0.125, 
                width: 0.167, 
                height: 0.25, 
                rotation: 15 
            },
            { 
                maskName: 'basic/hexagonMask', 
                x: 0.500, 
                y: 0.125, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/triangleMask', 
                x: 0.667, 
                y: 0.125, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/circleMask', 
                x: 0.833, 
                y: 0.125, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },

            { 
                maskName: 'basic/triangleMask', 
                x: 0.167, 
                y: 0.375, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/hexagonMask', 
                x: 0.333, 
                y: 0.375, 
                width: 0.167, 
                height: 0.25, 
                rotation: 30 
            },
            { 
                maskName: 'basic/circleMask', 
                x: 0.500, 
                y: 0.375, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/triangleMask', 
                x: 0.667, 
                y: 0.375, 
                width: 0.167, 
                height: 0.25, 
                rotation: -15 
            },
            // Blank at 0.833, 0.375

            { 
                maskName: 'basic/circleMask', 
                x: 0.167, 
                y: 0.625, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/diamondMask', 
                x: 0.333, 
                y: 0.625, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            { 
                maskName: 'basic/diamondMask', 
                x: 0.500, 
                y: 0.625, 
                width: 0.167, 
                height: 0.25, 
                rotation: 20 
            },
            // Blank at 0.667, 0.625
            { 
                maskName: 'basic/triangleMask', 
                x: 0.833, 
                y: 0.625, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },

            { 
                maskName: 'basic/hexagonMask', 
                x: 0.167, 
                y: 0.875, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            },
            // Blank at 0.333, 0.875
            { 
                maskName: 'basic/hexagonMask', 
                x: 0.500, 
                y: 0.875, 
                width: 0.167, 
                height: 0.25, 
                rotation: 40 
            },
            { 
                maskName: 'basic/triangleMask', 
                x: 0.667, 
                y: 0.875, 
                width: 0.167, 
                height: 0.25, 
                rotation: 10 
            },
            { 
                maskName: 'basic/circleMask', 
                x: 0.833, 
                y: 0.875, 
                width: 0.167, 
                height: 0.25, 
                rotation: 0 
            }
        ],
        // Global variance levels (0-1 scale)
        globalVariance: {
            position: 0.2, // How much to vary x/y positions
            size: 0.1,     // How much to vary width/height
            rotation: 0.3  // How much to vary rotation
        }
    },
    {
        key: 'pairedCropAbstraction',
        name: 'Paired Crop Abstraction',
        description: 'Overlapping organic shapes creating a fluid, abstract composition',
        defaultBG: '#F0F5FA',
        placements: [
            { 
                maskName: 'abstract/blobIrregular', 
                x: 0.40, 
                y: 0.45, 
                width: 0.50, 
                height: 0.50, 
                rotation: 0,
                parameterRanges: {
                    x: { min: 0.35, max: 0.45 },
                    y: { min: 0.40, max: 0.50 },
                    width: { min: 0.45, max: 0.55 },
                    height: { min: 0.45, max: 0.55 },
                    rotation: { min: -30, max: 30 }
                }
            },
            { 
                maskName: 'abstract/archBlob', 
                x: 0.60, 
                y: 0.55, 
                width: 0.25, 
                height: 0.25, 
                rotation: 12,
                parameterRanges: {
                    x: { min: 0.55, max: 0.65 },
                    y: { min: 0.50, max: 0.60 },
                    width: { min: 0.22, max: 0.28 },
                    height: { min: 0.22, max: 0.28 },
                    rotation: { min: 0, max: 25 }
                }
            },
            { 
                maskName: 'abstract/polygonSoft', 
                x: 0.35, 
                y: 0.30, 
                width: 0.12, 
                height: 0.12, 
                rotation: 8,
                parameterRanges: {
                    x: { min: 0.30, max: 0.40 },
                    y: { min: 0.25, max: 0.35 },
                    width: { min: 0.10, max: 0.15 },
                    height: { min: 0.10, max: 0.15 },
                    rotation: { min: -10, max: 25 }
                }
            }
        ],
        globalVariance: {
            position: 0.3,
            size: 0.2,
            rotation: 0.5
        }
    },
    {
        key: 'floatingForms',
        name: 'Floating Forms',
        description: 'Abstract shapes floating freely in space with varied rotations and positions',
        defaultBG: '#F7F7F7',
        placements: [
            { 
                maskName: 'abstract/blobIrregular', 
                x: 0.35, 
                y: 0.40, 
                width: 0.35, 
                height: 0.35, 
                rotation: 45 
            },
            { 
                maskName: 'abstract/cloudLike', 
                x: 0.55, 
                y: 0.50, 
                width: 0.20, 
                height: 0.20, 
                rotation: 180 
            },
            { 
                maskName: 'abstract/archBlob', 
                x: 0.25, 
                y: 0.60, 
                width: 0.20, 
                height: 0.20, 
                rotation: 270 
            },
            { 
                maskName: 'abstract/polygonSoft', 
                x: 0.70, 
                y: 0.20, 
                width: 0.10, 
                height: 0.10, 
                rotation: 90 
            },
            { 
                maskName: 'basic/circleMask', 
                x: 0.80, 
                y: 0.30, 
                width: 0.10, 
                height: 0.10, 
                rotation: 135 
            }
        ],
        globalVariance: {
            position: 0.4,
            size: 0.2,
            rotation: 0.6
        }
    },
    {
        key: 'slicedAbstraction',
        name: 'Sliced Abstraction',
        description: 'Horizontal slices with clean lines cutting across the image',
        defaultBG: '#F5F5F0',
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
        globalVariance: {
            position: 0.05, // Less variance for clean, straight slices
            size: 0.05,
            rotation: 0.1  // Allow for slight rotation
        }
    },
    {
        key: 'circularCutout',
        name: 'Circular Cutout',
        description: 'A single circular mask cutting through an image, reminiscent of the tree image example',
        defaultBG: '#FFFFFF',
        placements: [
            {
                maskName: 'basic/circleMask',
                x: 0.5,
                y: 0.5,
                width: 0.3,
                height: 0.3,
                rotation: 0,
                parameterRanges: {
                    x: { min: 0.4, max: 0.6 },
                    y: { min: 0.4, max: 0.6 },
                    width: { min: 0.25, max: 0.35 },
                    height: { min: 0.25, max: 0.35 }
                }
            }
        ],
        globalVariance: {
            position: 0.1,
            size: 0.1,
            rotation: 0
        }
    },
    {
        key: 'fragmentedGridArtistic',
        name: 'Fragmented Grid Artistic',
        description: 'A more artistic version of the fragmented grid with irregular spacing',
        defaultBG: "#f5f5f5",
        placements: [
            // Top row fragments
            {
                maskName: "basic/ovalMask",
                x: 0.2,
                y: 0.2,
                width: 0.15,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "basic/triangleMask",
                x: 0.4,
                y: 0.15,
                width: 0.12,
                height: 0.18,
                rotation: 0
            },
            {
                maskName: "basic/hexagonMask",
                x: 0.65,
                y: 0.25,
                width: 0.15,
                height: 0.12,
                rotation: 0
            },
            // Middle row fragments
            {
                maskName: "abstract/blobIrregular",
                x: 0.15,
                y: 0.45,
                width: 0.18,
                height: 0.15,
                rotation: 0
            },
            {
                maskName: "basic/diamondMask",
                x: 0.45,
                y: 0.4,
                width: 0.15,
                height: 0.2,
                rotation: 0
            },
            {
                maskName: "basic/triangleMask",
                x: 0.7,
                y: 0.5,
                width: 0.12,
                height: 0.15,
                rotation: 15
            },
            // Bottom row fragments
            {
                maskName: "abstract/polygonSoft",
                x: 0.25,
                y: 0.7,
                width: 0.15,
                height: 0.15,
                rotation: 30
            },
            {
                maskName: "basic/ovalMask",
                x: 0.5,
                y: 0.75,
                width: 0.2,
                height: 0.12,
                rotation: 0
            }
        ],
        globalVariance: {
            position: 0.15,
            size: 0.1,
            rotation: 0.2
        }
    }
];

// Export the abstract templates and add them to main templates
export default abstractTemplates;
