// src/utils/imageAnalysis.js
/**
 * Image Analysis Utilities for Rich Metadata Detection
 * Analyzes images to extract properties for better collage generation
 */

/**
 * Analyze image properties for rich metadata
 * @param {string} imageUrl - URL or data URL of the image
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImageProperties(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const analysis = performImageAnalysis(imageData, canvas.width, canvas.height);
        
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Perform the actual image analysis on ImageData
 * @param {ImageData} imageData - Canvas ImageData object
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Analysis results
 */
function performImageAnalysis(imageData, width, height) {
  const data = imageData.data;
  const totalPixels = width * height;
  
  // Analysis variables
  let totalSaturation = 0;
  let whiteEdgePixels = 0;
  let totalEdgePixels = 0;
  let brightnessSum = 0;
  let contrastSum = 0;
  
  // Define edge regions (5% border)
  const edgeWidth = Math.floor(width * 0.05);
  const edgeHeight = Math.floor(height * 0.05);
  
  // Sample pixels for analysis (every 4th pixel for performance)
  const sampleRate = 4;
  let sampledPixels = 0;
  
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      sampledPixels++;
      
      // Calculate saturation (for B&W detection)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      brightnessSum += brightness;
      
      // Check if pixel is in edge region
      const isEdge = x < edgeWidth || x >= width - edgeWidth || 
                     y < edgeHeight || y >= height - edgeHeight;
      
      if (isEdge) {
        totalEdgePixels++;
        // Check if edge pixel is white-ish (> 240 in all channels)
        if (r > 240 && g > 240 && b > 240) {
          whiteEdgePixels++;
        }
      }
    }
  }
  
  // Calculate metrics
  const avgSaturation = totalSaturation / sampledPixels;
  const avgBrightness = brightnessSum / sampledPixels;
  const whiteEdgeScore = totalEdgePixels > 0 ? whiteEdgePixels / totalEdgePixels : 0;
  
  // Determine properties
  const isBlackAndWhite = avgSaturation < 0.1; // Less than 10% saturation
  const hasWhiteEdges = whiteEdgeScore > 0.7; // More than 70% white edge pixels
  
  // Classify image role based on characteristics
  let imageRole = 'narrative'; // default
  if (hasWhiteEdges && avgBrightness > 200) {
    imageRole = 'texture'; // Likely a texture or background element
  } else if (avgSaturation > 0.3 && avgBrightness < 100) {
    imageRole = 'conceptual'; // High contrast, low brightness suggests conceptual
  }
  
  // Determine palette suitability
  let paletteSuitability = 'vibrant';
  if (isBlackAndWhite) {
    paletteSuitability = 'neutral';
  } else if (avgBrightness > 180 && avgSaturation < 0.2) {
    paletteSuitability = 'pastel';
  } else if (avgBrightness < 80) {
    paletteSuitability = 'muted';
  } else if (avgSaturation > 0.5) {
    paletteSuitability = 'vibrant';
  } else {
    paletteSuitability = 'earthtone';
  }
  
  return {
    is_black_and_white: isBlackAndWhite,
    white_edge_score: Math.round(whiteEdgeScore * 100) / 100, // Round to 2 decimals
    image_role: imageRole,
    palette_suitability: paletteSuitability,
    // Additional metrics for debugging/refinement
    avg_saturation: Math.round(avgSaturation * 100) / 100,
    avg_brightness: Math.round(avgBrightness),
    has_white_edges: hasWhiteEdges
  };
}

/**
 * Enhanced prompt for OpenAI Vision API that includes metadata analysis
 * @param {Object} imageAnalysis - Results from analyzeImageProperties
 * @returns {string} Enhanced prompt for LLM
 */
export function createEnhancedImagePrompt(imageAnalysis) {
  return `Analyze this image for use in artistic collages. The image has been pre-analyzed with these properties:
- Black & white: ${imageAnalysis.is_black_and_white}
- White edges: ${imageAnalysis.has_white_edges ? 'Yes' : 'No'}
- Brightness: ${imageAnalysis.avg_brightness}/255
- Color saturation: ${Math.round(imageAnalysis.avg_saturation * 100)}%

Please provide:
1. A detailed artistic description focusing on composition, texture, and visual elements
2. Confirm or correct the image role: texture (background/filler), narrative (main subject), or conceptual (abstract/symbolic)
3. Suggest if this is a photograph or illustration
4. Rate suitability for color palettes: vibrant, neutral, earthtone, muted, or pastel
5. Provide 5-7 relevant tags

Format as:
DESCRIPTION: [detailed description]
ROLE: [texture/narrative/conceptual]
TYPE: [photograph/illustration]
PALETTE: [vibrant/neutral/earthtone/muted/pastel]
TAGS: [tag1, tag2, tag3, tag4, tag5, tag6, tag7]`;
}

/**
 * Parse OpenAI response to extract structured metadata
 * @param {string} response - Raw response from OpenAI
 * @returns {Object} Parsed metadata object
 */
export function parseOpenAIResponse(response) {
  const result = {
    description: '',
    image_role: 'narrative',
    is_photograph: true,
    palette_suitability: 'vibrant',
    tags: []
  };
  
  try {
    // Extract description
    const descMatch = response.match(/DESCRIPTION:\s*(.+?)(?=\n[A-Z]+:|$)/s);
    if (descMatch) {
      result.description = descMatch[1].trim();
    }
    
    // Extract role
    const roleMatch = response.match(/ROLE:\s*(texture|narrative|conceptual)/i);
    if (roleMatch) {
      result.image_role = roleMatch[1].toLowerCase();
    }
    
    // Extract type
    const typeMatch = response.match(/TYPE:\s*(photograph|illustration)/i);
    if (typeMatch) {
      result.is_photograph = typeMatch[1].toLowerCase() === 'photograph';
    }
    
    // Extract palette
    const paletteMatch = response.match(/PALETTE:\s*(vibrant|neutral|earthtone|muted|pastel)/i);
    if (paletteMatch) {
      result.palette_suitability = paletteMatch[1].toLowerCase();
    }
    
    // Extract tags
    const tagsMatch = response.match(/TAGS:\s*(.+?)(?=\n[A-Z]+:|$)/s);
    if (tagsMatch) {
      const tagsString = tagsMatch[1].trim();
      result.tags = tagsString
        .replace(/[\[\]]/g, '') // Remove brackets
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    
  } catch (error) {
    console.warn('Error parsing OpenAI response:', error);
  }
  
  return result;
}
