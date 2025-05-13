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
    let metadata: { description?: string; tags?: string[]; imageType?: string } = {};
    try {
      metadata = JSON.parse(jsonString);
    } catch {
      // fallback: simple parse if not valid json
      const descMatch = jsonString.match(/description\s*:\s*(.*)\n/i);
      const tagsMatch = jsonString.match(/tags\s*:\s*\[(.*)\]/i);
      metadata.description = descMatch ? descMatch[1].trim() : '';
      metadata.tags = tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim()) : [];
    }

    // Update DB row
    const { error } = await supa
      .from('images')
      .update({ description: metadata.description, tags: metadata.tags, imageType: metadata.imageType })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error', error);
      return { statusCode: 500, body: 'Failed to update metadata' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, metadata }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: e.message };
  }
}; 