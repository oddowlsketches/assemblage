import { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Test generic fetch first
async function testGenericFetch() {
  console.log('[BATCH_UPDATE_BG] Attempting generic fetch to jsonplaceholder...');
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    console.log('[BATCH_UPDATE_BG] Generic fetch response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('[BATCH_UPDATE_BG] Generic fetch SUCCEEDED, data:', data ? 'exists' : 'null/undefined');
    } else {
      console.error('[BATCH_UPDATE_BG] Generic fetch FAILED with status:', response.status);
    }
  } catch (fetchErr: any) {
    console.error('[BATCH_UPDATE_BG] Generic fetch EXCEPTION CAUGHT:', fetchErr.message, fetchErr.code, fetchErr.name);
  }
  console.log('[BATCH_UPDATE_BG] Finished generic fetch attempt.');
}

let supa: any; // Declare supa globally in the module scope

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
  console.log('[BATCH_UPDATE_BG] Starting background processing task (after generic fetch test).');
  
  // Initialize Supa client here, only if generic fetch was successful (or for testing)
  if (!supa) {
    try {
      supa = createClient(
        process.env.SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_KEY as string
      );
      console.log('[BATCH_UPDATE_BG] Supabase client CREATED successfully inside processBatchInBackground.');
    } catch (initError: any) {
      console.error('[BATCH_UPDATE_BG] Supabase client FAILED to create inside processBatchInBackground:', initError.message);
      return; // Cannot proceed without Supabase client
    }
  }

  // Log environment variables and supa client status
  console.log(`[BATCH_UPDATE_BG] SUPABASE_URL available: ${!!process.env.SUPABASE_URL}`);
  console.log(`[BATCH_UPDATE_BG] SUPABASE_SERVICE_KEY available: ${!!process.env.SUPABASE_SERVICE_KEY ? 'Exists (not logging value)' : 'MISSING'}`);
  console.log(`[BATCH_UPDATE_BG] Supa client object status: ${supa ? 'Initialized' : 'Not initialized'}`);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !supa) {
    console.error('[BATCH_UPDATE_BG] Critical error: Supabase environment variables or client missing. Exiting.');
    return;
  }

  try {
    // Ultra-simple Supabase test query ONLY
    console.log('[BATCH_UPDATE_BG] Entering main try block. Attempting ONLY ultra-simple Supabase ping query...');
    let testData, testError;
    try {
      console.log('[BATCH_UPDATE_BG] ABOUT TO AWAIT Supabase ping query...');
      const pingResult = await supa.from('images').select('id').limit(1);
      console.log('[BATCH_UPDATE_BG] Supabase ping query AWAITED. Result object:', pingResult ? 'exists' : 'null/undefined');
      
      if (pingResult) {
        testData = pingResult.data;
        testError = pingResult.error;
      } else {
        // This case should ideally not happen if the await completes without throwing, 
        // but good to log if pingResult is unexpectedly null/undefined.
        console.error('[BATCH_UPDATE_BG] Supabase ping query returned null/undefined result object.');
        testError = { message: "Ping result was null or undefined" }; // Create a synthetic error
      }

      if (testError) {
        console.error('[BATCH_UPDATE_BG] Ultra-simple Supabase ping query FAILED. Error message:', testError.message);
        console.error('[BATCH_UPDATE_BG] Full Supabase error object:', testError);
      } else {
        console.log('[BATCH_UPDATE_BG] Ultra-simple Supabase ping query SUCCEEDED, data rows:', testData ? testData.length : 'null/undefined');
      }
    } catch (pingCatchError: any) {
      console.error('[BATCH_UPDATE_BG] Ultra-simple Supabase ping query EXCEPTION CAUGHT. Message:', pingCatchError && pingCatchError.message ? pingCatchError.message : 'No message available');
      console.error('[BATCH_UPDATE_BG] Full Ping Catch Error Object:', pingCatchError);
    }
    console.log('[BATCH_UPDATE_BG] After Supabase ping attempt block.');

    console.log('[BATCH_UPDATE_BG] Ping test complete. Starting actual batch metadata processing.');

    const BATCH_SIZE = 10; // Number of images to process in one go
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

    let offset = 0;
    let imagesProcessedInThisRun = 0;
    let consecutiveEmptyBatches = 0;
    const MAX_CONSECUTIVE_EMPTY_BATCHES = 2; // Stop if we get empty batches a couple of times in a row

    // eslint-disable-next-line no-constant-condition
    while (true) { // Loop indefinitely, break conditions are inside
      console.log(`[BATCH_UPDATE_BG] Fetching batch of images. Offset: ${offset}, Limit: ${BATCH_SIZE}`);
      const { data: images, error: fetchError } = await supa
        .from('images')
        .select('id, public_url, file_name') // Assuming file_name exists for logging
        .or('llm_description.is.null,llm_tags.is.null,image_type.is.null,metadata_status.eq.pending_llm') // Added pending_llm status
        .order('created_at', { ascending: true }) // Process older images first
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error('[BATCH_UPDATE_BG] Error fetching images batch:', JSON.stringify(fetchError));
        console.log('[BATCH_UPDATE_BG] Stopping due to error fetching images batch.');
        break; 
      }

      if (!images || images.length === 0) {
        console.log('[BATCH_UPDATE_BG] No more images found needing metadata processing in this batch.');
        consecutiveEmptyBatches++;
        if (consecutiveEmptyBatches >= MAX_CONSECUTIVE_EMPTY_BATCHES) {
            console.log('[BATCH_UPDATE_BG] Reached max consecutive empty batches. Assuming processing is complete.');
            break;
        }
        // If it was just one empty batch, but previous batches had items,
        // it might just be the end. We can wait a bit and try one more fetch cycle
        // or just break. For simplicity, breaking after a few empty fetches.
        offset = 0; // Reset offset to re-scan from the beginning if desired, or just break.
                      // For now, let's break as the query should catch all unprocessed.
        console.log('[BATCH_UPDATE_BG] No images in batch, will try one more scan or break.');
        // Small delay before retry or exit
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES * 2));
        // if we got an empty batch, it's likely we are done.
        // If the query is 'llm_description.is.null...' then an empty batch means no more nulls.
        // unless new images are added very rapidly.
        continue; // try fetching again, offset will be re-evaluated or loop will break
      }
      
      consecutiveEmptyBatches = 0; // Reset if we found images

      console.log(`[BATCH_UPDATE_BG] Fetched ${images.length} images in this batch. Processing...`);

      for (const image of images) {
        if (!image.id) {
            console.warn(`[BATCH_UPDATE_BG] Image data is malformed (missing ID): ${JSON.stringify(image)}. Skipping.`);
            continue;
        }
        if (!image.public_url) {
            console.warn(`[BATCH_UPDATE_BG] Image ID ${image.id} (File: ${image.file_name || 'N/A'}) is missing public_url. Skipping.`);
            // Optionally, update a status in Supabase to indicate this issue
            // await supa.from('images').update({ metadata_status: 'error_missing_url' }).eq('id', image.id);
            continue;
        }
        console.log(`[BATCH_UPDATE_BG] Requesting metadata for image ID ${image.id} (File: ${image.file_name || 'N/A'}), URL: ${image.public_url}`);
        try {
            await invokeGenerateMetadataWithRetry(image.id, image.public_url, siteUrl);
            imagesProcessedInThisRun++;
            // Optional: Short delay between individual calls if invokeGenerateMetadataWithRetry is very fast
            // await new Promise(resolve => setTimeout(resolve, 300)); 
        } catch (invokeError: any) {
            console.error(`[BATCH_UPDATE_BG] Error during invokeGenerateMetadataWithRetry for image ID ${image.id}:`, invokeError.message);
            // Decide if this error should stop the whole batch or just skip this image
        }
      }

      if (images.length < BATCH_SIZE) {
        console.log('[BATCH_UPDATE_BG] Processed the last image in the query results. Ending batch processing.');
        break; 
      }

      offset += BATCH_SIZE;
      console.log(`[BATCH_UPDATE_BG] Batch complete. Total processed in run: ${imagesProcessedInThisRun}. Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch.`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }

    console.log(`[BATCH_UPDATE_BG] Background metadata update cycle finished. Total images processed in this run: ${imagesProcessedInThisRun}`);

  } catch (e: any) {
    console.error('[BATCH_UPDATE_BG] General error in background processing task (outer try-catch):', e.message, e.code, e.name);
  }
  console.log('[BATCH_UPDATE_BG] processBatchInBackground function END');
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  await testGenericFetch(); // Await this simple test first.

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
