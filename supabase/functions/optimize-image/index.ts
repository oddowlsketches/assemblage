import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const THUMB_MAX_SIZE = 400 // pixels

serve(async (req) => {
  try {
    const { event } = await req.json()
    
    if (event?.type !== 'INSERT' || !event?.record?.name) {
      return new Response(JSON.stringify({ error: 'Invalid event' }), { status: 400 })
    }

    const { bucket_id, name } = event.record
    const filePath = name

    console.log(`Processing image: ${bucket_id}/${filePath}`)

    // Determine if this is CMS or user upload
    const isCmsUpload = bucket_id === 'cms-images'
    const bucketName = isCmsUpload ? 'cms-images' : 'user-images'
    
    // Extract user_id from path for user uploads
    let userId = null
    if (!isCmsUpload && filePath.includes('/')) {
      userId = filePath.split('/')[0]
    }

    // Download the original image
    const { data: originalData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`)
    }

    // Create thumbnail using browser-compatible image processing
    // Note: In a real Supabase Edge Function, you'd use a proper image library
    // For now, we'll create a simple placeholder that the client will replace
    const thumbPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg')
    
    // Upload thumbnail placeholder (actual thumbnail will be generated client-side)
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(thumbPath, originalData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError && uploadError.message !== 'The resource already exists') {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`)
    }

    // Get public URLs
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
      
    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(thumbPath)

    // Calculate file hash
    const arrayBuffer = await originalData.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Extract filename for title
    const fileName = filePath.split('/').pop() || 'untitled'

    // Create or update image record
    const imageData = {
      id: crypto.randomUUID(),
      src: originalUrl,
      thumb_src: thumbUrl,
      provider: isCmsUpload ? 'cms' : 'upload',
      user_id: userId,
      collection_id: isCmsUpload ? event.record.metadata?.collection_id : null,
      user_collection_id: !isCmsUpload ? event.record.metadata?.user_collection_id : null,
      title: fileName,
      file_hash: fileHash,
      metadata_status: 'pending_llm',
      description: '',
      tags: [],
      created_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabase
      .from('images')
      .upsert(imageData, {
        onConflict: 'file_hash',
        ignoreDuplicates: true
      })
      .select()
      .single()

    if (insertError) {
      // If it's a duplicate, that's OK
      if (insertError.code === '23505') {
        console.log('Image already exists with this hash')
        return new Response(JSON.stringify({ message: 'Duplicate image' }), { status: 200 })
      }
      throw new Error(`Failed to insert image record: ${insertError.message}`)
    }

    console.log('Image processed successfully:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing image:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
