-- Add completed column to sets table
-- This migration adds a completed flag to track whether a set has been completed

ALTER TABLE public.sets 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.sets.completed IS 'Indicates whether the set has been completed';

