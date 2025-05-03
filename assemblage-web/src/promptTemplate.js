/**
 * Returns a prompt for the LLM to generate a mask plan JSON from user text.
 * @param {string} userText - The user's free-text prompt.
 */
export function getMaskPlanPrompt(userText) {
  return `
You are a collage mask planner. Given a user prompt, emit a JSON object in this exact shape:

{
  "masks": [
    {
      "family": <one of "sliced"|"architectural"|"abstract"|"altar"|"narrative">,
      "type": <string, e.g. "sliceHorizontalWide" or "triptychArch">,
      "params": { /* mask parameters */ }
    }
  ]
}

User prompt: "${userText}"

Respond with only the JSON object, no explanation.`;
} 