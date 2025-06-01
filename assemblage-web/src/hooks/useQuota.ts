import { useState, useCallback } from 'react'
import { getSupabase } from '../supabaseClient'
import JSZip from 'jszip'

// Get quota caps from environment variables or use defaults
const MAX_ACTIVE_IMAGES = import.meta.env?.VITE_MAX_ACTIVE_IMAGES 
  ? parseInt(import.meta.env.VITE_MAX_ACTIVE_IMAGES as string) 
  : 50

const MAX_COLLAGES = import.meta.env?.VITE_MAX_COLLAGES 
  ? parseInt(import.meta.env.VITE_MAX_COLLAGES as string) 
  : 50

export interface QuotaStatus {
  images: {
    activeCount: number
    maxImages: number
    isOverQuota: boolean
    remainingQuota: number
  }
  collages: {
    activeCount: number
    maxCollages: number
    isOverQuota: boolean
    remainingQuota: number
  }
}

interface SavedCollage {
  id: string
  title: string
  image_data_url: string
  created_at: string
}

export const useQuota = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkQuota = useCallback(async (): Promise<QuotaStatus> => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Count active images
      const { count: imageCount, error: imageError } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('provider', 'upload')
        .eq('archived', false)

      if (imageError) throw imageError

      // Count active collages
      const { count: collageCount, error: collageError } = await supabase
        .from('saved_collages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('archived', false)

      if (collageError) throw collageError

      const activeImageCount = imageCount || 0
      const activeCollageCount = collageCount || 0

      return {
        images: {
          activeCount: activeImageCount,
          maxImages: MAX_ACTIVE_IMAGES,
          isOverQuota: activeImageCount >= MAX_ACTIVE_IMAGES,
          remainingQuota: Math.max(0, MAX_ACTIVE_IMAGES - activeImageCount)
        },
        collages: {
          activeCount: activeCollageCount,
          maxCollages: MAX_COLLAGES,
          isOverQuota: activeCollageCount >= MAX_COLLAGES,
          remainingQuota: Math.max(0, MAX_COLLAGES - activeCollageCount)
        }
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const archiveOldestImages = useCallback(async (count: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Get the oldest N images to archive
      const { data: oldestImages, error: fetchError } = await supabase
        .from('images')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'upload')
        .eq('archived', false)
        .order('created_at', { ascending: true })
        .limit(count)

      if (fetchError) throw fetchError

      if (!oldestImages || oldestImages.length === 0) {
        throw new Error('No images to archive')
      }

      // Archive them
      const imageIds = oldestImages.map((img: { id: string }) => img.id)
      const { error: updateError } = await supabase
        .from('images')
        .update({ archived: true })
        .in('id', imageIds)

      if (updateError) throw updateError

      return imageIds.length
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const downloadAndArchiveOldestCollages = useCallback(async (count: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Get the oldest N collages to archive
      const { data: oldestCollages, error: fetchError } = await supabase
        .from('saved_collages')
        .select('id, title, image_data_url, created_at')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true })
        .limit(count)

      if (fetchError) throw fetchError

      if (!oldestCollages || oldestCollages.length === 0) {
        throw new Error('No collages to archive')
      }

      // Create ZIP file
      const zip = new JSZip()
      
      oldestCollages.forEach((collage: SavedCollage, index: number) => {
        // Convert data URL to blob
        const dataUrl = collage.image_data_url
        const base64Data = dataUrl.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        
        // Create filename with date and title
        const date = new Date(collage.created_at).toISOString().split('T')[0]
        const sanitizedTitle = collage.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const filename = `${date}_${sanitizedTitle}_${collage.id.slice(0, 8)}.png`
        
        zip.file(filename, byteArray, { binary: true })
      })

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `assemblage_collages_archive_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)

      // Archive the collages in database
      const collageIds = oldestCollages.map((collage: SavedCollage) => collage.id)
      const { error: updateError } = await supabase
        .from('saved_collages')
        .update({ archived: true })
        .in('id', collageIds)

      if (updateError) throw updateError

      return collageIds.length
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    checkQuota,
    archiveOldestImages,
    downloadAndArchiveOldestCollages,
    loading,
    error,
    MAX_ACTIVE_IMAGES,
    MAX_COLLAGES
  }
} 