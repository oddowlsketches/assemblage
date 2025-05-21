import { Handler, HandlerResponse } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory chunk storage (in production, use Redis or similar)
const chunks = new Map<string, Buffer[]>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { fileName, base64, chunkIndex, totalChunks, fileSize } = JSON.parse(event.body || '{}');
    if (!fileName || !base64 || typeof chunkIndex !== 'number' || !totalChunks) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate a unique ID for the first chunk
    const id = chunkIndex === 0 ? uuidv4().slice(0, 8) : fileName;
    const chunk = Buffer.from(base64, 'base64');

    // Store chunk
    if (!chunks.has(fileName)) {
      chunks.set(fileName, []);
    }
    chunks.get(fileName)![chunkIndex] = chunk;

    // Check if we have all chunks
    const fileChunks = chunks.get(fileName)!;
    if (fileChunks.filter(Boolean).length === totalChunks) {
      // Combine chunks
      const buffer = Buffer.concat(fileChunks);
      const storagePath = `collages/${id}-${fileName}`;

      // Optimize image
      const metadata = await sharp(buffer).metadata();
      console.log(`[UPLOAD] Processing ${fileName}, original size: ${buffer.length} bytes, ${metadata.width}x${metadata.height}`);

      let optimizedBuffer;
      const sharpInstance = sharp(buffer);

      // Resize if needed
      if (metadata.width && metadata.width > 2000 || metadata.height && metadata.height > 2000) {
        sharpInstance.resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to appropriate format
      const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      if (['png', 'webp'].includes(ext)) {
        optimizedBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      } else {
        optimizedBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      }

      const compressionRatio = Math.round((1 - optimizedBuffer.length / buffer.length) * 100);
      console.log(`[UPLOAD] Optimized ${fileName}: ${optimizedBuffer.length} bytes (${compressionRatio}% reduction)`);

      // Upload to Storage
      const { error: uploadErr } = await supa.storage
        .from('images')
        .upload(storagePath, optimizedBuffer, { upsert: true });

      if (uploadErr) {
        console.error('[UPLOAD] Storage upload error:', uploadErr);
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      // Get public URL
      const { data: urlData } = supa.storage.from('images').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Create database entry
      const { data: insertData, error: insertErr } = await supa.from('images')
        .upsert(
          { id, src: publicUrl, title: fileName, description: "Processing...", tags: [], imagetype: "pending" },
          { onConflict: 'title' }
        )
        .select('id');

      if (insertErr) {
        console.error('[UPLOAD] DB insert error:', insertErr);
        throw new Error(`Database insert failed: ${insertErr.message}`);
      }

      // Trigger metadata generation
      try {
        const baseUrl = process.env.URL || 'http://localhost:8888';
        const metadataResponse = await fetch(`${baseUrl}/.netlify/functions/generate-image-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, publicUrl })
        });
        
        if (!metadataResponse.ok) {
          console.error('[UPLOAD] Metadata generation request failed:', await metadataResponse.text());
        }
      } catch (metadataError) {
        console.error('[UPLOAD] Failed to trigger metadata generation:', metadataError);
      }

      // Clean up chunks
      chunks.delete(fileName);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({
          id,
          replaced: insertData?.[0]?.id !== id,
          src: publicUrl,
          size: optimizedBuffer.length,
          compressionRatio
        })
      };
    }

    // Return progress for intermediate chunks
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        id: fileName,
        chunksReceived: fileChunks.filter(Boolean).length,
        totalChunks
      })
    };

  } catch (e: any) {
    console.error('[UPLOAD] General error:', e.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({ error: e.message })
    };
  }
}; 