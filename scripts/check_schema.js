#!/usr/bin/env node
/**
 * Check the images table schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('Checking images table schema...\n');
    
    // Get one row to see the structure
    const { data, error } = await supabase
        .from('images')
        .select('*')
        .limit(1);
        
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Available columns:');
        Object.keys(data[0]).forEach(key => {
            const value = data[0][key];
            const type = value === null ? 'null' : typeof value;
            console.log(`- ${key} (${type})`);
        });
        
        console.log('\nSample data:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data found in images table');
    }
}

checkSchema().catch(console.error);
