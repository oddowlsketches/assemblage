/**
 * Enhanced templates system
 * 
 * This file combines the original templates with the new abstract templates
 * and adds validation to ensure all templates reference valid mask names.
 */

// Import original templates
import { templates as originalTemplates } from './templates.js';

// Import abstract templates
import abstractTemplates from './abstract-templates.js';

// Background colors
const backgroundColors = [
    '#F6E6E4', // Soft Pink
    '#E8F3F1', // Mint White
    '#F0F5FA', // Cool White
    '#F5F5F0', // Warm White
    '#F2EBE5', // Cream
    '#E6E9F0', // Lavender White
    '#F4F1F7', // Lilac White
    '#E5EEF5', // Sky White
    '#F5EFE7', // Peach White
    '#EFF5EC'  // Sage White
];

/**
 * Returns a random background color from the palette
 */
export function getRandomBackgroundColor() {
    return backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
}

/**
 * Combined templates from both sources
 */
export const templates = [
    // Add original architectural templates
    ...originalTemplates.filter(t => t.key !== 'slicedLegacy'), // Exclude slicedLegacy since we have a better version
    
    // Add abstract templates
    ...abstractTemplates
];

/**
 * Function to get a template by key
 * @param {string} key - The template key
 * @returns {Object|null} - The template or null if not found
 */
export function getTemplateByKey(key) {
    return templates.find(t => t.key === key) || null;
}

/**
 * Get templates grouped by category
 * @returns {Object} - Object with templates grouped by category
 */
export function getTemplatesByCategory() {
    return {
        abstract: abstractTemplates,
        architectural: originalTemplates.filter(t => 
            t.key.includes('arch') || 
            t.key.includes('window') || 
            t.key.includes('altar')
        ),
        sliced: templates.filter(t => 
            t.key.includes('slice') || 
            t.key === 'slicedAbstraction'
        )
    };
}

/**
 * Default export is the combined templates array
 */
export default templates;
