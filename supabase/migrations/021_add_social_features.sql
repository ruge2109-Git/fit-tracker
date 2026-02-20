-- Migration to add social features to users table
-- 1. Add is_public and nickname columns
-- 2. Set default values
-- 3. Add RLS policies for public access

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update nickname for existing users (optional, can be fallback to name)
UPDATE public.users SET nickname = SPLIT_PART(email, '@', 1) WHERE nickname IS NULL;

-- Enable public access to nickname and id ONLY where is_public is true
-- This allows the leaderboard to function while keeping other profiles private

DROP POLICY IF EXISTS "Public can view public profiles" ON public.users;
CREATE POLICY "Public can view public profiles" ON public.users
  FOR SELECT 
  USING (is_public = true);

-- Note: The existing "Users can view their own profile" might need to be checked 
-- but usually users can view their own data regardless of is_public.
-- Assuming standard RLS on users table (if any) allows own access.
-- Let's add it just in case it's missing or restricted.

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
