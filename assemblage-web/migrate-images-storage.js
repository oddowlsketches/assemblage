// Migration script to update existing images with storage optimization data
// Run this using: node migrate-images-storage.js

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getImageDimensions(url) {
  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    
    // Simple dimension detection for JPEG/PNG
    const view = new DataView(buffer)
    
    // Check for PNG
    if (view.getUint32(0) === 0x89504E47) {
      const width = view.getUint32(16)
      const height = view.getUint32(20)
      return { width, height, size: buffer.byteLength }
    }
    
    // Check for JPEG
    if (view.getUint16(0) === 0xFFD8) {
      // This is a simplified check - in production you'd want a proper JPEG parser
      // For now, return estimated values
      return { width: 0, height: 0, size: buffer.byteLength }
    }
    
    return { width: 0, height: 0, size: buffer.byteLength }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return { width: 0, height: 0, size: 0 }
  }
}

async function migrateImages() {
  console.log('Starting image migration...')
  
  let offset = 0
  const limit = 50
  let totalMigrated = 0
  let totalErrors = 0
  
  while (true) {
    // Fetch images that need migration
    const { data: images, error } = await supabase
      .from('images')
      .select('id, src, thumb_src, user_id')
      .eq('provider', 'upload')
      .is('storage_key_original', null)
      .not('src', 'is', null)
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching images:', error)
      break
    }
    
    if (!images || images.length === 0) {
      console.log('No more images to migrate')
      break
    }
    
    console.log(`Processing batch: ${offset} to ${offset + images.length}`)
    
    for (const image of images) {
      try {
        // Extract storage keys from URLs
        const originalKey = image.src.match(/user-images\/(.+)$/)?.[1] || null
        const thumbKey = image.thumb_src?.match(/user-images\/(.+)$/)?.[1] || null
        
        // Get dimensions and size
        const { width, height, size } = await getImageDimensions(image.src)
        
        // Check if image is black and white (simplified check)
        // In production, you'd want to actually analyze the image
        const isBW = image.src.includes('bw') || image.src.includes('black')
        
        // Update the image record
        const { error: updateError } = await supabase
          .from('images')
          .update({
            storage_key_original: originalKey,
            storage_key_thumb: thumbKey,
            width: width || null,
            height: height || null,
            size_bytes: size || null,
            is_bw: isBW
          })
          .eq('id', image.id)
        
        if (updateError) {
          console.error(`Error updating image ${image.id}:`, updateError)
          totalErrors++
        } else {
          totalMigrated++
          if (totalMigrated % 10 === 0) {
            console.log(`Migrated ${totalMigrated} images...`)
          }
        }
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error)
        totalErrors++
      }
    }
    
    offset += limit
  }
  
  console.log('\nMigration complete!')
  console.log(`Total migrated: ${totalMigrated}`)
  console.log(`Total errors: ${totalErrors}`)
  
  // Get storage statistics
  const { data: stats, error: statsError } = await supabase
    .rpc('migrate_existing_images_to_storage')
  
  if (!statsError && stats) {
    console.log('\nStorage statistics:')
    console.log(`Total storage used: ${stats[0].total_size_mb} MB`)
  }
}

// Run the migration
migrateImages().catch(console.error)
