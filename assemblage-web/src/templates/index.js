// templates/index.js
// This file exports all available template modules

import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';
import tangramTemplate from './tangramTemplate';
import tilingTemplate from './tilingTemplate';

// Create the templates array first
const templates = [
  scrambledMosaic,
  pairedForms,
  tangramTemplate,
  tilingTemplate
];

// Then export everything
export {
  scrambledMosaic,
  pairedForms,
  tangramTemplate,
  tilingTemplate
};

export default templates;
