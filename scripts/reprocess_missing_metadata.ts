import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

async function reprocessMissingMetadata() {
  try {
    // Fetch all images that are missing imagetype or have empty descriptions
    const { data: images, error: fetchError } = await supa
      .from('images')
      .select('id, src')
      .or('imagetype.is.null,imagetype.eq.pending,description.is.null,description.eq.,description.eq.Processing...');

    if (fetchError) {
      console.error('Failed to fetch images:', fetchError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('No images found needing metadata reprocessing');
      return;
    }

    console.log(`Found ${images.length} images needing metadata reprocessing`);

    // Process images in batches of 5 to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(images.length/batchSize)}`);
      
      await Promise.all(batch.map(async (img) => {
        try {
          const response = await fetch('http://localhost:8888/.netlify/functions/generate-image-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: img.id, publicUrl: img.src })
          });

          if (!response.ok) {
            throw new Error(`Failed to generate metadata: ${await response.text()}`);
          }

          const result = await response.json();
          console.log(`Successfully reprocessed metadata for image ${img.id}`);
          return result;
        } catch (error) {
          console.error(`Failed to process image ${img.id}:`, error);
          return null;
        }
      }));

      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Completed reprocessing metadata for all images');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
reprocessMissingMetadata(); 