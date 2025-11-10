-- FitTrackr Database Schema
-- Initial migration for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
-- Supabase handles authentication, but we can add a profile table if needed
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio', 'mobility', 'flexibility')),
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets table
CREATE TABLE IF NOT EXISTS public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight DECIMAL(6, 2) NOT NULL CHECK (weight >= 0), -- in kg
  rest_time INTEGER CHECK (rest_time >= 0), -- in seconds
  set_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Exercises table (linking table)
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  target_weight DECIMAL(6, 2),
  "order" INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_sets_workout_id ON public.sets(workout_id);
CREATE INDEX idx_sets_exercise_id ON public.sets(exercise_id);
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Workouts policies
CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Sets policies
CREATE POLICY "Users can view sets from their workouts" ON public.sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = sets.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sets for their workouts" ON public.sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = sets.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sets from their workouts" ON public.sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = sets.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sets from their workouts" ON public.sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = sets.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- Exercises policies (public read, authenticated write)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Routines policies
CREATE POLICY "Users can view their own routines" ON public.routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routines" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" ON public.routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" ON public.routines
  FOR DELETE USING (auth.uid() = user_id);

-- Routine exercises policies
CREATE POLICY "Users can view exercises from their routines" ON public.routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises for their routines" ON public.routine_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises from their routines" ON public.routine_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their routines" ON public.routine_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

-- Seed some default exercises
INSERT INTO public.exercises (name, type, muscle_group, description) VALUES
  ('Bench Press', 'strength', 'chest', 'Classic chest exercise'),
  ('Squat', 'strength', 'legs', 'Compound leg exercise'),
  ('Deadlift', 'strength', 'back', 'Full body compound movement'),
  ('Overhead Press', 'strength', 'shoulders', 'Shoulder press exercise'),
  ('Barbell Row', 'strength', 'back', 'Back rowing movement'),
  ('Pull-ups', 'strength', 'back', 'Bodyweight back exercise'),
  ('Dips', 'strength', 'chest', 'Bodyweight chest/tricep exercise'),
  ('Lunges', 'strength', 'legs', 'Unilateral leg exercise'),
  ('Plank', 'strength', 'core', 'Isometric core exercise'),
  ('Running', 'cardio', 'cardio', 'Cardiovascular exercise')
ON CONFLICT DO NOTHING;

