-- Add Audit Log Table
-- Tracks all user actions for admin monitoring and debugging

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'workout', 'exercise', 'routine', 'auth', 'settings', etc.
  entity_id UUID, -- ID of the affected entity (nullable for actions like login)
  details JSONB, -- Additional details about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON public.audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Policy: System can insert audit logs (via service role or authenticated users)
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.audit_log IS 'Audit log table for tracking all user actions';
COMMENT ON COLUMN public.audit_log.action IS 'Action performed (e.g., login, create_workout, update_exercise)';
COMMENT ON COLUMN public.audit_log.entity_type IS 'Type of entity affected (e.g., workout, exercise, routine, auth)';
COMMENT ON COLUMN public.audit_log.entity_id IS 'ID of the affected entity (nullable for actions like login)';
COMMENT ON COLUMN public.audit_log.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN public.audit_log.ip_address IS 'IP address of the user when the action was performed';
COMMENT ON COLUMN public.audit_log.user_agent IS 'User agent string of the browser/client';

