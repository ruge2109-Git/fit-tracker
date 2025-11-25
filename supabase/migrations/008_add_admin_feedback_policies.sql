-- Add admin policies for feedback table
-- This migration allows admins to view and manage all feedbacks

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can create their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update their own pending feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Admins can update all feedbacks" ON public.feedback;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all feedbacks" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback (only if status is pending)
CREATE POLICY "Users can update their own pending feedback" ON public.feedback
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Admins can update all feedbacks
CREATE POLICY "Admins can update all feedbacks" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Admins can view all feedbacks" ON public.feedback IS 'Allows administrators to view all feedbacks regardless of owner';
COMMENT ON POLICY "Admins can update all feedbacks" ON public.feedback IS 'Allows administrators to update any feedback status';

