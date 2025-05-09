// templates/index.js
// This file exports all available template modules

import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';
import tilingTemplate from './tilingTemplate';

// Create the templates array first
const templates = [
  scrambledMosaic,
  pairedForms,
  tilingTemplate
];

// Then export everything
export {
  scrambledMosaic,
  pairedForms,
  tilingTemplate
};

export default templates;
