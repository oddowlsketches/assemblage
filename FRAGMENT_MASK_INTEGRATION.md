# Fragment Mask Integration Guide

This guide explains how to safely add shape masks to the fragments layout in your Assemblage app.

## Overview

The fragment mask integration adds the ability to apply various shape masks (circle, triangle, rectangle, etc.) to collage elements in the fragments layout. The integration is:

- **Simple**: Focused specifically on the fragments layout type
- **Safe**: Non-invasive approach that doesn't modify core app code
- **Controllable**: Can be enabled/disabled at runtime
- **Customizable**: Mask types and frequency can be adjusted

## Files

The integration consists of three main files:

1. **`js/fragmentsMaskSupport.js`**: Core mask functionality
2. **`js/enableFragmentMasks.js`**: Integration with main app
3. **`fragment-mask-test.html`**: Test page for trying out masks

## Testing First

Before integrating with your main app, you can test the mask functionality:

1. Open `fragment-mask-test.html` in your browser
2. Use the controls in the bottom right to adjust mask settings
3. Click "Generate Collage" to see different mask effects
4. Experiment with different mask types and probabilities

## Integration Steps

### Option 1: Simple Script Tag

The easiest way to add mask support is by adding a script tag to your `index.html`:

```html
<!-- Add this after your main app scripts -->
<script type="module" src="js/enableFragmentMasks.js"></script>
```

This will automatically enable mask support with default settings (20% probability of applying a mask using circle, triangle, rectangle, and ellipse shapes).

### Option 2: Manual Integration

For more control, you can manually integrate in your own JavaScript:

```javascript
import { applyMasksToFragments, drawMaskedFragment } from './js/fragmentsMaskSupport.js';

// When generating fragments:
const fragments = await fragmentsGenerator.generateFragments(images);
const maskedFragments = applyMasksToFragments(fragments, {
  probability: 0.2,
  maskTypes: ['circle', 'triangle', 'rectangle', 'ellipse'],
  consistentMasks: false
});

// Then draw masked fragments manually using drawMaskedFragment function
```

## Runtime Controls

After integration, you can control mask behavior from the browser console:

```javascript
// Adjust mask settings
window.updateMaskSettings({
  probability: 0.3,           // Increase probability to 30%
  maskTypes: ['circle', 'triangle'], // Only use circle and triangle masks
  consistentMasks: true       // Use the same mask type for all fragments in a collage
});

// Disable masks entirely
window.disableFragmentMasks();

// Re-enable masks
window.enableFragmentMasks();
```

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

If you encounter issues:

1. Open browser console (F12) to check for errors
2. Try reducing mask probability to a lower value
3. Limit mask types to the simpler shapes (circle, rectangle)
4. Disable masks entirely if needed: `window.disableFragmentMasks()`

## Notes

- This integration only affects the fragments layout type
- Masks are applied randomly to elements based on the probability setting
- For consistent visual appearance, enable the `consistentMasks` option
- More complex mask shapes may require more processing power

For extensive modifications or adding masks to other layout types, consider examining the `fragmentsMaskSupport.js` code as a starting point.
