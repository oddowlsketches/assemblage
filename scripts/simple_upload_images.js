#!/usr/bin/env node
/**
 * Simple Image Upload Script (No Processing)
 * 
 * This script uploads images directly to Supabase without processing.
 * Good for when images are already optimized.
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const crypto = require('crypto');

require('dotenv').config();

// Configuration
const INPUT_DIR = path.join(process.env.HOME, 'Desktop', 'collage-images');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_COLLECTION_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Generate simple metadata without AI
function generateSimpleMetadata(filename) {
    // Extract some info from filename if possible
    const baseName = path.basename(filename, path.extname(filename));
    const cleanName = baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return {
        title: cleanName,
        description: `Black and white collage image`,
        tags: ['collage', 'black and white', 'vintage', 'art']
    };
}

// Determine image role
function determineImageRole(tags) {
    const tagText = tags.join(' ').toLowerCase();
    
    if (tagText.includes('texture') || tagText.includes('pattern')) {
        return 'texture';
    }
    if (tagText.includes('abstract') || tagText.includes('geometric')) {
        return 'conceptual';
    }
    return 'narrative';
}

// Upload image to Supabase
async function uploadImage(filePath, filename) {
    const fileBuffer = await fs.readFile(filePath);
    const storagePath = `collages/${filename}`;
    
    const { data, error } = await supabase.storage
        .from('images')
        .upload(storagePath, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });
        
    if (error) throw error;
    
    return `images/${storagePath}`;
}

// Main function
async function uploadAllImages() {
    console.log('=== Simple Image Upload to Supabase ===\n');
    console.log(`Reading from: ${INPUT_DIR}`);
    
    try {
        await fs.access(INPUT_DIR);
    } catch (error) {
        console.error(`Error: Directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }
    
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} images\n`);
    
    let successCount = 0;
    const results = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = path.join(INPUT_DIR, file);
        
        console.log(`[${i + 1}/${imageFiles.length}] Uploading: ${file}`);
        
        try {
            // Generate unique ID
            const imageId = crypto.randomUUID();
            const newFilename = `${imageId}${path.extname(file)}`;
            
            // Upload to storage
            const storagePath = await uploadImage(filePath, newFilename);
            console.log(`  ✓ Uploaded to: ${storagePath}`);
            
            // Generate metadata (simple version)
            const metadata = generateSimpleMetadata(file);
            
            // Create database record
            const imageRecord = {
                id: imageId,
                src: storagePath,
                thumb_src: storagePath, // Same as main image for now
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                image_role: determineImageRole(metadata.tags),
                provider: 'cms',
                collection_id: DEFAULT_COLLECTION_ID,
                is_black_and_white: true,
                metadata_status: openai ? 'pending' : 'ready',
                original_filename: file,
                created_at: new Date().toISOString()
            };
            
            const { error: dbError } = await supabase
                .from('images')
                .insert([imageRecord]);
                
            if (dbError) throw dbError;
            
            console.log(`  ✓ Saved to database`);
            successCount++;
            results.push(imageRecord);
            
        } catch (error) {
            console.error(`  ✗ Error: ${error.message}`);
        }
    }
    
    console.log(`\n=== Upload Complete ===`);
    console.log(`✅ Successful: ${successCount}/${imageFiles.length}`);
    
    // Save results for reference
    if (results.length > 0) {
        const resultsPath = path.join(__dirname, `upload_results_${Date.now()}.json`);
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to: ${resultsPath}`);
    }
    
    if (!openai) {
        console.log('\nNote: OpenAI API key not found. Images uploaded with basic metadata.');
        console.log('To generate rich metadata, add OPENAI_API_KEY to your .env file');
    }
}

// Run
uploadAllImages().catch(console.error);
