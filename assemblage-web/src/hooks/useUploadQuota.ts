import { useState, useCallback } from 'react'
import { getSupabase } from '../supabaseClient'

// Get the storage cap from environment variable or use default
const MAX_ACTIVE_IMAGES = import.meta.env.VITE_MAX_ACTIVE_IMAGES 
  ? parseInt(import.meta.env.VITE_MAX_ACTIVE_IMAGES) 
  : 100

export const useUploadQuota = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkQuota = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Count active uploaded images for this user
      const { count, error: countError } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('provider', 'upload')
        .eq('archived', false)

      if (countError) {
        throw countError
      }

      const activeCount = count || 0
      const isOverQuota = activeCount >= MAX_ACTIVE_IMAGES
      const remainingQuota = Math.max(0, MAX_ACTIVE_IMAGES - activeCount)

      return {
        activeCount,
        maxImages: MAX_ACTIVE_IMAGES,
        isOverQuota,
        remainingQuota
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

      if (fetchError) {
        throw fetchError
      }

      if (!oldestImages || oldestImages.length === 0) {
        throw new Error('No images to archive')
      }

      // Archive them
      const imageIds = oldestImages.map((img: { id: string }) => img.id)
      const { error: updateError } = await supabase
        .from('images')
        .update({ archived: true })
        .in('id', imageIds)

      if (updateError) {
        throw updateError
      }

      return imageIds.length
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
    loading,
    error,
    MAX_ACTIVE_IMAGES
  }
}
