// templates/index.js
// This file exports all available template modules

// DO NOT add named exports to this file! Only use the default export (array). Named exports will cause circular dependency errors with template modules.
import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';
import tilingTemplate from './tilingTemplate';
import crystalEffect from './crystalEffectTemplate';
import slicedEffect from './slicedTemplate';
// import architecturalTemplate from './architecturalTemplate'; // Commenting out the old one
import dynamicArchitecturalTemplate from './dynamicArchitecturalTemplate'; // Import the new one
import layeredGeometric from './layeredGeometric';
import floatingElements from './floatingElements';
// legacy placement templates removed for now
// import legacyTemplates from './legacyTemplates.js';

// Export an array of all templates as the default export
export default [
  // architecturalTemplate, // Old one removed
  dynamicArchitecturalTemplate, // Add the new one, perhaps make its key/name clear if not already
  scrambledMosaic,
  pairedForms,
  tilingTemplate,
  crystalEffect,
  slicedEffect,
  layeredGeometric,
  floatingElements
];
