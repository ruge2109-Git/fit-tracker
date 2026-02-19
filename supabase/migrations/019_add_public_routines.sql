-- Add is_public column to routines
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Drop existing SELECT policy for routines
DROP POLICY IF EXISTS "Users can view their own routines" ON public.routines;

-- Create new SELECT policy for routines (Own or Public)
CREATE POLICY "Users can view own or public routines" ON public.routines
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Drop existing SELECT policy for routine_exercises
DROP POLICY IF EXISTS "Users can view exercises from their routines" ON public.routine_exercises;

-- Create new SELECT policy for routine_exercises
CREATE POLICY "Users can view exercises from own or public routines" ON public.routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_exercises.routine_id
      AND (routines.user_id = auth.uid() OR routines.is_public = true)
    )
  );
