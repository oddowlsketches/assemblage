import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImageUpload } from '../useImageUpload'
import imageCompression from 'browser-image-compression'

// Mock dependencies
vi.mock('browser-image-compression')
vi.mock('../../lib/supabase', () => {
  const mockSupabase = {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url/image.jpg' } })
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
        }))
      }))
    }))
  }
  
  return {
    supabase: mockSupabase,
    requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
    getCurrentUser: vi.fn(() => Promise.resolve({ id: 'test-user-id' }))
  }
})

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL.createObjectURL mock
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()
  })

  describe('validateFile', () => {
    it('should reject GIF files', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' })
      
      expect(() => result.current.validateFile(gifFile)).toThrow(
        'GIF files are not supported. Please use JPEG or PNG.'
      )
    })

    it('should reject WEBP files', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' })
      
      expect(() => result.current.validateFile(webpFile)).toThrow(
        'WEBP files are not supported. Please use JPEG or PNG.'
      )
    })

    it('should reject HEIC files', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      const heicFile = new File([''], 'test.heic', { type: 'image/heic' })
      
      expect(() => result.current.validateFile(heicFile)).toThrow(
        'HEIC files are not supported. Please use JPEG or PNG.'
      )
    })

    it('should reject files over 10MB', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      // Create a mock file over 10MB
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })
      
      expect(() => result.current.validateFile(largeFile)).toThrow(
        'File size exceeds 10MB limit.'
      )
    })

    it('should accept valid JPEG files', () => {
      const { result } = renderHook(() => useImageUpload())
      
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(jpegFile, 'size', { value: 1 * 1024 * 1024 })
      
      expect(result.current.validateFile(jpegFile)).toBe(true)
    })

    it('should accept valid PNG files', () => {
      const { result } = renderHook(() => useImageUpload())
      
      const pngFile = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(pngFile, 'size', { value: 1 * 1024 * 1024 })
      
      expect(result.current.validateFile(pngFile)).toBe(true)
    })
  })

  describe('validateDimensions', () => {
    it('should reject images with dimensions over 10000px', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      // Mock Image loading
      const mockImage = {
        width: 11000,
        height: 5000,
        onload: null,
        onerror: null,
        src: ''
      }
      
      global.Image = vi.fn(() => mockImage)
      
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' })
      
      const promise = result.current.validateDimensions(file)
      
      // Trigger onload
      act(() => {
        mockImage.onload()
      })
      
      await expect(promise).rejects.toThrow('Image dimensions exceed 10000px limit.')
    })

    it('should accept images within dimension limits', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      // Mock Image loading
      const mockImage = {
        width: 5000,
        height: 5000,
        onload: null,
        onerror: null,
        src: ''
      }
      
      global.Image = vi.fn(() => mockImage)
      
      const file = new File([''], 'normal.jpg', { type: 'image/jpeg' })
      
      const promise = result.current.validateDimensions(file)
      
      // Trigger onload
      act(() => {
        mockImage.onload()
      })
      
      await expect(promise).resolves.toBe(true)
    })
  })

  describe('compression', () => {
    it('should compress images over 2MB', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 })
      
      const compressedFile = new File([''], 'compressed.jpg', { type: 'image/jpeg' })
      Object.defineProperty(compressedFile, 'size', { value: 1.5 * 1024 * 1024 })
      
      imageCompression.mockResolvedValue(compressedFile)
      
      const resultFile = await result.current.compressImage(largeFile)
      
      expect(imageCompression).toHaveBeenCalledWith(largeFile, expect.objectContaining({
        maxSizeMB: 2,
        maxWidthOrHeight: 4000,
        useWebWorker: true,
        initialQuality: 0.8
      }))
      
      expect(resultFile).toBe(compressedFile)
    })

    it('should not compress images under 2MB', async () => {
      const { result } = renderHook(() => useImageUpload())
      
      const smallFile = new File([''], 'small.jpg', { type: 'image/jpeg' })
      Object.defineProperty(smallFile, 'size', { value: 1 * 1024 * 1024 })
      
      const resultFile = await result.current.compressImage(smallFile)
      
      expect(imageCompression).not.toHaveBeenCalled()
      expect(resultFile).toBe(smallFile)
    })
  })
})
