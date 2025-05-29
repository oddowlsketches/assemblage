#!/usr/bin/env node
/**
 * Check metadata_status constraint values
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkMetadataStatus() {
    console.log('Checking metadata_status values in existing data...\n');
    
    // Get distinct metadata_status values
    const { data, error } = await supabase
        .from('images')
        .select('metadata_status')
        .not('metadata_status', 'is', null);
        
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const uniqueStatuses = [...new Set(data.map(row => row.metadata_status))];
    console.log('Found metadata_status values:');
    uniqueStatuses.forEach(status => console.log(`- ${status}`));
    
    // Try to find some with specific statuses
    console.log('\nChecking for common status values:');
    const statusesToCheck = ['ready', 'pending', 'processing', 'error', 'complete'];
    
    for (const status of statusesToCheck) {
        const { count } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('metadata_status', status);
            
        if (count > 0) {
            console.log(`✓ "${status}" - ${count} records`);
        }
    }
}

checkMetadataStatus().catch(console.error);
