import { Handler, HandlerResponse } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// In-memory chunk storage (in production, use Redis or similar)
const chunks = new Map<string, Buffer[]>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

const MAX_PROCESSING_TIME = 8000; // 8 seconds to leave buffer for response

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  // Start timing the function
  const startTime = Date.now();

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { 
      fileName, 
      base64, 
      chunkIndex, 
      totalChunks, 
      fileSize, 
      collectionId, 
      image_role: rawRoleFromBody,
      userId,
      isUserUpload = false
    } = JSON.parse(event.body || '{}');
    
    if (!fileName || !base64 || typeof chunkIndex !== 'number' || !totalChunks) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders },
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
      // Check if we have enough time left
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        return {
          statusCode: 408,
          headers: { ...corsHeaders },
          body: JSON.stringify({ 
            error: 'Processing timeout risk',
            message: 'Upload received but processing deferred',
            id,
            status: 'deferred'
          })
        };
      }

      // Combine chunks
      const buffer = Buffer.concat(fileChunks);
      const storagePath = `collages/${id}-${fileName}`;

      // Quick image optimization with reduced quality for speed
      const metadata = await sharp(buffer).metadata();
      let optimizedBuffer;
      
      try {
        const sharpInstance = sharp(buffer);
        
        // Faster resize for very large images
        if (metadata.width && metadata.height) {
          const maxDimension = Math.max(metadata.width, metadata.height);
          if (maxDimension > 2000) {
            const scale = 2000 / maxDimension;
            sharpInstance.resize(
              Math.round(metadata.width * scale),
              Math.round(metadata.height * scale),
              { fit: 'inside', withoutEnlargement: true }
            );
          }
        }

        // Faster compression settings
        optimizedBuffer = await sharpInstance
          .jpeg({ 
            quality: 80,
            force: true,
            optimizeScans: true
          })
          .toBuffer();
      } catch (optimizeError) {
        console.error('[UPLOAD] Image optimization failed:', optimizeError);
        optimizedBuffer = buffer; // Fallback to original if optimization fails
      }

      // Upload to Storage
      const { error: uploadErr } = await supa.storage
        .from('images')
        .upload(storagePath, optimizedBuffer, { upsert: true });

      if (uploadErr) {
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      // Get public URL
      const { data: urlData } = supa.storage.from('images').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      // Generate thumbnail
      let thumbnailBuffer;
      try {
        thumbnailBuffer = await sharp(buffer)
          .resize(400, 400, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 70 })
          .toBuffer();
      } catch (thumbError) {
        console.error('[UPLOAD] Thumbnail generation failed:', thumbError);
        // Use original as fallback
        thumbnailBuffer = optimizedBuffer;
      }

      // Upload thumbnail
      const thumbPath = storagePath.replace(/\.[^/.]+$/, '_thumb.jpg');
      const { error: thumbErr } = await supa.storage
        .from('images')
        .upload(thumbPath, thumbnailBuffer, { upsert: true });

      if (thumbErr) {
        console.error('[UPLOAD] Thumbnail upload failed:', thumbErr);
      }

      const { data: thumbUrlData } = supa.storage.from('images').getPublicUrl(thumbPath);
      const thumbUrl = thumbUrlData.publicUrl;

      // Sanitize image_role so it always satisfies the DB check constraint
      const validRoles = ['texture', 'narrative', 'conceptual'];
      let image_role = rawRoleFromBody ? (validRoles.includes(rawRoleFromBody) ? rawRoleFromBody : 'narrative') : 'narrative';

      // Create initial database entry
      const imageData: any = {
        id,
        src: publicUrl,
        thumb_src: thumbUrl,
        title: fileName,
        description: "Processing...",
        tags: [],
        image_role,
        metadata_status: "pending_llm",
        provider: isUserUpload ? 'upload' : 'cms',
        metadata: {},
        is_black_and_white: true // Default to true for CMS images
      };

      // Handle collection assignment based on upload type
      if (isUserUpload && userId) {
        // User upload - use user_collection_id
        imageData.user_id = userId;
        imageData.user_collection_id = collectionId;
        imageData.collection_id = null; // Must be null for user uploads
      } else {
        // CMS upload - use collection_id and ensure it's not empty
        if (!collectionId) {
          throw new Error('Collection ID is required for CMS uploads');
        }
        imageData.collection_id = collectionId;
        imageData.user_collection_id = null; // Must be null for CMS uploads
        imageData.user_id = null; // CMS uploads don't have user_id
      }

      const { error: insertErr } = await supa.from('images')
        .upsert(imageData);

      if (insertErr) {
        throw new Error(`Database insert failed: ${insertErr.message}`);
      }

      // Trigger background metadata generation
      try {
        const baseUrl = process.env.URL || 'http://localhost:8888';
        fetch(`${baseUrl}/.netlify/functions/batch-update-metadata-bg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceProcess: true })
        }).catch(err => console.error('[UPLOAD] Failed to trigger background processing:', err));
      } catch (bgError) {
        console.error('[UPLOAD] Error triggering background process:', bgError);
      }

      // Clean up chunks
      chunks.delete(fileName);

      return {
        statusCode: 200,
        headers: { ...corsHeaders },
        body: JSON.stringify({
          id,
          status: 'uploaded',
          src: publicUrl,
          thumb_src: thumbUrl,
          message: 'Upload complete, metadata processing queued'
        })
      };
    }

    // Return progress for intermediate chunks
    return {
      statusCode: 200,
      headers: { ...corsHeaders },
      body: JSON.stringify({
        id: fileName,
        chunksReceived: fileChunks.filter(Boolean).length,
        totalChunks,
        status: 'receiving'
      })
    };

  } catch (e: any) {
    console.error('[UPLOAD] Error:', e);
    return {
      statusCode: 500,
      headers: { ...corsHeaders },
      body: JSON.stringify({ 
        error: e.message,
        status: 'error'
      })
    };
  }
};