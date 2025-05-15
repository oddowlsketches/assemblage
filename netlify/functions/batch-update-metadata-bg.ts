import { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// Robust helper to invoke the generate-image-metadata function with retries
async function invokeGenerateMetadataWithRetry(id: string, publicUrl: string, functionHost: string, attempt = 1): Promise<void> {
  console.log(`[BATCH_UPDATE_BG] INVOKE_METADATA_START: Attempt ${attempt} for ID ${id}`);
  const metadataFunctionUrl = `${functionHost}/.netlify/functions/generate-image-metadata`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout for the fetch itself

  try {
    const response = await fetch(metadataFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, publicUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `Failed to parse error from generate-image-metadata, status: ${response.status}` }));
      console.error(`[BATCH_UPDATE_BG] Error invoking generate-image-metadata for ID ${id} (Attempt ${attempt}):`, response.status, errorBody);
      if (response.status >= 500 && attempt < 3) {
        console.log(`[BATCH_UPDATE_BG] Retrying metadata generation for ID ${id}, attempt ${attempt + 1} after server error...`);
        await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); 
        return invokeGenerateMetadataWithRetry(id, publicUrl, functionHost, attempt + 1);
      }
    } else {
      console.log(`[BATCH_UPDATE_BG] Successfully invoked generate-image-metadata for ID ${id} (Attempt ${attempt})`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`[BATCH_UPDATE_BG] Fetch error invoking generate-image-metadata for ID ${id} (Attempt ${attempt}):`, err.message, err.code, err.name);
    if ((err.code === 'ETIMEDOUT' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'AbortError' || err.message.includes('timed out')) && attempt < 3) {
      console.log(`[BATCH_UPDATE_BG] Retrying metadata generation for ID ${id} due to network/timeout error, attempt ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 7000 * attempt)); 
      return invokeGenerateMetadataWithRetry(id, publicUrl, functionHost, attempt + 1);
    } else {
      console.error(`[BATCH_UPDATE_BG] Failed to invoke generate-image-metadata for ID ${id} after ${attempt} attempts.`);
    }
  }
}

async function processBatchInBackground(siteUrl: string) {
  const CHUNK_SIZE = 10;
  const DELAY_BETWEEN_CHUNKS = 5000;
  console.log('[BATCH_UPDATE_BG] Starting background processing task...');

  // Log environment variables and supa client status
  console.log(`[BATCH_UPDATE_BG] SUPABASE_URL available: ${!!process.env.SUPABASE_URL}`);
  console.log(`[BATCH_UPDATE_BG] SUPABASE_SERVICE_KEY available: ${!!process.env.SUPABASE_SERVICE_KEY ? 'Exists (not logging value)' : 'MISSING'}`);
  console.log(`[BATCH_UPDATE_BG] Supa client object status: ${supa ? 'Initialized' : 'Not initialized'}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !supa) {
    console.error('[BATCH_UPDATE_BG] Critical error: Supabase environment variables or client missing. Exiting.');
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();
    console.log(`[BATCH_UPDATE_BG] Querying Supabase for images before ${isoToday} or pending/processing...`);

    const { data: imagesToProcess, error: fetchError } = await supa
      .from('images')
      .select('id, src, created_at, imagetype, description')
      .or(`created_at.lt.${isoToday},imagetype.eq.pending,description.is.null,description.eq.'',description.eq.Processing...`);

    console.log('[BATCH_UPDATE_BG] Supabase query completed.');

    if (fetchError) {
      console.error('[BATCH_UPDATE_BG] Error fetching images for reprocessing in background task:', JSON.stringify(fetchError));
      return; 
    }

    console.log(`[BATCH_UPDATE_BG] imagesToProcess raw data:`, imagesToProcess ? `${imagesToProcess.length} items` : 'null or undefined');

    if (!imagesToProcess || imagesToProcess.length === 0) {
      console.log('[BATCH_UPDATE_BG] No images found for reprocessing in background task.');
      return; 
    }

    console.log(`[BATCH_UPDATE_BG] Found ${imagesToProcess.length} images for background reprocessing. Starting chunked processing...`);

    for (let i = 0; i < imagesToProcess.length; i += CHUNK_SIZE) {
      const chunk = imagesToProcess.slice(i, i + CHUNK_SIZE);
      console.log(`[BATCH_UPDATE_BG] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(imagesToProcess.length / CHUNK_SIZE)}, ${chunk.length} images.`);
      
      const chunkPromises = chunk.map(image => {
        if (image.src && image.id) {
          invokeGenerateMetadataWithRetry(image.id, image.src, siteUrl);
          return Promise.resolve();
        } else {
          console.warn(`[BATCH_UPDATE_BG] Skipping image ID ${image.id || 'unknown'} in background task due to missing src or id.`);
          return Promise.resolve();
        }
      });
      await Promise.all(chunkPromises);

      if (i + CHUNK_SIZE < imagesToProcess.length) {
        console.log(`[BATCH_UPDATE_BG] Background task finished chunk. Waiting ${DELAY_BETWEEN_CHUNKS / 1000}s before next chunk.`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
      }
    }
    console.log('[BATCH_UPDATE_BG] All chunks processed in background task.');
  } catch (e: any) {
    console.error('[BATCH_UPDATE_BG] General error in background processing task:', e.message, e.code, e.name);
  }
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const siteUrl = process.env.URL || `http://localhost:${process.env.PORT || 9999}`;

  processBatchInBackground(siteUrl).catch(error => {
    console.error("[BATCH_UPDATE_BG] Unhandled error from processBatchInBackground:", error);
  });

  return {
    statusCode: 202,
    body: JSON.stringify({ message: "Batch metadata update process initiated. Check logs for progress." }),
    headers: { 'Content-Type': 'application/json' },
  };
}; 
