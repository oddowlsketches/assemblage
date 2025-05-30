import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      // Use GPT Vision API to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and provide:
1. A brief, poetic description (2-3 sentences)
2. 5-7 relevant tags that capture the essence, mood, and content
3. A short caption (under 10 words)

Format your response as JSON:
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
      const metadata = JSON.parse(content);

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
