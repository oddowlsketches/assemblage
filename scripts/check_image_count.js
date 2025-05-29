#!/usr/bin/env node
/**
 * Quick verification script to check current image count
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentState() {
    console.log('Checking current database state...\n');
    
    // Count total images
    const { count: totalCount, error: totalError } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });
        
    console.log(`Total images in database: ${totalCount || 0}`);
    
    // Count by provider
    const { data: providerData, error: providerError } = await supabase
        .from('images')
        .select('provider');
        
    if (providerData) {
        const providerCounts = {};
        providerData.forEach(row => {
            const provider = row.provider || 'null';
            providerCounts[provider] = (providerCounts[provider] || 0) + 1;
        });
        
        console.log('\nImages by provider:');
        Object.entries(providerCounts).forEach(([provider, count]) => {
            console.log(`  ${provider}: ${count}`);
        });
    }
    
    // Count by collection
    const { data: collectionData, error: collectionError } = await supabase
        .from('images')
        .select('collection_id')
        .eq('collection_id', '00000000-0000-0000-0000-000000000001');
        
    console.log(`\nDefault collection images: ${collectionData?.length || 0}`);
    
    console.log('\nExpected: 620 images');
    console.log(`Missing: ${620 - (totalCount || 0)} images`);
    
    if (totalCount < 620) {
        console.log('\n⚠️  DATABASE IS MISSING IMAGES!');
        console.log('Run recovery immediately:');
        console.log('  node scripts/restore_images_from_backup.js');
    } else {
        console.log('\n✅ Database appears to be complete!');
    }
}

checkCurrentState().catch(console.error);
