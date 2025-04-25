# Mask Integration for Assemblage

This document outlines the safe integration of shape masks into the Assemblage app without modifying the core application code.

## Overview

The mask integration system allows the Assemblage app to apply various shape masks (circle, triangle, rectangle, etc.) to collage elements. The integration is designed to be:

- **Non-invasive**: Uses a proxy pattern to avoid modifying core app code
- **Reversible**: Can be disabled instantly if issues arise
- **Configurable**: Mask settings can be adjusted as needed

## Implementation Files

The mask integration consists of several components:

- **SimpleMaskManager** (`js/simpleMaskManager.js`): Handles shape mask creation and drawing
- **MaskIntegration** (`js/maskIntegration.js`): Integrates with the main app using a proxy pattern
- **Mask Test Page** (`mask-test.html` & `js/mask-test.js`): For testing mask functionality in isolation
- **Example Integration** (`js/examples/maskIntegrationExample.js`): Shows how to integrate with the main app

## Testing Process

Before integrating masks into the main app, we recommend:

1. Test using the dedicated `mask-test.html` page
2. Review how different mask shapes behave with various layout types
3. Adjust mask probability and settings as needed

## Usage Instructions

### Testing Locally

1. Open `mask-test.html` in your browser
2. Use the controls in the bottom-right corner to adjust mask settings
3. Click "Shift Perspective" to generate new collages with masks

### Integrating with Main App

Add the following code to your main app initialization:

```javascript
// Import the mask integration module
import maskIntegration from './js/maskIntegration.js';

// After app initialization, integrate masks with the generator
if (app && app.generator) {
    // Optional: Configure settings
    maskIntegration.updateSettings({
        enabled: true,
        probability: 0.2, 
        consistentMasksForMosaic: true,
        enabledMaskTypes: ['circle', 'triangle', 'rectangle', 'ellipse']
    });
    
    // Integrate with generator
    maskIntegration.integrateWithGenerator(app.generator);
}
```

### Adding a UI Toggle (Optional)

For a phased rollout, add a toggle in your UI:

```html
<div class="mask-toggle">
    <label>
        <input type="checkbox" id="enableMasks" checked>
        Enable shape masks
    </label>
</div>
```

Then handle the toggle events:

```javascript
document.getElementById('enableMasks').addEventListener('change', function(e) {
    if (e.target.checked) {
        maskIntegration.updateSettings({ enabled: true });
        maskIntegration.integrateWithGenerator(app.generator);
    } else {
        maskIntegration.updateSettings({ enabled: false });
        maskIntegration.disableIntegration(app.generator);
    }
});
```

## Configuration Options

The mask integration can be configured with various settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | Boolean | `true` | Master switch to enable/disable masking |
| `probability` | Number | `0.2` | Probability (0-1) of applying masks to fragments |
| `consistentMasksForMosaic` | Boolean | `true` | Whether to use a single mask type for mosaic layouts |
| `enabledMaskTypes` | Array | `['circle', 'triangle', 'rectangle', 'ellipse']` | Available mask types |

## Available Mask Types

The following mask types are supported:

- `circle`: Round mask
- `triangle`: Triangular mask (pointing up)
- `rectangle`: Standard rectangular mask
- `ellipse`: Oval mask
- `diamond`: Diamond-shaped mask
- `hexagon`: Six-sided mask
- `star`: Five-pointed star mask
- `arc`: Curved arc segment mask
- `arch`: Architectural arch (doorway) mask

## Troubleshooting

If you encounter issues with mask integration:

1. Check browser console for errors
2. Try disabling complex mask types (star, hexagon, etc.)
3. Reduce mask probability to lower values
4. Completely disable masks using:

```javascript
maskIntegration.disableIntegration(app.generator);
```

## Implementation Notes

- The mask integration uses a proxy pattern to safely override methods without modifying source code
- Original methods are preserved and can be restored at any time
- Performance impact should be minimal for most mask types
