// Log available test functions
console.log('Test functions are now available in the global scope:');
console.log('- testSplitElement() - Split a single element');
console.log('- testMaskElement() - Apply masking to elements');
console.log('- testAllFeatures() - Apply multiple enhancements');
console.log('- testRelationshipEnhancement() - Create visual relationships between elements');
console.log('- testSingleMask(type) - Test individual mask shapes (e.g. circle, star, etc.)');
/**
 * Test Console for Narrative Composition
 * 
 * This file provides global test functions for the narrative composition test page.
 * It's loaded separately from the main application to avoid circular dependencies.
 */

// Test Console for Narrative Composition
console.log('Test console initialized');

// Get the NarrativeTest instance
const getNarrativeTest = () => {
    const instance = window.narrativeTest;
    if (!instance) {
        console.error("NarrativeTest instance not found");
        return null;
    }
    return instance;
};

// Test Split Element
window.testSplitElement = () => {
    const narrativeTest = window.narrativeTest;
    if (!narrativeTest) {
        console.error("NarrativeTest instance not found");
        return;
    }

    if (!narrativeTest.currentFragments || narrativeTest.currentFragments.length === 0) {
        console.warn("No fragments available for splitting");
        return;
    }

    try {
        // Get the first fragment
        const element = narrativeTest.currentFragments[0];
        console.log('Original element:', element);

        // Get the image object
        const imgObj = narrativeTest.images[element.img];
        if (!imgObj) {
            console.error('Image object not found');
            return;
        }

        // Split the element
        const splitFragments = narrativeTest.narrativeManager.splitElement(
            element,
            'vertical',
            3,
            10,
            imgObj
        );

        if (!splitFragments) {
            console.error('Failed to split element');
            return;
        }

        // Replace the original fragment with the split fragments
        const index = narrativeTest.currentFragments.indexOf(element);
        if (index !== -1) {
            narrativeTest.currentFragments.splice(index, 1, ...splitFragments);
        }

        // Redraw the fragments
        narrativeTest.drawFragments(narrativeTest.narrativeCtx, narrativeTest.currentFragments, true);
        console.log('Split fragments:', splitFragments);
    } catch (error) {
        console.error('Error in testSplitElement:', error);
    }
};

// Test Mask Element
window.testMaskElement = () => {
    console.log('Testing extended mask element functionality...');
    const narrativeTest = getNarrativeTest();
    if (!narrativeTest) return;
    
    if (!narrativeTest.currentFragments || !narrativeTest.currentFragments.length) {
        console.warn("No fragments available to mask");
        alert("Please generate a collage first before testing mask functionality");
        return;
    }
    
    try {
        // Clear the canvas before drawing
        narrativeTest.narrativeCtx.clearRect(0, 0, narrativeTest.narrativeCanvas.width, narrativeTest.narrativeCanvas.height);
        
        // Define the extended mask types
        const maskTypes = [
            'circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'
        ];
        
        // Apply different mask types to different fragments for demonstration
        const fragments = JSON.parse(JSON.stringify(narrativeTest.currentFragments));
        
        // Apply masks to fragments
        fragments.forEach((fragment, index) => {
            // Select mask type based on index
            const maskTypeIndex = index % maskTypes.length;
            const maskType = maskTypes[maskTypeIndex];
            
            console.log(`Applying mask type: ${maskType} to fragment ${index}`);
            
            // Set up mask parameters based on type
            let maskParams = {};
            if (maskType === 'arc') {
                maskParams = {
                    startAngle: 0,
                    endAngle: Math.PI,
                    arcWidth: 0.2
                };
            }
            
            // Apply the mask directly using the narrativeManager
            const maskedFragment = narrativeTest.narrativeManager.maskElement(fragment, maskType, maskParams);
            
            // Copy all properties from maskedFragment back to the original fragment
            Object.assign(fragment, maskedFragment);
            
            // Log what was applied
            console.log(`Applied '${maskType}' mask to fragment ${index}`);
        });
        
        // Update the fragments
        narrativeTest.currentFragments = fragments;
        narrativeTest.narrativeFragments = fragments;
        
        // Redraw with masks
        narrativeTest.drawFragments(narrativeTest.narrativeCtx, fragments, true);
        
        console.log('Extended mask elements applied successfully');
    } catch (error) {
        console.error("Error in testMaskElement:", error);
        alert("An error occurred while testing mask functionality");
    }
};

