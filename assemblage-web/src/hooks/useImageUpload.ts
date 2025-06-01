import { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { getSupabase } from '../supabaseClient'
import { User } from '@supabase/supabase-js'

interface ProcessedFile extends File {
  // Add any custom properties if you extend the File object
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 8000 // Increased from 4000 to 8000 pixels
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const REJECTED_TYPES = ['image/gif', 'image/webp', 'image/heic']

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

  const validateDimensions = useCallback(async (file: File) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed ${MAX_DIMENSION}px limit. Please resize the image or it will be compressed automatically.`))
        } else {
          resolve(true)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for validation.'))
      }
      
      img.src = url
    })
  }, [])

  const compressImage = useCallback(async (file: File): Promise<File> => {
    // Skip compression for small files
    if (file.size < COMPRESSION_THRESHOLD) {
      console.log(`[compressImage] File already under ${COMPRESSION_THRESHOLD / 1024 / 1024}MB, skipping compression`);
      return file;
    }
    
    // Always attempt to optimize images
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.85,
      fileType: file.type as 'image/jpeg' | 'image/png'
    }

    try {
      const compressedFile = await imageCompression(file, options)
      console.log(`[compressImage] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      return compressedFile
    } catch (error) {
      console.error('Compression failed:', error)
      return file
    }
  }, [])

  const calculateFileHash = useCallback(async (file: File): Promise<string> => {
    // Use SHA-1 as specified in the requirements for better compatibility
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
        
        const maxSize = 400
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
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

  const uploadToSupabase = useCallback(async (file: File, collectionId: CollectionId, generateMetadata: boolean = true) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');
    
    const fileName = `${user.id}/${Date.now()}_${file.name}`
    const thumbFileName = fileName.replace(/\.[^/.]+$/, '_thumb.jpg')
    
    // Calculate file hash for deduplication
    const fileHash = await calculateFileHash(file);
    
    // Check if file already exists by hash (across all user's collections)
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
      // File already exists
      const existingImage = existingImages[0];
      console.log(`[uploadToSupabase] File already exists with hash ${fileHash}`);
      
      // If it's in a different collection, you might want to handle this differently
      // For now, we'll return an error to inform the user
      throw new Error(`This image already exists in your library as "${existingImage.title}"`)
    }
    
    const thumbnailBlob: Blob = await generateThumbnail(file)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError
    
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
    
    // Insert image record with URLs
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert({
        id: imageId,
        src: publicUrl,
        thumb_src: thumbUrl,
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
  }, [generateThumbnail, calculateFileHash])

  const uploadImage = useCallback(async (file: File, collectionId: CollectionId, generateMetadata: boolean = true) => {
    try {
      validateFile(file)
      await validateDimensions(file)

      const processedFile = await compressImage(file)
      const imageData = await uploadToSupabase(processedFile, collectionId, generateMetadata)
      
      return imageData
    } catch (err: any) {
      throw err
    }
  }, [validateFile, validateDimensions, compressImage, uploadToSupabase])

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
    validateDimensions,
    compressImage
  }
}
