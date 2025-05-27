import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  let id: string | undefined;
  
  try {
    const { id: imageId, publicUrl } = JSON.parse(event.body || '{}');
    id = imageId; // Store id for error handling
    
    if (!id || !publicUrl) {
      return { statusCode: 400, body: 'Missing id or publicUrl' };
    }

    // Fetch image and convert to base64
    const imgResp = await fetch(publicUrl);
    if (!imgResp.ok) {
      return { statusCode: 400, body: 'Unable to fetch image' };
    }
    const buffer = await imgResp.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Update status to processing
    await supa.from('images').update({ metadata_status: 'processing' }).eq('id', id);

    // Call OpenAI vision model
    const prompt =
      'Analyze this collage image. Provide a detailed description of its composition, textures, and artistic elements. Also suggest 5 relevant tags that capture its essence and classify it as either "texture", "narrative", or "conceptual" based on its primary visual nature. Format your response as JSON {"description":string, "tags":string[], "image_role":string}';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
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
    console.log(`[METADATA_FN] OpenAI raw response string for ID ${id}:`, jsonString);

    let cleanedJsonString = jsonString.trim();
    if (cleanedJsonString.startsWith('```json')) {
      cleanedJsonString = cleanedJsonString.substring(7); // Remove ```json
      if (cleanedJsonString.endsWith('```')) {
        cleanedJsonString = cleanedJsonString.substring(0, cleanedJsonString.length - 3); // Remove ```
      }
    }
    cleanedJsonString = cleanedJsonString.trim(); // Trim again in case of whitespace

    console.log(`[METADATA_FN] Cleaned JSON string for ID ${id}:`, cleanedJsonString);

    let metadata: { description?: string; tags?: string[]; image_role?: string } = {};
    try {
      metadata = JSON.parse(cleanedJsonString); // Try parsing the cleaned string
      console.log(`[METADATA_FN] Parsed metadata (try block) for ID ${id}:`, JSON.stringify(metadata));
    } catch (parseError: any) {
      console.warn(`[METADATA_FN] Failed to parse OpenAI response as JSON for ID ${id}. Attempting fallback. Error:`, parseError.message);
      // fallback: simple parse if not valid json
      const descMatch = cleanedJsonString.match(/description\s*:\s*"?(.*?)"?\s*(?:,|$|\n)/i);
      const tagsMatch = cleanedJsonString.match(/tags\s*:\s*\[(.*?)\]/i);
      const imageRoleMatch = cleanedJsonString.match(/image_role\s*:\s*"(.*?)"/i); // Attempt to grab image_role in fallback

      metadata.description = descMatch && descMatch[1] ? descMatch[1].trim().replace(/"$/, '') : '';
      metadata.tags = tagsMatch && tagsMatch[1] ? tagsMatch[1].split(',').map((t) => t.trim().replace(/"/g, '')) : [];
      metadata.image_role = imageRoleMatch && imageRoleMatch[1] ? imageRoleMatch[1].trim() : 'fallback_parse_failed'; // Default if not found in fallback
      console.log(`[METADATA_FN] Parsed metadata (catch/fallback block) for ID ${id}:`, JSON.stringify(metadata));
    }

    const updatePayload = {
      description: metadata.description,
      tags: metadata.tags,
      image_role: metadata.image_role,
      metadata_status: 'complete',
      last_processed: new Date().toISOString()
    };
    console.log(`[METADATA_FN] Supabase update payload for ID ${id}:`, JSON.stringify(updatePayload));

    // Update DB row
    const { error } = await supa
      .from('images')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('[METADATA_FN] Supabase update error for ID '+id, error);
      return { statusCode: 500, body: 'Failed to update metadata' };
    }

    console.log(`[METADATA_FN] Successfully updated Supabase for ID ${id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, metadata: { ...metadata } }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (e: any) {
    console.error(e);
    
    // Update status to error if we have the id
    if (id) {
      try {
        await supa.from('images').update({ 
          metadata_status: 'error',
          processing_error: e.message,
          last_processed: new Date().toISOString()
        }).eq('id', id);
        console.log(`[METADATA_FN] Updated error status for ID ${id}`);
      } catch (updateError) {
        console.error(`[METADATA_FN] Failed to update error status for ID ${id}:`, updateError);
      }
    }
    
    return { statusCode: 500, body: e.message };
  }
}; 