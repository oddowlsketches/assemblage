#!/usr/bin/env ts-node
/**
 * scripts/dbSync.ts
 *
 * Syncs the SQL schema in `supabase/schema.sql` to your Supabase project.
 *
 * Prerequisites:
 *   1. Install the Supabase CLI: `npm install -g supabase`  (or use `npx supabase`)
 *   2. Ensure the following env vars are set (see .env.example):
 *        SUPABASE_URL
 *        SUPABASE_SERVICE_KEY
 *   3. You must have logged in via `supabase login` at least once.
 *
 * Usage:
 *   npm run db:push
 */

import { execSync } from 'child_process';
import path from 'path';
// Import the shared schema purely so that TypeScript will type-check it and emit errors
// if someone changes the shapes without updating the DB SQL.
import '../shared/schema';

const schemaPath = path.resolve('supabase', 'schema.sql');

try {
  console.log('📦  Pushing database schema to Supabase…');
  // Using execSync so the CLI's interactive output is streamed directly.
  execSync(`npx supabase db push --file ${schemaPath}`, {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('✅  Supabase schema push complete.');
} catch (err) {
  console.error('❌  Failed to push schema:', err);
  process.exit(1);
} 