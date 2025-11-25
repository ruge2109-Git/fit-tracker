# 📧 Notificaciones de Feedback

Esta guía explica cómo configurar las notificaciones por email y push cuando se recibe un feedback.

## 📋 Características

Cuando un usuario envía feedback, el sistema automáticamente:

1. **Envía un email** al administrador con los detalles del feedback
2. **Envía una notificación push** al administrador (si tiene notificaciones habilitadas)

## 🔧 Configuración

### Paso 1: Configurar Resend (Servicio de Email)

1. **Crear cuenta en Resend**:
   - Ve a [https://resend.com](https://resend.com)
   - Crea una cuenta gratuita (100 emails/día gratis)
   - Verifica tu email de registro

2. **Obtener API Key**:
   - Ve a **API Keys** en el dashboard de Resend (menú lateral izquierdo)
   - Haz clic en **"Create API Key"**
   - Dale un nombre (ej: "FitTrackr Production")
   - Selecciona los permisos (puedes dejar "Full Access" para desarrollo)
   - Haz clic en **"Add"**
   - **IMPORTANTE**: Copia la clave inmediatamente (empieza con `re_` y solo se muestra una vez)
   - Guárdala de forma segura

3. **Verificar dominio o usar dominio de prueba**:

   **Opción A: Usar dominio de prueba (RÁPIDO - Para desarrollo/testing)**
   
   Resend te permite usar `onboarding@resend.dev` sin verificación:
   - No necesitas verificar nada
   - Funciona inmediatamente
   - Solo para desarrollo/testing
   - Límite: 100 emails/día
   
   ```env
   EMAIL_FROM=FitTrackr <onboarding@resend.dev>
   ```

   **Opción B: Verificar tu propio dominio (RECOMENDADO - Para producción)**
   
   Para usar tu propio dominio (ej: `noreply@tudominio.com`):
   
   a. **Añadir dominio en Resend**:
      - Ve a **Domains** en el dashboard de Resend
      - Haz clic en **"Add Domain"**
      - Ingresa tu dominio (ej: `tudominio.com` - sin www)
      - Haz clic en **"Add"**
   
   b. **Verificar dominio con DNS**:
      - Resend te mostrará registros DNS que debes añadir
      - Ve a tu proveedor de DNS (ej: Cloudflare, GoDaddy, Namecheap)
      - Añade los registros que Resend te indica:
        - **TXT record** para verificación (ej: `_resend.tudominio.com`)
        - **SPF record** (ej: `v=spf1 include:resend.com ~all`)
        - **DKIM records** (2 registros CNAME)
        - **DMARC record** (opcional pero recomendado)
   
   c. **Esperar verificación**:
      - Puede tardar desde minutos hasta 24 horas
      - Resend verificará automáticamente cuando los DNS estén correctos
      - El estado cambiará de "Pending" a "Verified" (verde)
   
   d. **Usar el dominio verificado**:
      ```env
      EMAIL_FROM=FitTrackr <noreply@tudominio.com>
      # O cualquier otro email en tu dominio:
      EMAIL_FROM=FitTrackr <support@tudominio.com>
      ```

4. **Configurar variables de entorno**:

   Añade a tu `.env.local`:

   ```env
   # Resend API Key
   RESEND_API_KEY=re_tu_api_key_aqui
   
   # Email del remitente
   # Para desarrollo (sin verificación):
   EMAIL_FROM=FitTrackr <onboarding@resend.dev>
   
   # Para producción (con dominio verificado):
   # EMAIL_FROM=FitTrackr <noreply@tudominio.com>
   ```

   **Nota**: Si no configuras `EMAIL_FROM`, se usará `FitTrackr <noreply@fittrackr.com>` por defecto (pero fallará si no está verificado).

### Paso 2: Verificar VAPID Keys (Para Push Notifications)

Las notificaciones push requieren VAPID keys. Si ya las tienes configuradas, puedes saltar este paso.

```bash
npm run generate-vapid-keys
```

Añade a tu `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica
VAPID_PRIVATE_KEY=tu_clave_privada
VAPID_EMAIL=mailto:tu-email@ejemplo.com
```

### Paso 3: Configurar en Producción (Vercel)

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Añade:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL`
   - `NEXT_PUBLIC_APP_URL` (tu URL de producción)

## 📧 Formato del Email

El email incluye:

- **Tipo de feedback** con icono (🐛 Bug, ✨ Feature, 💡 Improvement, 📝 Other)
- **Asunto** del feedback
- **Mensaje completo** del usuario
- **Rating** (si fue proporcionado)
- **Información del usuario** (nombre y email)
- **Fecha y hora** de envío
- **Botón** para ver en el panel de admin

## 🔔 Notificaciones Push

Las notificaciones push se envían a todos los administradores que:

1. Tienen `is_admin = true` en la tabla `users`
2. Tienen una suscripción push activa

**Nota**: Si un admin no tiene notificaciones push habilitadas, solo recibirá el email.

## 🧪 Testing

### Probar Email

1. Asegúrate de tener configurado `RESEND_API_KEY` y `EMAIL_FROM`
2. Envía un feedback desde la aplicación
3. Revisa tu email (y spam si no lo ves)

### Probar Push Notifications

1. Asegúrate de tener VAPID keys configuradas
2. Como admin, habilita notificaciones push en tu perfil
3. Envía un feedback desde otra cuenta
4. Deberías recibir una notificación push

## 🐛 Troubleshooting

### No recibo emails

1. **Verifica la API key de Resend**:
   ```bash
   # Verifica que RESEND_API_KEY esté en .env.local
   echo $RESEND_API_KEY
   ```

2. **Verifica el email del remitente**:
   - Debe ser un email verificado en Resend
   - O usa `onboarding@resend.dev` para pruebas

3. **Revisa los logs**:
   - Los errores se registran en la consola del servidor
   - Busca mensajes de "EmailService" en los logs

4. **Revisa el dashboard de Resend**:
   - Ve a **Emails** en Resend
   - Verifica si hay errores de envío

### No recibo notificaciones push

1. **Verifica VAPID keys**:
   - Deben estar configuradas en `.env.local`
   - Deben ser las mismas que usaste para suscribirte

2. **Verifica que eres admin**:
   ```sql
   SELECT id, email, is_admin FROM users WHERE email = 'tu-email@ejemplo.com';
   ```

3. **Verifica tu suscripción push**:
   - Asegúrate de haber habilitado notificaciones push en tu perfil
   - Revisa que la suscripción esté activa en la tabla `push_subscriptions`

## 🔒 Seguridad

- **RESEND_API_KEY**: Mantén esta clave secreta, nunca la commitees a git
- **VAPID_PRIVATE_KEY**: También debe mantenerse secreta
- Los emails solo se envían a usuarios con `is_admin = true`
- Las notificaciones push solo se envían a admins con suscripciones activas

## 📝 Alternativas a Resend

Si prefieres usar otro servicio de email:

1. **SendGrid**: Similar a Resend, cambia la URL en `email.service.ts`
2. **Nodemailer**: Para SMTP tradicional
3. **Supabase Edge Functions**: Para usar el servicio de email de Supabase

Para cambiar de servicio, modifica `src/lib/notifications/email.service.ts`.

## 📚 Referencias

- [Resend Documentation](https://resend.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Keys](https://web.dev/push-notifications-web-push-protocol/)

