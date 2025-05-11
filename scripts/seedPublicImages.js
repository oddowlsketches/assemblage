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
      tags: [],
      description: '' // default empty description to satisfy NOT NULL constraint
    };
  });

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