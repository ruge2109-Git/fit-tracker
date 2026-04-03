-- Días de descanso semanales: no entrenar en esos días no rompe la racha
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS rest_days text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.users.rest_days IS
  'Días de la semana (monday..sunday) marcados como descanso; omitir entreno no penaliza la racha';
