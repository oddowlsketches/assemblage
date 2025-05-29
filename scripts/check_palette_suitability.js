#!/usr/bin/env node
/**
 * Check what values are allowed for palette_suitability
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPaletteSuitability() {
    console.log('Checking palette_suitability values...\n');
    
    // Get all distinct values
    const { data, error } = await supabase
        .from('images')
        .select('palette_suitability');
        
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const uniqueValues = [...new Set(data.map(row => row.palette_suitability).filter(v => v !== null))];
    console.log('Found palette_suitability values:');
    uniqueValues.forEach(value => console.log(`- ${value}`));
    
    // Also check for patterns
    console.log('\nChecking value counts:');
    const valueCounts = {};
    data.forEach(row => {
        const value = row.palette_suitability || 'null';
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([value, count]) => {
            console.log(`  ${value}: ${count} records`);
        });
}

checkPaletteSuitability().catch(console.error);
