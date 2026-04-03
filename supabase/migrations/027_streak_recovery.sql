-- Recuperación de racha: hasta 3 usos por cuenta (contando filas; enforce en app)
CREATE TABLE IF NOT EXISTS public.streak_recovery_forgiveness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  forgiven_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, forgiven_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_recovery_forgiveness_user ON public.streak_recovery_forgiveness(user_id);

ALTER TABLE public.streak_recovery_forgiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak forgiveness" ON public.streak_recovery_forgiveness
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.streak_recovery_forgiveness IS
  'Días contados como entreno para la racha al usar "Recuperar racha"; máximo 3 por usuario (aplicación)';
