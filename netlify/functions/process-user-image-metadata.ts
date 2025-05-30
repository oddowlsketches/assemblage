import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProcessMetadataRequest {
  imageId: string;
  forceReprocess?: boolean;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageId, forceReprocess = false }: ProcessMetadataRequest = JSON.parse(event.body || '{}');
    
    if (!imageId) {
      return { statusCode: 400, body: 'Missing imageId' };
    }

    // Fetch the image record
    const { data: image, error: fetchError } = await supa
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Image not found' })
      };
    }

    // Check if already processed (unless force reprocess)
    if (image.metadata_status === 'complete' && !forceReprocess) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Metadata already processed',
          metadata: image.metadata
        })
      };
    }

    // Update status to processing
    await supa
      .from('images')
      .update({ metadata_status: 'processing' })
      .eq('id', imageId);

    // Fetch image and convert to base64
    const imageUrl = image.src || image.public_url;
    if (!imageUrl) {
      throw new Error('No image URL available');
    }

    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) {
      throw new Error('Unable to fetch image from URL');
    }
    
    const buffer = await imgResp.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Call OpenAI vision model with a more collage-specific prompt
    const prompt = `Analyze this black and white collage image. 

Provide:
1. A detailed description (2-3 sentences) of its composition, textures, and visual elements
2. A short caption (10-15 words) that captures its essence
3. 5-8 relevant tags that describe its content, style, and mood
4. Classify it as either "texture" (abstract patterns/surfaces), "narrative" (tells a story), or "conceptual" (represents ideas/concepts)

Format your response as JSON:
{
  "description": "detailed description here",
  "caption": "short caption here",
  "tags": ["tag1", "tag2", ...],
  "image_role": "texture|narrative|conceptual"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'low'
              }
            },
          ],
        },
      ],
    });

    const jsonString = completion.choices[0].message.content || '{}';
    console.log(`[USER_METADATA] OpenAI raw response for ID ${imageId}:`, jsonString);

    // Parse the response
    let cleanedJsonString = jsonString.trim();
    if (cleanedJsonString.startsWith('```json')) {
      cleanedJsonString = cleanedJsonString.substring(7);
      if (cleanedJsonString.endsWith('```')) {
        cleanedJsonString = cleanedJsonString.substring(0, cleanedJsonString.length - 3);
      }
    }
    cleanedJsonString = cleanedJsonString.trim();

    let metadata: any = {};
    try {
      metadata = JSON.parse(cleanedJsonString);
    } catch (parseError) {
      console.warn(`[USER_METADATA] Failed to parse OpenAI response for ID ${imageId}:`, parseError);
      
      // Fallback parsing
      const descMatch = cleanedJsonString.match(/description\s*:\s*"(.*?)"/i);
      const captionMatch = cleanedJsonString.match(/caption\s*:\s*"(.*?)"/i);
      const tagsMatch = cleanedJsonString.match(/tags\s*:\s*\[(.*?)\]/i);
      const roleMatch = cleanedJsonString.match(/image_role\s*:\s*"(.*?)"/i);

      metadata = {
        description: descMatch?.[1] || 'Black and white collage image',
        caption: captionMatch?.[1] || 'Untitled collage',
        tags: tagsMatch?.[1] ? 
          tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')) : 
          ['collage', 'black and white'],
        image_role: roleMatch?.[1] || 'narrative'
      };
    }

    // Validate image_role
    const validRoles = ['texture', 'narrative', 'conceptual'];
    if (!validRoles.includes(metadata.image_role)) {
      metadata.image_role = 'narrative';
    }

    // Update the image record with the metadata
    const updateData = {
      description: metadata.description,
      tags: metadata.tags,
      image_role: metadata.image_role,
      metadata: {
        ...image.metadata,
        caption: metadata.caption,
        description: metadata.description,
        tags: metadata.tags,
        generated_at: new Date().toISOString(),
        model: 'gpt-4o'
      },
      metadata_status: 'complete',
      last_processed: new Date().toISOString()
    };

    const { error: updateError } = await supa
      .from('images')
      .update(updateData)
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to update metadata: ${updateError.message}`);
    }

    console.log(`[USER_METADATA] Successfully updated metadata for ID ${imageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        metadata: updateData.metadata
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error: any) {
    console.error('[USER_METADATA] Error:', error);
    
    // Update status to error
    if (event.body) {
      const { imageId } = JSON.parse(event.body);
      if (imageId) {
        await supa
          .from('images')
          .update({ 
            metadata_status: 'error',
            processing_error: error.message,
            last_processed: new Date().toISOString()
          })
          .eq('id', imageId);
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message 
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};