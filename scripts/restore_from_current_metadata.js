#!/usr/bin/env node

/**
 * Enhanced Image Recovery Script
 * Restores all images from the current metadata.json file (425 images) to Supabase
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to intelligently determine image_role from description and tags
function determineImageRole(description, tags) {
    const tagText = tags.join(' ').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Check for texture-related keywords
    if (/(texture|surface|material|pattern|fabric|wood|stone|metal|rough|smooth)/.test(tagText) ||
        /(texture|surface|material|pattern|fabric|detail|close-up|rough|smooth)/.test(descLower)) {
        return 'texture';
    }
    
    // Check for conceptual/abstract keywords
    if (/(abstract|geometric|concept|form|shape|crystal|mineral|illustration|diagram|typography|letter)/.test(tagText) ||
        /(abstract|geometric|concept|form|shape|crystal|mineral|illustration|diagram|typography|letter)/.test(descLower)) {
        return 'conceptual';
    }
    
    // Default to narrative for everything else
    return 'narrative';
}

// Function to create title from description
function createTitle(description, originalId) {
    if (!description) return `Image ${originalId}`;
    // Use first sentence as title, max 80 chars to leave room for ID
    const firstSentence = description.split('.')[0];
    let baseTitle = firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence;
    // Append original ID to ensure uniqueness
    return `${baseTitle} (${originalId})`;
}

async function restoreImagesFromCurrent() {
    console.log('🔄 Starting enhanced image recovery from current metadata.json...');
    
    // Read the current metadata file (not the backup!)
    const metadataPath = path.join(__dirname, '../images/metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
        console.error(`❌ Current metadata file not found: ${metadataPath}`);
        process.exit(1);
    }
    
    console.log(`📂 Reading current metadata file: ${metadataPath}`);
    
    let metadataData;
    try {
        const fileContent = fs.readFileSync(metadataPath, 'utf8');
        metadataData = JSON.parse(fileContent);
    } catch (error) {
        console.error('❌ Failed to read/parse metadata file:', error.message);
        process.exit(1);
    }
    
    console.log(`📊 Found ${metadataData.length} images in current metadata`);
    console.log(`🎯 This is ${metadataData.length - 222} more images than the backup!`);
    
    // Check current database count
    const { data: existingImages, error: countError } = await supabase
        .from('images')
        .select('id', { count: 'exact' });
        
    if (countError) {
        console.error('❌ Failed to check existing images:', countError.message);
        process.exit(1);
    }
    
    console.log(`📊 Current images in database: ${existingImages.length}`);
    
    // Clear existing images first to avoid duplicates
    console.log('🧹 Clearing existing images to avoid duplicates...');
    const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible UUID
        
    if (deleteError) {
        console.error('❌ Failed to clear existing images:', deleteError.message);
        process.exit(1);
    }
    
    console.log('✅ Existing images cleared');
    
    // Default collection ID
    const DEFAULT_COLLECTION_ID = '00000000-0000-0000-0000-000000000001';
    
    // Process images in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    let processed = 0;
    let successful = 0;
    let errors = 0;
    
    for (let i = 0; i < metadataData.length; i += BATCH_SIZE) {
        const batch = metadataData.slice(i, i + BATCH_SIZE);
        
        console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(metadataData.length/BATCH_SIZE)} (${batch.length} images)...`);
        
        const imageRecords = batch.map(item => {
            // Generate proper image URL
            const imageUrl = `https://qpvuwzztqqeyqxkrnhfr.supabase.co/storage/v1/object/public/user-images/collages/${item.src}`;
            
            return {
                id: crypto.randomUUID(), // Generate UUID for primary key
                src: imageUrl,
                title: createTitle(item.description, item.id),
                description: item.description || '',
                tags: item.tags || [],
                image_role: determineImageRole(item.description, item.tags || []),
                provider: 'cms',
                collection_id: DEFAULT_COLLECTION_ID,
                is_black_and_white: true, // Most images appear to be B&W
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random dates in last 30 days
            };
        });
        
        try {
            const { data, error } = await supabase
                .from('images')
                .insert(imageRecords);
                
            if (error) {
                console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} failed:`, error.message);
                errors += batch.length;
            } else {
                console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} successful (${batch.length} images)`);
                successful += batch.length;
            }
        } catch (err) {
            console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, err.message);
            errors += batch.length;
        }
        
        processed += batch.length;
        
        // Small delay between batches to be nice to the database
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Enhanced recovery complete!');
    console.log(`📊 Total processed: ${processed}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Recovered ${successful} images (vs previous ${222} from backup)`);
    
    if (successful > 0) {
        console.log('\n🚀 Your site should now have significantly more images!');
        console.log(`🔍 Expected: "Loaded ${successful} image records" on your Netlify site.`);
    }
}

// Run the enhanced recovery
restoreImagesFromCurrent().catch(error => {
    console.error('💥 Enhanced recovery failed:', error);
    process.exit(1);
}); 