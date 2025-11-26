-- Migration: Add Body Measurements System
-- This migration adds support for tracking body measurements (weight, body fat, measurements)

-- Body Measurements table
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('weight', 'body_fat', 'chest', 'waist', 'hips', 'biceps', 'thighs', 'neck', 'shoulders', 'forearms', 'calves', 'custom')),
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'lbs', 'cm', 'inches', '%'
  notes TEXT,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON public.body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_type ON public.body_measurements(measurement_type);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON public.body_measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_type_date ON public.body_measurements(user_id, measurement_type, measurement_date DESC);

-- Enable RLS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own measurements
CREATE POLICY "Users can view their own measurements"
  ON public.body_measurements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own measurements
CREATE POLICY "Users can insert their own measurements"
  ON public.body_measurements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own measurements
CREATE POLICY "Users can update their own measurements"
  ON public.body_measurements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own measurements
CREATE POLICY "Users can delete their own measurements"
  ON public.body_measurements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_body_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_body_measurements_updated_at();

