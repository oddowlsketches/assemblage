#!/usr/bin/env node
/**
 * Complete Image Upload and Processing Pipeline
 * 
 * This script:
 * 1. Reads images from Desktop/collage-images
 * 2. Processes/optimizes them for web
 * 3. Uploads to Supabase storage
 * 4. Uses OpenAI Vision API to generate metadata
 * 5. Inserts records into the images table
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // For image processing
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const crypto = require('crypto');

// Load environment variables
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

// Check required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Please add it to your .env file');
    process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Helper function to determine image role from tags/description
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
    
    // Default to narrative
    return 'narrative';
}

// Process a single image
async function processImage(imagePath) {
    console.log(`Processing: ${path.basename(imagePath)}`);
    
    try {
        // Read and process the image
        const imageBuffer = await sharp(imagePath)
            .resize(MAX_WIDTH, MAX_HEIGHT, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ quality: JPEG_QUALITY })
            .toBuffer();
            
        // Get metadata
        const metadata = await sharp(imageBuffer).metadata();
        
        return {
            buffer: imageBuffer,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: imageBuffer.length
            }
        };
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error.message);
        return null;
    }
}

// Generate metadata using OpenAI Vision API
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
                        text: `This is a black and white collage image for an interactive oracle/fortune-telling art experience.
                        
Please analyze this image and provide:
1. A descriptive title (5-10 words)
2. A detailed description (30-50 words) focusing on the visual elements, composition, and mood
3. 5-8 tags that capture themes, emotions, symbols, and aesthetic qualities

Format your response as JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", ...]
}`
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
        
        // Parse the JSON response
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Failed to parse JSON response');
        
    } catch (error) {
        console.error('Error generating metadata:', error.message);
        return {
            title: 'Untitled Collage',
            description: 'A black and white collage image',
            tags: ['collage', 'black and white', 'art']
        };
    }
}

// Upload image to Supabase storage
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

// Insert image record into database
async function insertImageRecord(imageData) {
    try {
        const { data, error } = await supabase
            .from('images')
            .insert([imageData]);
            
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error inserting image record:', error.message);
        return null;
    }
}

// Main processing function
async function processAllImages() {
    console.log('=== Image Upload and Processing Pipeline ===\n');
    console.log(`Input directory: ${INPUT_DIR}`);
    
    // Check if input directory exists
    try {
        await fs.access(INPUT_DIR);
    } catch (error) {
        console.error(`Error: Input directory not found: ${INPUT_DIR}`);
        console.error('Please make sure Desktop/collage-images exists');
        process.exit(1);
    }
    
    // Get all image files
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} images to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each image
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = path.join(INPUT_DIR, file);
        
        console.log(`\n[${i + 1}/${imageFiles.length}] Processing: ${file}`);
        console.log('================================');
        
        try {
            // Step 1: Process/optimize image
            console.log('1. Optimizing image...');
            const processed = await processImage(filePath);
            if (!processed) {
                throw new Error('Failed to process image');
            }
            
            // Step 2: Generate metadata with OpenAI
            console.log('2. Generating metadata with AI...');
            const metadata = await generateMetadata(processed.buffer);
            console.log(`   Title: ${metadata.title}`);
            console.log(`   Tags: ${metadata.tags.join(', ')}`);
            
            // Step 3: Upload to Supabase storage
            const imageId = crypto.randomUUID();
            const filename = `${imageId}.jpg`;
            console.log('3. Uploading to Supabase storage...');
            const storagePath = await uploadToSupabase(processed.buffer, filename);
            if (!storagePath) {
                throw new Error('Failed to upload to storage');
            }
            console.log(`   Uploaded to: ${storagePath}`);
            
            // Step 4: Create thumbnail
            console.log('4. Creating thumbnail...');
            const thumbnailBuffer = await sharp(processed.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();
            
            const thumbPath = await uploadToSupabase(thumbnailBuffer, `thumb_${filename}`);
            
            // Step 5: Insert into database
            console.log('5. Saving to database...');
            const imageRecord = {
                id: imageId,
                src: storagePath,
                thumb_src: thumbPath || storagePath,
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                image_role: determineImageRole(metadata.description, metadata.tags),
                provider: 'cms',
                collection_id: DEFAULT_COLLECTION_ID,
                is_black_and_white: true,
                metadata_status: 'ready',
                original_filename: file,
                width: processed.metadata.width,
                height: processed.metadata.height,
                file_size: processed.metadata.size,
                created_at: new Date().toISOString()
            };
            
            await insertImageRecord(imageRecord);
            console.log('✅ Successfully processed and saved!');
            successCount++;
            
            // Add delay to avoid rate limiting
            if (i < imageFiles.length - 1) {
                console.log('\nWaiting 2 seconds before next image...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            errorCount++;
        }
    }
    
    // Summary
    console.log('\n\n=== Processing Complete ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${successCount + errorCount}`);
    
    if (successCount > 0) {
        console.log('\nYour images have been uploaded and are ready to use!');
        console.log('Check your Netlify site to see the new images in action.');
    }
}

// Install check
async function checkDependencies() {
    try {
        require('sharp');
    } catch (error) {
        console.error('Missing required package: sharp');
        console.error('Please install it with: npm install sharp');
        process.exit(1);
    }
}

// Run the script
(async () => {
    await checkDependencies();
    await processAllImages();
})().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
