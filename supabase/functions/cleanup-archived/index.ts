import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  try {
    // This function should be called by a scheduled job or manually
    console.log('[cleanup_archived] Starting cleanup of archived images')

    // Get all archived images older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: archivedImages, error: fetchError } = await supabase
      .from('images')
      .select('id, src, thumb_src, provider')
      .eq('archived', true)
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (fetchError) {
      throw new Error(`Failed to fetch archived images: ${fetchError.message}`)
    }

    console.log(`[cleanup_archived] Found ${archivedImages?.length || 0} archived images to clean up`)

    if (!archivedImages || archivedImages.length === 0) {
      return new Response(JSON.stringify({ message: 'No archived images to clean up' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Process deletions
    let deletedCount = 0
    const errors = []

    for (const image of archivedImages) {
      try {
        // Only delete storage files for user uploads (not CMS images)
        if (image.provider === 'upload' && image.src) {
          // Extract file path from URL
          const url = new URL(image.src)
          const pathParts = url.pathname.split('/storage/v1/object/public/user-images/')
          if (pathParts.length > 1) {
            const filePath = pathParts[1]
            
            // Delete original image
            const { error: deleteError } = await supabase.storage
              .from('user-images')
              .remove([filePath])
              
            if (deleteError) {
              console.error(`[cleanup_archived] Failed to delete file ${filePath}:`, deleteError)
            }
            
            // Delete thumbnail
            if (image.thumb_src) {
              const thumbUrl = new URL(image.thumb_src)
              const thumbParts = thumbUrl.pathname.split('/storage/v1/object/public/user-images/')
              if (thumbParts.length > 1) {
                const thumbPath = thumbParts[1]
                await supabase.storage
                  .from('user-images')
                  .remove([thumbPath])
              }
            }
          }
        }

        // Delete database record
        const { error: dbError } = await supabase
          .from('images')
          .delete()
          .eq('id', image.id)

        if (dbError) {
          throw dbError
        }

        deletedCount++
      } catch (error) {
        console.error(`[cleanup_archived] Failed to delete image ${image.id}:`, error)
        errors.push({ id: image.id, error: error.message })
      }
    }

    // Also clean up skipped images older than 30 days
    const { data: skippedImages, error: skippedError } = await supabase
      .from('images')
      .select('id, src, thumb_src, provider')
      .eq('metadata_status', 'skipped')
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (!skippedError && skippedImages && skippedImages.length > 0) {
      console.log(`[cleanup_archived] Found ${skippedImages.length} skipped images to clean up`)
      
      for (const image of skippedImages) {
        try {
          // Same deletion logic as above
          if (image.provider === 'upload' && image.src) {
            const url = new URL(image.src)
            const pathParts = url.pathname.split('/storage/v1/object/public/user-images/')
            if (pathParts.length > 1) {
              const filePath = pathParts[1]
              await supabase.storage.from('user-images').remove([filePath])
              
              if (image.thumb_src) {
                const thumbUrl = new URL(image.thumb_src)
                const thumbParts = thumbUrl.pathname.split('/storage/v1/object/public/user-images/')
                if (thumbParts.length > 1) {
                  const thumbPath = thumbParts[1]
                  await supabase.storage.from('user-images').remove([thumbPath])
                }
              }
            }
          }

          await supabase.from('images').delete().eq('id', image.id)
          deletedCount++
        } catch (error) {
          console.error(`[cleanup_archived] Failed to delete skipped image ${image.id}:`, error)
          errors.push({ id: image.id, error: error.message })
        }
      }
    }

    const response = {
      success: true,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Cleaned up ${deletedCount} images`
    }

    console.log('[cleanup_archived] Cleanup complete:', response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[cleanup_archived] Error during cleanup:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
