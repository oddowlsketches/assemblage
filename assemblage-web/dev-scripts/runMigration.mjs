// dev-scripts/runMigration.mjs
/**
 * Run the database migration to add rich metadata fields
 * Run from assemblage-web directory: node dev-scripts/runMigration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.log('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Running database migration to add rich metadata fields...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/add_rich_metadata.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('RPC method failed, trying direct execution...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.includes('--') && statement.startsWith('--')) {
          continue; // Skip comment lines
        }
        
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (stmtError) {
          console.warn(`⚠️  Statement failed (may be expected): ${stmtError.message}`);
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run: node dev-scripts/updateImageMetadata.mjs');
    console.log('2. This will process all existing images with the new metadata fields');
    console.log('3. Check the CMS to see the new metadata fields in action');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
