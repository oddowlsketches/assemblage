#!/usr/bin/env node
/**
 * scripts/seedPublicImages.js
 *
 * Reads the images from `assemblage-web/public/images/collages`
 * and seeds them into the `images` table in Supabase.
 *
 * Usage: npm run seed:images
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env from root if exists
const dotenvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedImages() {
  // Load metadata JSON for all images to seed
  const metaPath = path.resolve(process.cwd(), 'assemblage-web', 'public', 'images', 'metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.error('Metadata JSON not found:', metaPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(metaPath, 'utf-8');
  const metadata = JSON.parse(raw);
  const records = metadata.map(({ id, src, description, tags }) => ({
    id,
    src: `/images/collages/${src}`,
    title: id,
    tags: tags || [],
    description: description || '',
  }));

  console.log(`Seeding ${records.length} images into Supabase...`);
  const { data, error } = await supa.from('images').upsert(records, { onConflict: 'id', returning: 'representation' });
  if (error) {
    console.error('Error seeding images:', error);
    process.exit(1);
  }
  console.log('Seed complete. Records:', Array.isArray(data) ? data.length : 0);
}

seedImages().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 