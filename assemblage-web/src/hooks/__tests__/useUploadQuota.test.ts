import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUploadQuota } from '../useUploadQuota'

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }))
}))

describe('useUploadQuota', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { getSupabase } = require('../../supabaseClient')
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } }
        })
      },
      from: vi.fn()
    }
    getSupabase.mockReturnValue(mockSupabase)
  })

  describe('checkQuota', () => {
    it('should return correct quota when under limit', async () => {
      const mockSelect = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ count: 10, error: null })
      }
      mockSupabase.from.mockReturnValue(mockSelect)

      const { result } = renderHook(() => useUploadQuota())
      
      let quotaResult: any
      await act(async () => {
        quotaResult = await result.current.checkQuota()
      })

      expect(quotaResult).toEqual({
        activeCount: 10,
        maxImages: 30,
        isOverQuota: false,
        remainingQuota: 20
      })
    })

    it('should return correct quota when at limit', async () => {
      const mockSelect = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ count: 30, error: null })
      }
      mockSupabase.from.mockReturnValue(mockSelect)

      const { result } = renderHook(() => useUploadQuota())
      
      let quotaResult: any
      await act(async () => {
        quotaResult = await result.current.checkQuota()
      })

      expect(quotaResult).toEqual({
        activeCount: 30,
        maxImages: 30,
        isOverQuota: true,
        remainingQuota: 0
      })
    })

    it('should return correct quota when over limit', async () => {
      const mockSelect = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ count: 35, error: null })
      }
      mockSupabase.from.mockReturnValue(mockSelect)

      const { result } = renderHook(() => useUploadQuota())
      
      let quotaResult: any
      await act(async () => {
        quotaResult = await result.current.checkQuota()
      })

      expect(quotaResult).toEqual({
        activeCount: 35,
        maxImages: 30,
        isOverQuota: true,
        remainingQuota: 0
      })
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const { result } = renderHook(() => useUploadQuota())
      
      await expect(result.current.checkQuota()).rejects.toThrow('User must be authenticated')
    })
  })

  describe('archiveOldestImages', () => {
    it('should archive the specified number of oldest images', async () => {
      const mockImages = [
        { id: 'image-1' },
        { id: 'image-2' },
        { id: 'image-3' }
      ]

      const mockSelect = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockImages, error: null })
      }

      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockSelect) // For select query
        .mockReturnValueOnce(mockUpdate) // For update query

      const { result } = renderHook(() => useUploadQuota())
      
      let archivedCount: number = 0
      await act(async () => {
        archivedCount = await result.current.archiveOldestImages(3)
      })

      expect(archivedCount).toBe(3)
      expect(mockUpdate.update).toHaveBeenCalledWith({ archived: true })
      expect(mockUpdate.in).toHaveBeenCalledWith('id', ['image-1', 'image-2', 'image-3'])
    })

    it('should throw error when no images to archive', async () => {
      const mockSelect = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockSelect)

      const { result } = renderHook(() => useUploadQuota())
      
      await expect(result.current.archiveOldestImages(5)).rejects.toThrow('No images to archive')
    })
  })
})
