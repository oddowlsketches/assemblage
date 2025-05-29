#!/usr/bin/env node
/**
 * Minimal Upload Script - Uses NULL for all constrained fields
 * This should work regardless of database constraints
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
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

// Process and upload a single image
async function uploadImage(filePath, index, total) {
    const filename = path.basename(filePath);
    const originalName = path.basename(filename, path.extname(filename));
    
    console.log(`\n[${index}/${total}] Processing: ${filename}`);
    
    try {
        // 1. Read and process image
        const imageBuffer = await sharp(filePath)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
            
        // 2. Generate unique ID
        const imageId = crypto.randomUUID();
        const storageName = `${imageId}.jpg`;
        
        // 3. Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(`collages/${storageName}`, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        if (uploadError) throw uploadError;
        
        // 4. Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(`collages/${storageName}`);
            
        // 5. Create minimal database record - let most fields be NULL
        const record = {
            id: imageId,
            src: urlData.publicUrl,
            title: originalName,
            provider: 'cms',
            collection_id: DEFAULT_COLLECTION_ID,
            created_at: new Date().toISOString()
            // All other fields will be NULL
        };
        
        // 6. Insert to database
        const { error: dbError } = await supabase
            .from('images')
            .insert([record]);
            
        if (dbError) throw dbError;
        
        console.log('✅ Success!');
        return true;
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

// Main function
async function main() {
    console.log('=== Minimal Image Upload (NULL constraints) ===\n');
    console.log(`Reading from: ${INPUT_DIR}`);
    
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    console.log(`Found ${imageFiles.length} images\n`);
    
    let successCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const filePath = path.join(INPUT_DIR, imageFiles[i]);
        const success = await uploadImage(filePath, i + 1, imageFiles.length);
        
        if (success) successCount++;
        
        // Small delay
        if (i < imageFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log(`\n=== Complete ===`);
    console.log(`Successful: ${successCount}/${imageFiles.length}`);
}

// Check for sharp
try {
    require('sharp');
    main().catch(console.error);
} catch (error) {
    console.error('Missing required package: sharp');
    console.error('Install with: npm install sharp');
}
