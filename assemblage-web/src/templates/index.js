// templates/index.js
// This file exports all available template modules

// DO NOT add named exports to this file! Only use the default export (array). Named exports will cause circular dependency errors with template modules.
import scrambledMosaic from './scrambledMosaic';
import pairedForms from './pairedForms';
import photoStrip from './photoStrip';
import tilingTemplate from './tilingTemplate';
import crystalEffect from './crystalEffectTemplate';
// import architecturalTemplate from './architecturalTemplate'; // Commenting out the old one
import dynamicArchitecturalTemplate from './dynamicArchitecturalTemplate'; // Import the new one
import layeredGeometric from './layeredGeometric';
import floatingElements from './floatingElements';
import mixedMediaTemplate from './mixedMediaTemplate';
// import architecturalComposition from './architecturalComposition'; // REMOVED OLD TEMPLATE
import slicedTemplate from './slicedTemplate'; // Keep this one
import packedShapesTemplate from './packedShapesTemplate';
// legacy placement templates removed for now
// import legacyTemplates from './legacyTemplates.js';

// Export an array of all templates as the default export
export default [
  // architecturalTemplate, // Old one removed
  dynamicArchitecturalTemplate, // Add the new one, perhaps make its key/name clear if not already
  scrambledMosaic,
  pairedForms,
  photoStrip,
  photoStrip, // Increase frequency by adding twice  
  tilingTemplate,
  crystalEffect,
  slicedTemplate, // Use this one
  layeredGeometric,
  floatingElements,
  mixedMediaTemplate,
  // architecturalComposition, // REMOVED OLD TEMPLATE
  // Remove duplicate slicedTemplate here
  packedShapesTemplate
];
