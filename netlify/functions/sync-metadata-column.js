import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function handler(event) {
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
    // Find images where description/tags exist but metadata column is empty
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, description, tags, metadata')
      .not('description', 'is', null)
      .not('tags', 'is', null)
      .or('metadata.is.null,metadata.eq.{}')
      .limit(100);

    if (fetchError) {
      console.error('Error fetching images:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch images' })
      };
    }

    if (!images || images.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No images need metadata sync' })
      };
    }

    console.log(`Found ${images.length} images with missing metadata column`);

    // Update each image's metadata column
    const updates = [];
    for (const image of images) {
      const metadata = {
        description: image.description,
        tags: image.tags,
        caption: image.description ? image.description.substring(0, 50) + '...' : '',
        generated_at: new Date().toISOString(),
        model: 'gpt-4o-mini'
      };

      const { error: updateError } = await supabase
        .from('images')
        .update({ metadata })
        .eq('id', image.id);

      if (updateError) {
        updates.push({ id: image.id, status: 'error', error: updateError.message });
      } else {
        updates.push({ id: image.id, status: 'success' });
      }
    }

    const successCount = updates.filter(u => u.status === 'success').length;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Updated ${successCount} of ${images.length} images`,
        updates 
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
