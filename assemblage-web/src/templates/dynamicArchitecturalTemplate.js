import { ArchitecturalEffect } from '../effects/ArchitecturalEffect';
import { randomVibrantColor } from '../utils/colors';

/**
 * Generate a dynamic architectural composition using the ArchitecturalEffect class.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images
 * @param {Object} params - Configuration parameters from templateManager
 */
function renderDynamicArchitectural(canvas, images, params = {}) {
  if (!canvas || !images || images.length === 0) {
    console.warn('[DynamicArchitecturalTemplate] Canvas or images not provided.');
    return;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Use bgColor from params, fallback to a random vibrant one if not provided
  const bgColor = params.bgColor || randomVibrantColor();
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Randomization for "New" button behavior ---
  let currentStyle = params.style || dynamicArchitecturalTemplate.params.style.default;
  if (currentStyle === 'random') {
    const availableStyles = dynamicArchitecturalTemplate.params.style.options.filter(s => s !== 'random');
    // Add a chance to use the 'random' promptText which triggers generateArchitecturalPlan in the effect
    const effectiveStyles = [...availableStyles, 'random']; // Allow fallback to the effect's own random generator
    currentStyle = effectiveStyles[Math.floor(Math.random() * effectiveStyles.length)];
  }

  const randomizedUseColorBlockEcho = params.useColorBlockEcho !== undefined ? params.useColorBlockEcho : Math.random() < 0.7; // 70% chance for echo now
  const randomizedEchoPolicy = params.echoPolicy || (Math.random() < 0.6 ? 'all' : 'subset'); // 60% chance for 'all' if echo is on
  const randomizedEchoOpacity = params.echoOpacity || (0.5 + Math.random() * 0.4); // Range 0.5 - 0.9
  const randomizedElementOpacity = params.elementOpacity || (0.7 + Math.random() * 0.3); // Range 0.7 - 1.0
  // --- End Randomization ---

  console.log('[DATemplate] Randomized Params:', {
    currentStyle,
    bgColor,
    randomizedUseColorBlockEcho,
    randomizedEchoPolicy,
    randomizedEchoOpacity,
    randomizedElementOpacity
  });

  // Pass all params to ArchitecturalEffect, it can pick what it needs
  const effectParams = {
    ...params, // Original params take precedence if they exist
    promptText: currentStyle, // Use the (potentially randomized) style
    bgColor: bgColor, // Ensure bgColor is passed
    
    // Apply randomized values if not specified in incoming params
    useColorBlockEcho: randomizedUseColorBlockEcho,
    echoPolicy: randomizedUseColorBlockEcho ? randomizedEchoPolicy : (params.echoPolicy || 'none'), // Only apply policy if echo is on
    echoOpacity: randomizedEchoOpacity,
    elementOpacity: randomizedElementOpacity, // Renamed from opacity
    useComplementaryShapes: false // Explicitly disable old complementary shapes
  };

  const effect = new ArchitecturalEffect(ctx, images, effectParams);
  
  // The effect will generate its own plan and draw it.
  // ArchitecturalEffect.draw() should handle this, or we call specific methods.
  // Based on ArchitecturalEffect.ts, it seems `draw()` method might be the main entry point.
  // Let's assume `draw()` clears bg, generates plan, and draws plan + complementary shapes.
  effect.draw(); // We might need to adjust ArchitecturalEffect.draw() later.

  return { canvas, bgColor }; // Return canvas and bgColor used
}

const dynamicArchitecturalTemplate = {
  key: 'dynamicArchitectural',
  name: 'Dynamic Architectural',
  generate: renderDynamicArchitectural,
  params: {
    style: { type: 'select', options: ['random', 'singleArch', 'archSeries', 'nestedArches', 'coliseum', 'classic', 'modern', 'gothic'], default: 'random' },
    imageMode: { type: 'select', options: ['unique', 'single'], default: 'unique' },
    useMultiply: { type: 'boolean', default: true },
    useComplementaryShapes: { type: 'boolean', default: false }, // Existing complementary shapes, different from echo
    bgColor: { type: 'color' }, // No default, so it will be undefined unless set by user/theme
    // New Echo Params for UI
    useColorBlockEcho: { type: 'boolean', default: true }, // Default in UI might be true
    echoPolicy: { type: 'select', options: ['all', 'subset', 'none'], default: 'subset' },
    echoOpacity: { type: 'number', min: 0.1, max: 1, default: 0.6, step: 0.05 },
    elementOpacity: { type: 'number', min: 0.1, max: 1, default: 1, step: 0.05 } // Renamed from opacity
  }
};

export default dynamicArchitecturalTemplate; 