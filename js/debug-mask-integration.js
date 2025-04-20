console.log('Loading mask integration in debug mode...');

// Wait longer for app to initialize fully
setTimeout(() => {
  console.log('Attempting to attach mask support...');
  try {
    const app = window.app;
    if (!app) {
      console.error('App not found in window object - integration aborted');
      return;
    }
    
    console.log('App found, checking for MaskTest instance...');
    if (!(app instanceof MaskTest)) {
      console.error('App is not a MaskTest instance - integration aborted');
      return;
    }
    
    console.log('MaskTest instance found, checking methods...');
    if (typeof app.applyMasks !== 'function') {
      console.error('applyMasks is not a function - integration aborted');
      return;
    }
    
    console.log('All checks passed, ready to integrate mask support');
    
    // Add a simple flag to allow easy disabling
    window.enableMaskSupport = false;
    
    // Create a "try it" function that won't automatically run
    window.tryMaskSupport = function() {
      console.log('Enabling minimal mask support for testing...');
      window.enableMaskSupport = true;
      
      // Store original applyMasks method
      const originalApplyMasks = app.applyMasks;
      
      // Override applyMasks to use our debug version
      app.applyMasks = function(fragments, settings) {
        console.log('Debug: Applying masks to fragments...');
        console.log('Debug: Fragment count:', fragments.length);
        console.log('Debug: Current settings:', settings);
        
        // Call original method
        const result = originalApplyMasks.call(this, fragments, settings);
        
        console.log('Debug: Mask application complete');
        console.log('Debug: Masked fragments:', result.filter(f => f.maskType).length);
        
        return result;
      };
      
      console.log('Mask support enabled - next fragment collage will use masks');
      console.log('To disable, use window.enableMaskSupport = false');
    };
    
    console.log('Debug mode integration complete');
    console.log('To test masks, run window.tryMaskSupport() in console');
    
  } catch (error) {
    console.error('Error during mask integration:', error);
  }
}, 2000); // Longer 2-second delay 