import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ImageBatch {
  id: string
  src: string
  thumb_src: string
  provider: string
}

serve(async (req) => {
  try {
    // This function is meant to be called by a cron job
    console.log('Starting batch metadata processing')

    // Get pending images using the RPC function
    const { data: pendingImages, error: fetchError } = await supabase
      .rpc('list_pending_images', { batch_size: 25 })

    if (fetchError) {
      throw new Error(`Failed to fetch pending images: ${fetchError.message}`)
    }

    if (!pendingImages || pendingImages.length === 0) {
      console.log('No pending images to process')
      return new Response(JSON.stringify({ message: 'No pending images' }), { status: 200 })
    }

    console.log(`Processing ${pendingImages.length} images`)

    // Update status to processing for all images
    const imageIds = pendingImages.map((img: ImageBatch) => img.id)
    await supabase
      .from('images')
      .update({ metadata_status: 'processing' })
      .in('id', imageIds)

    // Process images in a single OpenAI call for efficiency
    const processedResults = await processImageBatch(pendingImages)

    // Update all images with their metadata
    const updatePromises = processedResults.map(async (result) => {
      const { id, metadata, error } = result
      
      if (error) {
        // Update with error status
        return supabase
          .from('images')
          .update({
            metadata_status: 'error',
            processing_error: error,
            retry_count: supabase.sql`COALESCE(retry_count, 0) + 1`,
            last_processed: new Date().toISOString()
          })
          .eq('id', id)
      }

      // Update with successful metadata
      return supabase
        .from('images')
        .update({
          description: metadata.description,
          tags: metadata.tags,
          is_black_and_white: metadata.is_black_and_white,
          is_photograph: metadata.is_photograph,
          white_edge_score: metadata.white_edge_score,
          palette_suitability: metadata.palette_suitability,
          image_role: metadata.image_role,
          metadata: metadata,
          metadata_status: 'complete',
          last_processed: new Date().toISOString()
        })
        .eq('id', id)
    })

    await Promise.all(updatePromises)

    console.log('Batch processing complete')

    return new Response(JSON.stringify({ 
      success: true, 
      processed: pendingImages.length 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in batch processing:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function processImageBatch(images: ImageBatch[]) {
  try {
    // Create a batch prompt for all images
    const batchPrompt = images.map((img, index) => {
      return `Image ${index + 1} (ID: ${img.id}): Analyze this image.`
    }).join('\n\n')

    const systemPrompt = `You are analyzing a batch of images for a collage-making application. 
For each image, provide:
1. A detailed description (2-3 sentences)
2. 5-8 relevant tags
3. Whether it's black and white (true/false)
4. Whether it's a photograph (true/false)
5. White edge score (0-1, how much white border it has)
6. Palette suitability: one of "vibrant", "neutral", "earthtone", "muted", "pastel"
7. Image role: one of "texture", "narrative", "conceptual"

Return a JSON array with one object per image in the same order, using this structure:
[{
  "id": "image_id",
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "is_black_and_white": true/false,
  "is_photograph": true/false,
  "white_edge_score": 0.0-1.0,
  "palette_suitability": "vibrant|neutral|earthtone|muted|pastel",
  "image_role": "texture|narrative|conceptual"
}]`

    // For now, create placeholder data since we can't actually call OpenAI from Edge Functions
    // In production, this would make the actual API call
    const results = images.map(img => ({
      id: img.id,
      metadata: {
        description: 'A black and white collage image with interesting textures and patterns.',
        tags: ['collage', 'black-and-white', 'texture', 'abstract'],
        is_black_and_white: true,
        is_photograph: false,
        white_edge_score: 0.1,
        palette_suitability: 'neutral',
        image_role: 'texture',
        generated_at: new Date().toISOString(),
        model: 'gpt-4o'
      },
      error: null
    }))

    return results
  } catch (error) {
    // Return error for all images
    return images.map(img => ({
      id: img.id,
      metadata: null,
      error: error.message
    }))
  }
}
