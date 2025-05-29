#!/usr/bin/env node
/**
 * Test what values are allowed for constrained fields
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConstraints() {
    console.log('Testing database constraints...\n');
    
    // Common values to test for palette_suitability
    const palettesToTest = [
        null,
        'vibrant',
        'muted',
        'monochrome',
        'pastel',
        'neutral',
        'warm',
        'cool',
        'high-contrast',
        'low-contrast'
    ];
    
    console.log('Testing palette_suitability values:');
    
    for (const paletteValue of palettesToTest) {
        const testId = crypto.randomUUID();
        const testRecord = {
            id: testId,
            src: 'https://example.com/test.jpg',
            title: 'Test Image',
            description: 'Test',
            tags: ['test'],
            created_at: new Date().toISOString(),
            image_role: 'narrative',
            collection_id: '00000000-0000-0000-0000-000000000001',
            is_black_and_white: true,
            is_photograph: false,
            white_edge_score: 0,
            palette_suitability: paletteValue,
            rotation: 0,
            provider: 'cms'
        };
        
        const { error } = await supabase
            .from('images')
            .insert([testRecord]);
            
        if (!error) {
            console.log(`✅ "${paletteValue}" - VALID`);
            // Clean up test record
            await supabase.from('images').delete().eq('id', testId);
        } else {
            if (error.message.includes('check constraint')) {
                console.log(`❌ "${paletteValue}" - INVALID (${error.message})`);
            } else {
                console.log(`⚠️  "${paletteValue}" - Other error: ${error.message}`);
            }
        }
    }
    
    // Also test metadata_status values
    console.log('\n\nTesting metadata_status values:');
    const statusesToTest = [
        null,
        'ready',
        'pending',
        'processing',
        'complete',
        'error'
    ];
    
    for (const statusValue of statusesToTest) {
        const testId = crypto.randomUUID();
        const testRecord = {
            id: testId,
            src: 'https://example.com/test2.jpg',
            title: 'Test Image 2',
            description: 'Test',
            tags: ['test'],
            created_at: new Date().toISOString(),
            image_role: 'narrative',
            collection_id: '00000000-0000-0000-0000-000000000001',
            is_black_and_white: true,
            is_photograph: false,
            white_edge_score: 0,
            rotation: 0,
            provider: 'cms',
            metadata_status: statusValue
        };
        
        const { error } = await supabase
            .from('images')
            .insert([testRecord]);
            
        if (!error) {
            console.log(`✅ "${statusValue}" - VALID`);
            // Clean up test record
            await supabase.from('images').delete().eq('id', testId);
        } else {
            if (error.message.includes('check constraint')) {
                console.log(`❌ "${statusValue}" - INVALID`);
            }
        }
    }
}

testConstraints().catch(console.error);
