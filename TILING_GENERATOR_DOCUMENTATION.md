# Tiling Generator Documentation

## Overview

The improved Tiling Generator creates visually appealing collages by arranging images in tile-like patterns across the canvas. It supports various styles, layouts, and image repetition controls to create diverse collage effects.

## Key Features

### 1. Image Repetition Control

The generator offers precise control over image repetition with several options:

- **No Repetition**: Each image appears exactly once in the collage
- **Limited Repetition**: Each image can appear up to 3 times (configurable via `ABSOLUTE_MAX_REPEATS`)
- **Full Repetition**: Images can repeat as many times as needed
- **Smart Selection**: When repetition is allowed, the generator prioritizes less-used images

Example:
```javascript
// Parameters when generating a collage
const parameters = {
  allowImageRepetition: true  // or false to disallow repetition
};
```

### 2. Layout Modes

Two primary layout modes are supported:

- **Focal Mode**: Creates arrangements with fewer, larger images focused on key points
- **Field Mode**: Creates patterns with many smaller images distributed across the canvas

### 3. Scaling Variations

The generator supports different scaling approaches:

- **Dramatic Scaling**: Creates bold compositions with extreme size differences
- **Uniform Scaling**: Creates more balanced compositions with similar-sized elements

### 4. Tile Count Variation

- Automatically selects appropriate tile counts based on the chosen style
- Field mode: 40-120 tiles (configurable range)
- Focal mode: 3-7 tiles (configurable range)
- Dramatic scaling mode: Fewer, larger tiles (25-70)

### 5. Positioning Strategies

- **Grid-based**: Field mode uses a modified grid system with controlled overlap
- **Strategic Placement**: Focal mode uses principles like the Rule of Thirds and Golden Ratio

### 6. Opacity Distribution

- Smart opacity distribution creates visual depth
- Full opacity (1.0): Key elements (15-20%)
- High opacity (0.7-0.9): Secondary elements (35-50%)
- Medium opacity (0.3-0.6): Background elements

### 7. Aspect Ratio Preservation

- All images maintain their original aspect ratio
- Tiles are sized to preserve the original proportions

## Usage Example

```javascript
import CollageGenerator from './js/collage/collageGenerator.js';

// Create generator with canvas
const canvas = document.getElementById('collageCanvas');
const generator = new CollageGenerator(canvas);

// Generate a tiling collage
generator.generate(
  images,             // Array of loaded image objects
  null,               // Fortune text (optional)
  'tiling',           // Effect type
  {
    allowImageRepetition: true,  // Allow limited repetition (max 3)
    complexity: 7,               // Higher values = more complex patterns
    density: 5,                  // Higher values = more tiles
    contrast: 6,                 // Image contrast enhancement
    selectedCompositionStyle: 'Focal', // 'Focal' or 'Field'
    useDramaticScaling: true     // Enable dramatic scaling differences
  }
);
```

## Debugging Features

The generator includes comprehensive logging for diagnostics:

- Logs tile counts, distribution, and scaling information
- Reports image usage statistics
- Provides detailed information about positioning and coverage

## Testing Tools

A test page is available at `test_tiling.html` that allows:

- Toggling image repetition
- Switching between scaling styles
- Testing different layout modes
- Generating and saving collage outputs

## Implementation Notes

- **File Location**: `/js/collage/tilingGenerator.js`
- **Dependencies**: Relies on image loading from `loadImageCollection()`
- **Canvas Handling**: Automatically handles high-DPI displays with proper scaling