// Test All Features
window.testAllFeatures = () => {
    console.log('Testing advanced narrative features...');
    const narrativeTest = getNarrativeTest();
    if (!narrativeTest) return;
    
    if (!narrativeTest.currentFragments || !narrativeTest.currentFragments.length) {
        alert("No collage generated yet. Please generate a collage first.");
        return;
    }
    
    try {
        // Create a copy of the fragments to work with
        const fragments = JSON.parse(JSON.stringify(narrativeTest.currentFragments));
        
        // Sort fragments by size to identify potential focal elements
        fragments.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        // Identify main focal element (one of the larger elements)
        const focalIndex = Math.floor(Math.random() * Math.min(3, fragments.length));
        const focalElement = fragments[focalIndex];
        
        // Create visual emphasis on focal element
        if (focalElement) {
            // Increase size slightly to create emphasis
            const sizeIncrease = 1.15;
            
            // Calculate the center position to maintain center point after scaling
            const centerX = focalElement.x + focalElement.width/2;
            const centerY = focalElement.y + focalElement.height/2;
            
            // Apply size increase
            focalElement.width *= sizeIncrease;
            focalElement.height *= sizeIncrease;
            
            // Recalculate position to maintain center point
            focalElement.x = centerX - focalElement.width/2;
            focalElement.y = centerY - focalElement.height/2;
            
            // Ensure maximum visibility
            focalElement.opacity = 1.0;
            focalElement.depth = 0.1; // Move closer to foreground
            focalElement.blendMode = 'multiply'; // Ensure multiply blend mode
            
            // Apply interesting mask to focal element
            focalElement.maskType = 'star';
            
            // Generate proper star points using narrativeManager
            const tempMaskedFocal = narrativeTest.narrativeManager.maskElement(focalElement, 'star');
            focalElement.maskParams = tempMaskedFocal.maskParams;
            
            console.log('Applied star mask to focal element');
        }
        
        // Create 1-2 supporting elements that interact with the focal element
        const availableForSplitting = fragments.filter((f, idx) => 
            idx !== focalIndex && f.width > 100 && f.height > 100);
        
        // If we have elements available for splitting
        if (availableForSplitting.length > 0) {
            // Split one supporting element to create visual tension
            const elementToSplit = availableForSplitting[0];
            const splitType = Math.random() < 0.5 ? 'vertical' : 'horizontal';
            const splitCount = 2;
            const spacing = 15;
            
            try {
                // Create a proper copy with all needed properties
                const elementCopy = JSON.parse(JSON.stringify(elementToSplit));
                
                // Add required properties if missing
                if (elementCopy.img !== undefined && narrativeTest.images) {
                    const imgObj = narrativeTest.images[elementCopy.img];
                    if (imgObj && imgObj.img) {
                        elementCopy.sourceWidth = imgObj.img.naturalWidth;
                        elementCopy.sourceHeight = imgObj.img.naturalHeight;
                    }
                }
                
                // Split the element using the NarrativeManager's method
                const splitFragments = narrativeTest.narrativeManager.splitElement(
                    elementCopy, splitType, splitCount, spacing
                );
                
                if (splitFragments && splitFragments.length > 0) {
                    // Find the index of the element to replace
                    const originalIndex = fragments.findIndex(f => 
                        f.x === elementToSplit.x && f.y === elementToSplit.y);
                    
                    if (originalIndex >= 0) {
                        // Replace with split fragments
                        fragments.splice(originalIndex, 1, ...splitFragments);
                    }
                }
            } catch (error) {
                console.error("Error splitting element:", error);
            }
        }
        
        // Create relationships between remaining elements
        fragments.forEach((fragment, index) => {
            if (index === focalIndex) return;
            
            // Calculate distance to focal element
            if (focalElement) {
                const dx = fragment.x - focalElement.x;
                const dy = fragment.y - focalElement.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Rotate elements to relate to focal element
                const angle = Math.atan2(dy, dx);
                fragment.rotation = (angle * 180 / Math.PI) + (Math.random() - 0.5) * 20;
                
                // Adjust opacity based on distance
                const maxDistance = Math.sqrt(
                    Math.pow(narrativeTest.narrativeCanvas.width, 2) + 
                    Math.pow(narrativeTest.narrativeCanvas.height, 2)
                ) / 2;
                
                const distanceRatio = Math.min(1, distance / maxDistance);
                fragment.opacity = 1 - (distanceRatio * 0.4); // Fade distant elements slightly
            }
            
            // Add random masking to some elements for visual interest
            if (Math.random() < 0.25) { // 25% chance of masking
                const maskTypes = ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'];
                const selectedMaskType = maskTypes[Math.floor(Math.random() * maskTypes.length)];
                fragment.maskType = selectedMaskType;
                
                // For complex shapes like star and hexagon, generate proper points
                if (selectedMaskType === 'star' || selectedMaskType === 'hexagon') {
                    // We need to get the original parameters from narrativeManager
                    const tempMasked = narrativeTest.narrativeManager.maskElement(fragment, selectedMaskType);
                    fragment.maskParams = tempMasked.maskParams;
                }
            }
        });
        
        // Ensure proper depth sorting
        fragments.sort((a, b) => (a.depth || 0) - (b.depth || 0));
        
        // Update the current fragments and redraw
        narrativeTest.currentFragments = fragments;
        narrativeTest.narrativeFragments = fragments;
        
        // Redraw with updated fragments
        narrativeTest.drawFragments(narrativeTest.narrativeCtx, fragments, true);
        
        console.log('Enhanced narrative composition applied successfully');
    } catch (error) {
        console.error("Error in testAllFeatures:", error);
        alert("An error occurred while testing advanced narrative features");
    }
};

