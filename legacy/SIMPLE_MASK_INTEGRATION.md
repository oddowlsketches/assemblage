# Simple Fragment Mask Integration for Assemblage

This is a minimal implementation to add mask shapes to the fragments layout in your Assemblage app.

## What's Included

1. **Simple Fragment Mask Test Page**: A standalone page to test mask shapes
   - `simple-fragment-mask-test.html`

2. **Simple Integration Script**: A drop-in script to add mask support to the main app
   - `js/simple-mask-integration.js`

## How to Test

1. Open the test page in your browser:
   ```
   http://localhost:8000/simple-fragment-mask-test.html
   ```

2. Use the controls in the bottom-right corner to:
   - Adjust the probability of applying masks
   - Enable/disable consistent mask types
   - Select which mask shapes to use

3. Click "Generate Collage" to see different mask effects

## How to Integrate with Main App

### Method 1: Simple Script Include

Add the integration script to your `index.html` file:

```html
<!-- Add this after your main app scripts -->
<script type="module" src="js/simple-mask-integration.js"></script>
```

This will automatically add mask support with the default settings (20% probability of applying circle, triangle, rectangle, and ellipse masks).

### Method 2: Manual Integration

If you prefer to have more control, you can manually incorporate the mask code into your app:

1. Copy the `applyMaskPath` function from the integration script
2. Add code to your fragment drawing logic to apply masks to some fragments
3. Update your fragment generation to set `fragment.maskType` for selected fragments

## Runtime Controls

After integration, you can control mask behavior from the browser console:

```javascript
// Adjust mask settings
window.updateMaskSettings({
  probability: 0.3,           // Increase probability to 30%
  maskTypes: ['circle', 'triangle'], // Only use circle and triangle masks
  consistent: true            // Use the same mask type for all fragments
});

// Disable masks entirely
window.disableMasks();

// Re-enable masks
window.enableMasks();
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

1. Check the browser console (F12) for errors
2. Try reducing the mask probability to a lower value
3. Stick with simpler mask shapes (circle, rectangle)
4. Disable masks entirely if needed: `window.disableMasks()`

## Safety Features

This integration is designed to be safe and non-invasive:

- Only modifies the fragments layout, not other layout types
- Wraps original methods so they can be restored if needed
- Can be disabled at runtime without reloading
- Handles errors gracefully, falling back to original behavior

## Why This Approach?

The simple approach has several advantages:

1. **Focused scope**: Only modifies the fragments layout
2. **Minimal risk**: Non-invasive method that won't break your main app
3. **Easy testing**: Dedicated test page to validate everything
4. **Runtime control**: Can be turned on/off while using the app
