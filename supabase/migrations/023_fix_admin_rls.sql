-- Fix RLS policies for admin access
-- Admin users should be able to view ALL users and ALL audit logs

-- 1. Add policy for admins to view ALL user profiles
-- This is needed so the audit log can show user info for all users

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.is_admin = true
    )
  );

-- 2. Ensure the audit_log INSERT policy works for server-side inserts
-- The existing policy 'Authenticated users can insert audit logs' 
-- uses WITH CHECK (auth.uid() = user_id) which is correct.
-- Let's just verify it exists.

-- 3. Add a comment for documentation
COMMENT ON POLICY "Admins can view all users" ON public.users IS 
  'Allows admin users to view all user profiles, needed for audit log user filtering';
