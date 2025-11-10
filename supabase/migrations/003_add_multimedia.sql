-- Add multimedia support to exercises
-- This migration adds image, video, and GIF support for exercise demonstrations

-- Add multimedia columns to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS demonstration_gif TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.exercises.image_url IS 'URL to exercise demonstration image';
COMMENT ON COLUMN public.exercises.video_url IS 'URL to exercise demonstration video';
COMMENT ON COLUMN public.exercises.demonstration_gif IS 'URL to exercise demonstration animated GIF';

