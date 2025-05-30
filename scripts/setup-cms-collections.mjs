import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCmsCollections() {
  console.log('Setting up CMS collections...');

  try {
    // Create default collection
    const defaultCollectionId = '00000000-0000-0000-0000-000000000001';
    
    console.log('Creating default collection...');
    const { error: insertError } = await supabase
      .from('image_collections')
      .upsert({
        id: defaultCollectionId,
        name: 'Default Library',
        description: 'Default CMS image collection',
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (insertError) {
      console.error('Error creating default collection:', insertError);
      // Continue anyway - it might already exist
    } else {
      console.log('✓ Default collection created/updated');
    }

    // Find any images with collection_id that doesn't exist
    console.log('Checking for orphaned collection references...');
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('collection_id')
      .not('collection_id', 'is', null)
      .is('user_collection_id', null);

    if (imagesError) {
      console.error('Error checking images:', imagesError);
      return;
    }

    const uniqueCollectionIds = [...new Set(images?.map(img => img.collection_id) || [])];
    console.log(`Found ${uniqueCollectionIds.length} unique collection IDs in images table`);

    // Check which collections are missing
    for (const collectionId of uniqueCollectionIds) {
      if (!collectionId) continue;

      const { data: exists, error: checkError } = await supabase
        .from('image_collections')
        .select('id')
        .eq('id', collectionId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Collection doesn't exist
        console.log(`Creating missing collection: ${collectionId}`);
        
        const { error: createError } = await supabase
          .from('image_collections')
          .insert({
            id: collectionId,
            name: `Collection ${collectionId.slice(0, 8)}`,
            description: 'Auto-created collection for existing images',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error(`Error creating collection ${collectionId}:`, createError);
        } else {
          console.log(`✓ Created collection ${collectionId}`);
        }
      } else if (!checkError) {
        console.log(`✓ Collection ${collectionId} already exists`);
      }
    }

    console.log('\nSetup complete!');
    console.log('The CMS should now be able to upload images without constraint errors.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
setupCmsCollections();