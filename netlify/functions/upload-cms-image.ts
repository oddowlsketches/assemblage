import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface UploadCMSImageRequest {
  fileData: string; // base64 encoded file data
  fileName: string;
  collectionId: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fileData, fileName, collectionId }: UploadCMSImageRequest = JSON.parse(event.body || '{}');
    
    if (!fileData || !fileName || !collectionId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Calculate SHA-1 hash
    const hash = crypto.createHash('sha1');
    hash.update(buffer);
    const fileHash = hash.digest('hex');
    
    // Check for existing image with same hash
    const { data: existingImage } = await supabase
      .from('images')
      .select('id, src, thumb_src')
      .eq('file_hash', fileHash)
      .eq('provider', 'cms')
      .single();
      
    if (existingImage) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Image already exists',
          data: existingImage
        })
      };
    }
    
    // Generate unique file paths
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `originals/${timestamp}_${sanitizedFileName}`;
    const thumbPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
    
    // Upload original to cms-images bucket
    const { error: uploadError } = await supabase.storage
      .from('cms-images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    
    // For now, upload the same image as thumbnail
    // In production, you'd resize it properly
    const { error: thumbError } = await supabase.storage
      .from('cms-images')
      .upload(thumbPath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
      
    if (thumbError) {
      // Clean up original if thumb fails
      await supabase.storage.from('cms-images').remove([filePath]);
      throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
    }
    
    // Get public URLs
    const { data: { publicUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(filePath);
      
    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(thumbPath);
    
    // Create image record
    const imageData = {
      id: crypto.randomUUID(),
      src: publicUrl,
      thumb_src: thumbUrl,
      title: fileName,
      collection_id: collectionId,
      user_collection_id: null,
      provider: 'cms',
      file_hash: fileHash,
      metadata_status: 'pending_llm',
      description: '',
      tags: [],
      created_at: new Date().toISOString()
    };
    
    const { data: newImage, error: dbError } = await supabase
      .from('images')
      .insert(imageData)
      .select()
      .single();
      
    if (dbError) {
      // Clean up uploaded files
      await supabase.storage.from('cms-images').remove([filePath, thumbPath]);
      throw new Error(`Failed to create image record: ${dbError.message}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        data: newImage
      }),
      headers: { 'Content-Type': 'application/json' }
    };
    
  } catch (error: any) {
    console.error('[upload-cms-image] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
