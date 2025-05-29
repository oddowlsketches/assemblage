#!/usr/bin/env node
/**
 * Enhance Metadata for Existing Images
 * 
 * This script updates metadata for images already in the database
 * using OpenAI Vision API
 */

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
    console.error('Missing required environment variables');
    console.error('Need: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Determine image role from metadata
function determineImageRole(description, tags) {
    const combined = `${description} ${tags.join(' ')}`.toLowerCase();
    
    if (/(texture|surface|material|pattern|fabric|wood|stone|metal)/.test(combined)) {
        return 'texture';
    }
    if (/(abstract|geometric|concept|form|shape|crystal|mineral)/.test(combined)) {
        return 'conceptual';
    }
    return 'narrative';
}

// Generate metadata using OpenAI
async function generateMetadata(imageUrl) {
    try {
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
                            url: imageUrl,
                            detail: "high"
                        }
                    }
                ]
            }],
            max_tokens: 300
        });
        
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Failed to parse JSON response');
        
    } catch (error) {
        console.error('Error generating metadata:', error.message);
        return null;
    }
}

// Main function
async function enhanceMetadata() {
    console.log('=== Enhancing Image Metadata with AI ===\n');
    
    // Get images that need metadata
    const { data: images, error } = await supabase
        .from('images')
        .select('id, src, title, description, tags')
        .eq('provider', 'cms')
        .eq('metadata_status', 'pending')
        .limit(50);
        
    if (error) {
        console.error('Error fetching images:', error);
        return;
    }
    
    console.log(`Found ${images.length} images needing metadata\n`);
    
    let successCount = 0;
    
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`[${i + 1}/${images.length}] Processing image: ${image.id}`);
        
        try {
            // Get public URL for the image
            const { data: urlData } = supabase.storage
                .from(image.src.split('/')[0])
                .getPublicUrl(image.src.split('/').slice(1).join('/'));
                
            if (!urlData?.publicUrl) {
                throw new Error('Could not get public URL');
            }
            
            // Generate metadata
            console.log('  Generating metadata...');
            const metadata = await generateMetadata(urlData.publicUrl);
            
            if (!metadata) {
                throw new Error('Failed to generate metadata');
            }
            
            console.log(`  Title: ${metadata.title}`);
            console.log(`  Tags: ${metadata.tags.join(', ')}`);
            
            // Update database
            const { error: updateError } = await supabase
                .from('images')
                .update({
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags,
                    image_role: determineImageRole(metadata.description, metadata.tags),
                    metadata_status: 'ready',
                    updated_at: new Date().toISOString()
                })
                .eq('id', image.id);
                
            if (updateError) throw updateError;
            
            console.log('  ✅ Updated successfully!');
            successCount++;
            
            // Rate limiting
            if (i < images.length - 1) {
                console.log('  Waiting 2 seconds...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}\n`);
        }
    }
    
    console.log(`\n=== Complete ===`);
    console.log(`Updated ${successCount}/${images.length} images`);
}

// Run
enhanceMetadata().catch(console.error);
