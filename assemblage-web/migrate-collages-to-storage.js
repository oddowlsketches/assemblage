// Migration script to move existing collages to storage
// Run this with: node migrate-collages-to-storage.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // You'll need the service key for this

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to convert data URL to blob
function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

async function migrateCollages() {
  let migrated = 0;
  let errors = 0;
  let hasMore = true;
  let offset = 0;
  const batchSize = 10;

  console.log('Starting collage migration to storage...');

  while (hasMore) {
    // Fetch collages that haven't been migrated yet
    const { data: collages, error: fetchError } = await supabase
      .from('saved_collages')
      .select('id, user_id, image_data_url, thumbnail_url')
      .is('storage_key', null)
      .not('image_data_url', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('Error fetching collages:', fetchError);
      break;
    }

    if (!collages || collages.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch of ${collages.length} collages...`);

    for (const collage of collages) {
      try {
        // Generate storage keys
        const storageKey = `${collage.user_id}/${collage.id}.png`;
        const thumbnailKey = `${collage.user_id}/${collage.id}_thumb.png`;

        // Convert data URLs to blobs
        const imageBlob = dataURLtoBlob(collage.image_data_url);
        
        // Upload full image
        const { error: uploadError } = await supabase.storage
          .from('collages')
          .upload(storageKey, imageBlob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // If we have a thumbnail data URL, upload it too
        if (collage.thumbnail_url && collage.thumbnail_url.startsWith('data:')) {
          const thumbnailBlob = dataURLtoBlob(collage.thumbnail_url);
          
          const { error: thumbError } = await supabase.storage
            .from('collages')
            .upload(thumbnailKey, thumbnailBlob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          if (thumbError) {
            console.warn(`Thumbnail upload failed for ${collage.id}:`, thumbError);
          }
        }

        // Generate signed URL for thumbnail
        const { data: thumbUrlData } = await supabase.storage
          .from('collages')
          .createSignedUrl(thumbnailKey, 3600);

        // Update database record
        const { error: updateError } = await supabase
          .from('saved_collages')
          .update({
            storage_key: storageKey,
            thumbnail_url: thumbUrlData?.signedUrl || collage.thumbnail_url,
            image_data_url: null // Clear the data URL to free up space
          })
          .eq('id', collage.id);

        if (updateError) {
          throw updateError;
        }

        migrated++;
        console.log(`✓ Migrated collage ${collage.id}`);
        
      } catch (error) {
        errors++;
        console.error(`✗ Failed to migrate collage ${collage.id}:`, error.message);
      }
    }

    // If we got a full batch, there might be more
    if (collages.length === batchSize) {
      offset += batchSize;
    } else {
      hasMore = false;
    }
  }

  console.log('\nMigration complete!');
  console.log(`Successfully migrated: ${migrated} collages`);
  console.log(`Errors: ${errors}`);
}

// Run the migration
migrateCollages().catch(console.error);
