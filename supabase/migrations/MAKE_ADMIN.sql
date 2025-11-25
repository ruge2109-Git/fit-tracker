-- Script para hacerte administrador
-- Ejecuta este script en Supabase SQL Editor después de ejecutar la migración 006_add_admin_support.sql

-- OPCIÓN 1: Por email (reemplaza con tu email)
UPDATE public.users 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);

-- OPCIÓN 2: Por User ID (reemplaza con tu user ID)
-- Puedes obtener tu user ID desde la tabla auth.users o desde tu perfil en la app
UPDATE public.users 
SET is_admin = true 
WHERE id = 'tu-user-id-aqui';

-- Verificar que se actualizó correctamente
SELECT 
  u.id,
  u.email,
  u.name,
  u.is_admin,
  u.created_at
FROM public.users u
WHERE u.is_admin = true;

-- NOTA: Si ejecutaste la migración 007_sync_users_trigger.sql, 
-- los usuarios deberían sincronizarse automáticamente.
-- Si aún no tienes usuarios en public.users, ejecuta primero la migración 007.

