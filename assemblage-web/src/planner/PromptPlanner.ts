export class PromptPlanner {
  constructor(private maskLibrary: string[]) {}
  
  async plan(prompt: string): Promise<MaskPlacement[]> {
    // Convert prompt to lowercase for case-insensitive matching
    const lowerPrompt = prompt.toLowerCase();
    
    // Determine which masks to use based on the prompt
    let masks: string[] = [];
    
    if (lowerPrompt.includes('arch')) {
      masks = ["arch"];
    } else if (lowerPrompt.includes('arc') || lowerPrompt.includes('circle')) {
      masks = ["arc"];
    } else if (lowerPrompt.includes('diamond')) {
      masks = ["diamond"];
    } else if (lowerPrompt.includes('hex') || lowerPrompt.includes('crystal')) {
      masks = ["hexagon"];
    } else if (lowerPrompt.includes('star')) {
      masks = ["star"];
    } else {
      // If no specific keyword is found, use all available masks
      masks = this.maskLibrary;
    }
    
    // Filter out masks that don't exist in the library
    const availableMasks = masks.filter(mask => this.maskLibrary.includes(mask));
    
    // If no matching masks were found, use all available masks
    const masksToUse = availableMasks.length > 0 ? availableMasks : this.maskLibrary;
    
    // Determine the number of masks to use (3-7)
    const numMasks = Math.min(Math.max(3, Math.floor(Math.random() * 5) + 3), masksToUse.length);
    
    // Create placements with more meaningful positions
    const placements: MaskPlacement[] = [];
    
    // For architectural prompts, create a more structured layout
    if (lowerPrompt.includes('arch') || lowerPrompt.includes('building') || lowerPrompt.includes('facade')) {
      // Create a more structured layout for architectural elements
      for (let i = 0; i < numMasks; i++) {
        const maskName = masksToUse[i % masksToUse.length];
        
        // Calculate position based on index
        const x = 100 + (i * 200);
        const y = 300; // Center vertically
        
        // Vary the size slightly
        const width = 180 + Math.random() * 40;
        const height = 180 + Math.random() * 40;
        
        // Minimal rotation for architectural elements
        const rotation = Math.random() * 20 - 10; // -10 to +10 degrees
        
        placements.push({
          maskName,
          x,
          y,
          width,
          height,
          rotation,
          layer: i
        });
      }
    } else {
      // For other prompts, create a more random layout
      for (let i = 0; i < numMasks; i++) {
        const maskName = masksToUse[i % masksToUse.length];
        
        // Random position
        const x = Math.random() * 800;
        const y = Math.random() * 600;
        
        // Vary the size
        const width = 150 + Math.random() * 100;
        const height = 150 + Math.random() * 100;
        
        // Random rotation
        const rotation = Math.random() * 360;
        
        placements.push({
          maskName,
          x,
          y,
          width,
          height,
          rotation,
          layer: i
        });
      }
    }
    
    return placements;
  }
}

export interface MaskPlacement {
  maskName: string;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  layer: number;
} 