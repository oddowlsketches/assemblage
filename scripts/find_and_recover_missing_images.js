#!/usr/bin/env node

/**
 * Missing Images Recovery Script
 * Finds image files that exist but aren't in metadata.json and adds them to the database
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function createBasicMetadata(filename) {
    const id = path.basename(filename, '.jpg');
    return {
        id: crypto.randomUUID(),
        src: `https://qpvuwzztqqeyqxkrnhfr.supabase.co/storage/v1/object/public/user-images/collages/${filename}`,
        title: `Recovered Image ${id}`,
        description: `Recovered image file: ${filename}`,
        tags: ['recovered', 'missing-metadata'],
        image_role: 'narrative', // Default role
        provider: 'cms',
        collection_id: '00000000-0000-0000-0000-000000000001',
        is_black_and_white: true,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
}

async function findAndRecoverMissingImages() {
    console.log('🔍 Finding images that exist as files but missing from metadata...');
    
    // Read current metadata to get list of known images
    const metadataPath = path.join(__dirname, '../images/metadata.json');
    let knownImages = [];
    
    if (fs.existsSync(metadataPath)) {
        const metadataData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        knownImages = metadataData.map(item => item.src);
        console.log(`📊 Known images in metadata: ${knownImages.length}`);
    }
    
    // Find all image files in collages directory
    const collagesDir = path.join(__dirname, '../images/collages');
    const allImageFiles = fs.readdirSync(collagesDir)
        .filter(file => file.toLowerCase().endsWith('.jpg'))
        .sort();
    
    console.log(`📂 Total image files found: ${allImageFiles.length}`);
    
    // Find images without metadata
    const missingMetadata = allImageFiles.filter(filename => 
        !knownImages.some(knownSrc => knownSrc.includes(filename))
    );
    
    console.log(`🔍 Images missing metadata: ${missingMetadata.length}`);
    if (missingMetadata.length > 0) {
        console.log('Missing files:', missingMetadata.slice(0, 5), missingMetadata.length > 5 ? '...' : '');
    }
    
    // Also check orphaned backup directory
    const orphanedDir = path.join(__dirname, '../images/orphaned_backup');
    let orphanedImages = [];
    if (fs.existsSync(orphanedDir)) {
        orphanedImages = fs.readdirSync(orphanedDir)
            .filter(file => file.toLowerCase().endsWith('.jpg'))
            .map(filename => ({ filename, isOrphaned: true }));
        console.log(`📂 Orphaned backup images: ${orphanedImages.length}`);
    }
    
    // Combine all missing images
    const allMissingImages = [
        ...missingMetadata.map(filename => ({ filename, isOrphaned: false })),
        ...orphanedImages
    ];
    
    console.log(`📊 Total missing images to recover: ${allMissingImages.length}`);
    
    if (allMissingImages.length === 0) {
        console.log('✅ No missing images found! All files have metadata.');
        return;
    }
    
    // Create records for missing images
    const missingRecords = allMissingImages.map(({ filename, isOrphaned }) => {
        const record = createBasicMetadata(filename);
        
        if (isOrphaned) {
            record.src = `https://qpvuwzztqqeyqxkrnhfr.supabase.co/storage/v1/object/public/user-images/orphaned_backup/${filename}`;
            record.title = `Orphaned Image ${path.basename(filename, '.jpg')}`;
            record.description = `Recovered from orphaned backup: ${filename}`;
            record.tags = ['recovered', 'orphaned', 'backup'];
        }
        
        return record;
    });
    
    // Insert missing images in batches
    const BATCH_SIZE = 50;
    let successful = 0;
    let errors = 0;
    
    for (let i = 0; i < missingRecords.length; i += BATCH_SIZE) {
        const batch = missingRecords.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(missingRecords.length/BATCH_SIZE)} (${batch.length} images)...`);
        
        try {
            const { data, error } = await supabase
                .from('images')
                .insert(batch);
                
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
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Missing images recovery complete!');
    console.log(`✅ Successfully added: ${successful} images`);
    console.log(`❌ Errors: ${errors} images`);
    
    if (successful > 0) {
        console.log(`\n📈 Total images should now be: 425 + ${successful} = ${425 + successful}`);
        console.log('🚀 Your site should now have even more images available!');
    }
}

// Run the missing images recovery
findAndRecoverMissingImages().catch(error => {
    console.error('💥 Missing images recovery failed:', error);
    process.exit(1);
}); 