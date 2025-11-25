-- Add admin support
-- This migration adds is_admin column to users table and helper functions

-- Add is_admin column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

-- Add comment for documentation
COMMENT ON COLUMN public.users.is_admin IS 'Indicates if the user has administrator privileges';

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current authenticated user is an admin';

-- Note: To make yourself admin, run this SQL (replace with your user ID or email):
-- UPDATE public.users SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
-- Or by user ID:
-- UPDATE public.users SET is_admin = true WHERE id = 'tu-user-id-aqui';

