# 🚀 Despliegue de Push Notifications en Producción

Esta guía te ayudará a desplegar el sistema de Push Notifications en producción.

## ✅ Checklist Pre-Despliegue

- [x] Push notifications funcionando en local
- [ ] Variables de entorno configuradas en producción
- [ ] Migración de base de datos ejecutada en producción
- [ ] Cron job configurado
- [ ] Pruebas en producción realizadas

## 📋 Paso 1: Configurar Variables de Entorno en Producción

### Si usas Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_vapid
VAPID_PRIVATE_KEY=tu_clave_privada_vapid
VAPID_EMAIL=mailto:tu-email@ejemplo.com
```

**⚠️ Importante:**
- Usa las **mismas** VAPID keys que generaste para desarrollo
- `VAPID_PRIVATE_KEY` debe mantenerse **secreta** (no se expone al cliente)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` se expone al cliente (por eso tiene el prefijo `NEXT_PUBLIC_`)
- `VAPID_EMAIL` es opcional pero recomendado

4. Selecciona los entornos donde aplicar (Production, Preview, Development)
5. Haz clic en **Save**

### Si usas otro proveedor:

Agrega las mismas variables de entorno en tu plataforma de hosting.

## 🗄️ Paso 2: Ejecutar Migración en Producción

### Opción A: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Abre el archivo `supabase/migrations/create_push_subscriptions_table.sql`
4. Copia y pega el contenido en el editor SQL
5. Haz clic en **Run** para ejecutar la migración

### Opción B: Supabase CLI

```bash
# Asegúrate de estar conectado a tu proyecto de producción
supabase link --project-ref tu-project-ref

# Ejecuta la migración
supabase db push
```

### Verificar la migración:

1. En Supabase Dashboard, ve a **Table Editor**
2. Deberías ver la tabla `push_subscriptions`
3. Verifica que tenga las columnas correctas:
   - `id` (UUID)
   - `user_id` (UUID, referencia a auth.users)
   - `endpoint` (TEXT)
   - `p256dh` (TEXT)
   - `auth` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## ⏰ Paso 3: Verificar Cron Job

El archivo `vercel.json` ya está configurado con el cron job:

