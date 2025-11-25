-- Add response field to feedback table
-- This migration adds the ability for admins to respond to feedback

-- Add response column
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for responded_by lookups
CREATE INDEX IF NOT EXISTS idx_feedback_responded_by ON public.feedback(responded_by);

-- Add comment for documentation
COMMENT ON COLUMN public.feedback.response IS 'Admin response to the feedback';
COMMENT ON COLUMN public.feedback.responded_at IS 'Timestamp when the feedback was responded to';
COMMENT ON COLUMN public.feedback.responded_by IS 'Admin user ID who responded to the feedback';

