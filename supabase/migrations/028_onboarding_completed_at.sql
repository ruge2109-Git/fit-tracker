-- Track when the user finished the in-app onboarding wizard (null = not completed)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.onboarding_completed_at IS
  'When set, the guided onboarding flow was completed or skipped. NULL means show onboarding on next dashboard load.';

-- Existing accounts before this feature: treat as already onboarded (avoid surprising veteran users)
UPDATE public.users
SET onboarding_completed_at = COALESCE(created_at, NOW())
WHERE onboarding_completed_at IS NULL;
