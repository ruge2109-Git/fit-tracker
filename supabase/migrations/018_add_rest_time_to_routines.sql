-- Add rest_time to routine_exercises table
ALTER TABLE public.routine_exercises
ADD COLUMN IF NOT EXISTS target_rest_time INTEGER DEFAULT 90;

-- Update comment
COMMENT ON COLUMN public.routine_exercises.target_rest_time IS 'Target rest time between sets in seconds';
