import { TemplateManager } from './templateManager';

export async function fetchMaskPlanFromLLM(prompt) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log('[OpenAI] fetchMaskPlanFromLLM called with prompt:', prompt);
  
  const availableTemplates = TemplateManager.getAvailableTemplateKeys();
  const systemPrompt = `You are a helpful assistant that helps create image collages using predefined templates.
Available template keys: ${availableTemplates.join(', ')}.

Rules:
1. Always pick one of the registered template keys.
2. Don't invent new mask names.
3. Limit overrides to at most 2 changes.
4. If the prompt clearly references the "slicedLegacy" style, pick that key.
5. Output only valid JSON in the following format:
{
  "templateKey": "one_of_available_keys",
  "overrides": [
    {
      "index": 0,
      "x": 0.2,
      "y": 0.3,
      "width": 0.4,
      "height": 0.4,
      "rotation": 45
    }
  ],
  "bgColor": "#ffffff"
}
Note: overrides and bgColor are optional. Only include them if needed.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 512,
    }),
  });
  
  if (!response.ok) {
    throw new Error('OpenAI API error: ' + response.statusText);
  }
  
  const data = await response.json();
  const text = data.choices[0].message.content;
  
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
    const response = JSON.parse(jsonString);
    
    // Handle both old and new response formats
    if (response.templateKey) {
      // New template-based format
      const template = TemplateManager.getTemplate(response.templateKey);
      if (!template) {
        throw new Error(`Invalid template key: ${response.templateKey}`);
      }
      
      // Apply overrides to get final placements
      const finalPlacements = TemplateManager.applyOverrides(template, response.overrides);
      
      return {
        placements: finalPlacements,
        bgColor: response.bgColor || template.defaultBG
      };
    } else if (response.masks) {
      // Old format - convert to template format
      const templateKey = determineTemplateFromMasks(response.masks);
      const template = TemplateManager.getTemplate(templateKey);
      if (!template) {
        throw new Error(`Could not determine template from masks`);
      }
      
      return {
        placements: template.placements,
        bgColor: template.defaultBG
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (e) {
    throw new Error('Failed to parse LLM JSON: ' + e.message + '\nRaw response: ' + text);
  }
}

function determineTemplateFromMasks(masks) {
  // Simple mapping from mask types to templates
  if (masks.some(m => m.family === 'sliced')) {
    return 'slicedLegacy';
  } else if (masks.some(m => m.type.includes('arch'))) {
    return 'archesRow';
  } else if (masks.some(m => m.type.includes('window'))) {
    return 'windowsGrid';
  }
  // Default to sliced legacy if we can't determine
  return 'slicedLegacy';
} 