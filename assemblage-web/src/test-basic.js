// Simple test file to check if core functionality works
import { CollageService } from './core/CollageService.js';
import templateModules from './templates/index.js';

console.log('[Test] Starting basic functionality test...');

// Test 1: Check if templates are loaded
console.log('[Test] Template modules:', templateModules);
console.log('[Test] Template count:', templateModules.length);

// Test 2: Create a dummy canvas and try to create CollageService
try {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  const service = new CollageService(canvas, {});
  console.log('[Test] CollageService created successfully');
  
  // Test 3: Try to get templates
  const templates = service.getAllTemplates();
  console.log('[Test] Templates from service:', templates);
  
} catch (error) {
  console.error('[Test] Error creating CollageService:', error);
}

console.log('[Test] Basic functionality test complete');
