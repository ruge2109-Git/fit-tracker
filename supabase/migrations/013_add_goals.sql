-- Migration: Add Goals/Objectives System
-- This migration adds support for user goals and objectives tracking

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('weight', 'volume', 'frequency', 'strength', 'endurance', 'custom')),
  target_value DECIMAL(10, 2) NOT NULL CHECK (target_value > 0),
  current_value DECIMAL(10, 2) DEFAULT 0 CHECK (current_value >= 0),
  unit TEXT NOT NULL, -- 'kg', 'lbs', 'times', 'days', etc.
  start_date DATE NOT NULL,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Progress tracking table (for historical tracking)
CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value DECIMAL(10, 2) NOT NULL CHECK (value >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_type ON public.goals(type);
CREATE INDEX idx_goals_is_completed ON public.goals(is_completed);
CREATE INDEX idx_goals_target_date ON public.goals(target_date);
CREATE INDEX idx_goal_progress_goal_id ON public.goal_progress(goal_id);
CREATE INDEX idx_goal_progress_created_at ON public.goal_progress(created_at DESC);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view their own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Goal Progress policies
CREATE POLICY "Users can view progress of their goals" ON public.goal_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create progress for their goals" ON public.goal_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update progress of their goals" ON public.goal_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete progress of their goals" ON public.goal_progress
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_progress.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- Function to automatically update goal current_value when progress is added
CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.goals
  SET 
    current_value = (
      SELECT COALESCE(MAX(value), 0)
      FROM public.goal_progress
      WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
  WHERE id = NEW.goal_id;
  
  -- Check if goal is completed
  UPDATE public.goals
  SET 
    is_completed = true,
    completed_at = NOW()
  WHERE id = NEW.goal_id
    AND current_value >= target_value
    AND is_completed = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal current_value on progress insert
CREATE TRIGGER trigger_update_goal_on_progress
  AFTER INSERT ON public.goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_value();

-- Add comments for documentation
COMMENT ON TABLE public.goals IS 'User goals and objectives for fitness tracking';
COMMENT ON COLUMN public.goals.type IS 'Type of goal: weight, volume, frequency, strength, endurance, custom';
COMMENT ON COLUMN public.goals.target_value IS 'Target value to achieve';
COMMENT ON COLUMN public.goals.current_value IS 'Current progress value (auto-updated from goal_progress)';
COMMENT ON COLUMN public.goals.unit IS 'Unit of measurement (kg, lbs, times, days, etc.)';
COMMENT ON TABLE public.goal_progress IS 'Historical tracking of goal progress';

