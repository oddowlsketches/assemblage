import { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// Helper to invoke the generate-image-metadata function
async function triggerMetadataGeneration(id: string, publicUrl: string, functionHost: string) {
  const metadataFunctionUrl = `${functionHost}/.netlify/functions/generate-image-metadata`;
  try {
    console.log(`[BATCH_UPDATE] Triggering metadata for ID: ${id}`);
    const response = await fetch(metadataFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, publicUrl }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`[BATCH_UPDATE] Error triggering metadata for ID ${id}:`, response.status, errorBody);
    } else {
      console.log(`[BATCH_UPDATE] Successfully triggered metadata for ID ${id}`);
    }
  } catch (error: any) {
    console.error(`[BATCH_UPDATE] Fetch error for ID ${id}:`, error.message);
  }
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Basic security: Check for a secret query parameter or a specific caller if needed.
  // For now, allowing GET for manual trigger via browser/curl for testing.
  // In production, you might want this to be POST only and secured.
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Determine the function host (for calling other functions)
  // For deployed functions, event.headers.host might give the site's hostname.
  // process.env.URL is usually the deployed site URL.
  // For local, construct localhost with the port (usually 9999 for functions).
  const siteUrl = process.env.URL || `http://localhost:${process.env.PORT || 9999}`;

  try {
    console.log('[BATCH_UPDATE] Starting batch metadata update process...');
    
    // Define your criteria for images to reprocess.
    // Example 1: Images created before a certain date (adjust date as needed)
    // const { data: imagesToProcess, error: fetchError } = await supa
    //   .from('images')
    //   .select('id, src')
    //   .lt('created_at', '2023-10-26'); // Change to your desired date

    // Example 2: Images with 'pending' type or missing description (more robust)
    const { data: imagesToProcess, error: fetchError } = await supa
      .from('images')
      .select('id, src')
      .or('imagetype.eq.pending,description.is.null,description.eq.\'\',description.eq.Processing...')
      // .limit(10) // Optional: process in smaller chunks initially

    if (fetchError) {
      console.error('[BATCH_UPDATE] Error fetching images for reprocessing:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch images: ' + fetchError.message }) };
    }

    if (!imagesToProcess || imagesToProcess.length === 0) {
      console.log('[BATCH_UPDATE] No images found matching criteria for reprocessing.');
      return { statusCode: 200, body: JSON.stringify({ message: 'No images to reprocess.' }) };
    }

    console.log(`[BATCH_UPDATE] Found ${imagesToProcess.length} images to reprocess. Triggering metadata generation...`);

    // Asynchronously trigger metadata generation for each image
    // For very large batches, consider a queue or staggered calls to avoid overwhelming OpenAI/functions
    const processingPromises = imagesToProcess.map(image => {
      if (image.src) {
        return triggerMetadataGeneration(image.id, image.src, siteUrl);
      } else {
        console.warn(`[BATCH_UPDATE] Skipping image ID ${image.id} due to missing src.`);
        return Promise.resolve(); // Resolve immediately for skipped images
      }
    });

    // Optional: Wait for all triggers to be SENT (not completed)
    // await Promise.all(processingPromises); // This only waits for the fetch calls to be made, not for OpenAI to finish.

    // For simplicity, we're not waiting here. The function returns quickly.
    // Monitor individual generate-image-metadata logs for actual processing.

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Triggered metadata reprocessing for ${imagesToProcess.length} images. Check function logs for progress.` }),
    };

  } catch (e: any) {
    console.error('[BATCH_UPDATE] General error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}; 