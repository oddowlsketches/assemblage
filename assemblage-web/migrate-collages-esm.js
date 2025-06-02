// Migration script to move existing collages to storage
// Run this with: node migrate-collages-esm.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Make sure you have both VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to convert data URL to buffer
function dataURLtoBuffer(dataURL) {
  const base64 = dataURL.split(',')[1];
  return Buffer.from(base64, 'base64');
}

async function migrateCollages() {
  let migrated = 0;
  let errors = 0;
  let hasMore = true;
  let offset = 0;
  const batchSize = 5; // Small batches to avoid timeouts

  console.log('Starting collage migration to storage...');
  console.log('This will process collages in batches of', batchSize);
  console.log('---');

  // First, check how many need migration
  const { data: stats } = await supabase
    .rpc('count_collages_to_migrate');
  
  if (stats && stats[0]) {
    console.log(`Total collages: ${stats[0].total_collages}`);
    console.log(`Already migrated: ${stats[0].migrated_collages}`);
    console.log(`Need migration: ${stats[0].pending_migration}`);
    console.log('---');
  }

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

    console.log(`\nProcessing batch of ${collages.length} collages...`);

    for (const collage of collages) {
      try {
        console.log(`Processing collage ${collage.id}...`);
        
        // Generate storage keys
        const storageKey = `${collage.user_id}/${collage.id}.png`;
        const thumbnailKey = `${collage.user_id}/${collage.id}_thumb.png`;

        // Convert data URL to buffer
        const imageBuffer = dataURLtoBuffer(collage.image_data_url);
        
        // Upload full image
        const { error: uploadError } = await supabase.storage
          .from('collages')
          .upload(storageKey, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // Skip if already exists
          if (uploadError.message?.includes('already exists')) {
            console.log(`  → Image already in storage, updating database...`);
          } else {
            throw uploadError;
          }
        }

        // Upload thumbnail if it's a data URL
        let newThumbnailUrl = collage.thumbnail_url;
        if (collage.thumbnail_url && collage.thumbnail_url.startsWith('data:')) {
          try {
            const thumbnailBuffer = dataURLtoBuffer(collage.thumbnail_url);
            
            const { error: thumbError } = await supabase.storage
              .from('collages')
              .upload(thumbnailKey, thumbnailBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
              });

            if (!thumbError || thumbError.message?.includes('already exists')) {
              // Generate signed URL for thumbnail
              const { data: thumbUrlData } = await supabase.storage
                .from('collages')
                .createSignedUrl(thumbnailKey, 3600);
              
              if (thumbUrlData) {
                newThumbnailUrl = thumbUrlData.signedUrl;
              }
            }
          } catch (thumbErr) {
            console.warn(`  → Thumbnail processing failed, keeping original`);
          }
        }

        // Update database record
        const { error: updateError } = await supabase
          .from('saved_collages')
          .update({
            storage_key: storageKey,
            thumbnail_url: newThumbnailUrl,
            image_data_url: null // Clear the data URL to free up space
          })
          .eq('id', collage.id);

        if (updateError) {
          throw updateError;
        }

        migrated++;
        console.log(`  ✓ Successfully migrated`);
        
      } catch (error) {
        errors++;
        console.error(`  ✗ Failed to migrate:`, error.message);
      }
    }

    // If we got a full batch, there might be more
    if (collages.length === batchSize) {
      offset += batchSize;
      console.log(`\nContinuing with next batch...`);
    } else {
      hasMore = false;
    }
  }

  console.log('\n=================================');
  console.log('Migration complete!');
  console.log(`Successfully migrated: ${migrated} collages`);
  console.log(`Errors: ${errors}`);
  console.log('=================================');
}

// Run the migration
console.log('Supabase URL:', supabaseUrl);
console.log('Service key:', supabaseServiceKey ? 'Found' : 'MISSING!');
console.log('');

migrateCollages().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
