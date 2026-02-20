-- 025_enable_realtime_and_fix_audit.sql

-- 1. Habilitar Realtime para las tablas de comunidad
-- Intentamos añadirlas directamente. 
-- Si alguna ya está añadida, verás una advertencia o error que puedes ignorar.
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
COMMIT;

-- 2. Corregir RLS de audit_log
-- Esto solucionará los errores rojos de la terminal.
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Activar Replica Identity para ver los datos en tiempo real
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
