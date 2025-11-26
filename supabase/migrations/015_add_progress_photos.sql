-- Migration: Add Progress Photos System
-- This migration adds support for tracking progress photos

-- Progress Photos table
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- URL to photo in Supabase Storage
  photo_type TEXT NOT NULL DEFAULT 'front' CHECK (photo_type IN ('front', 'side', 'back', 'custom')),
  notes TEXT,
  photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_type ON public.progress_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON public.progress_photos(photo_date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON public.progress_photos(user_id, photo_date DESC);

-- Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own photos
CREATE POLICY "Users can view their own photos"
  ON public.progress_photos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert their own photos"
  ON public.progress_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update their own photos"
  ON public.progress_photos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON public.progress_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_progress_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON public.progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_photos_updated_at();