// Test Individual Mask Type
window.testSingleMask = (maskType) => {
    console.log(`Testing specific mask shape: ${maskType}`);
    const narrativeTest = getNarrativeTest();
    if (!narrativeTest) return;
    
    if (!narrativeTest.currentFragments || !narrativeTest.currentFragments.length) {
        console.warn("No fragments available to mask");
        alert("Please generate a collage first before testing mask functionality");
        return;
    }
    
    try {
        // Make a deep copy of the first fragment
        const fragment = JSON.parse(JSON.stringify(narrativeTest.currentFragments[0]));
        
        // Make it large and centered
        const canvasWidth = narrativeTest.narrativeCanvas.width;
        const canvasHeight = narrativeTest.narrativeCanvas.height;
        
        // Resize to occupy significant portion of canvas
        const newWidth = canvasWidth * 0.6;
        const newHeight = canvasHeight * 0.6;
        
        // Center the fragment
        fragment.x = (canvasWidth - newWidth) / 2;
        fragment.y = (canvasHeight - newHeight) / 2;
        fragment.width = newWidth;
        fragment.height = newHeight;
        
        // Set other properties
        fragment.opacity = 1.0;
        fragment.depth = 0;
        fragment.blendMode = 'multiply';
        
        // Apply the specific mask using narrativeManager
        console.log(`Applying ${maskType} mask...`);
        
        // Set up specific parameters for arc and arch masks
        let maskParams = {};
        if (maskType === 'arc') {
            maskParams = {
                startAngle: 0,
                endAngle: 180, // Half-circle arc
                arcWidth: Math.min(fragment.width, fragment.height) / 3 // Thicker arc
            };
        } else if (maskType === 'arch') {
            // Set arch parameters to create a classic architectural arch shape
            maskParams = {
                // Using default parameters which will create a proper arch shape
                // with the top portion rounded and straight sides
            };
        }
        
        const masked = narrativeTest.narrativeManager.maskElement(fragment, maskType, maskParams);
        console.log('Masked fragment:', masked);
        
        // Clear canvas
        narrativeTest.narrativeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw with the mask
        const singleFragmentArray = [masked];
        narrativeTest.drawFragments(narrativeTest.narrativeCtx, singleFragmentArray, true);
        
        console.log(`Mask shape '${maskType}' applied successfully`);
    } catch (error) {
        console.error(`Error testing ${maskType} mask:`, error);
        alert(`An error occurred while testing ${maskType} mask functionality`);
    }
};

