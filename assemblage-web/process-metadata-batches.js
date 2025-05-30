// Run this in your app's console to process pending metadata in small batches
async function processPendingMetadata() {
  console.log('🤖 Processing pending metadata in small batches...\n');
  
  let totalProcessed = 0;
  let hasMore = true;
  let iteration = 0;
  
  while (hasMore && iteration < 20) { // Max 20 iterations to be safe
    iteration++;
    console.log(`📦 Batch ${iteration}: Processing up to 5 images...`);
    
    try {
      const response = await fetch('/.netlify/functions/process-pending-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Batch ${iteration} result:`, data.message);
        
        if (data.results && data.results.length > 0) {
          totalProcessed += data.results.length;
          
          // Check if we processed less than 5, meaning we're done
          if (data.results.length < 5) {
            hasMore = false;
            console.log('📋 No more pending images to process.');
          } else {
            console.log('⏳ Waiting 3 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          hasMore = false;
          console.log('📋 No pending images found.');
        }
      } else {
        console.error(`❌ Batch ${iteration} failed:`, await response.text());
        console.log('⏸️  Stopping due to error. You can run this script again later.');
        break;
      }
    } catch (error) {
      console.error(`❌ Batch ${iteration} error:`, error);
      console.log('⏸️  Stopping due to error. You can run this script again later.');
      break;
    }
  }
  
  console.log(`\n🎉 Processing complete! Total images processed: ${totalProcessed}`);
  console.log('\n💡 Check your image status in Supabase with:');
  console.log('SELECT COUNT(*), metadata_status FROM images GROUP BY metadata_status;');
}

// Run it
processPendingMetadata();
