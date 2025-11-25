-- Migration: Add saved filters and tags tables
-- This migration adds support for saved filters and workout tags

-- Tags table (user-specific tags)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Workout Tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.workout_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, tag_id)
);

-- Saved Filters table
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'exercise', 'routine')),
  filters JSONB NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_workout_tags_workout_id ON public.workout_tags(workout_id);
CREATE INDEX idx_workout_tags_tag_id ON public.workout_tags(tag_id);
CREATE INDEX idx_saved_filters_user_id ON public.saved_filters(user_id);
CREATE INDEX idx_saved_filters_type ON public.saved_filters(type);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Tags policies
CREATE POLICY "Users can view workout tags from their workouts" ON public.workout_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_tags.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workout tags for their workouts" ON public.workout_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_tags.workout_id
      AND workouts.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = workout_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workout tags from their workouts" ON public.workout_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE workouts.id = workout_tags.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- Saved Filters policies
CREATE POLICY "Users can view their own saved filters" ON public.saved_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters" ON public.saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters" ON public.saved_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters" ON public.saved_filters
  FOR DELETE USING (auth.uid() = user_id);

