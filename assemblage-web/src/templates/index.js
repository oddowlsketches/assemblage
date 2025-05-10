// templates/index.js
// This file exports all available template modules

// DO NOT add named exports to this file! Only use the default export (array). Named exports will cause circular dependency errors with template modules.
import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';
import tilingTemplate from './tilingTemplate';
import crystalEffect from './crystalEffectTemplate';
import slicedEffect from './slicedTemplate';
// legacy placement templates removed for now
// import legacyTemplates from './legacyTemplates.js';

// Export an array of all templates as the default export
export default [
  scrambledMosaic,
  pairedForms,
  tilingTemplate,
  crystalEffect,
  slicedEffect,
];
