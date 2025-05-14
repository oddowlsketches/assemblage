import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }
  // Only allow POST for actual uploads
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: 'Method Not Allowed'
    };
  }

  try {
    const { fileName, base64 } = JSON.parse(event.body || '{}');
    if (!fileName || !base64) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: 'Missing fileName or base64 data'
      };
    }

    // Generate unique ID and storage path
    const id = uuidv4().slice(0, 8);
    const storagePath = `collages/${id}-${fileName}`;

    // Upload to Storage
    const buffer = Buffer.from(base64, 'base64');
    const { error: uploadErr } = await supa.storage
      .from('images')
      .upload(storagePath, buffer, { upsert: true });
    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: uploadErr.message })
      };
    }

    // Get public URL and generate a time-limited signed URL for OpenAI fetch
    const { data: urlData } = supa.storage.from('images').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;
    // Create a signed URL (60s expiry) for reliable external fetch
    const { data: signedData, error: signedErr } = await supa.storage
      .from('images')
      .createSignedUrl(storagePath, 60);
    const openAiUrl = signedErr ? publicUrl : signedData.signedUrl;

    // Upsert initial row by title to avoid duplicates
    const { data: insertData, error: insertErr } = await supa.from('images')
      .upsert(
        { id, src: publicUrl, title: fileName, description: "Processing...", tags: [], imagetype: "pending" },
        { onConflict: 'title' }
      )
      .select('id');

    if (insertErr) {
      console.error('Initial DB insert error:', insertErr);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: 'Failed to save initial image record: ' + insertErr.message })
      };
    }

    // Determine if an existing row was replaced
    const actualId = insertData?.[0]?.id;
    const replaced = actualId !== id;

    // Default metadata placeholder
    let metadata: { description?: string; tags?: string[]; imageType?: string } = {
      description: '',
      tags: [],
      imageType: undefined
    };
    // In production (non-local), call OpenAI for real metadata
    if (!process.env.SUPABASE_URL?.includes('127.0.0.1')) {
      console.log(`[UPLOAD_FN] Attempting OpenAI call for ID: ${actualId} with URL: ${openAiUrl}`);
      // Prompt the vision model with a public image URL
      const prompt = `
You are an art cataloging assistant.
Return only JSON in this format with no extra text:
{"description":string,"tags":string[],"imageType":"texture"|"narrative"|"conceptual"}
`;
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: openAiUrl } }
              ]
            }
          ] as any
        });
        const content = response.choices[0].message.content || '{}';
        console.log(`[UPLOAD_FN] OpenAI raw content for ID ${actualId}:`, content);
        try {
          metadata = JSON.parse(content);
          console.log(`[UPLOAD_FN] OpenAI parsed metadata for ID ${actualId}:`, metadata);
        } catch (parseErr: any) {
          console.error(`[UPLOAD_FN] OpenAI JSON.parse error for ID ${actualId}:`, parseErr.message);
          console.error(`[UPLOAD_FN] Faulty JSON string for ID ${actualId}:`, content);
          // Keep default/empty metadata if parse fails
        }
      } catch (err: any) {
        console.error(`[UPLOAD_FN] OpenAI API call error for ID ${actualId}:`, err.message || err);
        // Keep default/empty metadata if OpenAI call fails
      }
    } else {
      console.log(`[UPLOAD_FN] Local dev mode: skipping OpenAI metadata for ID: ${actualId}.`);
    }

    console.log(`[UPLOAD_FN] Attempting to update DB for ID ${actualId} with metadata:`, metadata);
    // Update row with metadata
    const { error: updateErr } = await supa.from('images')
      .update({ description: metadata.description, tags: metadata.tags, imagetype: metadata.imageType })
      .eq('id', actualId);
    if (updateErr) {
      console.error(`[UPLOAD_FN] DB update error for ID ${actualId}:`, updateErr);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: updateErr.message })
      };
    }

    console.log(`[UPLOAD_FN] Successfully processed and updated ID ${actualId}.`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ id: actualId, replaced, src: publicUrl, description: metadata.description, tags: metadata.tags, imagetype: metadata.imageType })
    };
  } catch (e: any) {
    console.error('[UPLOAD_FN] General catch error:', e.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: e.message })
    };
  }
}; 