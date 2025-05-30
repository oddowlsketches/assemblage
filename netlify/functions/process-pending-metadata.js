import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function handler(event) {
  // This function can be called as a scheduled function or webhook
  
  if (!supabase) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Service configuration error',
        details: 'Missing required environment variables for Supabase'
      })
    };
  }

  try {
    // Find images with pending metadata
    const { data: pendingImages, error: fetchError } = await supabase
      .from('images')
      .select('id')
      .or('metadata_status.eq.pending_llm,metadata_status.eq.processing,metadata_status.is.null')
      .limit(5); // Process up to 5 at a time to avoid timeouts

    if (fetchError) {
      console.error('Error fetching pending images:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch pending images' })
      };
    }

    if (!pendingImages || pendingImages.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No pending images to process' })
      };
    }

    console.log(`Found ${pendingImages.length} images with pending metadata`);

    // Process each image
    const results = [];
    for (const image of pendingImages) {
      try {
        // Call the metadata processing function
        const response = await fetch(`${process.env.URL || 'https://assemblage-app.netlify.app'}/.netlify/functions/process-user-image-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: image.id })
        });

        if (response.ok) {
          results.push({ id: image.id, status: 'success' });
        } else {
          const errorText = await response.text();
          results.push({ id: image.id, status: 'error', error: errorText });
        }
      } catch (error) {
        results.push({ id: image.id, status: 'error', error: error.message });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Processed ${results.length} images`,
        results 
      })
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}
