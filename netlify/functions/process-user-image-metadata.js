import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase service role key. Checked: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check if Supabase client is initialized
  if (!supabase) {
    console.error('Supabase client not initialized. Missing environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Service configuration error',
        details: 'Missing required environment variables for Supabase'
      })
    };
  }

  try {
    const { imageId } = JSON.parse(event.body);
    
    if (!imageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image ID required' })
      };
    }

    // Get the image record
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      console.error('Error fetching image:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Image not found' })
      };
    }

    // Check if metadata already exists
    if (image.metadata_status === 'complete') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Metadata already exists' })
      };
    }

    // Update status to processing
    await supabase
      .from('images')
      .update({ metadata_status: 'processing' })
      .eq('id', imageId);

    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        throw new Error('OpenAI API key not configured');
      }
      
      console.log('Analyzing image with OpenAI:', image.id, image.src?.substring(0, 50) + '...');
      
      // Use GPT Vision API to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an art curator analyzing images. Always respond with valid JSON only, no markdown formatting, no code blocks, no backticks."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and provide:
1. A brief, poetic description (2-3 sentences)
2. 5-7 relevant tags that capture the essence, mood, and content
3. A short caption (under 10 words)

Respond ONLY with valid JSON, no markdown formatting or backticks:
{
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "caption": "..."
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: image.src,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      
      // Clean the response - remove any markdown formatting
      const cleanedContent = content
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .trim();
      
      let metadata;
      try {
        metadata = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', cleanedContent);
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      // Validate metadata structure
      if (!metadata.description || !Array.isArray(metadata.tags) || !metadata.caption) {
        console.error('Invalid metadata structure:', metadata);
        throw new Error('Metadata missing required fields');
      }
      
      // Ensure tags are strings and limit to 7
      metadata.tags = metadata.tags
        .filter(tag => typeof tag === 'string')
        .slice(0, 7);

      // Update the image record with metadata
      const { error: updateError } = await supabase
        .from('images')
        .update({
          description: metadata.description,
          tags: metadata.tags,
          metadata: metadata,
          metadata_status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (updateError) {
        throw updateError;
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          metadata: metadata
        })
      };

    } catch (analysisError) {
      console.error('Error analyzing image:', analysisError);
      
      // Update status to error
      await supabase
        .from('images')
        .update({ 
          metadata_status: 'error',
          metadata_error: analysisError.message 
        })
        .eq('id', imageId);

      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to analyze image',
          details: analysisError.message 
        })
      };
    }

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}
