import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import sharp from "npm:sharp@0.33.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const MAX_EMBEDDING_CALLS_PER_MIN = parseInt(Deno.env.get('MAX_EMBEDDING_CALLS_PER_MIN') || '20');

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
const dropboxAccessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Import our utilities (in Deno, we need to inline these for now)
async function generateThumbnail(imageBuffer: Uint8Array, options: any = {}): Promise<Uint8Array> {
  const { width = 200, height = 200, quality = 80 } = options;
  
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      })
      .jpeg({ quality, force: true })
      .toBuffer();
    
    return new Uint8Array(thumbnail);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

async function extractColorPalette(imageBuffer: Uint8Array, numColors: number = 5): Promise<{ dominant: string; palette: string[] }> {
  try {
    // Resize image for faster processing
    const resized = await sharp(imageBuffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const pixels: Map<string, number> = new Map();

    // Count pixel occurrences
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      pixels.set(hex, (pixels.get(hex) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(pixels.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors)
      .map(([color]) => color);

    const dominant = sortedColors[0] || '#000000';

    return { dominant, palette: sortedColors };
  } catch (error) {
    console.error('Error extracting color palette:', error);
    throw new Error(`Failed to extract color palette: ${error.message}`);
  }
}

async function downloadFromDropbox(fileId: string): Promise<Uint8Array> {
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${dropboxAccessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: fileId }),
    },
  });

  if (!response.ok) {
    throw new Error(`Dropbox download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function downloadFromSupabase(imagePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from('user-images')
    .download(imagePath);

  if (error) {
    throw new Error(`Supabase download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function checkRateLimit(): Promise<boolean> {
  const minuteEpoch = Math.floor(Date.now() / 60000);
  const key = `rate_gate:${minuteEpoch}`;
  
  // Use Supabase for KV storage (simple implementation)
  const { data: currentCount } = await supabase
    .from('kv_store')
    .select('value')
    .eq('key', key)
    .single();

  const count = currentCount?.value || MAX_EMBEDDING_CALLS_PER_MIN;
  
  if (count <= 0) {
    return false; // Rate limit exceeded
  }

  // Decrement counter
  await supabase
    .from('kv_store')
    .upsert({ 
      key, 
      value: count - 1,
      expires_at: new Date((minuteEpoch + 1) * 60000).toISOString()
    });

  return true;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
}

async function logEmbeddingUsage(userId: string | null, tokensIn: number): Promise<void> {
  // OpenAI embedding cost: $0.0001 per 1K tokens
  const costUsd = (tokensIn / 1000) * 0.0001;

  await supabase
    .from('embedding_usage_log')
    .insert({
      user_id: userId,
      tokens_in: tokensIn,
      cost_usd: costUsd,
    });
}

async function scheduleRetry(imageId: string, delaySeconds: number): Promise<void> {
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
  
  await supabase
    .from('images_retry_queue')
    .insert({
      image_id: imageId,
      scheduled_at: scheduledAt,
    });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageId } = await req.json();
    
    if (!imageId) {
      return new Response(
        JSON.stringify({ error: 'Missing imageId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return new Response(
        JSON.stringify({ error: 'Image not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('images')
      .update({ 
        metadata_status: 'processing',
        last_processed: new Date().toISOString()
      })
      .eq('id', imageId);

    // Download image based on provider
    let imageBuffer: Uint8Array;
    
    if (image.provider === 'dropbox') {
      imageBuffer = await downloadFromDropbox(image.external_id || image.src);
    } else {
      // Extract path from URL or use direct path
      const storagePath = image.src.includes('/storage/v1/object/public/') 
        ? image.src.split('/storage/v1/object/public/user-images/')[1]
        : image.src;
      imageBuffer = await downloadFromSupabase(storagePath);
    }

    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(imageBuffer);
    const thumbnailPath = `thumbnails/${imageId}.jpg`;
    
    // Upload thumbnail
    const { error: thumbError } = await supabase.storage
      .from('user-images')
      .upload(thumbnailPath, thumbnailBuffer, { upsert: true });

    if (thumbError) {
      console.error('Thumbnail upload error:', thumbError);
    }

    // Extract color palette
    const colorPalette = await extractColorPalette(imageBuffer);

    // Generate embedding (with rate limiting and retry logic)
    let embedding: number[] | null = null;
    let embeddingError: string | null = null;

    // Check rate limit
    const canProceed = await checkRateLimit();
    if (!canProceed) {
      // Schedule retry in 30 seconds
      await scheduleRetry(imageId, 30);
      return new Response(
        JSON.stringify({ 
          message: 'Rate limited, scheduled for retry',
          retryIn: 30 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Generate text for embedding
      const embeddingText = `${image.title} ${image.description || ''} ${(image.tags || []).join(' ')}`.trim();
      embedding = await generateEmbedding(embeddingText);
      
      // Log usage (estimate tokens - roughly 4 chars per token)
      const estimatedTokens = Math.ceil(embeddingText.length / 4);
      await logEmbeddingUsage(image.user_id || null, estimatedTokens);
      
    } catch (error) {
      console.error('Embedding generation error:', error);
      embeddingError = error.message;
      
      // Increment retry count
      const newRetryCount = (image.retry_count || 0) + 1;
      
      if (newRetryCount < MAX_RETRIES) {
        // Schedule retry in 5 minutes
        await scheduleRetry(imageId, 300);
        await supabase
          .from('images')
          .update({ retry_count: newRetryCount })
          .eq('id', imageId);
          
        return new Response(
          JSON.stringify({ 
            message: 'Embedding failed, scheduled for retry',
            retryCount: newRetryCount,
            maxRetries: MAX_RETRIES
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Max retries reached
        embeddingError = 'embedding-fail: max retries exceeded';
      }
    }

    // Get thumbnail URL
    const { data: thumbUrl } = supabase.storage
      .from('user-images')
      .getPublicUrl(thumbnailPath);

    // Update image record with results
    const updateData: any = {
      metadata_status: embedding ? 'complete' : 'error',
      processing_error: embeddingError,
      palette: colorPalette.palette,
      dominant_color: colorPalette.dominant,
      thumbnail_url: thumbUrl.publicUrl,
      last_processed: new Date().toISOString(),
    };

    if (embedding) {
      // Check if we're using vector or JSONB for embeddings
      const { data: columnInfo } = await supabase
        .from('information_schema.columns')
        .select('data_type')
        .eq('table_name', 'images')
        .eq('column_name', 'embedding')
        .single();
      
      if (columnInfo?.data_type === 'USER-DEFINED') {
        // Vector type
        updateData.embedding = `[${embedding.join(',')}]`;
      } else {
        // JSONB fallback
        updateData.embedding = embedding;
      }
    }

    const { error: updateError } = await supabase
      .from('images')
      .update(updateData)
      .eq('id', imageId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update image record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageId,
        status: updateData.metadata_status,
        thumbnail: thumbUrl.publicUrl,
        palette: colorPalette.palette,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process image error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
