import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Fetch all pending images
    const { data: pendingImages, error: fetchError } = await supa
      .from('images')
      .select('id, src')
      .eq('imagetype', 'pending');

    if (fetchError) {
      console.error('[BATCH_UPDATE] Failed to fetch pending images:', fetchError);
      return { statusCode: 500, body: 'Failed to fetch pending images' };
    }

    if (!pendingImages || pendingImages.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No pending images found' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log(`[BATCH_UPDATE] Found ${pendingImages.length} pending images`);

    // Process each pending image
    const results = await Promise.allSettled(
      pendingImages.map(async (img) => {
        try {
          const baseUrl = process.env.URL || 'http://localhost:8888';
          const response = await fetch(`${baseUrl}/.netlify/functions/generate-image-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: img.id, publicUrl: img.src })
          });

          if (!response.ok) {
            throw new Error(`Failed to generate metadata for image ${img.id}: ${await response.text()}`);
          }

          return { id: img.id, success: true };
        } catch (error: any) {
          console.error(`[BATCH_UPDATE] Error processing image ${img.id}:`, error);
          return { id: img.id, success: false, error: error.message };
        }
      })
    );

    const summary = {
      total: pendingImages.length,
      succeeded: results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length,
      failed: results.filter(r => r.status === 'rejected' || !(r.value as any).success).length
    };

    console.log('[BATCH_UPDATE] Processing summary:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify({ summary, results }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (e: any) {
    console.error('[BATCH_UPDATE] Unexpected error:', e);
    return { statusCode: 500, body: e.message };
  }
}; 