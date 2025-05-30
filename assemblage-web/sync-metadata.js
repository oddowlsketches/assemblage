// Run this script in your browser console or with Node.js to sync metadata

async function syncMetadata() {
  console.log('🔄 Starting metadata sync process...\n');

  try {
    // Step 1: Sync metadata column
    console.log('📊 Step 1: Syncing metadata column for images with existing tags/descriptions...');
    const syncResponse = await fetch('https://assemblage-app.netlify.app/.netlify/functions/sync-metadata-column', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('Sync result:', syncData);
    } else {
      console.error('Sync failed:', await syncResponse.text());
    }

    // Wait 5 seconds
    console.log('\n⏳ Waiting 5 seconds before processing pending metadata...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Process pending metadata
    console.log('\n🤖 Step 2: Processing images with pending metadata...');
    const processResponse = await fetch('https://assemblage-app.netlify.app/.netlify/functions/process-pending-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (processResponse.ok) {
      const processData = await processResponse.json();
      console.log('Process result:', processData);
    } else {
      console.error('Processing failed:', await processResponse.text());
    }

    console.log('\n✅ Metadata sync process complete!');
    console.log('\n💡 To check the status in Supabase SQL editor:');
    console.log('SELECT COUNT(*), metadata_status FROM images GROUP BY metadata_status;');

  } catch (error) {
    console.error('Error during sync:', error);
  }
}

// Run the sync
syncMetadata();
