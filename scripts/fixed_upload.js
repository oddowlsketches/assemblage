#!/usr/bin/env node
/**
 * Fixed Upload Script - Handles all database constraints correctly
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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
                height: metadata.height
            }
        };
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error.message);
        return null;
    }
}

// Generate metadata with AI
async function generateMetadata(imageBuffer, filename) {
    if (!openai) {
        // Return basic metadata if no OpenAI key
        return {
            description: `Black and white collage image: ${filename}`,
            tags: ['collage', 'black and white', 'vintage', 'art']
        };
    }
    
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
            tags = tagsMatch[1].split(',').map(tag => tag.trim().toLowerCase());
        }
        
        return { description, tags };
        
    } catch (error) {
        console.error('Error generating metadata:', error.message);
        return {
            description: `Black and white collage image: ${filename}`,
            tags: ['collage', 'black and white', 'vintage', 'art']
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
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath);
            
        return publicUrlData.publicUrl;
    } catch (error) {
        console.error(`Error uploading ${filename}:`, error.message);
        return null;
    }
}

// Main processing function
async function processAllImages() {
    console.log('=== Fixed Image Upload Pipeline ===\n');
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
            console.log('2. Generating metadata...');
            const metadata = await generateMetadata(processed.buffer, originalFilename);
            if (metadata.description) {
                console.log(`   Description: ${metadata.description}`);
            }
            if (metadata.tags && metadata.tags.length > 0) {
                console.log(`   Tags: ${metadata.tags.join(', ')}`);
            }
            
            // Step 3: Upload main image
            const imageId = crypto.randomUUID();
            const filename = `${imageId}.jpg`;
            console.log('3. Uploading to Supabase storage...');
            const imageUrl = await uploadToSupabase(processed.buffer, filename);
            if (!imageUrl) {
                throw new Error('Failed to upload to storage');
            }
            console.log(`   Uploaded successfully`);
            
            // Step 4: Create and upload thumbnail
            console.log('4. Creating thumbnail...');
            const thumbnailBuffer = await sharp(processed.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();
            
            const thumbUrl = await uploadToSupabase(thumbnailBuffer, `thumb_${filename}`);
            
            // Step 5: Save to database
            console.log('5. Saving to database...');
            const imageRecord = {
                id: imageId,
                src: imageUrl,
                thumb_src: thumbUrl,
                title: originalFilename,
                description: metadata.description || '',
                tags: metadata.tags || [],
                image_role: determineImageRole(metadata.description || '', metadata.tags || []),
                provider: 'cms',
                collection_id: DEFAULT_COLLECTION_ID,
                is_black_and_white: true,
                is_photograph: false,
                white_edge_score: 0,
                palette_suitability: 'vibrant', // Use 'vibrant' instead of 'monochrome'
                rotation: 0,
                created_at: new Date().toISOString()
                // metadata_status is intentionally omitted to be null
            };
            
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
                const waitTime = openai ? 2000 : 500; // Wait less if not using AI
                console.log(`\nWaiting ${waitTime/1000} seconds before next image...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n\n=== Processing Complete ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${imageFiles.length}`);
    
    if (successCount > 0) {
        console.log('\nYour images have been uploaded successfully!');
        console.log('Run this to verify:');
        console.log('  node scripts/check_image_count.js');
    }
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
