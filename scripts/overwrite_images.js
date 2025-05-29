#!/usr/bin/env node
/**
 * Overwrite Existing Images
 * 
 * This script updates all existing CMS images with new metadata
 * from the Desktop/collage-images folder
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

require('dotenv').config();

const INPUT_DIR = path.join(process.env.HOME, 'Desktop', 'collage-images');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

async function clearExistingImages() {
    console.log('Clearing existing CMS images from database...');
    
    const { error } = await supabase
        .from('images')
        .delete()
        .eq('provider', 'cms');
        
    if (error) {
        console.error('Error clearing images:', error);
        return false;
    }
    
    console.log('✅ Cleared existing CMS images');
    return true;
}

async function main() {
    console.log('=== Overwrite Existing Images ===\n');
    
    // First check current state
    const { count: currentCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('provider', 'cms');
        
    console.log(`Current CMS images in database: ${currentCount || 0}`);
    
    console.log('\nThis will DELETE all existing CMS images and re-upload from Desktop/collage-images');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clear existing images
    const cleared = await clearExistingImages();
    if (!cleared) {
        process.exit(1);
    }
    
    // Now run the upload script
    console.log('\nStarting fresh upload...\n');
    require('./cms_compatible_upload.js');
}

main().catch(console.error);
