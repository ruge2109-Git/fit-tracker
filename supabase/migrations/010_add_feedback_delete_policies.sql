-- Add DELETE policies for feedback table
-- This migration allows users and admins to delete feedbacks according to their permissions

-- Users can delete their own pending feedbacks
CREATE POLICY "Users can delete their own pending feedbacks" ON public.feedback
  FOR DELETE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Admins can delete any feedback
CREATE POLICY "Admins can delete any feedback" ON public.feedback
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can delete their own pending feedbacks" ON public.feedback IS 'Allows users to delete their own feedbacks that are still pending';
COMMENT ON POLICY "Admins can delete any feedback" ON public.feedback IS 'Allows administrators to delete any feedback regardless of owner or status';

