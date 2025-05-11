#!/usr/bin/env ts-node
/**
 * scripts/seedPublicImages.ts
 *
 * Reads the images from `assemblage-web/public/images/collages`
 * and seeds them into the `images` table in Supabase.
 * 
 * Usage: npm run seed:images (or ts-node scripts/seedPublicImages.ts)
 */

import fs from 'fs';
import path from 'path';
// @ts-ignore: import supabase client types might not resolve in this script
import { createClient } from '@supabase/supabase-js';

dotenv(); // load env from .env in root

function dotenv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    env.split(/\r?\n/).forEach((line) => {
      const [key, ...vals] = line.split('=');
      if (key && !process.env[key]) {
        process.env[key] = vals.join('=');
      }
    });
  }
}

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

async function seedImages() {
  const dir = path.resolve(process.cwd(), 'assemblage-web', 'public', 'images', 'collages');
  if (!fs.existsSync(dir)) {
    console.error('Directory not found:', dir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => /\.jpe?g$/.test(f));
  const records = files.map((file) => {
    const id = path.basename(file, path.extname(file));
    return {
      id,
      src: `/images/collages/${file}`,
      title: id,
      tags: [] as string[],
    };
  });

  console.log(`Seeding ${records.length} images into Supabase...`);
  const { data, error } = await supa.from('images').upsert(records, { onConflict: ['id'] });
  if (error) {
    console.error('Error seeding images:', error);
    process.exit(1);
  }
  console.log('Seed complete. Records:', data?.length);
}

seedImages().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 