// templates/index.js
// This file exports all available template modules

import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';

// Export individual templates for direct access
export {
  scrambledMosaic,
  pairedForms
};

// Export a collection of all templates
const templates = {
  scrambledMosaic,
  pairedForms
};

export default templates;
