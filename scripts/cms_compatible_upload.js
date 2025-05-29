#!/usr/bin/env node
/**
 * Upload Images - Matching Existing CMS Pipeline
 * 
 * This script uploads images with the exact same structure as the CMS pipeline:
 * - Uses original filename as title
 * - Generates proper description
 * - Creates all required metadata fields
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
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 85;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Helper function to determine image role
function determineImageRole(description, tags) {
    const combined = `${description} ${tags.join(' ')}`.toLowerCase();
    
    if (/(texture|surface|material|pattern|fabric|wood|stone|metal|rough|smooth)/.test(combined)) {
        return 'texture';
    }
    if (/(abstract|geometric|concept|form|shape|crystal|mineral|illustration|diagram|typography|letter)/.test(combined)) {
        return 'conceptual';
    }
    return 'narrative';
}

// Process image
async function processImage(imagePath) {
    console.log(`Processing: ${path.basename(imagePath)}`);
    
    try {
        const imageBuffer = await sharp(imagePath)
            .resize(MAX_WIDTH, MAX_HEIGHT, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ quality: JPEG_QUALITY })
            .toBuffer();
            
        const metadata = await sharp(imageBuffer).metadata();
        
        return {
            buffer: imageBuffer,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            }
        };
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error.message);
        return null;
    }
}

// Generate metadata matching CMS pipeline format
async function generateMetadata(imageBuffer) {
    try {
        const base64Image = imageBuffer.toString('base64');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `This image is part of a surreal black and white collage art collection for an interactive oracle/fortune-telling web experience.
    
Please provide:
1. A concise description (15-30 words) of what's in this image
2. A list of 5-8 descriptive tags for the image, focusing on themes, emotions, symbols, and aesthetic qualities

Format your response exactly like this:
DESCRIPTION: [your description here]
TAGS: [tag1], [tag2], [tag3], [tag4], [tag5], [tag6]`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`,
                            detail: "high"
                        }
                    }
                ]
            }],
            max_tokens: 300
        });
        
        const result = response.choices[0].message.content;
        
        // Parse the response
        let description = "";
        let tags = [];
        
        const descMatch = result.match(/DESCRIPTION:\s*(.+?)(?=TAGS:|$)/s);
        const tagsMatch = result.match(/TAGS:\s*(.+)/s);
        
        if (descMatch) {
            description = descMatch[1].trim();
        }
        
        if (tagsMatch) {
            tags = tagsMatch[1].split(',').map(tag => tag.trim());
        }
        
        return { description, tags };
        
    } catch (error) {
        console.error('Error generating metadata:', error.message);
        return {
            description: '',
            tags: []
        };
    }
}

// Upload to Supabase
async function uploadToSupabase(imageBuffer, filename) {
    const storagePath = `collages/${filename}`;
    
    try {
        const { data, error } = await supabase.storage
            .from('images')
            .upload(storagePath, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        if (error) throw error;
        
        return `images/${storagePath}`;
    } catch (error) {
        console.error(`Error uploading ${filename}:`, error.message);
        return null;
    }
}

// Main processing function
async function processAllImages() {
    console.log('=== CMS-Compatible Image Upload Pipeline ===\n');
    console.log(`Input directory: ${INPUT_DIR}`);
    
    try {
        await fs.access(INPUT_DIR);
    } catch (error) {
        console.error(`Error: Input directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }
    
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} images to process\n`);
    
    // First, check what columns exist in the database
    console.log('Checking database schema...');
    const { data: schemaCheck } = await supabase
        .from('images')
        .select('*')
        .limit(1);
        
    const availableColumns = schemaCheck && schemaCheck.length > 0 ? Object.keys(schemaCheck[0]) : [];
    console.log('Available columns:', availableColumns.join(', '));
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = path.join(INPUT_DIR, file);
        const originalFilename = path.basename(file, path.extname(file));
        
        console.log(`\n[${i + 1}/${imageFiles.length}] Processing: ${file}`);
        console.log('================================');
        
        try {
            // Step 1: Process image
            console.log('1. Optimizing image...');
            const processed = await processImage(filePath);
            if (!processed) {
                throw new Error('Failed to process image');
            }
            
            // Step 2: Generate metadata
            console.log('2. Generating metadata with AI...');
            const metadata = await generateMetadata(processed.buffer);
            console.log(`   Description: ${metadata.description || 'No description generated'}`);
            console.log(`   Tags: ${metadata.tags.join(', ') || 'No tags'}`);
            
            // Step 3: Upload main image
            const imageId = crypto.randomUUID();
            const filename = `${imageId}.jpg`;
            console.log('3. Uploading to Supabase storage...');
            const storagePath = await uploadToSupabase(processed.buffer, filename);
            if (!storagePath) {
                throw new Error('Failed to upload to storage');
            }
            console.log(`   Uploaded to: ${storagePath}`);
            
            // Step 4: Create and upload thumbnail
            console.log('4. Creating thumbnail...');
            const thumbnailBuffer = await sharp(processed.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();
            
            const thumbPath = await uploadToSupabase(thumbnailBuffer, `thumb_${filename}`);
            
            // Step 5: Build database record (only include columns that exist)
            console.log('5. Saving to database...');
            const imageRecord = {
                id: imageId,
                src: storagePath,
                thumb_src: thumbPath || storagePath,
                title: originalFilename, // Use original filename as title
                description: metadata.description || '',
                tags: metadata.tags || [],
                image_role: determineImageRole(metadata.description, metadata.tags),
                provider: 'cms',
                collection_id: DEFAULT_COLLECTION_ID,
                is_black_and_white: true,
                // Don't set metadata_status - let it be null
                created_at: new Date().toISOString()
            };
            
            // Add optional fields only if they exist in the schema
            if (availableColumns.includes('original_filename')) {
                imageRecord.original_filename = file;
            }
            if (availableColumns.includes('width')) {
                imageRecord.width = processed.metadata.width;
            }
            if (availableColumns.includes('height')) {
                imageRecord.height = processed.metadata.height;
            }
            if (availableColumns.includes('updated_at')) {
                imageRecord.updated_at = new Date().toISOString();
            }
            
            const { error: insertError } = await supabase
                .from('images')
                .insert([imageRecord]);
                
            if (insertError) {
                throw insertError;
            }
            
            console.log('✅ Successfully processed and saved!');
            successCount++;
            
            // Rate limiting
            if (i < imageFiles.length - 1) {
                console.log('\nWaiting 2 seconds before next image...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n\n=== Processing Complete ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${successCount + errorCount}`);
}

// Check dependencies
async function checkDependencies() {
    try {
        require('sharp');
    } catch (error) {
        console.error('Missing required package: sharp');
        console.error('Please install with: npm install sharp');
        process.exit(1);
    }
}

// Run
(async () => {
    await checkDependencies();
    await processAllImages();
})().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
