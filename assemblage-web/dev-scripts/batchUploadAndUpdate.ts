// scripts/batchUploadAndUpdate.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as csvParseSync from 'csv-parse/sync';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // Re-added for ES Module __dirname equivalent
import { dirname } from 'path';    // Re-added for ES Module __dirname equivalent

// ES Module equivalents for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file at project root
// Assumes __dirname is the directory of the current script (CommonJS behavior)
dotenv.config({ path: path.resolve(__dirname, '../../', '.env') });

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// IMPORTANT: CSV file should be in the assemblage-web directory
const CSV_FILE_PATH = './local_paths_images.csv'; // Assumes CSV is in assemblage-web/ and script run from there
const IMAGE_BUCKET_NAME = 'images';

// Base local directories to search for original images
const LOCAL_IMAGE_BASE_DIRS = [
  '/Users/emilyschwartzman/assemblage-app/assemblage-web/public/images/collages/',
  '/Users/emilyschwartzman/assemblage-app/images/collages/'
];

// Delay between processing each image (in milliseconds) to be gentle
const DELAY_MS = 200; // Reduced delay for dry run, can be 0

interface ImageRecord {
  id: string;       // From CSV, column named 'id'
  src: string;      // From CSV, column named 'src' (e.g., /images/collages/imgname.jpg)
  title?: string;   // Optional, from CSV
  // Add other columns if needed for logging or decisions
}

async function findLocalImage(filename: string): Promise<string | null> {
  for (const baseDir of LOCAL_IMAGE_BASE_DIRS) {
    const fullPath = path.join(baseDir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function processImageRecord(record: ImageRecord, supabase: SupabaseClient): Promise<boolean> {
  console.log(`\nProcessing ID: ${record.id}, Src: ${record.src}`);

  if (!record.src || !record.src.startsWith('/images/collages/')) {
    console.error(`  [SKIP] Invalid 'src' format for ID ${record.id}: ${record.src}`);
    return false;
  }

  const filename = path.basename(record.src);
  const localFilePath = await findLocalImage(filename);

  if (!localFilePath) {
    console.error(`  [ERROR] Local file not found for ${filename} (ID: ${record.id}) in provided directories.`);
    return false;
  }
  console.log(`  [FOUND] Local file: ${localFilePath}`);

  const supabaseStoragePath = `collages/${filename}`;

  try {
    // Attempt to remove the existing file first to ensure fresh metadata on re-upload
    console.log(`  [REMOVE_ATTEMPT] Attempting to remove existing file at ${supabaseStoragePath}...`);
    const { data: removeData, error: removeError } = await supabase.storage
      .from(IMAGE_BUCKET_NAME)
      .remove([supabaseStoragePath]);

    if (removeError) {
      // Log warning but continue, as upload might still succeed or file might not exist
      console.warn(`  [WARN_REMOVE] Could not remove ${supabaseStoragePath} (it may not exist, or other error):`, removeError.message);
    } else {
      console.log(`  [REMOVED_SUCCESS] Successfully removed or confirmed not present: ${supabaseStoragePath}`);
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    
    const fileExtension = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else if (fileExtension === '.gif') {
      contentType = 'image/gif';
    } else if (fileExtension === '.webp') {
      contentType = 'image/webp';
    }
    // Add more types if needed

    console.log(`  [UPLOAD] Uploading ${filename} from ${localFilePath} to Supabase storage at ${supabaseStoragePath} with Content-Type: ${contentType}...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET_NAME)
      .upload(supabaseStoragePath, fileBuffer, {
        cacheControl: '3600',
        upsert: true, 
        contentType: contentType, // Explicitly set Content-Type
      });

    if (uploadError) {
      console.error(`  [ERROR_UPLOAD] Failed to upload ${filename} for ID ${record.id}:`, uploadError.message);
      return false;
    }
    console.log(`  [UPLOAD_SUCCESS] Successfully uploaded ${filename}. Path: ${uploadData.path}`);

    const { data: publicUrlData } = supabase.storage
      .from(IMAGE_BUCKET_NAME)
      .getPublicUrl(supabaseStoragePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(`  [ERROR_PUBLIC_URL] Could not get public URL for ${supabaseStoragePath} (ID: ${record.id}).`);
      return false;
    }
    const newPublicUrl = publicUrlData.publicUrl;
    console.log(`  [PUBLIC_URL] New public URL: ${newPublicUrl}`);

    console.log(`  [DB_UPDATE] Updating src for ID ${record.id} to ${newPublicUrl} and set metadata_status to 'pending_llm'.`);
    const { error: dbUpdateError } = await supabase
      .from('images')
      .update({ src: newPublicUrl, metadata_status: 'pending_llm' })
      .eq('id', record.id);

    if (dbUpdateError) {
      console.error(`  [ERROR_DB_UPDATE] Failed to update database for ID ${record.id}:`, dbUpdateError.message);
      return false;
    }
    console.log(`  [DB_UPDATE_SUCCESS] Successfully updated database for ID ${record.id}.`);
    return true;

  } catch (error: any) {
    console.error(`  [ERROR_GENERAL] Unexpected error processing ID ${record.id} (${filename}):`, error.message);
    return false;
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Supabase URL or Service Key environment variables are not set. Check your .env file path and contents.");
    console.log("SUPABASE_URL:", SUPABASE_URL ? "Loaded" : "MISSING");
    console.log("SUPABASE_SERVICE_KEY:", SUPABASE_SERVICE_KEY ? "Loaded (not showing value)" : "MISSING");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('Supabase client initialized.');

  // Resolve CSV_FILE_PATH relative to the current working directory (assemblage-web)
  const absoluteCsvFilePath = path.resolve(CSV_FILE_PATH);
  console.log(`Attempting to read CSV file from: ${absoluteCsvFilePath}`);


  if (!fs.existsSync(absoluteCsvFilePath)) {
    console.error(`CSV file not found at: ${absoluteCsvFilePath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(absoluteCsvFilePath, { encoding: 'utf-8' });
  const records: ImageRecord[] = csvParseSync.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} records in CSV to process.`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const success = await processImageRecord(record, supabase);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    if (DELAY_MS > 0 && i < records.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\n--- Batch Processing Complete ---`);
  console.log(`Successfully processed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  if (errorCount > 0) {
    console.log('Review logs above for details on failed image processing.');
  }
}

main().catch(console.error);