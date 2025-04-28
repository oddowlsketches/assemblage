/**
 * Effect Tester for Assemblage
 * 
 * This script adds buttons to manually test each effect
 */

(function() {
    console.log('[Tester] Loading effect tester...');
    
    // Create a simple UI for testing
    function createTestUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';
        
        // Title
        const title = document.createElement('div');
        title.textContent = 'Effect Tester';
        title.style.color = 'white';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        container.appendChild(title);
        
        // Create buttons for each effect
        const effects = ['tiling', 'fragments', 'mosaic', 'layers', 'sliced', 'crystal'];
        
        effects.forEach(effect => {
            const button = document.createElement('button');
            button.textContent = `Test ${effect}`;
            button.style.padding = '5px';
            button.style.backgroundColor = '#444';
            button.style.color = 'white';
            button.style.border = '1px solid #666';
            button.style.borderRadius = '3px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => {
                console.log(`[Tester] Testing ${effect} effect...`);
                testEffect(effect);
            });
            
            container.appendChild(button);
        });
        
        // Add status display
        const status = document.createElement('div');
        status.id = 'effect-tester-status';
        status.style.color = 'white';
        status.style.fontSize = '12px';
        status.style.marginTop = '5px';
        status.textContent = 'Ready';
        container.appendChild(status);
        
        // Add clear masks button
        const clearMasks = document.createElement('button');
        clearMasks.textContent = 'Disable Masking';
        clearMasks.style.padding = '5px';
        clearMasks.style.backgroundColor = '#700';
        clearMasks.style.color = 'white';
        clearMasks.style.border = '1px solid #900';
        clearMasks.style.borderRadius = '3px';
        clearMasks.style.cursor = 'pointer';
        clearMasks.style.marginTop = '10px';
        
        clearMasks.addEventListener('click', () => {
            console.log('[Tester] Attempting to disable masks...');
            disableMasking();
        });
        
        container.appendChild(clearMasks);
        
        // Add hide/show button
        const hideButton = document.createElement('button');
        hideButton.textContent = 'Hide Panel';
        hideButton.style.padding = '5px';
        hideButton.style.backgroundColor = '#444';
        hideButton.style.color = 'white';
        hideButton.style.border = '1px solid #666';
        hideButton.style.borderRadius = '3px';
        hideButton.style.cursor = 'pointer';
        hideButton.style.marginTop = '10px';
        
        hideButton.addEventListener('click', () => {
            const isHidden = container.style.width === '20px';
            if (isHidden) {
                container.style.width = '';
                container.style.height = '';
                hideButton.textContent = 'Hide Panel';
                Array.from(container.children).forEach(child => {
                    if (child !== hideButton) {
                        child.style.display = '';
                    }
                });
            } else {
                Array.from(container.children).forEach(child => {
                    if (child !== hideButton) {
                        child.style.display = 'none';
                    }
                });
                container.style.width = '20px';
                container.style.height = '20px';
                hideButton.textContent = '+';
                hideButton.style.display = '';
            }
        });
        
        container.appendChild(hideButton);
        
        return container;
    }
    
    // Function to test a specific effect
    function testEffect(effectName) {
        const statusEl = document.getElementById('effect-tester-status');
        if (statusEl) {
            statusEl.textContent = `Testing ${effectName}...`;
        }
        
        try {
            if (!window.app || !window.app.collageGenerator) {
                console.log('[Tester] App or collage generator not found');
                if (statusEl) {
                    statusEl.textContent = 'Error: App not found';
                }
                return;
            }
            
            // Set the effect type directly
            if (window.app.currentEffect) {
                window.app.currentEffect = effectName;
            }
            
            // Call the appropriate generation method
            if (window.app.generateCollage) {
                // Store the original effect selection function if it exists
                const originalSelectEffect = window.app.selectEffect || null;
                
                // Temporarily override the effect selection if needed
                if (window.app.selectEffect) {
                    window.app.selectEffect = function() {
                        console.log(`[Tester] Forcing effect: ${effectName}`);
                        return effectName;
                    };
                }
                
                // Generate a collage with the specified effect
                window.app.generateCollage();
                
                // Restore the original function
                if (originalSelectEffect) {
                    window.app.selectEffect = originalSelectEffect;
                }
                
                if (statusEl) {
                    statusEl.textContent = `Generated ${effectName}`;
                }
            } else {
                console.log('[Tester] app.generateCollage method not found');
                if (statusEl) {
                    statusEl.textContent = 'Error: generateCollage not found';
                }
            }
        } catch (error) {
            console.error(`[Tester] Error testing ${effectName}:`, error);
            if (statusEl) {
                statusEl.textContent = `Error testing ${effectName}`;
            }
        }
    }
    
    // Function to disable masking
    function disableMasking() {
        const statusEl = document.getElementById('effect-tester-status');
        
        try {
            // Find the mask integration
            let maskIntegration = null;
            if (window.maskIntegration) {
                maskIntegration = window.maskIntegration;
            } else if (window.app && window.app.maskIntegration) {
                maskIntegration = window.app.maskIntegration;
            }
            
            if (maskIntegration) {
                console.log('[Tester] Found mask integration, attempting to disable...');
                
                // Try to disable masking by different methods
                if (typeof maskIntegration.disable === 'function') {
                    maskIntegration.disable();
                    console.log('[Tester] Called maskIntegration.disable()');
                } else if (typeof maskIntegration.setEnabled === 'function') {
                    maskIntegration.setEnabled(false);
                    console.log('[Tester] Called maskIntegration.setEnabled(false)');
                } else {
                    // Try a more direct approach
                    maskIntegration.enabled = false;
                    console.log('[Tester] Set maskIntegration.enabled = false');
                }
                
                if (statusEl) {
                    statusEl.textContent = 'Masking disabled';
                }
                
                // Regenerate current collage
                if (window.app && window.app.generateCollage) {
                    window.app.generateCollage();
                }
            } else {
                console.log('[Tester] Mask integration not found');
                
                // Try a different approach - modify the drawFragment method
                if (window.app && window.app.collageGenerator && window.app.collageGenerator.drawFragment) {
                    const origDrawFrag = window.app.collageGenerator.drawFragment;
                    
                    window.app.collageGenerator.drawFragment = function(fragment, ctx) {
                        // Remove mask before drawing
                        const origMask = fragment.mask;
                        fragment.mask = null;
                        
                        // Call original method
                        const result = origDrawFrag.call(this, fragment, ctx);
                        
                        // Restore original mask
                        fragment.mask = origMask;
                        
                        return result;
                    };
                    
                    console.log('[Tester] Modified drawFragment to ignore masks');
                    
                    if (statusEl) {
                        statusEl.textContent = 'Masks bypassed';
                    }
                    
                    // Regenerate current collage
                    if (window.app && window.app.generateCollage) {
                        window.app.generateCollage();
                    }
                } else {
                    console.log('[Tester] Could not find a way to disable masking');
                    
                    if (statusEl) {
                        statusEl.textContent = 'Could not disable masking';
                    }
                }
            }
        } catch (error) {
            console.error('[Tester] Error disabling masking:', error);
            if (statusEl) {
                statusEl.textContent = 'Error disabling masking';
            }
        }
    }
    
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const ui = createTestUI();
            document.body.appendChild(ui);
        });
    } else {
        // DOM already loaded
        const ui = createTestUI();
        document.body.appendChild(ui);
    }
    
    console.log('[Tester] Effect tester initialized');
})();
