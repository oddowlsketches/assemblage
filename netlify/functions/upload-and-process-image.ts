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

    // Asynchronously trigger metadata generation for this image
    // Ensure this URL is correct for your Netlify setup (local dev vs deployed)
    const functionHost = process.env.URL || `http://localhost:${process.env.PORT || 9999}`;
    const metadataFunctionUrl = `${functionHost}/.netlify/functions/generate-image-metadata`;
    
    console.log(`[UPLOAD_FN] Asynchronously invoking metadata generation for ID: ${actualId} at ${metadataFunctionUrl}`);
    fetch(metadataFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Add any necessary auth headers if your function is protected
      body: JSON.stringify({ id: actualId, publicUrl: openAiUrl }) // Send openAiUrl (signed or public) for reliability
    })
    .then(res => {
      if (!res.ok) {
        res.json().then(err => console.error(`[UPLOAD_FN] Error invoking generate-image-metadata for ID ${actualId}:`, res.status, err));
      } else {
        console.log(`[UPLOAD_FN] Successfully invoked generate-image-metadata for ID ${actualId}`);
      }
    })
    .catch(err => console.error(`[UPLOAD_FN] Fetch error invoking generate-image-metadata for ID ${actualId}:`, err));

    // The original OpenAI call and direct DB update for metadata is now REMOVED from this function.
    // It will be handled by generate-image-metadata.ts exclusively.

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      // Return only the initial info; metadata will come via the async function
      body: JSON.stringify({ id: actualId, replaced, src: publicUrl, description: "Processing...", tags: [], imagetype: "pending" })
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