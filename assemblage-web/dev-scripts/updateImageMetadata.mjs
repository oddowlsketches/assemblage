// dev-scripts/updateImageMetadata.mjs
/**
 * Script to update existing images with rich metadata
 * Run from assemblage-web directory: node dev-scripts/updateImageMetadata.mjs
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configuration
const BATCH_SIZE = 5; // Process 5 images at a time
const DELAY_MS = 2000; // 2 second delay between batches to respect API limits

/**
 * Analyze image properties using canvas (for use in Node.js, we'll skip this 
 * and focus on LLM analysis, but include the structure for future browser use)
 */
function createEnhancedImagePrompt() {
  return `Analyze this image for use in artistic collages. Please provide:

1. A detailed artistic description focusing on composition, texture, and visual elements
2. Determine the image role: 
   - "texture" for backgrounds, patterns, or filler elements
   - "narrative" for main subjects, people, objects with clear focus
   - "conceptual" for abstract, symbolic, or text-based content
3. Identify if this is a photograph or illustration
4. Assess which color palette would work best - FOR BLACK AND WHITE IMAGES, consider the contrast and mood:
   - "vibrant" for high-contrast B&W that could pair with bold colors
   - "neutral" for pure grayscale images that work with any palette
   - "earthtone" for warm-toned or sepia-like B&W images
   - "muted" for soft, low-contrast B&W images
   - "pastel" for light, ethereal B&W images
   For COLOR images:
   - "vibrant" for bold, saturated colors
   - "earthtone" for browns, greens, natural colors
   - "muted" for desaturated, soft colors
   - "pastel" for light, soft colors
5. Determine if the image is primarily black and white (low color saturation)
6. Provide 5-7 relevant tags for categorization

Format your response exactly as:
DESCRIPTION: [detailed description]
ROLE: [texture/narrative/conceptual]  
TYPE: [photograph/illustration]
PALETTE: [vibrant/neutral/earthtone/muted/pastel]
BLACK_AND_WHITE: [true/false]
TAGS: [tag1, tag2, tag3, tag4, tag5, tag6, tag7]`;
}

/**
 * Parse OpenAI response to extract structured metadata
 */
function parseOpenAIResponse(response) {
  const result = {
    description: '',
    image_role: 'narrative',
    is_photograph: true,
    palette_suitability: 'vibrant',
    is_black_and_white: false,
    tags: [],
    white_edge_score: 0 // We'll set this to a default for now
  };
  
  try {
    // Extract description
    const descMatch = response.match(/DESCRIPTION:\s*(.+?)(?=\n[A-Z_]+:|$)/s);
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
    
    // Extract black and white
    const bwMatch = response.match(/BLACK_AND_WHITE:\s*(true|false)/i);
    if (bwMatch) {
      result.is_black_and_white = bwMatch[1].toLowerCase() === 'true';
    }
    
    // Extract tags
    const tagsMatch = response.match(/TAGS:\s*(.+?)(?=\n[A-Z_]+:|$)/s);
    if (tagsMatch) {
      const tagsString = tagsMatch[1].trim();
      result.tags = tagsString
        .replace(/[\[\]]/g, '') // Remove brackets
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 7); // Limit to 7 tags
    }
    
  } catch (error) {
    console.warn('Error parsing OpenAI response:', error);
  }
  
  return result;
}

/**
 * Process a single image with OpenAI Vision API
 */
async function processImage(image) {
  console.log(`\nProcessing image: ${image.id}`);
  console.log(`Title: ${image.title}`);
  console.log(`Source: ${image.src}`);
  
  try {
    // Update status to processing
    await supabase
      .from('images')
      .update({ 
        metadata_status: 'processing',
        last_processed: new Date().toISOString()
      })
      .eq('id', image.id);
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the latest vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: createEnhancedImagePrompt()
            },
            {
              type: "image_url",
              image_url: {
                url: image.src,
                detail: "low" // Use low detail to reduce costs
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1 // Low temperature for consistent results
    });
    
    const responseText = response.choices[0].message.content;
    console.log('OpenAI Response:', responseText);
    
    // Check if OpenAI refused to analyze the image
    if (responseText.includes("I'm unable to analyze") || 
        responseText.includes("I cannot analyze") ||
        responseText.includes("I can't analyze") ||
        responseText.length < 50) {
      throw new Error('OpenAI refused to analyze image or gave generic response');
    }
    
    // Parse the response
    const metadata = parseOpenAIResponse(responseText);
    
    // Update the database with new metadata
    const updateData = {
      description: metadata.description,
      image_role: metadata.image_role,
      is_photograph: metadata.is_photograph,
      palette_suitability: metadata.palette_suitability,
      is_black_and_white: metadata.is_black_and_white,
      white_edge_score: metadata.white_edge_score,
      tags: metadata.tags,
      metadata_status: 'complete',
      last_processed: new Date().toISOString(),
      processing_error: null
    };
    
    const { error: updateError } = await supabase
      .from('images')
      .update(updateData)
      .eq('id', image.id);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Successfully processed:', {
      role: metadata.image_role,
      palette: metadata.palette_suitability,
      bw: metadata.is_black_and_white,
      tags: metadata.tags.length
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error processing image:', error.message);
    
    // Update status to error
    await supabase
      .from('images')
      .update({ 
        metadata_status: 'error',
        processing_error: error.message,
        last_processed: new Date().toISOString()
      })
      .eq('id', image.id);
    
    return false;
  }
}

/**
 * Main function to process all images
 */
async function main() {
  console.log('🚀 Starting image metadata update process...');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
    console.error('❌ Missing required environment variables');
    console.log('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
    console.log('OPENAI_API_KEY:', OPENAI_API_KEY ? '✅' : '❌');
    process.exit(1);
  }
  
  // Get all images that need processing
  const { data: images, error } = await supabase
    .from('images')
    .select('*')
    .or(
      'metadata_status.in.(pending_llm,error),' + 
      'description.is.null,' +
      'description.eq.' 
    )
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching images:', error);
    process.exit(1);
  }
  
  console.log(`📊 Found ${images.length} images to process`);
  
  if (images.length === 0) {
    console.log('✅ No images need processing');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process images in batches
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(images.length / BATCH_SIZE)}`);
    
    // Process batch concurrently
    const batchPromises = batch.map(processImage);
    const batchResults = await Promise.all(batchPromises);
    
    // Count results
    batchResults.forEach(success => {
      if (success) successCount++;
      else errorCount++;
    });
    
    // Delay between batches to respect API limits
    if (i + BATCH_SIZE < images.length) {
      console.log(`⏱️  Waiting ${DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  console.log('\n🎉 Processing complete!');
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n🔍 Images with errors can be reprocessed by running this script again');
  }
}

// Run the script
main().catch(console.error);
