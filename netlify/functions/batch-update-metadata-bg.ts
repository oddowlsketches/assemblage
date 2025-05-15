import { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// Robust helper to invoke the generate-image-metadata function with retries
async function invokeGenerateMetadataWithRetry(id: string, publicUrl: string, functionHost: string, attempt = 1): Promise<void> {
  console.log(`[BATCH_UPDATE] INVOKE_METADATA_START: Attempt ${attempt} for ID ${id}`);
  const metadataFunctionUrl = `${functionHost}/.netlify/functions/generate-image-metadata`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25-second timeout for the fetch itself

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
      console.error(`[BATCH_UPDATE] Error invoking generate-image-metadata for ID ${id} (Attempt ${attempt}):`, response.status, errorBody);
      if (response.status >= 500 && attempt < 3) {
        console.log(`[BATCH_UPDATE] Retrying metadata generation for ID ${id}, attempt ${attempt + 1} after server error...`);
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt)); // 3s, 6s delay
        return invokeGenerateMetadataWithRetry(id, publicUrl, functionHost, attempt + 1);
      }
    } else {
      console.log(`[BATCH_UPDATE] Successfully invoked generate-image-metadata for ID ${id} (Attempt ${attempt})`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`[BATCH_UPDATE] Fetch error invoking generate-image-metadata for ID ${id} (Attempt ${attempt}):`, err.message, err.code, err.name);
    if ((err.code === 'ETIMEDOUT' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'AbortError' || err.message.includes('timed out')) && attempt < 3) {
      console.log(`[BATCH_UPDATE] Retrying metadata generation for ID ${id} due to network/timeout error, attempt ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // 5s, 10s delay for network issues
      return invokeGenerateMetadataWithRetry(id, publicUrl, functionHost, attempt + 1);
    } else {
      console.error(`[BATCH_UPDATE] Failed to invoke generate-image-metadata for ID ${id} after ${attempt} attempts.`);
    }
  }
  // console.log(`[BATCH_UPDATE] INVOKE_METADATA_END: Finished attempt ${attempt} for ID ${id}`); // Optional: can be noisy
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const siteUrl = process.env.URL || `http://localhost:${process.env.PORT || 9999}`;
  const CHUNK_SIZE = 10; // Process 10 images per chunk
  const DELAY_BETWEEN_CHUNKS = 5000; // 5 seconds

  try {
    console.log('[BATCH_UPDATE] Starting batch metadata update process with chunking...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString();

    const { data: imagesToProcess, error: fetchError } = await supa
      .from('images')
      .select('id, src, created_at, imagetype, description')
      .or(`created_at.lt.${isoToday},imagetype.eq.pending,description.is.null,description.eq.'',description.eq.Processing...`);

    if (fetchError) {
      console.error('[BATCH_UPDATE] Error fetching images for reprocessing:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch images: ' + fetchError.message }) };
    }

    if (!imagesToProcess || imagesToProcess.length === 0) {
      console.log('[BATCH_UPDATE] No images found matching criteria for reprocessing.');
      return { statusCode: 200, body: JSON.stringify({ message: 'No images to reprocess.' }) };
    }

    console.log(`[BATCH_UPDATE] Found ${imagesToProcess.length} images to reprocess. Starting chunked processing...`);

    for (let i = 0; i < imagesToProcess.length; i += CHUNK_SIZE) {
      const chunk = imagesToProcess.slice(i, i + CHUNK_SIZE);
      console.log(`[BATCH_UPDATE] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(imagesToProcess.length / CHUNK_SIZE)}, ${chunk.length} images.`);
      
      const chunkPromises = chunk.map(image => {
        if (image.src && image.id) {
          // Don't await here, let them run in parallel within the chunk
          invokeGenerateMetadataWithRetry(image.id, image.src, siteUrl); 
          return Promise.resolve(); // Immediately resolve so Promise.all doesn't wait for OpenAI
        } else {
          console.warn(`[BATCH_UPDATE] Skipping image ID ${image.id || 'unknown'} due to missing src or id.`);
          return Promise.resolve();
        }
      });
      
      await Promise.all(chunkPromises); // Wait for all fetch initiations in the current chunk

      if (i + CHUNK_SIZE < imagesToProcess.length) {
        console.log(`[BATCH_UPDATE] Finished chunk. Waiting ${DELAY_BETWEEN_CHUNKS / 1000}s before next chunk.`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
      }
    }

    console.log('[BATCH_UPDATE] All chunks processed.');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Triggered metadata reprocessing for ${imagesToProcess.length} images in chunks. Check function logs for detailed progress.` }),
    };

  } catch (e: any) {
    console.error('[BATCH_UPDATE] General error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}; 