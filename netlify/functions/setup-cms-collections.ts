import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('[SETUP_CMS] Starting CMS collections setup...');

    // Create default collection if it doesn't exist
    const defaultCollectionId = '00000000-0000-0000-0000-000000000001';
    
    // Check if default collection exists
    const { data: existingCollection, error: checkError } = await supa
      .from('image_collections')
      .select('id')
      .eq('id', defaultCollectionId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Collection doesn't exist, create it
      console.log('[SETUP_CMS] Default collection not found, creating...');
      
      const { error: insertError } = await supa
        .from('image_collections')
        .insert({
          id: defaultCollectionId,
          name: 'Default Library',
          description: 'Default CMS image collection',
          is_default: true
        });

      if (insertError) {
        console.error('[SETUP_CMS] Error creating default collection:', insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to create default collection',
            details: insertError.message
          })
        };
      }

      console.log('[SETUP_CMS] Default collection created successfully');
    } else if (!checkError) {
      console.log('[SETUP_CMS] Default collection already exists');
    }

    // Find any orphaned collection references in images table
    const { data: orphanedRefs, error: orphanError } = await supa
      .from('images')
      .select('collection_id')
      .not('collection_id', 'is', null)
      .is('user_collection_id', null); // Only CMS images

    if (!orphanError && orphanedRefs) {
      const uniqueCollectionIds = [...new Set(orphanedRefs.map(r => r.collection_id))];
      
      for (const collectionId of uniqueCollectionIds) {
        if (!collectionId) continue;
        
        // Check if this collection exists
        const { data: exists, error: existsError } = await supa
          .from('image_collections')
          .select('id')
          .eq('id', collectionId)
          .single();

        if (existsError && existsError.code === 'PGRST116') {
          // Collection doesn't exist, create it
          console.log(`[SETUP_CMS] Creating missing collection: ${collectionId}`);
          
          const { error: createError } = await supa
            .from('image_collections')
            .insert({
              id: collectionId,
              name: `Collection ${collectionId.slice(0, 8)}`,
              description: 'Auto-created collection for existing images'
            });

          if (createError) {
            console.error(`[SETUP_CMS] Error creating collection ${collectionId}:`, createError);
          }
        }
      }
    }

    // Verify the constraint is now satisfied
    const { data: constraintCheck, error: constraintError } = await supa
      .rpc('check_images_consistency');

    if (constraintError) {
      // If the RPC doesn't exist, that's okay
      console.log('[SETUP_CMS] Could not verify constraint (RPC may not exist)');
    } else {
      console.log('[SETUP_CMS] Constraint check result:', constraintCheck);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'CMS collections setup completed'
      })
    };

  } catch (error: any) {
    console.error('[SETUP_CMS] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Setup failed',
        details: error.message
      })
    };
  }
};