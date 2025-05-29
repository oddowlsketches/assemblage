#!/usr/bin/env ts-node
/**
 * Diagnostic script to inventory storage vs database state
 * Generates CSVs showing missing files, missing DB entries, and stale metadata
 * 
 * SAFETY: This script is READ-ONLY - no mutations to storage or database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Debug output for env variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_COLLECTION_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface StorageObject {
  name: string;
  bucket: string;
  fullPath: string;
}

interface ImageRow {
  id: string;
  src: string;
  thumb_src: string | null;
  provider: string | null;
  collection_id: string | null;
  metadata_status: string | null;
  processing_error: string | null;
}

interface DiagnosticReport {
  missingInDb: Array<{ bucket: string; path: string; fullPath: string }>;
  missingInStorage: Array<{ 
    id: string; 
    src: string; 
    thumb_src: string | null;
    provider: string | null;
    metadata_status: string | null;
  }>;
  staleMetadata: Array<{
    id: string;
    src: string;
    metadata_status: string | null;
    provider: string | null;
  }>;
}

// Helper function to convert array to CSV
function arrayToCsv(data: any[], columns: string[]): string {
  if (!data.length) return columns.join(',') + '\n';
  
  const rows = [columns.join(',')];
  for (const item of data) {
    const row = columns.map(col => {
      const value = item[col] !== null && item[col] !== undefined ? String(item[col]) : '';
      // Escape values containing commas or quotes
      if (value && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

async function listAllStorageObjects(): Promise<StorageObject[]> {
  const objects: StorageObject[] = [];
  
  // List objects in cms-images bucket
  console.log('Scanning cms-images bucket...');
  const { data: cmsFiles, error: cmsError } = await supabase.storage
    .from('cms-images')
    .list('', { limit: 1000, offset: 0 });
    
  if (cmsError) {
    console.error('Error listing cms-images:', cmsError);
  } else if (cmsFiles) {
    for (const file of cmsFiles) {
      if (file.name && !file.name.endsWith('/')) {
        objects.push({
          name: file.name,
          bucket: 'cms-images',
          fullPath: `cms-images/${file.name}`
        });
      }
    }
  }
  
  // List objects in user-images bucket (including subdirectories)
  console.log('Scanning user-images bucket...');
  const subdirs = ['', 'orphaned_backup', 'collages'];
  
  for (const subdir of subdirs) {
    const { data: userFiles, error: userError } = await supabase.storage
      .from('user-images')
      .list(subdir, { limit: 1000, offset: 0 });
      
    if (userError) {
      console.error(`Error listing user-images/${subdir}:`, userError);
    } else if (userFiles) {
      for (const file of userFiles) {
        if (file.name && !file.name.endsWith('/')) {
          const fullPath = subdir 
            ? `user-images/${subdir}/${file.name}`
            : `user-images/${file.name}`;
          objects.push({
            name: file.name,
            bucket: 'user-images',
            fullPath
          });
        }
      }
    }
  }
  
  console.log(`Found ${objects.length} total objects in storage`);
  return objects;
}

async function getAllImageRows(): Promise<ImageRow[]> {
  console.log('Fetching image rows from database...');
  
  const { data, error } = await supabase
    .from('images')
    .select('id, src, thumb_src, provider, collection_id, metadata_status, processing_error')
    .or('provider.eq.cms,provider.is.null');
    
  if (error) {
    console.error('Error fetching images:', error);
    return [];
  }
  
  console.log(`Found ${data?.length || 0} CMS/null provider images in database`);
  return data || [];
}

async function checkFileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
      
    return !error && !!data;
  } catch {
    return false;
  }
}

async function generateDiagnosticReport(): Promise<DiagnosticReport> {
  const storageObjects = await listAllStorageObjects();
  const imageRows = await getAllImageRows();
  
  const report: DiagnosticReport = {
    missingInDb: [],
    missingInStorage: [],
    staleMetadata: []
  };
  
  // Create a map of database entries by src path
  const dbBySrc = new Map<string, ImageRow>();
  for (const row of imageRows) {
    dbBySrc.set(row.src, row);
  }
  
  // Check for storage objects missing in DB
  console.log('\nChecking for storage objects missing in database...');
  for (const obj of storageObjects) {
    if (!dbBySrc.has(obj.fullPath)) {
      report.missingInDb.push({
        bucket: obj.bucket,
        path: obj.name,
        fullPath: obj.fullPath
      });
    }
  }
  
  // Check for DB entries with missing storage files
  console.log('\nChecking for database entries with missing storage files...');
  for (const row of imageRows) {
    // Parse the bucket and path from src
    const srcParts = row.src.split('/');
    const bucket = srcParts[0];
    const filePath = srcParts.slice(1).join('/');
    
    const exists = await checkFileExists(bucket, filePath);
    if (!exists) {
      report.missingInStorage.push({
        id: row.id,
        src: row.src,
        thumb_src: row.thumb_src,
        provider: row.provider,
        metadata_status: row.metadata_status
      });
    }
    
    // Check for stale metadata
    if (row.metadata_status !== 'ready') {
      report.staleMetadata.push({
        id: row.id,
        src: row.src,
        metadata_status: row.metadata_status,
        provider: row.provider
      });
    }
  }
  
  return report;
}

async function writeCsvFiles(report: DiagnosticReport): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, 'diagnostics', timestamp);
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Write missing_in_db.csv
  const missingInDbCsv = arrayToCsv(report.missingInDb, ['bucket', 'path', 'fullPath']);
  fs.writeFileSync(path.join(outputDir, 'missing_in_db.csv'), missingInDbCsv);
  
  // Write missing_in_storage.csv
  const missingInStorageCsv = arrayToCsv(report.missingInStorage, ['id', 'src', 'thumb_src', 'provider', 'metadata_status']);
  fs.writeFileSync(path.join(outputDir, 'missing_in_storage.csv'), missingInStorageCsv);
  
  // Write stale_metadata.csv
  const staleMetadataCsv = arrayToCsv(report.staleMetadata, ['id', 'src', 'metadata_status', 'provider']);
  fs.writeFileSync(path.join(outputDir, 'stale_metadata.csv'), staleMetadataCsv);
  
  console.log(`\nCSV files written to: ${outputDir}`);
}

async function generateRestoreSql(report: DiagnosticReport): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, 'diagnostics', timestamp);
  
  let sql = '-- Restore script for default collection images\n';
  sql += '-- Generated: ' + new Date().toISOString() + '\n';
  sql += '-- SAFETY: Review this SQL before executing!\n\n';
  
  sql += 'BEGIN;\n\n';
  
  // INSERT statements for missing_in_db
  if (report.missingInDb.length > 0) {
    sql += '-- INSERT rows for files that exist in storage but not in database\n';
    sql += '-- Total: ' + report.missingInDb.length + ' rows\n\n';
    
    for (const obj of report.missingInDb) {
      const thumbSrc = obj.fullPath.includes('/thumbnails/') 
        ? obj.fullPath 
        : obj.fullPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.$1');
        
      sql += `INSERT INTO images (src, thumb_src, provider, collection_id, metadata_status, created_at, updated_at)\n`;
      sql += `VALUES ('${obj.fullPath}', '${thumbSrc}', 'cms', '${DEFAULT_COLLECTION_ID}', 'pending', NOW(), NOW());\n\n`;
    }
  }
  
  // UPDATE statements for missing_in_storage
  if (report.missingInStorage.length > 0) {
    sql += '-- UPDATE rows where files are missing from storage\n';
    sql += '-- Total: ' + report.missingInStorage.length + ' rows\n\n';
    
    for (const row of report.missingInStorage) {
      sql += `UPDATE images SET metadata_status = 'error', processing_error = 'file-missing' WHERE id = '${row.id}';\n`;
    }
    sql += '\n';
  }
  
  sql += 'COMMIT;\n\n';
  sql += '-- Summary:\n';
  sql += `-- Files in storage missing from DB: ${report.missingInDb.length}\n`;
  sql += `-- DB entries missing storage files: ${report.missingInStorage.length}\n`;
  sql += `-- Entries with stale metadata: ${report.staleMetadata.length}\n`;
  
  fs.writeFileSync(path.join(outputDir, 'restore_default_collection.sql'), sql);
  console.log(`SQL restore script written to: ${path.join(outputDir, 'restore_default_collection.sql')}`);
}

async function main() {
  console.log('Starting storage vs database inventory...\n');
  
  try {
    const report = await generateDiagnosticReport();
    
    // Print summary
    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    console.log(`Files in storage missing from DB: ${report.missingInDb.length}`);
    console.log(`DB entries missing storage files: ${report.missingInStorage.length}`);
    console.log(`Entries with stale metadata: ${report.staleMetadata.length}`);
    
    // Write CSV files
    await writeCsvFiles(report);
    
    // Generate restore SQL
    await generateRestoreSql(report);
    
    console.log('\nDiagnostic complete!');
    
  } catch (error) {
    console.error('Error during diagnostic:', error);
    process.exit(1);
  }
}

// Run the diagnostic
main();
