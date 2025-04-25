# Cursor Implementation Prompt: Assemblage LLM Integration

## Overview

I've created a framework for integrating LLM capabilities into the Assemblage app's narrative composition feature. The goal is to improve the quality of narrative collages by using an LLM to help create more meaningful relationships between elements.

## Current Implementation

I've added:

1. An LLM Composition Enhancer module (`js/llmCompositionEnhancer.js`)
2. Updated the Narrative Composition Manager to work with the enhancer
3. Modified the test UI to include an LLM toggle button
4. Added test infrastructure with mock LLM responses

The implementation is designed to be:
- Non-disruptive to existing functionality
- Incrementally testable
- Easily integrated with the main app

## Next Implementation Steps

Now I need you to implement the following improvements to make the LLM integration more effective:

1. **Enhance the Composition Strategies:**
   - The current mock implementation has basic composition strategies (focal-point, journey, contrast)
   - Implement more sophisticated layout algorithms in each of these strategies
   - Add visual flow analysis that creates stronger directional relationships between elements

2. **Improve Fragment Feature Extraction:**
   - Enhance the `extractFragmentFeatures` method to derive more meaningful characteristics
   - Add content type hinting based on fragment proportions and other visual properties
   - Implement a simple semantic grouping algorithm that clusters related fragments

3. **Add Background Color Harmony:**
   - Implement a color analysis function that selects background colors that harmonize with fragments
   - Add subtle gradient options for backgrounds to create depth
   - Implement intelligent opacity adjustments based on fragment position and significance

4. **Create Stronger Visual Hierarchies:**
   - Refine the fragment scaling logic to create clearer primary/secondary relationships
   - Implement smarter overlap management that creates intentional rather than random overlaps
   - Add subtle rotation patterns that create visual rhythm

## Code Quality Expectations

When implementing these features:
- Maintain a clean, modular architecture that separates concerns
- Add comprehensive comments explaining the logic
- Include fallback behaviors for when the LLM service is unavailable
- Ensure backward compatibility with non-LLM enhanced compositions

## Testing Guidance

Focus on creating visually distinct compositions between:
1. Standard compositions (no narrative enhancement)
2. Basic narrative compositions (without LLM)
3. LLM-enhanced narrative compositions

Each should have clearly distinguishable characteristics that demonstrate the value of the LLM integration.

## End Goal

The final implementation should result in narrative compositions that:
- Have clear focal points and visual hierarchy
- Create meaningful relationships between elements
- Guide the viewer's eye through an intentional path
- Suggest a story or concept rather than random arrangement

When properly implemented, the difference between an LLM-enhanced composition and a standard one should be immediately apparent and aesthetically superior.
