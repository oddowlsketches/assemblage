# LLM Integration for Assemblage

This document describes how to implement and test the LLM integration for the Narrative Composition feature in Assemblage.

## What's New?

- Added an LLM Composition Enhancer module that can work with an LLM service to create more meaningful narrative compositions
- Updated the Narrative Composition Manager to support LLM-enhanced compositions
- Added UI controls to enable/disable LLM enhancement in the test app

## Implementation Details

The LLM integration is designed to be modular and non-disruptive to the existing application. Key features:

1. **Graceful Degradation**: If LLM services are unavailable, the system falls back to the original composition algorithm
2. **Mock Mode**: For development and testing, you can use mock responses without an actual LLM service
3. **Incremental Enhancement**: The LLM enhancer works with your existing composition logic rather than replacing it

## Files Added/Modified

- **New**: `/js/llmCompositionEnhancer.js` - Core LLM integration module
- **Updated**: `narrativeCompositionManager.js` - Added LLM support
- **Updated**: `narrative-test.js` - Added LLM toggle functionality
- **Updated**: `narrative-test.html` - Added LLM toggle button

## Testing the Integration

1. Make the update script executable:
   ```bash
   chmod +x apply_llm_updates.sh
   ```

2. Apply the updates:
   ```bash
   ./apply_llm_updates.sh
   ```

3. Open `narrative-test.html` in your browser

4. Use the "Enable LLM" button to toggle between standard narrative composition and LLM-enhanced composition

## Current Limitations

- The current implementation uses mock responses for testing
- No actual LLM API integration yet (to be added in future updates)
- Limited to basic compositional enhancements (focal points, relationships, etc.)

## Next Steps

### Phase 2: Real LLM API Integration

1. Add OpenAI/Anthropic API integration to replace mock responses
2. Implement proper error handling and rate limiting
3. Add caching to reduce API calls

### Phase 3: Advanced Semantic Analysis

1. Integrate image content analysis using vision models
2. Implement more sophisticated relationship detection between elements
3. Add narrative theme suggestion based on available elements

### Phase 4: Main App Integration

1. Add LLM toggle to main app UI
2. Implement user prompt input for narrative direction
3. Create preset narrative styles based on common themes

## Notes for Developers

- The LLM enhancer is designed to work with any LLM service that accepts JSON
- Mock responses are stored in the LLMCompositionEnhancer class for easy modification
- All LLM-related functionality is behind feature flags for easy enabling/disabling
