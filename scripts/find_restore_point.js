#!/usr/bin/env node
/**
 * Find the exact time when you had 620 images
 * This helps identify the correct PITR restore point
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findRestorePoint() {
    console.log('=== FINDING YOUR RESTORE POINT ===\n');
    
    // Get current time info
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    console.log('Current time:', now.toISOString());
    console.log('2 hours ago:', twoHoursAgo.toISOString());
    console.log('3 hours ago:', threeHoursAgo.toISOString());
    console.log('');
    
    // Check recent modifications
    console.log('Checking for recently modified images...');
    const { data: recentChanges, error } = await supabase
        .from('images')
        .select('id, created_at, updated_at')
        .or(`created_at.gte.${threeHoursAgo.toISOString()},updated_at.gte.${threeHoursAgo.toISOString()}`)
        .order('updated_at', { ascending: false })
        .limit(10);
        
    if (recentChanges && recentChanges.length > 0) {
        console.log('\nRecent activity in images table:');
        recentChanges.forEach(img => {
            console.log(`- ${img.id}: created ${img.created_at}, updated ${img.updated_at}`);
        });
    } else {
        console.log('No recent modifications found in the last 3 hours');
    }
    
    // Provide restore recommendations
    console.log('\n=== RECOMMENDED RESTORE POINTS ===');
    console.log('\nWhen using Supabase PITR, try these times in order:');
    console.log(`1. ${new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString()} (2.5 hours ago)`);
    console.log(`2. ${new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()} (2 hours ago)`);
    console.log(`3. ${new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()} (3 hours ago)`);
    console.log('\nThe data loss likely occurred between 1-2 hours ago during debugging.');
    
    // SQL to help support
    console.log('\n=== SQL FOR SUPABASE SUPPORT ===');
    console.log('If you need to work with support, provide this SQL:');
    console.log(`
-- Check current state
SELECT 
    COUNT(*) as total_count,
    COUNT(CASE WHEN provider = 'cms' THEN 1 END) as cms_count,
    COUNT(CASE WHEN collection_id = '00000000-0000-0000-0000-000000000001' THEN 1 END) as default_collection_count
FROM images;

-- Find when deletions might have occurred (if audit logs are available)
-- This query is for Supabase support to run
SELECT 
    timestamp,
    operation,
    table_name,
    COUNT(*) as affected_rows
FROM audit_logs
WHERE table_name = 'images' 
    AND operation = 'DELETE'
    AND timestamp > NOW() - INTERVAL '4 hours'
GROUP BY timestamp, operation, table_name
ORDER BY timestamp DESC;
`);
}

findRestorePoint().catch(console.error);
