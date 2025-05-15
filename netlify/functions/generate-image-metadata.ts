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
  try {
    const { id, publicUrl } = JSON.parse(event.body || '{}');
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

    // Call OpenAI vision model
    const prompt =
      'Analyze this collage image. Provide a detailed description of its composition, textures, and artistic elements. Also suggest 5 relevant tags that capture its essence and classify it as either "texture", "narrative", or "conceptual" based on its primary visual nature. Format your response as JSON {"description":string, "tags":string[], "imageType":string}';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
    });

    const jsonString = completion.choices[0].message.content || '{}';
    console.log(`[METADATA_FN] OpenAI response string for ID ${id}:`, jsonString);

    let metadata: { description?: string; tags?: string[]; imageType?: string } = {};
    try {
      metadata = JSON.parse(jsonString);
      console.log(`[METADATA_FN] Parsed metadata (try block) for ID ${id}:`, JSON.stringify(metadata));
    } catch (parseError: any) {
      console.warn(`[METADATA_FN] Failed to parse OpenAI response as JSON for ID ${id}. Attempting fallback. Error:`, parseError.message);
      // fallback: simple parse if not valid json
      const descMatch = jsonString.match(/description\s*:\s*"?(.*?)"?\s*(?:,|$|\n)/i);
      const tagsMatch = jsonString.match(/tags\s*:\s*\[(.*?)\]/i);
      const imageTypeMatch = jsonString.match(/imageType\s*:\s*"(.*?)"/i); // Attempt to grab imageType in fallback

      metadata.description = descMatch && descMatch[1] ? descMatch[1].trim().replace(/"$/, '') : '';
      metadata.tags = tagsMatch && tagsMatch[1] ? tagsMatch[1].split(',').map((t) => t.trim().replace(/"/g, '')) : [];
      metadata.imageType = imageTypeMatch && imageTypeMatch[1] ? imageTypeMatch[1].trim() : 'fallback_parse_failed'; // Default if not found in fallback
      console.log(`[METADATA_FN] Parsed metadata (catch/fallback block) for ID ${id}:`, JSON.stringify(metadata));
    }

    const updatePayload = {
      description: metadata.description,
      tags: metadata.tags,
      imagetype: metadata.imageType // Ensure this matches the DB column name exactly
    };
    console.log(`[METADATA_FN] Supabase update payload for ID ${id}:`, JSON.stringify(updatePayload));

    // Update DB row
    const { error } = await supa
      .from('images')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Supabase update error', error);
      return { statusCode: 500, body: 'Failed to update metadata' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, metadata: { ...metadata, imagetype: metadata.imageType } }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: e.message };
  }
}; 