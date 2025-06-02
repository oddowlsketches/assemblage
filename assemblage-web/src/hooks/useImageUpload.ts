import { useState, useCallback } from 'react'
import { getSupabase } from '../supabaseClient'
import { User } from '@supabase/supabase-js'

interface ProcessedFile extends File {
  // Add any custom properties if you extend the File object
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 2560 // Reduced to 2560px as per requirements
const COMPRESSION_QUALITY = 0.85 // 85% quality as per requirements
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const REJECTED_TYPES = ['image/gif', 'image/webp', 'image/heic']
const THUMBNAIL_SIZE = 400 // 400px thumbnail as per requirements

type CollectionId = string | 'cms';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File) => {
    if (REJECTED_TYPES.includes(file.type)) {
      const ext = file.type.split('/')[1].toUpperCase()
      throw new Error(`${ext} files are not supported. Please use JPEG or PNG.`)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please use JPEG or PNG.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit.')
    }

    return true
  }, [])

  const getImageDimensions = useCallback(async (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for validation.'))
      }
      
      img.src = url
    })
  }, [])

  const resizeAndCompressImage = useCallback(async (file: File): Promise<{file: File, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          } else {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        // Determine output format - prefer WebP if browser supports it, otherwise JPEG
        const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        const outputFormat = supportsWebP ? 'image/webp' : 'image/jpeg'
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new file with the appropriate extension
            const extension = outputFormat === 'image/webp' ? '.webp' : '.jpg'
            const fileName = file.name.replace(/\.[^/.]+$/, extension)
            const compressedFile = new File([blob], fileName, { type: outputFormat })
            resolve({ file: compressedFile, width, height })
          } else {
            reject(new Error('Failed to compress image'))
          }
        }, outputFormat, COMPRESSION_QUALITY)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for processing'))
      }
      
      img.src = url
    })
  }, [])

  const calculateFileHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }, []);

  const generateThumbnail = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context for thumbnail'));
          return;
        }
        
        // Fixed size thumbnail
        let width = img.width
        let height = img.height
        
        if (width > height) {
          height = Math.round((height * THUMBNAIL_SIZE) / width)
          width = THUMBNAIL_SIZE
        } else {
          width = Math.round((width * THUMBNAIL_SIZE) / height)
          height = THUMBNAIL_SIZE
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate thumbnail blob'))
          }
        }, 'image/jpeg', 0.8)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for thumbnail'))
      }
      
      img.src = url
    })
  }, [])

  const checkIsBlackAndWhite = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(false)
          return
        }
        
        // Sample a smaller version for performance
        const sampleSize = 100
        canvas.width = sampleSize
        canvas.height = sampleSize
        
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
        
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const data = imageData.data
        
        let isGrayscale = true
        
        // Check if all pixels are grayscale (R=G=B)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          if (Math.abs(r - g) > 5 || Math.abs(g - b) > 5 || Math.abs(r - b) > 5) {
            isGrayscale = false
            break
          }
        }
        
        resolve(isGrayscale)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(false) // Default to false on error
      }
      
      img.src = url
    })
  }, [])

  const uploadToSupabase = useCallback(async (file: File, collectionId: CollectionId, generateMetadata: boolean = true) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');
    
    // Process the image
    const { file: processedFile, width, height } = await resizeAndCompressImage(file)
    const fileSize = processedFile.size
    
    // Generate storage paths
    const timestamp = Date.now()
    const baseFileName = file.name.replace(/\.[^/.]+$/, '')
    const fileName = `${user.id}/${timestamp}_${baseFileName}.${processedFile.type === 'image/webp' ? 'webp' : 'jpg'}`
    const thumbFileName = `${user.id}/${timestamp}_${baseFileName}_thumb.jpg`
    
    // Calculate file hash for deduplication
    const fileHash = await calculateFileHash(processedFile);
    
    // Check if file already exists by hash
    const { data: existingImages, error: checkError } = await supabase
      .from('images')
      .select('id, src, thumb_src, user_collection_id, title')
      .eq('file_hash', fileHash)
      .eq('provider', 'upload')
      .eq('user_id', user.id);
    
    if (checkError) {
      console.error('[uploadToSupabase] Error checking existing image:', checkError);
    }
      
    if (existingImages && existingImages.length > 0) {
      const existingImage = existingImages[0];
      console.log(`[uploadToSupabase] File already exists with hash ${fileHash}`);
      throw new Error(`This image already exists in your library as "${existingImage.title}"`)
    }
    
    // Check if image is black and white
    const isBW = await checkIsBlackAndWhite(processedFile)
    
    // Generate thumbnail
    const thumbnailBlob = await generateThumbnail(processedFile)
    
    // Upload original (processed) image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError
    
    // Upload thumbnail
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('user-images')
      .upload(thumbFileName, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      })

    if (thumbError) {
      await supabase.storage.from('user-images').remove([fileName])
      throw thumbError
    }

    // Get public URLs
    const { data: { publicUrl } } = supabase.storage
      .from('user-images')
      .getPublicUrl(fileName)
      
    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from('user-images')
      .getPublicUrl(thumbFileName)

    // For uploads, always use user_collection_id (not collection_id)
    if (collectionId === 'cms') {
      throw new Error('Cannot upload images to Default Library');
    }
    
    // Generate a unique ID for the image
    const imageId = crypto.randomUUID();
    
    // Insert image record with all optimization data
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert({
        id: imageId,
        src: publicUrl,
        thumb_src: thumbUrl,
        storage_key_original: fileName,
        storage_key_thumb: thumbFileName,
        width: width,
        height: height,
        size_bytes: fileSize,
        is_bw: isBW,
        collection_id: null,
        user_collection_id: collectionId,
        user_id: user.id,
        provider: 'upload',
        remote_id: null,
        file_hash: fileHash,
        metadata_status: generateMetadata ? 'pending_llm' : 'skipped',
        description: '',
        title: file.name,
        archived: false
      })
      .select('id, src, thumb_src, user_collection_id, user_id, metadata_status, description, title, provider')
      .single()

    if (dbError) {
      console.error('[uploadToSupabase] Database insert error:', dbError);
      await supabase.storage.from('user-images').remove([fileName, thumbFileName])
      
      // Parse the error to provide user-friendly message
      if (dbError.message && dbError.message.includes('check_violation')) {
        try {
          // Extract the JSON detail from the error
          const detailMatch = dbError.message.match(/DETAIL:\s*({.*})/);
          if (detailMatch) {
            const errorDetail = JSON.parse(detailMatch[1]);
            throw new Error(errorDetail.message || 'Storage limit exceeded');
          }
        } catch (parseError) {
          // Fallback to a generic message if parsing fails
          if (dbError.message.includes('IMAGE_COUNT_LIMIT')) {
            throw new Error('You have reached the limit of 30 images. Please delete or archive some images before uploading more.');
          } else if (dbError.message.includes('STORAGE_SIZE_LIMIT')) {
            throw new Error('You have reached the storage limit of 15 MB. Please delete or archive some images before uploading more.');
          }
        }
      }
      
      throw new Error(dbError.message || 'Failed to save image to database')
    }

    // Trigger metadata generation only if enabled
    if (generateMetadata) {
      fetch('/.netlify/functions/process-user-image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: imageData.id })
      }).then(response => {
        if (!response.ok) {
          response.text().then(errorText => {
            console.error('[uploadToSupabase] Metadata generation failed:', errorText);
          });
        } else {
          console.log('[uploadToSupabase] Metadata generation triggered for image:', imageData.id);
        }
      }).catch(metadataError => {
        console.error('[uploadToSupabase] Error triggering metadata generation:', metadataError);
      });
    }

    return imageData
  }, [resizeAndCompressImage, generateThumbnail, calculateFileHash, checkIsBlackAndWhite])

  const uploadImage = useCallback(async (file: File, collectionId: CollectionId, generateMetadata: boolean = true) => {
    try {
      validateFile(file)
      const imageData = await uploadToSupabase(file, collectionId, generateMetadata)
      return imageData
    } catch (err: any) {
      throw err
    }
  }, [validateFile, uploadToSupabase])

  const uploadMultiple = useCallback(async (files: File[], collectionId: CollectionId, generateMetadata: boolean = true) => {
    const results = []
    const errors = []
    const totalFiles = files.length
    
    console.log(`[uploadMultiple] Starting upload of ${totalFiles} files to collection ${collectionId}`);
    
    setUploading(true)
    setError(null)
    setProgress(0)

    for (let i = 0; i < totalFiles; i++) {
      try {
        // Calculate overall progress based on file count
        const fileProgress = ((i + 1) / totalFiles) * 100
        setProgress(fileProgress)
        
        console.log(`[uploadMultiple] Uploading file ${i + 1}/${totalFiles}: ${files[i].name}`);
        const result = await uploadImage(files[i], collectionId, generateMetadata)
        console.log(`[uploadMultiple] Successfully uploaded: ${files[i].name}`, result);
        results.push(result)
      } catch (err: any) {
        console.error(`[uploadMultiple] Failed to upload ${files[i].name}:`, err);
        errors.push({ file: files[i].name, error: err.message })
      }
    }
    
    setProgress(100)
    setUploading(false)
    
    console.log(`[uploadMultiple] Upload complete. Success: ${results.length}, Errors: ${errors.length}`);

    return { results, errors }
  }, [uploadImage])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    uploadImage,
    uploadMultiple,
    uploading,
    progress,
    error,
    reset,
    validateFile,
    resizeAndCompressImage,
    generateThumbnail
  }
}
