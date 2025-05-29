#!/usr/bin/env ts-node
/**
 * Direct restore helper for Supabase Pro backups
 * This helps you restore the images table from an hour ago
 */

import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'your-project-ref';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';

// Extract project reference from URL if not set
const extractedRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || PROJECT_REF;

console.log('=== Supabase Pro Backup Restore Guide ===\n');

console.log('Since you just upgraded to Pro, you should have access to:');
console.log('1. Point-in-Time Recovery (PITR)');
console.log('2. Daily automated backups\n');

console.log('=== IMMEDIATE STEPS ===\n');

console.log('1. **Access Supabase Dashboard**');
console.log(`   Go to: https://app.supabase.com/project/${extractedRef}/settings/database\n`);

console.log('2. **Use Point-in-Time Recovery (Recommended)**');
console.log('   - In the Database settings, find "Point-in-time Recovery"');
console.log('   - Click "Restore to a point in time"');
console.log('   - Select a time from 1-2 hours ago (before the data loss)');
console.log('   - Choose to restore only the "images" table');
console.log('   - Click "Restore"\n');

console.log('3. **Alternative: Use SQL Editor**');
console.log('   If PITR is not yet active (can take time after upgrade), try:');
console.log(`   - Go to: https://app.supabase.com/project/${extractedRef}/editor`);
console.log('   - Run this query to check for system backups:\n');

const checkBackupSQL = `
-- Check if there's a recent backup table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%backup%' 
  OR table_name LIKE '%images_%'
ORDER BY table_name;

-- Check audit logs if enabled
SELECT * 
FROM audit.record_version 
WHERE table_name = 'images' 
  AND recorded_at > NOW() - INTERVAL '3 hours'
ORDER BY recorded_at DESC 
LIMIT 10;
`;

console.log('```sql');
console.log(checkBackupSQL);
console.log('```\n');

console.log('4. **Emergency Recovery via Support**');
console.log('   If the above doesn\'t work:');
console.log('   - Email: support@supabase.io');
console.log('   - Subject: "Urgent: Pro customer data recovery needed"');
console.log(`   - Include project ref: ${extractedRef}`);
console.log('   - Mention: "Lost ~125 images from images table, need restore from 1-2 hours ago"');
console.log('   - Request: Point-in-time recovery to before the data loss\n');

// Generate a recovery verification script
const verifySQL = `
-- Verify image count after restore
SELECT 
  COUNT(*) as total_images,
  COUNT(CASE WHEN provider = 'cms' THEN 1 END) as cms_images,
  COUNT(CASE WHEN provider IS NULL THEN 1 END) as null_provider_images,
  COUNT(CASE WHEN metadata_status = 'ready' THEN 1 END) as ready_images,
  COUNT(CASE WHEN collection_id = '00000000-0000-0000-0000-000000000001' THEN 1 END) as default_collection
FROM images;

-- Check for recent deletions (if audit is enabled)
SELECT 
  operation,
  table_name,
  COUNT(*) as count,
  MIN(recorded_at) as first_deletion,
  MAX(recorded_at) as last_deletion
FROM audit.record_version
WHERE table_name = 'images' 
  AND operation = 'DELETE'
  AND recorded_at > NOW() - INTERVAL '3 hours'
GROUP BY operation, table_name;
`;

fs.writeFileSync(
  path.join(__dirname, 'verify_restore.sql'),
  `-- Run this after restore to verify success\n${verifySQL}`
);

console.log('5. **After Restore - Verify**');
console.log('   Run the verification script:');
console.log('   cat scripts/verify_restore.sql\n');

console.log('=== QUICK TIP ===');
console.log('If you have any browser tabs open with the Supabase dashboard from');
console.log('before the data loss, check if they still show the 620 images.');
console.log('Sometimes the UI caches data that can help identify what\'s missing.\n');

// Create a timestamp for tracking
const timestamp = new Date().toISOString();
fs.writeFileSync(
  path.join(__dirname, 'restore_attempt.log'),
  `Restore attempt initiated at: ${timestamp}\nExpected images: 620\nProject: ${extractedRef}\n`
);

console.log(`Timestamp recorded: ${timestamp}`);
console.log('Use this timestamp when communicating with Supabase support.\n');
