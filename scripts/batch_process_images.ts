#!/usr/bin/env ts-node
/**
 * Batch process pending images with rate limiting
 * This script processes images marked as 'pending' in batches,
 * respecting the embedding API rate limits
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_EMBEDDING_CALLS_PER_MIN = parseInt(process.env.MAX_EMBEDDING_CALLS_PER_MIN || '20');
const BATCH_SIZE = 10; // Process 10 images at a time

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getPendingImages(limit: number) {
  const { data, error } = await supabase
    .from('images')
    .select('id, src, provider')
    .eq('metadata_status', 'pending')
    .limit(limit);
    
  if (error) {
    console.error('Error fetching pending images:', error);
    return [];
  }
  
  return data || [];
}

async function processImageBatch(images: any[]) {
  console.log(`Processing batch of ${images.length} images...`);
  
  for (const image of images) {
    try {
      // Invoke the process_image edge function for each image
      const { data, error } = await supabase.functions.invoke('process_image', {
        body: { imageId: image.id }
      });
      
      if (error) {
        console.error(`Failed to process image ${image.id}:`, error);
      } else {
        console.log(`✓ Processed image ${image.id}`);
      }
    } catch (err) {
      console.error(`Error processing image ${image.id}:`, err);
    }
  }
}

async function main() {
  console.log('Starting batch image processing...');
  console.log(`Rate limit: ${MAX_EMBEDDING_CALLS_PER_MIN} calls per minute`);
  console.log(`Batch size: ${BATCH_SIZE} images\n`);
  
  let processedCount = 0;
  let hasMore = true;
  
  while (hasMore) {
    // Get next batch of pending images
    const pendingImages = await getPendingImages(BATCH_SIZE);
    
    if (pendingImages.length === 0) {
      hasMore = false;
      console.log('\nNo more pending images to process.');
      break;
    }
    
    // Process the batch
    await processImageBatch(pendingImages);
    processedCount += pendingImages.length;
    
    console.log(`\nProcessed ${processedCount} images total`);
    
    // Rate limiting: wait to respect API limits
    if (pendingImages.length === BATCH_SIZE) {
      const waitTime = (60 / MAX_EMBEDDING_CALLS_PER_MIN) * BATCH_SIZE * 1000;
      console.log(`Waiting ${Math.round(waitTime / 1000)}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  console.log(`\nBatch processing complete. Total images processed: ${processedCount}`);
}

// Run the script
main().catch(console.error);
