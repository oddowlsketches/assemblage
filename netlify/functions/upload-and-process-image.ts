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

    const invokeGenerateMetadata = async (attempt = 1): Promise<void> => {
      console.log(`[UPLOAD_FN] INVOKE_METADATA_START: Attempt ${attempt} for ID ${actualId}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

      try {
        const response = await fetch(metadataFunctionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: actualId, publicUrl: openAiUrl }),
          signal: controller.signal // Pass the abort signal to fetch
        });
        clearTimeout(timeoutId); // Clear the timeout if fetch completes/errors normally

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error from generate-image-metadata' }));
          console.error(`[UPLOAD_FN] Error invoking generate-image-metadata for ID ${actualId} (Attempt ${attempt}):`, response.status, errorBody);
          if (response.status >= 500 && attempt < 3) { // Retry on server errors
            console.log(`[UPLOAD_FN] Retrying metadata generation for ID ${actualId}, attempt ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 1s, 2s delay
            return invokeGenerateMetadata(attempt + 1);
          }
        } else {
          console.log(`[UPLOAD_FN] Successfully invoked generate-image-metadata for ID ${actualId} (Attempt ${attempt})`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId); // Clear the timeout if fetch completes/errors normally
        console.error(`[UPLOAD_FN] Fetch error invoking generate-image-metadata for ID ${actualId} (Attempt ${attempt}):`, err.message, err.code, err.name);
        // Retry on specific network errors like ETIMEDOUT or UND_ERR_CONNECT_TIMEOUT or AbortError
        if ((err.code === 'ETIMEDOUT' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'AbortError' || err.message.includes('timed out')) && attempt < 3) {
          console.log(`[UPLOAD_FN] Retrying metadata generation for ID ${actualId} due to network/timeout error, attempt ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 2s, 4s delay for network issues
          return invokeGenerateMetadata(attempt + 1);
        } else {
          console.error(`[UPLOAD_FN] Failed to invoke generate-image-metadata for ID ${actualId} after ${attempt} attempts.`);
        }
      }
      console.log(`[UPLOAD_FN] INVOKE_METADATA_END: Finished attempt ${attempt} for ID ${actualId}`);
    };

    invokeGenerateMetadata(); // Fire-and-forget with retries

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