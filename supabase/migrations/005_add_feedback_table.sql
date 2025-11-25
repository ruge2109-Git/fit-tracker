-- Add feedback table
-- This migration adds a feedback table for users to submit feedback about the application

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- Add index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback (only if status is pending)
CREATE POLICY "Users can update their own pending feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Add comment for documentation
COMMENT ON TABLE public.feedback IS 'User feedback and suggestions for the application';
COMMENT ON COLUMN public.feedback.type IS 'Type of feedback: bug, feature, improvement, or other';
COMMENT ON COLUMN public.feedback.rating IS 'Optional rating from 1 to 5 stars';
COMMENT ON COLUMN public.feedback.status IS 'Status of feedback: pending, reviewed, resolved, or dismissed';

