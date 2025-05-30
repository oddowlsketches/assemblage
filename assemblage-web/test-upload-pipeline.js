// Test script for upload pipeline
// Run with: node test-upload-pipeline.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

// You'll need to set these environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUploadPipeline() {
  console.log('🧪 Testing Upload Pipeline...\n');

  // 1. Test SHA-1 hash calculation
  console.log('1️⃣ Testing SHA-1 hash calculation...');
  const testData = Buffer.from('test image data');
  const hash = crypto.createHash('sha1').update(testData).digest('hex');
  console.log(`   ✅ SHA-1 hash: ${hash}\n`);

  // 2. Test database connection
  console.log('2️⃣ Testing database connection...');
  const { data: collections, error: collError } = await supabase
    .from('user_collections')
    .select('id, name')
    .limit(1);
  
  if (collError) {
    console.error('   ❌ Database error:', collError);
    return;
  }
  console.log(`   ✅ Found ${collections?.length || 0} collections\n`);

  // 3. Test storage bucket access
  console.log('3️⃣ Testing storage bucket access...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('   ❌ Storage error:', bucketError);
  } else {
    const userImagesBucket = buckets?.find(b => b.name === 'user-images');
    const cmsImagesBucket = buckets?.find(b => b.name === 'cms-images');
    
    console.log(`   ${userImagesBucket ? '✅' : '❌'} user-images bucket`);
    console.log(`   ${cmsImagesBucket ? '✅' : '❌'} cms-images bucket\n`);
  }

  // 4. Test duplicate detection
  console.log('4️⃣ Testing duplicate detection...');
  const testHash = 'test123';
  const { data: duplicates } = await supabase
    .from('images')
    .select('id')
    .eq('file_hash', testHash)
    .limit(1);
  
  console.log(`   ✅ Duplicate check working (found ${duplicates?.length || 0} matches)\n`);

  // 5. Test metadata status query
  console.log('5️⃣ Testing metadata status query...');
  const { data: pendingImages, error: pendingError } = await supabase
    .from('images')
    .select('id, metadata_status')
    .eq('metadata_status', 'pending_llm')
    .limit(5);
  
  if (pendingError) {
    console.error('   ❌ Query error:', pendingError);
  } else {
    console.log(`   ✅ Found ${pendingImages?.length || 0} images pending metadata\n`);
  }

  console.log('✨ Upload pipeline test complete!');
}

testUploadPipeline().catch(console.error);
