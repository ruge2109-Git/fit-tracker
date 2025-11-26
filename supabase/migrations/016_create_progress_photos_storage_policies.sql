-- Migration: Create Storage Policies for Progress Photos Bucket
-- This migration creates RLS policies for the progress-photos storage bucket
-- 
-- IMPORTANT: Make sure the bucket "progress-photos" exists before running this migration
-- The bucket should be created as PRIVATE (not public)

-- Storage Policies for progress-photos bucket
-- These policies allow users to manage their own photos
-- Photos are stored in the format: {userId}/{timestamp}-{random}.{ext}

-- Allow users to view their own photos
CREATE POLICY "Users can view their own progress photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to upload their own photos
CREATE POLICY "Users can upload their own progress photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own photos
CREATE POLICY "Users can update their own progress photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own progress photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

