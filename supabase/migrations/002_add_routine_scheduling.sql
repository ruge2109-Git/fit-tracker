-- Add scheduling fields to routines table
-- This migration adds frequency and scheduled days support

-- Add frequency column
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (frequency IN (
  'custom', 'weekly_1', 'weekly_2', 'weekly_3', 'weekly_4', 'weekly_5', 'weekly_6', 'daily'
));

-- Add scheduled_days column (array of days)
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS scheduled_days TEXT[] CHECK (
  scheduled_days <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::TEXT[]
);

-- Add routine_id to workouts to track which routine was used
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL;

-- Add index for routine_id lookups
CREATE INDEX IF NOT EXISTS idx_workouts_routine_id ON public.workouts(routine_id);

-- Update existing routines to have default frequency
UPDATE public.routines 
SET frequency = 'custom' 
WHERE frequency IS NULL;