// Create mask test buttons
if (typeof document !== 'undefined') {
    setTimeout(() => {
        try {
            // Create container for mask test buttons
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.gap = '10px';
            container.style.justifyContent = 'center';
            container.style.margin = '20px 0';
            
            // Define mask types
            const maskTypes = ['circle', 'triangle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'star', 'arc', 'arch'];
            
            // Create button for each mask type
            maskTypes.forEach(maskType => {
                const button = document.createElement('button');
                button.textContent = `Test ${maskType} Mask`;
                button.style.padding = '8px 12px';
                button.style.backgroundColor = '#3498db';
                button.style.color = 'white';
                button.style.border = 'none';
                button.style.borderRadius = '4px';
                button.style.cursor = 'pointer';
                
                button.addEventListener('click', () => {
                    window.testSingleMask(maskType);
                });
                
                container.appendChild(button);
            });
            
            // Add container below existing buttons
            const featureTests = document.querySelector('.feature-tests');
            if (featureTests) {
                featureTests.appendChild(container);
            }
        } catch (error) {
            console.error('Error setting up mask test buttons:', error);
        }
    }, 1000); // Wait for DOM to be ready
}

// Test Relationship Enhancement - Special function for creating visual connections between elements
window.testRelationshipEnhancement = () => {
    console.log('Testing relationship enhancement...');
    const narrativeTest = getNarrativeTest();
    if (!narrativeTest) return;
    
    if (!narrativeTest.currentFragments || narrativeTest.currentFragments.length === 0) {
        alert("No collage generated yet. Please generate a collage first.");
        return;
    }
    
    try {
        // Create a deep copy of the current fragments
        const fragments = JSON.parse(JSON.stringify(narrativeTest.currentFragments));
        
        // First, select 3-5 fragments to use for the relationship pattern
        const fragmentCount = Math.min(fragments.length, Math.floor(Math.random() * 3) + 3); // 3-5 fragments
        
        // Sort fragments by size to get a mix of large and small elements
        fragments.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        // Select every other element to get a mix of sizes
        const selectedIndices = [];
        for (let i = 0; i < fragmentCount; i++) {
            selectedIndices.push(i * 2 % fragments.length);
        }
        
        // Choose a relationship pattern
        const patterns = ['circular', 'diagonal', 'pyramid', 'cascade'];
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        console.log(`Applying ${selectedPattern} relationship pattern with ${fragmentCount} elements`);
        
        // Get canvas dimensions
        const canvasWidth = narrativeTest.narrativeCanvas.width;
        const canvasHeight = narrativeTest.narrativeCanvas.height;
        
        // Apply the selected pattern
        switch (selectedPattern) {
            case 'circular':
                // Arrange in a circle around the center
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const radius = Math.min(canvasWidth, canvasHeight) * 0.3;
                
                selectedIndices.forEach((index, i) => {
                    const fragment = fragments[index];
                    
                    // Calculate position on the circle
                    const angle = (i / selectedIndices.length) * Math.PI * 2;
                    
                    // Calculate center position for the fragment
                    const fragmentCenterX = centerX + Math.cos(angle) * radius;
                    const fragmentCenterY = centerY + Math.sin(angle) * radius;
                    
                    // Update fragment position (adjusting for width/height)
                    fragment.x = fragmentCenterX - fragment.width / 2;
                    fragment.y = fragmentCenterY - fragment.height / 2;
                    
                    // Rotate to face center
                    fragment.rotation = (angle * 180 / Math.PI) + 90;
                    
                    // Ensure high visibility
                    fragment.opacity = 0.9 + (Math.random() * 0.1);
                    
                    // Move relational fragments to foreground
                    fragment.depth = 0.1 + (i * 0.05);
                    
                    // Ensure blend mode is always set to multiply
                    fragment.blendMode = 'multiply';
                });
                break;
                
            case 'diagonal':
                // Arrange along a diagonal line from top-left to bottom-right
                const startX = canvasWidth * 0.15;
                const startY = canvasHeight * 0.15;
                const endX = canvasWidth * 0.85;
                const endY = canvasHeight * 0.85;
                
                selectedIndices.forEach((index, i) => {
                    const fragment = fragments[index];
                    const progress = i / (selectedIndices.length - 1 || 1);
                    
                    // Calculate position along diagonal
                    const fragmentCenterX = startX + (endX - startX) * progress;
                    const fragmentCenterY = startY + (endY - startY) * progress;
                    
                    // Update fragment position
                    fragment.x = fragmentCenterX - fragment.width / 2;
                    fragment.y = fragmentCenterY - fragment.height / 2;
                    
                    // Rotate to follow diagonal
                    const angle = Math.atan2(endY - startY, endX - startX);
                    fragment.rotation = (angle * 180 / Math.PI) + (Math.random() - 0.5) * 15;
                    
                    // Ensure high visibility
                    fragment.opacity = 0.9 + (Math.random() * 0.1);
                    
                    // Progressively increase depth (later elements in front)
                    fragment.depth = 0.1 + (progress * 0.3);
                    
                // Create overlaps between adjacent elements
                    if (i > 0) {
                        // Move slightly toward previous element for overlap
                        const overlapAmount = 0.2; // 20% overlap
                        fragment.x -= (fragment.width * overlapAmount) * Math.cos(angle);
                        fragment.y -= (fragment.height * overlapAmount) * Math.sin(angle);
                    }
                    
                    // Ensure blend mode is always set to multiply
                    fragment.blendMode = 'multiply';
                });
                break;
                
            case 'pyramid':
                // Arrange in a pyramid pattern
                // Large element at bottom, smaller elements stacked above
                
                // Sort selected fragments by size (largest first)
                const pyramidIndices = [...selectedIndices].sort((a, b) => {
                    const areaA = fragments[a].width * fragments[a].height;
                    const areaB = fragments[b].width * fragments[b].height;
                    return areaB - areaA;
                });
                
                // Base position for the pyramid
                const baseX = canvasWidth / 2;
                const baseY = canvasHeight * 0.75;
                
                pyramidIndices.forEach((index, i) => {
                    const fragment = fragments[index];
                    const layerHeight = canvasHeight * 0.2; // Height per layer
                    
                    // Position fragments with larger ones at the bottom
                    if (i === 0) {
                        // Base element centered at bottom
                        fragment.x = baseX - fragment.width / 2;
                        fragment.y = baseY - fragment.height / 2;
                        fragment.depth = 0.4; // Base in background
                    } else {
                        // Progressively stack and center above, with slight randomness
                        const offset = (Math.random() - 0.5) * 40; // Random horizontal variation
                        fragment.x = baseX - fragment.width / 2 + offset;
                        fragment.y = baseY - fragment.height / 2 - (layerHeight * i);
                        fragment.depth = 0.4 - (i * 0.1); // Higher elements more in foreground
                    }
                    
                    // Add slight rotation variation
                    fragment.rotation = (Math.random() - 0.5) * 10;
                    
                    // Ensure high visibility with slight progression
                    fragment.opacity = 0.85 + (i * 0.03);
                    
                    // Ensure blend mode is always set to multiply
                    fragment.blendMode = 'multiply';
                });
                break;
                
            case 'cascade':
                // Create a flowing cascade from top to bottom
                const cascadeStartX = canvasWidth * 0.2;
                const cascadeWidth = canvasWidth * 0.6;
                
                selectedIndices.forEach((index, i) => {
                    const fragment = fragments[index];
                    const progress = i / (selectedIndices.length - 1 || 1);
                    
                    // Calculate position with S-curve horizontal movement
                    const horizontalOffset = Math.sin(progress * Math.PI * 2) * (cascadeWidth * 0.4);
                    fragment.x = cascadeStartX + (cascadeWidth * 0.5) + horizontalOffset - fragment.width / 2;
                    fragment.y = canvasHeight * 0.1 + (canvasHeight * 0.7 * progress) - fragment.height / 2;
                    
                    // Rotate to follow the flow
                    const flowDirection = Math.cos(progress * Math.PI * 2); // Changes direction along the cascade
                    fragment.rotation = flowDirection * 20;
                    
                    // Variable opacity for depth
                    fragment.opacity = 0.85 + (Math.sin(progress * Math.PI) * 0.15);
                    
                    // Progressive depth change
                    fragment.depth = progress * 0.5;
                    
                    // Ensure blend mode is always set to multiply
                    fragment.blendMode = 'multiply';
                });
                break;
        }
        
        // For non-selected fragments, make them recede into the background
        fragments.forEach((fragment, index) => {
            if (!selectedIndices.includes(index)) {
                // Reduce opacity but keep it visible
                fragment.opacity = 0.65 + (Math.random() * 0.15);
                
                // Push to background
                fragment.depth = 0.6 + (Math.random() * 0.3);
                
                // Always use multiply blend mode
                fragment.blendMode = 'multiply';
            }
        });
        
        // Sort fragments by depth for proper layering
        fragments.sort((a, b) => (a.depth || 0) - (b.depth || 0));
        
        // Update current fragments and redraw
        narrativeTest.currentFragments = fragments;
        narrativeTest.narrativeFragments = fragments;
        
        // Redraw with enhanced relationships
        narrativeTest.drawFragments(narrativeTest.narrativeCtx, fragments, true);
        
        console.log(`Relationship enhancement (${selectedPattern}) applied successfully`);
    } catch (error) {
        console.error("Error in testRelationshipEnhancement:", error);
        alert("An error occurred while testing relationship enhancement");
    }
};