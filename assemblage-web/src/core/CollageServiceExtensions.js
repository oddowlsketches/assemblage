/**
 * Extensions to the CollageService class for template parameterization
 * This file provides non-intrusive extensions that can be imported and used
 * alongside the existing CollageService without breaking anything.
 */

import { randomizeTemplate, parameterizeTemplate } from './TemplateParameterizer';

// Cache for parameterized templates
const parameterizedTemplateCache = new Map();

/**
 * Extension methods to add to the CollageService prototype
 */
const CollageServiceExtensions = {
  /**
   * Draw a randomized version of the template
   * @param {Object} template - The template to randomize
   * @returns {Object} The randomized template
   */
  drawRandomizedTemplate(template) {
    if (!template) return null;
    
    // Get or create parameterized template
    let parameterized = parameterizedTemplateCache.get(template.key);
    if (!parameterized) {
      parameterized = parameterizeTemplate(template);
      parameterizedTemplateCache.set(template.key, parameterized);
    }
    
    // Create a randomized version
    const randomized = randomizeTemplate(parameterized);
    
    // Draw it using existing method
    this.drawTemplate(randomized);
    
    return randomized;
  },
  
  /**
   * Add feedback for a template generation
   * @param {Object} template - The template that was shown
   * @param {boolean} isPositive - Whether the feedback was positive
   */
  recordTemplateFeedback(template, isPositive) {
    if (!window.templateFeedbackHistory) {
      window.templateFeedbackHistory = [];
    }
    
    // Add to global feedback history
    window.templateFeedbackHistory.push({
      templateKey: template.key,
      timestamp: new Date().toISOString(),
      isPositive,
      template: { ...template } // Store a copy of the template
    });
    
    console.log(`Recorded ${isPositive ? 'positive' : 'negative'} feedback for template "${template.key}"`);
    
    // If we have a parameterized version of this template,
    // we could apply learning here
    const parameterized = parameterizedTemplateCache.get(template.key);
    if (parameterized && window.templateFeedbackHistory.length >= 5) {
      this.learnFromFeedback(template.key);
    }
    
    return window.templateFeedbackHistory.length;
  },
  
  /**
   * Apply learning from feedback to a template
   * @param {string} templateKey - The template key to learn from
   */
  learnFromFeedback(templateKey) {
    if (!window.templateFeedbackHistory || window.templateFeedbackHistory.length === 0) {
      console.log('No feedback history to learn from');
      return;
    }
    
    // Get parameterized template
    const parameterized = parameterizedTemplateCache.get(templateKey);
    if (!parameterized) {
      console.log(`No parameterized template found for key "${templateKey}"`);
      return;
    }
    
    // Apply learning
    const learnedTemplate = learnFromFeedback(
      parameterized,
      window.templateFeedbackHistory
    );
    
    // Update cache
    parameterizedTemplateCache.set(templateKey, learnedTemplate);
    
    console.log(`Applied learning from ${window.templateFeedbackHistory.length} feedback entries to template "${templateKey}"`);
    
    return learnedTemplate;
  },
  
  /**
   * Download the feedback history as JSON
   */
  downloadFeedbackHistory() {
    if (!window.templateFeedbackHistory || window.templateFeedbackHistory.length === 0) {
      console.log('No feedback history to download');
      return;
    }
    
    // Create a download link
    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(window.templateFeedbackHistory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "template-feedback.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};

/**
 * Apply extensions to the CollageService class
 * @param {Class} CollageService - The CollageService class to extend
 */
export function extendCollageService(CollageService) {
  // Add extension methods to the prototype
  Object.keys(CollageServiceExtensions).forEach(methodName => {
    CollageService.prototype[methodName] = CollageServiceExtensions[methodName];
  });
  
  console.log('CollageService extended with template parameterization and feedback');
}

/**
 * Initialize extensions
 * Call this function at app startup to ensure extensions are loaded
 */
export function initCollageServiceExtensions() {
  // Create or reset global feedback history
  window.templateFeedbackHistory = window.templateFeedbackHistory || [];
  
  // Clear parameterized template cache
  parameterizedTemplateCache.clear();
  
  console.log('CollageService extensions initialized');
}
