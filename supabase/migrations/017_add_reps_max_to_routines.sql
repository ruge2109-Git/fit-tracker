-- Add target_reps_max to routine_exercises table
ALTER TABLE public.routine_exercises
ADD COLUMN IF NOT EXISTS target_reps_max INTEGER;

-- Update comment for the new column
COMMENT ON COLUMN public.routine_exercises.target_reps_max IS 'Maximum target repetitions for ranges (e.g. 8-12 reps)';
