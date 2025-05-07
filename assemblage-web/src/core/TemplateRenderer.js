// TemplateRenderer.js
import { templates } from '../templates';
import { getMaskDescriptor } from '../masks/maskRegistry';
import templateModules from '../templates/index';

/**
 * TemplateRenderer - Handles rendering of all template types
 */
export class TemplateRenderer {
  constructor(collageService) {
    this.collageService = collageService;
    this.canvas = collageService.canvas;
    this.ctx = collageService.ctx;
    this.images = collageService.images;
    
    // Initialize template handlers
    this.handlers = {};
    
    // Register all template modules
    Object.values(templateModules).forEach(module => {
      if (module && module.key && module.render) {
        this.handlers[module.key] = module.render;
      }
    });
    
    // Template feedback storage
    this.feedbackStore = this.loadFeedback();
  }
  
  /**
   * Get a template by key
   */
  getTemplate(key) {
    return templates.find(t => t.key === key);
  }
  
  /**
   * Get all templates
   */
  getAllTemplates() {
    return templates;
  }
  
  /**
   * Render a template with parameters
   */
  async renderTemplate(key, params = {}) {
    console.log(`[TemplateRenderer] Rendering template: ${key}`, params);
    
    const template = this.getTemplate(key);
    if (!template) {
      console.error(`Template not found: ${key}`);
      return;
    }
    
    // Merge default parameters with provided parameters
    const mergedParams = {};
    Object.entries(template.params).forEach(([paramKey, paramDef]) => {
      mergedParams[paramKey] = params[paramKey] !== undefined ? params[paramKey] : paramDef.default;
    });
    
    // Call the appropriate handler
    const handler = this.handlers[key];
    if (!handler) {
      console.error(`No handler implemented for template: ${key}`);
      return;
    }
    
    try {
      // Use the render function from the template module
      await handler(this.canvas, this.images, mergedParams);
    } catch (error) {
      console.error(`Error rendering template ${key}:`, error);
    }
    
    return this.canvas;
  }
  

  
  /**
   * Save feedback about a template
   */
  saveFeedback(key, params, liked) {
    const feedback = {
      templateKey: key,
      params: {...params},
      liked,
      timestamp: Date.now()
    };
    
    // Get existing feedback
    const storedFeedback = this.loadFeedback();
    storedFeedback.push(feedback);
    
    // Store feedback in localStorage
    localStorage.setItem('templateFeedback', JSON.stringify(storedFeedback));
    
    console.log(`Saved ${liked ? 'positive' : 'negative'} feedback for ${key}`);
    return storedFeedback;
  }
  
  /**
   * Load all feedback from storage
   */
  loadFeedback() {
    const storedFeedback = localStorage.getItem('templateFeedback');
    return storedFeedback ? JSON.parse(storedFeedback) : [];
  }
  
  /**
   * Get feedback for a specific template
   */
  getTemplateFeedback(key) {
    const allFeedback = this.loadFeedback();
    return allFeedback.filter(f => f.templateKey === key);
  }
  
  /**
   * Analyze feedback to suggest optimal parameter ranges
   */
  analyzeTemplateFeedback(key) {
    const feedback = this.getTemplateFeedback(key);
    const positiveFeedback = feedback.filter(f => f.liked);
    
    if (positiveFeedback.length < 3) {
      return null; // Not enough data for analysis
    }
    
    const template = this.getTemplate(key);
    if (!template) return null;
    
    // Calculate optimal parameter ranges based on positive feedback
    const analysis = {};
    
    Object.entries(template.params).forEach(([paramKey, paramDef]) => {
      if (paramDef.type === 'number') {
        // For numeric parameters, find min, max, and average of liked values
        const values = positiveFeedback.map(f => f.params[paramKey]).filter(v => v !== undefined);
        if (values.length > 0) {
          analysis[paramKey] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length
          };
        }
      } else if (paramDef.type === 'select') {
        // For select parameters, find most common value
        const valuesCount = {};
        positiveFeedback.forEach(f => {
          const value = f.params[paramKey];
          if (value !== undefined) {
            valuesCount[value] = (valuesCount[value] || 0) + 1;
          }
        });
        
        let maxCount = 0;
        let popular = null;
        
        Object.entries(valuesCount).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count;
            popular = value;
          }
        });
        
        if (popular !== null) {
          analysis[paramKey] = { popular, count: maxCount };
        }
      }
    });
    
    return analysis;
  }
}
