#!/usr/bin/env node
/**
 * Working Upload Script - Respects all database constraints
 * Based on actual constraint testing results
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

// Valid constraint values based on testing
const VALID_PALETTE_VALUES = ['vibrant', 'muted', 'pastel', 'neutral'];
const VALID_METADATA_STATUS = ['processing', 'complete', 'error'];

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

// Generate metadata with AI or fallback
async function generateMetadata(imageBuffer, filename) {
    if (!openai) {
        return {
            description: `Black and white collage artwork featuring vintage and surreal imagery`,
            tags: ['collage', 'black and white', 'vintage', 'surreal', 'art']
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
        
        // Ensure we have a description (required field)
        if (!description) {
            description = `Black and white collage artwork featuring vintage and surreal imagery`;
        }
        
        return { description, tags };
        
    } catch (error) {
        console.error('Error with AI:', error.message);
        return {
            description: `Black and white collage artwork featuring vintage and surreal imagery`,
            tags: ['collage', 'black and white', 'vintage', 'surreal', 'art']
        };
    }
}

// Process and upload image
async function processAndUpload(filePath, index, total) {
    const filename = path.basename(filePath);
    const originalName = path.basename(filename, path.extname(filename));
    
    console.log(`\n[${index}/${total}] Processing: ${filename}`);
    console.log('================================');
    
    try {
        // Step 1: Process image
        console.log('1. Optimizing image...');
        const imageBuffer = await sharp(filePath)
            .resize(MAX_WIDTH, MAX_HEIGHT, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ quality: JPEG_QUALITY })
            .toBuffer();
        
        // Step 2: Generate metadata
        console.log('2. Generating metadata...');
        const metadata = await generateMetadata(imageBuffer, originalName);
        console.log(`   Description: ${metadata.description}`);
        if (metadata.tags && metadata.tags.length > 0) {
            console.log(`   Tags: ${metadata.tags.join(', ')}`);
        }
        
        // Step 3: Upload to storage
        const imageId = crypto.randomUUID();
        const storageName = `${imageId}.jpg`;
        console.log('3. Uploading to storage...');
        
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(`collages/${storageName}`, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(`collages/${storageName}`);
        
        // Step 4: Create thumbnail
        console.log('4. Creating thumbnail...');
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
        
        const thumbName = `thumb_${storageName}`;
        await supabase.storage
            .from('images')
            .upload(`collages/${thumbName}`, thumbnailBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        const { data: thumbUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(`collages/${thumbName}`);
        
        // Step 5: Insert to database with valid constraint values
        console.log('5. Saving to database...');
        const imageRecord = {
            id: imageId,
            src: urlData.publicUrl,
            thumb_src: thumbUrlData.publicUrl,
            title: originalName,
            description: metadata.description, // Required field
            tags: metadata.tags || [],
            image_role: determineImageRole(metadata.description, metadata.tags || []),
            provider: 'cms',
            collection_id: DEFAULT_COLLECTION_ID,
            is_black_and_white: true,
            is_photograph: false,
            white_edge_score: 0,
            palette_suitability: 'neutral', // Valid value from constraint test
            rotation: 0,
            created_at: new Date().toISOString(),
            metadata_status: 'complete' // Valid value from constraint test
        };
        
        const { error: dbError } = await supabase
            .from('images')
            .insert([imageRecord]);
            
        if (dbError) throw dbError;
        
        console.log('✅ Successfully uploaded and saved!');
        return true;
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

// Main function
async function main() {
    console.log('=== Working Image Upload Script ===\n');
    console.log(`Input directory: ${INPUT_DIR}`);
    console.log(`Using constraints:`);
    console.log(`- palette_suitability: "neutral"`);
    console.log(`- metadata_status: "complete"`);
    console.log(`- description: Required (not null)\n`);
    
    try {
        await fs.access(INPUT_DIR);
    } catch (error) {
        console.error(`Error: Directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }
    
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    console.log(`Found ${imageFiles.length} images to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const filePath = path.join(INPUT_DIR, imageFiles[i]);
        const success = await processAndUpload(filePath, i + 1, imageFiles.length);
        
        if (success) {
            successCount++;
        } else {
            errorCount++;
        }
        
        // Rate limiting
        if (i < imageFiles.length - 1) {
            const waitTime = openai ? 2000 : 200;
            console.log(`\nWaiting ${waitTime/1000}s before next image...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    console.log('\n\n=== Upload Complete ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${imageFiles.length}`);
    
    if (successCount > 0) {
        console.log('\nVerify with: node scripts/check_image_count.js');
    }
}

// Check dependencies and run
try {
    require('sharp');
    main().catch(console.error);
} catch (error) {
    console.error('Missing required package: sharp');
    console.error('Install with: npm install sharp');
}
