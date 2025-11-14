# 🔔 Notificaciones Push - Guía Completa

Esta guía cubre todo lo relacionado con las notificaciones push en FitTrackr, desde la configuración inicial hasta el despliegue en producción.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Testing Local](#testing-local)
6. [Despliegue en Producción](#despliegue-en-producción)
7. [Configuración de Cron Jobs](#configuración-de-cron-jobs)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

## Introducción

Las notificaciones push permiten a los usuarios recibir recordatorios automáticos cuando tienen rutinas programadas para el día. El sistema utiliza:

- **Web Push API** - Estándar web para notificaciones push
- **VAPID Keys** - Autenticación del servidor
- **Service Worker** - Manejo de notificaciones en segundo plano
- **Cron Jobs** - Ejecución automática de notificaciones programadas

## Configuración Inicial

### Paso 1: Generar VAPID Keys

VAPID (Voluntary Application Server Identification) keys son necesarias para autenticar tu servidor con los servicios de push.

```bash
npm run generate-vapid-keys
```

Esto generará un par de claves (pública y privada). **Guarda estas claves de forma segura**.

### Paso 2: Configurar Variables de Entorno

Agrega las siguientes variables a tu `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_EMAIL=mailto:tu-email@ejemplo.com
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Solo para producción
```

**Importante:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` se expone al cliente (por eso tiene el prefijo `NEXT_PUBLIC_`)
- `VAPID_PRIVATE_KEY` debe mantenerse **secreta** (nunca la commitees a git)
- `VAPID_EMAIL` es opcional pero recomendado (debe empezar con `mailto:`)
- `SUPABASE_SERVICE_ROLE_KEY` es necesario para que el cron job pueda acceder a la base de datos sin autenticación de usuario

## Configuración de Base de Datos

### Migración de Base de Datos

Ejecuta la migración para crear la tabla `push_subscriptions`:

1. Ve a tu dashboard de Supabase
2. Abre **SQL Editor**
3. Copia y pega el contenido de `supabase/migrations/create_push_subscriptions_table.sql`
4. Ejecuta la migración

Esta migración crea:
- Tabla `push_subscriptions` con RLS habilitado
- Políticas de seguridad para que los usuarios solo vean sus propias suscripciones
- Índices para optimizar consultas

### Verificar la Migración

```sql
-- Verificar que la tabla existe
SELECT * FROM push_subscriptions LIMIT 1;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions';
```

## Configuración de Variables de Entorno

### Desarrollo Local

Crea `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
VAPID_EMAIL=mailto:tu-email@ejemplo.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Producción (Vercel)

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega todas las variables anteriores (excepto `NEXT_PUBLIC_APP_URL` que debe ser tu URL de producción)
4. Agrega también `SUPABASE_SERVICE_ROLE_KEY` para el cron job

## Testing Local

### Requisitos: HTTPS

Las push notifications **requieren HTTPS** para funcionar. En desarrollo local:

#### Opción 1: Usar ngrok (Recomendado)

```bash
# Instalar ngrok
# Windows (con Chocolatey)
choco install ngrok

# O descargar desde https://ngrok.com/download

# Iniciar tu app
npm run dev

# En otra terminal, crear túnel HTTPS
ngrok http 3000

# Usar la URL HTTPS que ngrok proporciona
```

#### Opción 2: Chrome en localhost

Chrome permite push notifications en `localhost` sin HTTPS automáticamente.

### Pasos para Probar

1. **Habilitar notificaciones en la app:**
   - Ve a Settings/Profile
   - Haz clic en "Enable Notifications"
   - Concede permiso cuando el navegador lo solicite

2. **Probar notificación de prueba:**
   - Haz clic en "Test Notification"
   - Deberías ver una notificación inmediatamente

3. **Verificar suscripción:**
   - Abre DevTools → Application → Service Workers
   - Verifica que `sw-push.js` esté registrado
   - En Supabase, verifica que la suscripción se guardó:
     ```sql
     SELECT * FROM push_subscriptions WHERE user_id = 'tu-user-id';
     ```

4. **Probar endpoint de schedule (manual):**
   ```bash
   # Desde el navegador (DevTools Console)
   fetch('/api/push/schedule?test=true', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

5. **Crear rutina de prueba:**
   - Crea una rutina con días programados (ej: Lunes, Miércoles)
   - Activa la rutina
   - Prueba el schedule endpoint con `?test=true`
   - Deberías recibir una notificación si hoy es uno de los días programados

## Despliegue en Producción

### Checklist Pre-Despliegue

- [ ] VAPID keys generadas
- [ ] Variables de entorno configuradas en Vercel
- [ ] Migración de base de datos ejecutada en producción
- [ ] `SUPABASE_SERVICE_ROLE_KEY` agregada a Vercel
- [ ] Service Worker accesible en `/sw-push.js`
- [ ] Cron job configurado (ver siguiente sección)

### Pasos de Despliegue

1. **Agregar variables de entorno en Vercel:**
   - Ve a Settings → Environment Variables
   - Agrega todas las variables necesarias
   - Selecciona los entornos (Production, Preview, Development)

2. **Ejecutar migración en producción:**
   - Ve a tu proyecto de Supabase (producción)
   - Ejecuta la migración `create_push_subscriptions_table.sql`

3. **Verificar Service Worker:**
   - Despliega la aplicación
   - Abre tu app en producción (HTTPS)
   - Verifica en DevTools → Application → Service Workers que `sw-push.js` esté registrado

4. **Probar en producción:**
   - Habilita notificaciones en la app
   - Crea una rutina con días programados
   - Prueba manualmente: `https://tu-dominio.com/api/push/schedule?test=true`

## Configuración de Cron Jobs

El sistema necesita ejecutar automáticamente el endpoint `/api/push/schedule` para enviar notificaciones programadas.

### Opción 1: Vercel Cron Jobs

Crea o actualiza `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/push/schedule",
      "schedule": "0 13 * * *"
    }
  ]
}
```

**Nota sobre horarios:**
- El formato es: `minuto hora día mes día-semana` (cron estándar)
- Vercel usa **UTC** para los cron jobs
- `0 13 * * *` = 13:00 UTC = 8:00 AM Colombia (UTC-5)

**Para cambiar la hora:**
- Calcula la hora UTC correspondiente a tu zona horaria
- Actualiza el `schedule` en `vercel.json`
- Ejemplo: 6:00 PM Colombia = 23:00 UTC → `0 23 * * *`

### Opción 2: GitHub Actions (Recomendado)

Si los cron jobs de Vercel no funcionan de manera confiable, usa GitHub Actions:

El archivo `.github/workflows/push-notifications.yml` ya está configurado:

```yaml
on:
  schedule:
    - cron: '0 13 * * *'  # 8:00 AM Colombia (13:00 UTC)
  workflow_dispatch:  # Permite ejecución manual
```

**Ventajas:**
- Más confiable que Vercel cron jobs
- Permite ejecución manual desde GitHub
- Logs detallados de cada ejecución
- Gratis para repositorios públicos

**Configuración:**
1. El workflow ya está configurado
2. Solo necesitas que el repositorio esté en GitHub
3. GitHub ejecutará automáticamente el workflow según el schedule

### Opción 3: Servicios Externos

Si prefieres usar un servicio externo:

- **cron-job.org** (gratis)
- **EasyCron** (gratis)

Configura para que llame:
```
POST https://tu-dominio.com/api/push/schedule?cron=true
```

Con el header:
```
User-Agent: Cron Service
```

## Troubleshooting

### Notificaciones no funcionan

1. **Verificar HTTPS:**
   - Las push notifications requieren HTTPS
   - Verifica que tu dominio use HTTPS

2. **Verificar Service Worker:**
   - Abre DevTools → Application → Service Workers
   - Verifica que `sw-push.js` esté registrado y activo
   - Revisa la consola para errores

3. **Verificar permisos:**
   - Configuración del navegador → Notificaciones
   - Asegúrate de que el sitio esté permitido

4. **Verificar VAPID keys:**
   - Verifica que las keys estén en las variables de entorno
   - Asegúrate de que `VAPID_EMAIL` empiece con `mailto:`
   - Reinicia el servidor después de agregar variables

5. **Verificar base de datos:**
   - Verifica que la tabla `push_subscriptions` existe
   - Verifica que la suscripción se guardó:
     ```sql
     SELECT * FROM push_subscriptions WHERE user_id = 'tu-user-id';
     ```

### Cron job no se ejecuta

1. **Verificar `vercel.json`:**
   - Asegúrate de que el archivo esté en la raíz
   - Verifica la sintaxis JSON
   - Verifica que el schedule esté en formato UTC

2. **Verificar logs:**
   - En Vercel Dashboard → Deployments → Functions
   - Busca `/api/push/schedule` y revisa los logs

3. **Probar manualmente:**
   ```bash
   curl -X POST "https://tu-dominio.com/api/push/schedule?cron=true" \
     -H "User-Agent: vercel-cron/1.0"
   ```

4. **Usar GitHub Actions:**
   - Si Vercel cron no funciona, usa GitHub Actions
   - El workflow ya está configurado en `.github/workflows/push-notifications.yml`

### Suscripciones no se guardan

1. **Verificar RLS:**
   - En Supabase Dashboard → Authentication → Policies
   - Verifica que las políticas RLS estén configuradas

2. **Verificar autenticación:**
   - Asegúrate de que el usuario esté autenticado
   - Verifica que el token de sesión sea válido

3. **Verificar logs del API:**
   - Revisa los logs de `/api/push/subscribe` en Vercel
   - Busca errores en la respuesta

### Notificaciones no aparecen en móvil cuando la app está cerrada

1. **Verificar Service Worker:**
   - El Service Worker debe estar registrado
   - Verifica que `sw-push.js` maneje correctamente los eventos push

2. **Verificar permisos del navegador:**
   - En Android: Configuración → Aplicaciones → Tu navegador → Notificaciones
   - Asegúrate de que las notificaciones estén habilitadas

3. **Verificar que la app esté instalada como PWA:**
   - Las notificaciones funcionan mejor cuando la app está instalada
   - Instala la PWA desde el navegador

## API Reference

### POST `/api/push/subscribe`

Suscribe al usuario a notificaciones push.

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription saved"
}
```

### POST `/api/push/unsubscribe`

Desuscribe al usuario de notificaciones push.

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### POST `/api/push/send`

Envía una notificación push a un usuario específico.

**Body:**
```json
{
  "userId": "user-id",
  "title": "Notification Title",
  "body": "Notification body",
  "icon": "/icons/icon-192x192.png",
  "tag": "notification-tag",
  "data": {}
}
```

### POST `/api/push/schedule`

Endpoint para cron job que envía notificaciones programadas.

**Query Parameters:**
- `test=true` - Permite ejecutar manualmente sin verificar la hora
- `cron=true` - Indica que es una petición del cron job

**Response:**
```json
{
  "success": true,
  "sent": 5,
  "diagnostics": {
    "totalRoutines": 10,
    "routinesProcessed": 10,
    "routinesWithTodayScheduled": 3,
    "routinesWithSubscriptions": 3,
    "subscriptionsFound": 5
  }
}
```

## Arquitectura

```
Usuario → NotificationService → PushService → API Route → Database
                                                      ↓
Cron Job → Schedule API → Check Routines → Send Push → Service Worker → Notification
```

### Flujo de Notificación

1. Usuario habilita notificaciones → Se crea suscripción push
2. Suscripción se guarda en `push_subscriptions`
3. Usuario crea rutina con días programados
4. Cron job ejecuta `/api/push/schedule` diariamente
5. El endpoint verifica rutinas programadas para hoy
6. Para cada rutina activa con suscripción, envía push notification
7. Service Worker recibe y muestra la notificación

## Seguridad

- ✅ VAPID keys para autenticación del servidor
- ✅ Row Level Security (RLS) en base de datos
- ✅ Autenticación requerida para todos los endpoints
- ✅ Limpieza automática de suscripciones inválidas
- ✅ Service Role Key solo usado en cron jobs (server-side)

## Recursos Adicionales

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

---

**Última actualización**: 14/11/2025

