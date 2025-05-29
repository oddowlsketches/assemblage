#!/usr/bin/env ts-node
/**
 * Check and restore from Supabase backups
 * Supabase Pro tier includes Point-in-Time Recovery (PITR)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getCurrentImageCount() {
  const { count, error } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error counting images:', error);
    return 0;
  }
  
  return count || 0;
}

async function exportCurrentImages() {
  console.log('Exporting current images table as backup...');
  
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error exporting images:', error);
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `backups/images_backup_${timestamp}.json`);
  
  // Create backups directory if it doesn't exist
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  
  // Save backup
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`Current images backed up to: ${backupPath}`);
  console.log(`Total images in backup: ${data?.length || 0}`);
  
  return data;
}

async function checkRecentActivity() {
  console.log('\nChecking recent image activity...');
  
  // Get images modified in the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  const { data: recentlyModified, error: modError } = await supabase
    .from('images')
    .select('id, updated_at, metadata_status, provider')
    .gte('updated_at', twoHoursAgo)
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (!modError && recentlyModified) {
    console.log(`\nImages modified in last 2 hours: ${recentlyModified.length}`);
    if (recentlyModified.length > 0) {
      console.log('Recent modifications:');
      recentlyModified.forEach(img => {
        console.log(`  - ${img.id}: ${img.updated_at} (${img.metadata_status})`);
      });
    }
  }
  
  // Get images by provider
  const { data: providerCounts, error: provError } = await supabase
    .from('images')
    .select('provider');
    
  if (!provError && providerCounts) {
    const counts = providerCounts.reduce((acc, img) => {
      const provider = img.provider || 'null';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nImages by provider:');
    Object.entries(counts).forEach(([provider, count]) => {
      console.log(`  - ${provider}: ${count}`);
    });
  }
}

async function generateRestoreSQL() {
  console.log('\nGenerating SQL to restore to 620 images...');
  
  // This assumes you have a backup or know which images should exist
  // You'll need to provide the backup data or image list
  
  const sqlPath = path.join(__dirname, 'restore_to_620_images.sql');
  
  let sql = `-- Restore images table to expected 620 images
-- Generated: ${new Date().toISOString()}

-- First, backup current state
CREATE TABLE IF NOT EXISTS images_backup_before_restore AS 
SELECT * FROM images;

-- If you have a list of the 620 image IDs that should exist,
-- you can generate INSERT statements here

-- Example structure:
-- INSERT INTO images (id, src, thumb_src, provider, collection_id, metadata_status, ...)
-- SELECT id, src, thumb_src, provider, collection_id, metadata_status, ...
-- FROM <backup_source>
-- ON CONFLICT (id) DO UPDATE SET
--   src = EXCLUDED.src,
--   thumb_src = EXCLUDED.thumb_src,
--   metadata_status = EXCLUDED.metadata_status;

-- Note: You'll need to provide the actual backup data or restore point
`;
  
  fs.writeFileSync(sqlPath, sql);
  console.log(`SQL template written to: ${sqlPath}`);
}

async function main() {
  console.log('=== Supabase Backup Check ===\n');
  
  // Check current state
  const currentCount = await getCurrentImageCount();
  console.log(`Current image count: ${currentCount}`);
  console.log(`Expected image count: 620`);
  console.log(`Missing images: ${620 - currentCount}`);
  
  // Export current state as backup
  await exportCurrentImages();
  
  // Check recent activity
  await checkRecentActivity();
  
  // Generate restore SQL template
  await generateRestoreSQL();
  
  console.log('\n=== Backup Restoration Options ===\n');
  
  console.log('1. **Point-in-Time Recovery (PITR) - Pro Feature**');
  console.log('   If you just upgraded to Pro, PITR should be available.');
  console.log('   Go to: https://app.supabase.com/project/[your-project]/settings/database');
  console.log('   Look for "Point-in-time Recovery" section');
  console.log('   You can restore to any point within the retention period (usually 7 days)');
  console.log('');
  
  console.log('2. **Daily Backups**');
  console.log('   Supabase creates daily backups automatically');
  console.log('   Go to: https://app.supabase.com/project/[your-project]/settings/database');
  console.log('   Look for "Backups" section');
  console.log('   You should see backups from the last 7 days');
  console.log('');
  
  console.log('3. **Manual Restore via SQL**');
  console.log('   If you have a backup file or know the exact data:');
  console.log('   - Use the generated restore_to_620_images.sql as a template');
  console.log('   - Fill in the actual image data');
  console.log('   - Execute via: psql $SUPABASE_DB_URL -f restore_to_620_images.sql');
  console.log('');
  
  console.log('4. **Contact Supabase Support**');
  console.log('   As a Pro customer, you have access to support');
  console.log('   They can help with emergency recovery');
  console.log('   Email: support@supabase.io');
  console.log('   Include your project reference and this issue description');
}

main().catch(console.error);
