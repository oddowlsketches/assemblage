# Template Development Guide for Assemblage

This guide outlines the process for creating, testing, and integrating new template types into the Assemblage application.

## Table of Contents

1. [Template Architecture Overview](#template-architecture-overview)
2. [Development Process](#development-process)
3. [Template Structure](#template-structure)
4. [Adding a New Template](#adding-a-new-template)
5. [Template Testing](#template-testing)
6. [Common Design Patterns](#common-design-patterns)
7. [Troubleshooting](#troubleshooting)

## Template Architecture Overview

The Assemblage template system is built around these key components:

- **TemplateSchema (templates.ts):** Defines the interface and parameters for each template
- **Template Modules (src/templates/):** Contains implementation code for each template type
- **TemplateRenderer (src/core/TemplateRenderer.js):** Manages template rendering and feedback
- **Template Review UI (public/template-review.html):** Interactive UI for testing templates

This modular approach allows each template to:
- Be independently developed and tested
- Use its own unique parameter set
- Collect and analyze user feedback
- Be easily integrated into the main application

## Development Process

The recommended template development process:

1. **Define**: Add template interface to `templates.ts` with parameters, description, etc.
2. **Prototype**: Create a template module with core rendering logic
3. **Test**: Use template-review.html to interactively test parameters
4. **Refine**: Use feedback data to optimize parameter ranges
5. **Integrate**: Update the template index file to include the new template

## Template Structure

Each template consists of two main parts:

### 1. Schema Definition (in templates.ts)

```typescript
{
  key: 'templateName',
  name: 'Human Friendly Name',
  description: 'Detailed description of what this template does...',
  category: 'abstract', // or 'architectural', 'narrative', 'altar', 'combined'
  params: {
    // Parameters with their types, ranges, and defaults
    paramName: { 
      type: 'number', // or 'select', 'color', 'boolean'
      min: 0,
      max: 100,
      default: 50,
      label: 'User-friendly Parameter Name',
      description: 'Explanation of this parameter'
    },
    // More parameters...
  }
}
```

### 2. Implementation Module (in src/templates/templateName.js)

```javascript
// Core rendering function
export function renderTemplate(canvas, images, params) {
  // 1. Convert params as needed
  // 2. Clear canvas and set background
  // 3. Draw template based on parameters
  // 4. Return the canvas
}

// Template module export
export default {
  name: 'Template Name',
  key: 'templateKey',
  render: renderTemplate
};
```

## Adding a New Template

Follow these steps to add a new template:

1. **Define Template Schema**
   
   Add your template definition to `src/templates.ts`:

   ```typescript
   {
     key: 'yourTemplate',
     name: 'Your Template',
     description: 'Description of what your template does...',
     category: 'abstract', // Choose appropriate category
     params: {
       // Define 3-7 parameters that control the template's behavior
     }
   }
   ```

2. **Create Template Module**

   Create a new file at `src/templates/yourTemplate.js`:

   ```javascript
   // yourTemplate.js
   
   // Helper functions specific to this template
   function helperFunction() {
     // ...
   }
   
   // Main rendering function
   export function renderTemplate(canvas, images, params) {
     if (!canvas || images.length === 0) return;
     
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     
     // Your template implementation
     // ...
     
     return canvas;
   }
   
   // Export template module
   export default {
     name: 'Your Template',
     key: 'yourTemplate',
     render: renderTemplate
   };
   ```

3. **Register Template Module**

   Update `src/templates/index.js` to include your new template:

   ```javascript
   import yourTemplate from './yourTemplate';
   
   export {
     // Existing exports...
     yourTemplate
   };
   
   const templates = {
     // Existing templates...
     yourTemplate
   };
   
   export default templates;
   ```

4. **Test Template**

   Open template-review.html in your browser and select your template from the dropdown to test interactively.

## Template Testing

The template review page provides several tools for testing:

1. **Interactive Controls**: Adjusts parameters in real-time
2. **Feedback Collection**: "Like" and "Dislike" buttons gather data
3. **Parameter Insights**: Shows statistics on successful parameter combinations
4. **Download**: Save your designs for reference

Tips for effective testing:
- Test with multiple images to ensure compatibility
- Try extreme parameter values to check for edge cases
- Collect multiple "liked" samples before analyzing insights
- Test at different screen sizes to ensure responsive behavior

## Common Design Patterns

When creating templates, consider these common patterns:

### Pattern Generation

For templates that involve creating patterns (like grids or clusters):

```javascript
function createPattern(params) {
  // Create an empty pattern structure
  const pattern = [];
  
  // Generate pattern based on parameters
  // ...
  
  return pattern;
}
```

### Element Placement

For templates that place elements (like shapes or masks):

```javascript
function calculatePlacements(canvas, params) {
  const placements = [];
  
  // Calculate positions, sizes, rotations
  // ...
  
  return placements;
}
```

### Randomization

For adding controlled variability:

```javascript
// Random value within a range
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// Random item from array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
```

## Troubleshooting

Common issues and solutions:

### Parameters Not Updating

If parameter changes don't affect the rendered output:
- Check parameter name mapping in your template module
- Verify parameter types are being converted correctly
- Add console.log statements to debug parameter flow

### Rendering Issues

If the template doesn't render correctly:
- Check the canvas context is being accessed properly
- Verify image loading is complete before drawing
- Inspect element dimensions and positions
- Use ctx.save() and ctx.restore() around context changes

### Performance Problems

If rendering is slow:
- Reduce unnecessary canvas operations
- Use integer coordinates for pixel-perfect rendering
- Consider using requestAnimationFrame for animations
- Profile performance using browser developer tools

---

Happy template development! This modular system allows for endless creativity while maintaining a consistent architecture and user experience.
