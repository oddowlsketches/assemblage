#!/usr/bin/env node
/**
 * Check which storage buckets are available
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkBuckets() {
    console.log('Checking available storage buckets...\n');
    
    // Try to list buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Try to access specific buckets
    console.log('\nChecking specific bucket access:');
    
    const bucketsToCheck = ['user-images', 'cms-images', 'images'];
    
    for (const bucketName of bucketsToCheck) {
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 1 });
                
            if (error) {
                console.log(`❌ ${bucketName}: Not accessible (${error.message})`);
            } else {
                console.log(`✅ ${bucketName}: Accessible`);
            }
        } catch (err) {
            console.log(`❌ ${bucketName}: Error (${err.message})`);
        }
    }
}

checkBuckets().catch(console.error);