```json
{
  "crons": [
    {
      "path": "/api/push/schedule",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecutará el endpoint `/api/push/schedule` todos los días a las 8:00 AM UTC.

### Verificar en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Cron Jobs**
3. Deberías ver el cron job listado
4. Verifica que el schedule sea `0 8 * * *` (8 AM UTC diariamente)

### Ajustar la hora (si es necesario):

Si quieres cambiar la hora, edita `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/push/schedule",
      "schedule": "0 8 * * *"  // Formato: minuto hora día mes día-semana
    }
  ]
}
```

Ejemplos:
- `0 8 * * *` = 8:00 AM UTC diariamente
- `0 9 * * *` = 9:00 AM UTC diariamente
- `0 8 * * 1-5` = 8:00 AM UTC, solo días laborables

## 🚀 Paso 4: Desplegar a Producción

### Si usas Vercel:

1. Haz commit y push de tus cambios:
   ```bash
   git add .
   git commit -m "feat: add push notifications"
   git push origin main
   ```

2. Vercel desplegará automáticamente
3. Espera a que el despliegue termine

### Si usas otro proveedor:

Sigue el proceso de despliegue de tu plataforma.

## 🧪 Paso 5: Probar en Producción

### 5.1 Verificar Service Worker

1. Abre tu app en producción (HTTPS)
2. Abre DevTools (F12)
3. Ve a **Application** → **Service Workers**
4. Verifica que `sw-push.js` esté registrado y activo
5. No debería haber errores

### 5.2 Probar Notificaciones

1. Inicia sesión en tu app de producción
2. Ve a **Profile** → **Notifications**
3. Haz clic en **Enable Notifications**
4. Acepta el permiso cuando el navegador lo solicite
5. Haz clic en **Test Notification**
6. Deberías recibir una notificación

### 5.3 Probar Push Notifications

1. Con las notificaciones habilitadas, haz clic en **Enable Push Notifications**
2. Verifica en la consola que no haya errores
3. Verifica en Supabase que la suscripción se haya guardado:
   - Ve a **Table Editor** → `push_subscriptions`
   - Deberías ver una fila con tu `user_id`

### 5.4 Probar Notificación Programada (Manual)

Para probar sin esperar al cron job:

1. Crea una rutina con días programados
2. Asegúrate de que la rutina esté activa
3. Llama manualmente al endpoint:
   ```bash
   curl -X POST https://tu-dominio.com/api/push/schedule?test=true
   ```
   
   O desde el navegador:
   ```
   https://tu-dominio.com/api/push/schedule?test=true
   ```

4. Deberías recibir una notificación push

## 🔍 Paso 6: Monitoreo y Verificación

### Verificar Logs de Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Deployments** → Selecciona el último deployment
3. Ve a **Functions** → Busca `/api/push/schedule`
4. Revisa los logs para ver si hay errores

### Verificar Base de Datos:

1. En Supabase Dashboard, ve a **Table Editor** → `push_subscriptions`
2. Verifica que las suscripciones se estén guardando
3. Revisa que no haya suscripciones duplicadas

### Verificar Cron Job:

1. En Vercel Dashboard, ve a **Settings** → **Cron Jobs**
2. Revisa el historial de ejecuciones
3. Verifica que se esté ejecutando correctamente

## 🐛 Troubleshooting en Producción

### Las notificaciones no funcionan:

1. **Verifica HTTPS:**
   - Las push notifications requieren HTTPS
   - Asegúrate de que tu dominio use HTTPS

2. **Verifica Service Worker:**
   - Abre DevTools → Application → Service Workers
   - Verifica que `sw-push.js` esté registrado
   - Si hay errores, revisa la consola

3. **Verifica Variables de Entorno:**
   - En Vercel Dashboard, verifica que las variables estén configuradas
   - Asegúrate de que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` esté disponible en el cliente

4. **Verifica Permisos:**
   - Asegúrate de que el usuario haya otorgado permisos de notificación
   - Revisa la configuración del navegador

### El cron job no se ejecuta:

1. **Verifica `vercel.json`:**
   - Asegúrate de que el archivo esté en la raíz del proyecto
   - Verifica la sintaxis JSON

2. **Verifica Logs:**
   - Revisa los logs del cron job en Vercel
   - Busca errores en la ejecución

3. **Prueba Manualmente:**
   - Llama al endpoint manualmente para verificar que funciona

### Las suscripciones no se guardan:

1. **Verifica RLS (Row Level Security):**
   - En Supabase Dashboard, ve a **Authentication** → **Policies**
   - Verifica que las políticas RLS estén configuradas correctamente

2. **Verifica Autenticación:**
   - Asegúrate de que el usuario esté autenticado
   - Verifica que el token de sesión sea válido

3. **Verifica Logs del API:**
   - Revisa los logs de `/api/push/subscribe` en Vercel
   - Busca errores en la respuesta

## 📝 Checklist Post-Despliegue

- [ ] Variables de entorno configuradas en producción
- [ ] Migración de base de datos ejecutada
- [ ] Cron job configurado y funcionando
- [ ] Service Worker registrado correctamente
- [ ] Notificaciones de prueba funcionando
- [ ] Push notifications funcionando
- [ ] Suscripciones guardándose en la base de datos
- [ ] Cron job ejecutándose correctamente
- [ ] Logs sin errores críticos

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sistema de Push Notifications estará funcionando en producción. Los usuarios recibirán notificaciones automáticas a las 8 AM en los días que tengan rutinas programadas.

## 📚 Recursos Adicionales

- [Documentación de VAPID](https://tools.ietf.org/html/rfc8292)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

