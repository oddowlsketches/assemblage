-- 20250529021000_create_user_images_storage.sql
-- Create storage bucket for user images

-- Note: This migration creates the storage bucket and policies
-- Run this after the main migration

-- Insert the bucket configuration
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true, -- public for GET requests
  false, -- no AVIF auto-detection
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-images bucket
-- Allow public to read all images
CREATE POLICY "Public can view user images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create thumbs folder structure note
-- Images should be organized as:
-- user-images/
--   {user_id}/
--     thumbs/
--       {image_id}_thumb.jpg
--     originals/
--       {image_id}.{ext}
